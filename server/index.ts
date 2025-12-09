import express from 'express'
import http from 'http'
import { Server, Socket } from 'socket.io'
import cors from 'cors'
import { logOutputs, rl } from './src/logs.js'
import { handlePlayedHand, handleRoundOver, startGame, startRound } from './src/game.js'
import type { Card, Room } from './types.js'
import { disconnectPlayer, getRooms, leaveRoom, playerJoin } from './src/rooms.js'

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

const PORT: string = process.env.PORT || '5000'
server.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`)
    console.log('Type "help" for available commands\n')
})

const rooms: Record<string, Room> = {}
io.on('connection', (socket: Socket) => {
    console.log(`> Client Connected: ${socket.id.slice(0, 6)}`)

    socket.on('user-registered', (data) => {
        socket.data.id = data.id
        socket.data.username = data.username
        socket.data.picture = data.picture
        console.log(`User registered: ${data.username} (${socket.id.slice(0, 6)})`)
    })

    socket.on('get-room-list', () => {
        socket.emit('room-list', getRooms(rooms))
    })

    socket.on('join-room', (roomID: string) => {
        if (rooms[roomID]?.players.length === 4) return
        if (!socket.data.id) {
            console.log(`Warning: join-room called without user registration for ${socket.id.slice(0, 6)}`)
            return
        }

        const room = rooms[roomID]
        if (room && room.players.some((p) => p.id === socket.data.id)) {
            console.log(`User ${socket.data.username} already in room ${roomID}`)
            io.to(roomID).emit('game-data', rooms[roomID])
            return
        }

        playerJoin(socket, roomID, rooms)
        io.emit('room-list', getRooms(rooms))
        io.to(roomID).emit('game-data', rooms[roomID])
    })

    socket.on('start-triggered', () => {
        const roomID = socket.data.roomID
        if (!rooms[roomID]) return

        io.to(roomID).emit('start-game', roomID)
        startGame(rooms[roomID])
        io.to(roomID).emit('game-data', rooms[roomID])
    })

    socket.on('leave-room', () => {
        const roomID = socket.data.roomID

        leaveRoom(socket, rooms)
        io.to(roomID).emit('game-data', rooms[roomID])
        io.emit('room-list', getRooms(rooms))
    })

    socket.on('disconnect', () => {
        console.log(`< Client Disconnected: ${socket.id.slice(0, 6)}`)
        const affectedRooms = Object.keys(rooms).filter((rID) => {
            const room = rooms[rID]
            if (!room) return false
            return room.players.some((p) => p.id === socket.data.id)
        })

        disconnectPlayer(socket, rooms)
        io.emit('room-list', getRooms(rooms))

        affectedRooms.forEach((roomID) => {
            if (roomID && rooms[roomID]) {
                io.to(roomID).emit('game-data', rooms[roomID])
            }
        })
    })

    socket.on('hand-played', (hand: Card[]) => {
        handlePlayedHand(hand, rooms[socket.data.roomID]!)
        io.to(socket.data.roomID).emit('game-data', rooms[socket.data.roomID])

        // Start new round after 3 sec
        const room = rooms[socket.data.roomID]!
        const roundOver = room.deck.length === 0
        const emptyHands = room.players.every(player => player.hand.length === 0)
        if (roundOver && emptyHands) {
            handleRoundOver(room)

            setTimeout(() => {
                startRound(room)
            io.to(socket.data.roomID).emit('game-data', rooms[socket.data.roomID])
            }, 3000)
        }
    })
})

rl.prompt()
rl.on('line', (input: string) => {
    logOutputs(input.trim().toLowerCase(), io, rooms)
    rl.prompt()
})
