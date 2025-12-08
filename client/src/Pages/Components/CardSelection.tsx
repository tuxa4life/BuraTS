import type { Card } from '../../types'

const CardSelection = ({ hand, trump, selected, setSelected }: { hand: Card[], trump: Card, selected: Card[], setSelected: React.Dispatch<React.SetStateAction<Card[]>> }) => {
    const sortHand = (): Card[] => {
        const suitePriority = {
            clubs: ['clubs', 'hearts', 'spades', 'diamonds'],
            spades: ['spades', 'hearts', 'clubs', 'diamonds'],
            hearts: ['hearts', 'spades', 'diamonds', 'clubs'],
            diamonds: ['diamonds', 'spades', 'hearts', 'clubs'],
        }

        const order = suitePriority[trump.suite]
        return hand.sort((a, b) => order.indexOf(a.suite) - order.indexOf(b.suite))
    }

    const toggleCard = (card: Card) => {
        setSelected((prev) => {
            const isSelected = prev.some((c) => c.name === card.name)
            if (isSelected) {
                return prev.filter((c) => c.name !== card.name)
            } else {
                return [...prev, card]
            }
        })
    }

    const cards = sortHand().map((card) => {
        const isSelected = selected.some((c) => c.name === card.name)
        return <img key={'hand-' + card.name} src={`/cards/${card.name}.png`} alt="" className={isSelected ? 'selected' : ''} onClick={() => toggleCard(card)} />
    })

    return <div className="card-selection">{cards}</div>
}

export default CardSelection
