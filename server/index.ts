import express from 'express'
import http from 'http'
import { Server, Socket } from 'socket.io'
import cors from 'cors'
import { logOutputs, rl } from './src/logs.js'
import { disconnectPlayer, getRooms, leaveRoom, playerJoin } from './src/game.js'
import type { Player, Room } from './types.js'

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
    })

    socket.on('get-room-list', () => {
        socket.emit('room-list', getRooms(rooms))
    })

    socket.on('join-room', (roomID: string) => {
        playerJoin(socket, roomID, rooms)
        io.emit('room-list', getRooms(rooms))
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
})

rl.prompt()
rl.on('line', (input: string) => {
    logOutputs(input.trim().toLowerCase(), io, rooms)
    rl.prompt()
})
