import express from 'express'
import http from 'http'
import { Server, Socket } from 'socket.io'
import cors from 'cors'
import { logOutputs, rl } from './src/logs.js'
import { handlePlayedHand, resolveTrick, handleRoundOver, handleBura, isBura, offerDavi, respondDavi, resetRoomToLobby, startGame, startRound } from './src/game.js'
import type { Card, Room } from './types.js'
import { getRooms, leaveRoom, playerJoin } from './src/rooms.js'

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

// Pause-on-disconnect: a started game whose player drops is held for this long
// (waiting for everyone to reconnect) before it is aborted and torn down.
const PAUSE_MS = 2 * 60 * 1000
const pauseTimers: Record<string, NodeJS.Timeout> = {}

// How long all four played cards stay revealed before the trick resolves.
const TRICK_REVEAL_MS = 5 * 1000

const clearPauseTimer = (roomID: string) => {
    const timer = pauseTimers[roomID]
    if (timer) {
        clearTimeout(timer)
        delete pauseTimers[roomID]
    }
}

const abortGame = (roomID: string) => {
    clearPauseTimer(roomID)
    const room = rooms[roomID]
    if (!room) return

    console.log(`Aborting game in room "${roomID}" (reconnect window expired)`)
    io.to(roomID).emit('game-aborted')
    io.in(roomID).socketsLeave(roomID)
    delete rooms[roomID]
    io.emit('room-list', getRooms(rooms))
}

const endGame = (roomID: string, message: string) => {
    clearPauseTimer(roomID)
    const room = rooms[roomID]
    if (!room) return

    console.log(`Game over in room "${roomID}": ${message}`)

    // Final team scores (teammates share the same total). Captured before reset.
    const teams = [
        { names: [room.players[0]?.username, room.players[2]?.username], points: room.players[0]?.points ?? 0 },
        { names: [room.players[1]?.username, room.players[3]?.username], points: room.players[1]?.points ?? 0 },
    ]
    io.to(roomID).emit('game-over', { message, teams })

    // Keep the room and its players alive in a fresh lobby state so they can
    // rematch; a later start-triggered fully re-initialises the game.
    resetRoomToLobby(room)
    io.to(roomID).emit('game-data', room)
    io.emit('room-list', getRooms(rooms))
}

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
        if (!socket.data.id) {
            console.log(`Warning: join-room called without user registration for ${socket.id.slice(0, 6)}`)
            return
        }

        const room = rooms[roomID]
        const alreadyInRoom = !!room && room.players.some((p) => p.id === socket.data.id)

        // Reject only genuinely new players when the room is full. A player who
        // is already seated (e.g. reconnecting to a started game whose seat we
        // kept) must be allowed through to the reconnect branch below.
        if (!alreadyInRoom && room?.players.length === 4) return

        if (room && alreadyInRoom) {
            console.log(`User ${socket.data.username} already in room ${roomID}`)
            // Reconnecting socket for an existing player: re-attach this socket
            // to the socket.io room so future broadcasts reach it.
            socket.join(roomID)
            socket.data.roomID = roomID

            // Clear this player's disconnected flag and resume the game once
            // every missing player has returned.
            room.disconnected = room.disconnected.filter((id) => id !== socket.data.id)
            let resumed = false
            if (room.paused && room.disconnected.length === 0) {
                room.paused = false
                room.pauseEndsAt = undefined
                clearPauseTimer(roomID)
                resumed = true
                console.log(`Resuming game in room "${roomID}"`)
            }

            // Only fan out to the whole room when state actually changed (resume).
            // Otherwise just sync the reconnecting socket — broadcasting on every
            // re-join would amplify any client-side re-join into room-wide churn.
            if (resumed) io.to(roomID).emit('game-data', room)
            else socket.emit('game-data', room)
            return
        }

        playerJoin(socket, roomID, rooms)
        io.emit('room-list', getRooms(rooms))
        io.to(roomID).emit('game-data', rooms[roomID])
    })

    socket.on('set-team', (team: number) => {
        const room = rooms[socket.data.roomID]
        if (!room || room.started) return
        if (team !== 0 && team !== 1) return

        const player = room.players.find((p) => p.id === socket.data.id)
        if (!player) return

        player.team = team
        io.to(socket.data.roomID).emit('game-data', room)
    })

    socket.on('start-triggered', () => {
        const roomID = socket.data.roomID
        const room = rooms[roomID]
        if (!room) return
        if (room.players.length !== 4) return
        if (room.players[0]?.id !== socket.data.id) return

        const team0 = room.players.filter((p) => p.team === 0)
        const team1 = room.players.filter((p) => p.team === 1)
        if (team0.length !== 2 || team1.length !== 2) return

        // Seat teams alternately so partners sit across (indices 0 & 2 vs 1 & 3),
        // which is what all the in-game even/odd team logic relies on.
        room.players = [team0[0]!, team1[0]!, team0[1]!, team1[1]!]

        io.to(roomID).emit('start-game', roomID)
        startGame(room)
        io.to(roomID).emit('game-data', room)
    })

    socket.on('leave-room', () => {
        const roomID = socket.data.roomID

        leaveRoom(socket, rooms)
        io.to(roomID).emit('game-data', rooms[roomID])
        io.emit('room-list', getRooms(rooms))
    })

    socket.on('disconnect', () => {
        console.log(`< Client Disconnected: ${socket.id.slice(0, 6)}`)
        const userId = socket.data.id
        if (!userId) return

        Object.keys(rooms).forEach((roomID) => {
            const room = rooms[roomID]
            if (!room) return
            if (!room.players.some((p) => p.id === userId)) return

            socket.leave(roomID)

            if (room.started) {
                // Started game: keep the player's seat, pause and wait for them
                // to reconnect. The 2-minute window starts at the first drop and
                // is not extended by additional disconnects.
                if (!room.disconnected.includes(userId)) room.disconnected.push(userId)
                room.paused = true
                if (!pauseTimers[roomID]) {
                    room.pauseEndsAt = Date.now() + PAUSE_MS
                    pauseTimers[roomID] = setTimeout(() => abortGame(roomID), PAUSE_MS)
                    console.log(`Pausing game in room "${roomID}" — waiting for ${room.disconnected.length} player(s)`)
                }
                io.to(roomID).emit('game-data', room)
            } else {
                // Lobby: remove the player as before.
                room.players = room.players.filter((p) => p.id !== userId)
                if (room.players.length === 0) delete rooms[roomID]
                if (rooms[roomID]) io.to(roomID).emit('game-data', rooms[roomID])
            }
        })

        io.emit('room-list', getRooms(rooms))
    })

    socket.on('hand-played', (hand: Card[]) => {
        const roomID = socket.data.roomID
        const room = rooms[roomID]
        if (!room) return
        if (room.paused) return
        if (room.davi.pending) return

        // A completed trick is being revealed for a few seconds; ignore any
        // further plays until it has resolved.
        if (room.players.length === 4 && room.players.every((p) => p.played.length !== 0)) return

        // Bura: five trump cards played at once instantly wins the round.
        if (isBura(room, hand)) {
            const playerIndex = room.turn ?? 0
            const player = room.players[playerIndex]
            if (player) {
                player.played = hand
                player.hand = player.hand.filter((card) => !hand.some((h) => h.suite === card.suite && h.value === card.value))
            }
            io.to(roomID).emit('game-data', room)

            const result = handleBura(room, playerIndex)
            io.to(roomID).emit('message', result.message)
            setTimeout(() => {
                if (result.gameOver) {
                    endGame(roomID, result.winnerText ?? result.message)
                    return
                }
                startRound(room)
                io.to(roomID).emit('message', '')
                io.to(roomID).emit('game-data', room)
            }, 3000)
            return
        }

        const { allPlayed } = handlePlayedHand(hand, room)
        io.to(roomID).emit('game-data', room)

        if (!allPlayed) return

        // All four cards are now on the table — hold the reveal so players can
        // see the full trick, then resolve it (winner takes, deal next).
        setTimeout(() => {
            if (!rooms[roomID]) return
            const { winnerIndex } = resolveTrick(room)
            io.to(roomID).emit('game-data', room)

            const roundOver = room.deck.length === 0
            const emptyHands = room.players.every((player) => player.hand.length === 0)
            if (roundOver && emptyHands) {
                const { message, gameOver, winnerText } = handleRoundOver(room)
                io.to(roomID).emit('message', message)

                setTimeout(() => {
                    if (gameOver) {
                        endGame(roomID, winnerText ?? message)
                        return
                    }
                    startRound(room)
                    io.to(roomID).emit('message', '')
                    io.to(roomID).emit('game-data', room)
                }, 3000)
            } else {
                io.to(roomID).emit('message', `${room.players[winnerIndex]?.username} takes!`)
                setTimeout(() => io.to(roomID).emit('message', ''), 2000)
            }
        }, TRICK_REVEAL_MS)
    })

    socket.on('chat-message', (text: string) => {
        const roomID = socket.data.roomID
        const room = rooms[roomID]
        if (!room) return
        if (!room.players.some((p) => p.id === socket.data.id)) return

        const trimmed = (text ?? '').toString().trim().slice(0, 500)
        if (!trimmed) return

        const message = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            senderId: socket.data.id,
            username: socket.data.username,
            picture: socket.data.picture,
            text: trimmed,
            at: Date.now(),
        }
        io.to(roomID).emit('chat-message', message)
    })

    socket.on('davi-offer', () => {
        const room = rooms[socket.data.roomID]
        if (!room) return

        const offererIndex = room.players.findIndex((p) => p.id === socket.data.id)
        if (offererIndex === -1) return

        if (offerDavi(room, offererIndex)) {
            io.to(socket.data.roomID).emit('game-data', room)
        }
    })

    socket.on('davi-respond', (action: 'accept' | 'decline' | 'challenge') => {
        const roomID = socket.data.roomID
        const room = rooms[roomID]
        if (!room) return

        const playerIndex = room.players.findIndex((p) => p.id === socket.data.id)
        if (playerIndex === -1) return

        const result = respondDavi(room, playerIndex, action)
        if (!result) return

        if (result.type === 'pending') {
            // Accepted-to-continue, or challenged back: just push the new state.
            io.to(roomID).emit('game-data', room)
            return
        }

        // Declined: round ends immediately.
        io.to(roomID).emit('game-data', room)
        io.to(roomID).emit('message', result.message)
        setTimeout(() => {
            if (result.gameOver) {
                endGame(roomID, result.winnerText ?? result.message)
                return
            }
            startRound(room)
            io.to(roomID).emit('message', '')
            io.to(roomID).emit('game-data', room)
        }, 3000)
    })
})

rl.prompt()
rl.on('line', (input: string) => {
    logOutputs(input.trim().toLowerCase(), io, rooms)
    rl.prompt()
})
