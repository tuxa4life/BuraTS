import { type Card, type Player, Suite } from '../types.js'

const generateKeys = (): Card[] => {
    const suites = [Suite.spades, Suite.hearts, Suite.clubs, Suite.diamonds]
    const values = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

    const keys: Card[] = []

    suites.forEach((suite) =>
        values.forEach((value) => {
            const card: Card = {
                suite,
                value,
                name: `${suite}_${value}`,
            }

            keys.push(card)
        })
    )

    return keys
}

const shuffleDeck = (cards: Card[]): Card[] => {
    const shuffled = [...cards]

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
    }

    return shuffled
}

const sortHand = (cards: Card[], trump: Card): Card[] => {
    const suitePriority = {
        clubs: ['clubs', 'hearts', 'spades', 'diamonds'],
        spades: ['spades', 'hearts', 'clubs', 'diamonds'],
        hearts: ['hearts', 'spades', 'diamonds', 'clubs'],
        diamonds: ['diamonds', 'spades', 'hearts', 'clubs'],
    }

    const cardPowers: { [k: string]: number } = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, J: 10, Q: 11, K: 12, '10': 13, A: 14 }
    const order = suitePriority[trump.suite]

    return cards.sort((a, b) => {
        const suiteDiff = order.indexOf(a.suite) - order.indexOf(b.suite)
        if (suiteDiff !== 0) return suiteDiff

        return cardPowers[b.value]! - cardPowers[a.value]!
    })
}

const beatsHand = (challengerHand: Card[], currentWinnerHand: Card[], trumpCard: Card, leadingSuit: Suite): boolean => {
    const cardPowerMap: { [k: string]: number } = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, J: 10, Q: 11, K: 12, '10': 13, A: 14 }
    for (let index = 0; index < challengerHand.length; index ++) {
        const challengerCard = challengerHand[index]
        const winnerCard = currentWinnerHand[index]
        const challengerValue = cardPowerMap[challengerCard!.value]
        const winnerValue = cardPowerMap[winnerCard!.value]

        const challengerIsTrump = challengerCard!.suite === trumpCard.suite
        const winnerIsTrump = winnerCard!.suite === trumpCard.suite

        if (challengerIsTrump && !winnerIsTrump) return true
        if (!challengerIsTrump && winnerIsTrump) return false
        

        if (challengerIsTrump && winnerIsTrump) {
            if (challengerValue! > winnerValue!) return true
            if (challengerValue! < winnerValue!) return false

            continue
        }

        const challengerIsLeadingSuit = challengerCard!.suite === leadingSuit
        const winnerIsLeadingSuit = winnerCard!.suite === leadingSuit

        if (challengerIsLeadingSuit && !winnerIsLeadingSuit) return true
        if (!challengerIsLeadingSuit && winnerIsLeadingSuit) return false

        if (challengerIsLeadingSuit && winnerIsLeadingSuit) {
            if (challengerValue! > winnerValue!) return true
            if (challengerValue! < winnerValue!) return false

            continue
        }

        continue
    }

    return false
}

const determineWinner = (players: Player[], trumpCard: Card, leadingIndex: number): number => {
    const sortedHands = players.map((player) => sortHand(player.played, trumpCard))
    let winnerIndex = leadingIndex

    const leadingSuit = sortedHands[leadingIndex]![0]!.suite
    for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
        if (playerIndex === winnerIndex) {
            continue
        }

        const challengerHand = sortedHands[playerIndex]
        const currentWinnerHand = sortedHands[winnerIndex]

        const challengerBeatsWinner = beatsHand(challengerHand!, currentWinnerHand!, trumpCard, leadingSuit)
        if (challengerBeatsWinner) {
            winnerIndex = playerIndex
        }
    }

    return winnerIndex
}


const gatherPlayedCards = (players: Player[]): Card[][] => {
    const output: Card[][] = []
    players.forEach((player) => output.push(player.played))

    return output
}

export { generateKeys, shuffleDeck, determineWinner, gatherPlayedCards }
