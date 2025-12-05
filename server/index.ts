import express from 'express'
import http from 'http'
import { Server, Socket } from 'socket.io'
import cors from 'cors'
import { logOutputs, rl } from './src/logs.js'
import { getRooms, playerJoin } from './src/game.js'
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

    socket.on('disconnect', () => {
        console.log(`< Client Disconnected: ${socket.id.slice(0, 6)}`)

        Object.keys(rooms).forEach((roomId: string) => {
            const room = rooms[roomId]
            if (!room) return
            room.players = room.players.filter((player) => player.id !== socket.data.id)

            if (room.players.length === 0) delete rooms[roomId]
        })
    })

    socket.on('user-registered', (id) => {
        socket.data.id = id
    })

    socket.on('get-room-list', () => {
        socket.emit('room-list', getRooms(rooms))
    })

    socket.on('create-room', ({ roomID, user }: { roomID: string; user: Player }) => {
        playerJoin(user, roomID, rooms)
        io.emit('room-list', getRooms(rooms))
    })
})

rl.prompt()
rl.on('line', (input: string) => {
    logOutputs(input.trim().toLowerCase(), io, rooms)
    rl.prompt()
})
