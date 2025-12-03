export const generateKeys = (): Card[] => {
    const suites = [Suite.spades, Suite.heart, Suite.clubs, Suite.diamonds]
    const values = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

    const keys: Card[] = []

    suites.forEach((suite) =>
        values.forEach((value) => {
            const card: Card = {
                suite,
                value,
                getName: () => {
                    return `${suite}_${value}`
                },
            }

            keys.push(card)
        })
    )

    return keys
}
