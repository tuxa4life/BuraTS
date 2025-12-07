import { type Card, Suite } from '../types.js'

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

export { generateKeys, shuffleDeck }