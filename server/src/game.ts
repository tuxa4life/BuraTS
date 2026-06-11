import { type Room, type Card, type Player } from '../types.js'
import { determineWinner, gatherPlayedCards, generateKeys, getCardPoints, shuffleDeck } from './cards.js'

// Highest davi level and the score that ends the whole game.
// MAX_DAVI is mirrored in client/src/Pages/Game.tsx for button visibility only.
const MAX_DAVI = 11
const WIN_SCORE = 11

const clearDavi = (room: Room) => {
    room.davi.pending = false
    room.davi.from = undefined
    room.davi.to = undefined
    room.davi.level = 0
}

// Returns the index of the team (0 = players 0 & 2, 1 = players 1 & 3) that has
// reached the winning score, or null if nobody has won yet.
const getWinningTeam = (room: Room): number | null => {
    if ((room.players[0]?.points ?? 0) >= WIN_SCORE) return 0
    if ((room.players[1]?.points ?? 0) >= WIN_SCORE) return 1
    return null
}

const startGame = (room: Room) => {
    if (!room) return

    const deck = shuffleDeck(generateKeys())
    room.deck = deck
    room.turn = 0
    room.trump = deck[deck.length - 1]
    room.multiplier = 1
    room.lastWinner = 0
    room.started = true
    room.paused = false
    room.disconnected = []
    room.pauseEndsAt = undefined
    clearDavi(room)

    room.players.forEach((player) => {
        player.hand = []
        player.played = []
        player.taken = []
        player.points = 0
    })

    dealHand(room)
}

// True when every card in `hand` exists in `playerHand`, counting multiplicity
// (so a card the player holds once can't be played twice in the same hand).
const handIsOwned = (hand: Card[], playerHand: Card[]): boolean => {
    const remaining = playerHand.map((c) => `${c.suite}_${c.value}`)
    return hand.every((c) => {
        const i = remaining.indexOf(`${c.suite}_${c.value}`)
        if (i === -1) return false
        remaining.splice(i, 1)
        return true
    })
}

// Server-side authority for a play attempt. The client checks the same rules
// for UX, but only this check is binding: it must be the player's turn, they
// must not have already played into the current trick, every card must come
// from their own hand, a lead must be single-suited, and a follow must match
// the lead's card count. A genuine Bura (five trumps from hand) is exempt
// from the lead/follow shape rules, matching how it could always be declared.
const validatePlay = (room: Room, playerIndex: number, hand: Card[]): boolean => {
    if (!room.started || room.paused || room.davi.pending) return false
    if (room.turn !== playerIndex) return false

    const player = room.players[playerIndex]
    if (!player) return false
    if (player.played.length !== 0) return false

    if (hand.length === 0 || hand.length > 5) return false
    if (!handIsOwned(hand, player.hand)) return false

    if (isBura(room, hand)) return true

    const leadCount = room.players.find((p) => p.played.length > 0)?.played.length
    if (leadCount === undefined) {
        // Leading the trick: all cards must share one suite.
        return hand.every((c) => c.suite === hand[0]!.suite)
    }
    return hand.length === leadCount
}

// Moves the played cards from the player's hand to their played pile. Keeps
// the server's own card instances (matched by suite/value) so client-supplied
// objects — and any spoofed fields on them — never enter the room state.
const applyPlay = (player: Player, hand: Card[]) => {
    const isPlayed = (card: Card) => hand.some((h) => h.suite === card.suite && h.value === card.value)
    player.played = player.hand.filter(isPlayed)
    player.hand = player.hand.filter((card) => !isPlayed(card))
}

// Records a single play and advances the turn. Does NOT resolve a completed
// trick — that is deferred (see resolveTrick) so all four cards can be shown
// for a moment before the winner takes them.
const handlePlayedHand = (hand: Card[], room: Room): { allPlayed: boolean } => {
    const player = room.players[room.turn!]
    if (!player) return { allPlayed: false }
    applyPlay(player, hand)
    room.turn = (room.turn! + 1) % 4

    const allPlayed = room.players.every((player) => player.played.length !== 0)
    return { allPlayed }
}

// Resolves a completed trick: the winner takes the four played cards, played
// hands are cleared, and the next cards are dealt.
const resolveTrick = (room: Room): { winnerIndex: number } => {
    const winnerIndex = determineWinner(room.players, room.trump!, room.lastWinner)
    room.lastWinner = winnerIndex
    room.players[winnerIndex]!.taken.push(...gatherPlayedCards(room.players))

    room.turn = room.lastWinner
    room.players.forEach((player) => (player.played = []))

    dealHand(room)
    return { winnerIndex }
}

const startRound = (room: Room) => {
    if (!room) return

    const deck = shuffleDeck(generateKeys())
    room.deck = deck
    room.turn = room.lastWinner
    room.trump = deck[deck.length - 1]
    room.multiplier = 1
    clearDavi(room)

    room.players.forEach((player) => {
        player.hand = []
        player.played = []
        player.taken = []
    })

    dealHand(room)
}

type RoundResult = { message: string, gameOver: boolean, winnerText?: string }

const winnerMessage = (room: Room, team: number): string => {
    const [a, b] = team === 0 ? [0, 2] : [1, 3]
    return `${room.players[a]!.username} & ${room.players[b]!.username} won the game!`
}

const handleRoundOver = (room: Room): RoundResult => {
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

    const winningTeam = getWinningTeam(room)
    if (winningTeam !== null) {
        return { message: text, gameOver: true, winnerText: winnerMessage(room, winningTeam) }
    }
    return { message: text, gameOver: false }
}

// Bura: a hand of five cards all of the trump suit, played at once. It instantly
// wins the round for the player's team, regardless of accumulated card points.
const isBura = (room: Room, hand: Card[]): boolean => {
    const trumpSuite = room.trump?.suite
    return hand.length === 5 && !!trumpSuite && hand.every((c) => c.suite === trumpSuite)
}

const handleBura = (room: Room, playerIndex: number): RoundResult => {
    const team = playerIndex % 2
    const [a, b] = team === 0 ? [0, 2] : [1, 3]
    room.players[a]!.points += room.multiplier
    room.players[b]!.points += room.multiplier

    const message = `${room.players[playerIndex]!.username} called Bura! ${room.players[a]!.username} & ${room.players[b]!.username} win the round.`

    const won = getWinningTeam(room)
    if (won !== null) {
        return { message, gameOver: true, winnerText: winnerMessage(room, won) }
    }
    return { message, gameOver: false }
}

// Player on turn offers/raises davi. Returns true if the offer was opened.
const offerDavi = (room: Room, playerIndex: number): boolean => {
    if (!room.started || room.paused) return false
    if (room.davi.pending) return false
    if (room.turn !== playerIndex) return false
    // Only before this player has played into the current trick.
    if ((room.players[playerIndex]?.played.length ?? 0) !== 0) return false
    if (room.multiplier + 1 > MAX_DAVI) return false

    room.davi.pending = true
    room.davi.from = playerIndex
    room.davi.to = (playerIndex + 1) % 4
    room.davi.level = room.multiplier + 1
    return true
}

type DaviResponse =
    | { type: 'pending' }                              // still pending (accepted to continue, or challenged back)
    | { type: 'round-over', message: string, gameOver: boolean, winnerText?: string }
    | null                                             // invalid

// Challenged player responds to a pending davi.
const respondDavi = (room: Room, playerIndex: number, action: 'accept' | 'decline' | 'challenge'): DaviResponse => {
    if (!room.davi.pending) return null
    if (room.davi.to !== playerIndex) return null

    if (action === 'accept') {
        room.multiplier = room.davi.level
        clearDavi(room)
        return { type: 'pending' }
    }

    if (action === 'challenge') {
        if (room.davi.level + 1 > MAX_DAVI) return null // can't raise past the cap
        room.davi.level += 1
        // Swap roles: the challenge bounces back to the original offerer.
        const newTo = room.davi.from
        room.davi.from = room.davi.to
        room.davi.to = newTo
        return { type: 'pending' }
    }

    // decline: the challenged player's team forfeits the round at the current
    // accepted stake (room.multiplier); the offering team scores it.
    const winningTeam = (room.davi.from ?? 0) % 2
    const [a, b] = winningTeam === 0 ? [0, 2] : [1, 3]
    room.players[a]!.points += room.multiplier
    room.players[b]!.points += room.multiplier
    const declinerName = room.players[room.davi.to!]?.username
    const message = `${declinerName} declined! ${room.players[a]!.username} & ${room.players[b]!.username} win the round.`
    clearDavi(room)

    const won = getWinningTeam(room)
    if (won !== null) {
        return { type: 'round-over', message, gameOver: true, winnerText: winnerMessage(room, won) }
    }
    return { type: 'round-over', message, gameOver: false }
}

// Return a finished room to a fresh lobby state, keeping its players so they can
// rematch. A subsequent startGame fully re-initialises play.
const resetRoomToLobby = (room: Room) => {
    room.deck = []
    room.turn = null
    room.trump = undefined
    room.multiplier = 1
    room.lastWinner = 0
    room.started = false
    room.paused = false
    room.disconnected = []
    room.pauseEndsAt = undefined
    clearDavi(room)

    room.players.forEach((player) => {
        player.hand = []
        player.played = []
        player.taken = []
        player.points = 0
    })
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

export { startGame, handlePlayedHand, resolveTrick, startRound, handleRoundOver, offerDavi, respondDavi, isBura, handleBura, resetRoomToLobby, validatePlay, applyPlay }
