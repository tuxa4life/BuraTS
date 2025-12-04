import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { logOutputs, rl } from './src/logs.js'
import { generateKeys } from './src/cards.js'

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server(server, {cors: { origin: '*' }})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`)
    console.log('Type "help" for available commands\n')
})

const rooms = {}

io.on('connection', (socket) => {
    console.log(`> Client Connected: ${socket.id.slice(0, 6)}`)

    const cards = generateKeys()
    socket.emit('test', cards)

    socket.on('disconnect', () => {
        console.log(`< Client Disconnected: ${socket.id.slice(0, 6)}`)
    })
})

rl.prompt()
rl.on('line', (input) => {
    logOutputs(input.trim().toLowerCase(), io, rooms)
    rl.prompt()
})