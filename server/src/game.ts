import { type Room, type Card } from '../types.js'
import { determineWinner, gatherPlayedCards, generateKeys, getCardPoints, shuffleDeck } from './cards.js'

const startGame = (room: Room) => {
    if (!room) return

    const deck = shuffleDeck(generateKeys())
    room.deck = deck
    room.turn = 0
    room.trump = deck[deck.length - 1]
    room.multiplier = 1
    room.lastWinner = 0

    room.players.forEach((player) => {
        player.hand = []
        player.played = []
        player.taken = []
        player.points = 0
    })

    dealHand(room)
}

const handlePlayedHand = (hand: Card[], room: Room): { allPlayed: boolean, winnerIndex: number | null } => {
    const player = room?.players[room.turn!]
    player!.played = hand
    player!.hand = player!.hand.filter((card) => !hand.some((h) => h.suite === card.suite && h.value === card.value))
    room!.turn = (room?.turn! + 1) % 4

    const allPlayed = room.players.every((player) => player.played.length !== 0)
    let winnerIndex = null
    if (allPlayed) {
        winnerIndex = determineWinner(room.players, room.trump!, room.lastWinner)
        room.lastWinner = winnerIndex
        room.players[winnerIndex]!.taken.push(...gatherPlayedCards(room.players))

        room.turn = room.lastWinner
        room.players.forEach((player) => (player.played = []))

        dealHand(room)
    }

    return { allPlayed, winnerIndex }
}

const startRound = (room: Room) => {
    if (!room) return

    const deck = shuffleDeck(generateKeys())
    room.deck = deck
    room.turn = room.lastWinner
    room.trump = deck[deck.length - 1]
    room.multiplier = 1

    room.players.forEach((player) => {
        player.hand = []
        player.played = []
        player.taken = []
    })

    dealHand(room)
}

const handleRoundOver = (room: Room): string => {
    let teamA = 0
    let teamB = 0

    let text = ''

    room.players.forEach((p, i) => {
        const total = p?.taken.flat(1).reduce((acc, c) => acc + getCardPoints(c.value), 0)
        if (i % 2 === 0) teamA += total
        else teamB += total
    })

    if (teamA > teamB) {
        room.players[0]!.points += room.multiplier
        room.players[2]!.points += room.multiplier

        text = `${room.players[0]!.username} and ${room.players[2]!.username} won the round!`
    } else if (teamA < teamB) {
        room.players[1]!.points += room.multiplier
        room.players[3]!.points += room.multiplier

        text = `${room.players[1]!.username} and ${room.players[3]!.username} won the round!`
    } else {
        text = 'The round was a draw!'
    }

    return text
}

const dealHand = (room: Room) => {
    const players = room.players
    const winnerIndex = room.lastWinner

    if (players.length === 0) return
    let i = winnerIndex
    while (room.deck.length > 0 && room.players.some((p) => p.hand.length < 5)) {
        room.players[i]!.hand.push(room.deck.splice(0, 1)[0]!)
        i = (i + 1) % 4
    }
}

export { startGame, handlePlayedHand, startRound, handleRoundOver }
