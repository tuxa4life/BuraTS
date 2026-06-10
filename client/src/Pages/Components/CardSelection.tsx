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

    // Give every card a z-index fixed to its position in the hand (left-to-right),
    // so stacking is deterministic. Selected cards are boosted by a constant but
    // keep their positional order, so selecting/deselecting in any order never
    // reshuffles which card sits on top.
    const cards = sortHand().map((card, i) => {
        const isSelected = selected.some((c) => c.name === card.name)
        return <img key={'hand-' + card.name} src={`/cards/${card.name}.png`} alt="" className={isSelected ? 'selected' : ''} style={{ zIndex: isSelected ? 100 + i : i }} onClick={() => toggleCard(card)} />
    })

    // Expose the card count so the CSS can overlap the hand only as much as
    // needed to keep every card on screen (see .card-selection in game.css).
    return <div className="card-selection" style={{ '--count': cards.length } as React.CSSProperties}>{cards}</div>
}

export default CardSelection
