import type { Card } from '../../types'

const Deck = ({deck, trump} : {deck: Card[], trump: Card}) => {
    return (
        <div className="deck-container">
    {deck.length !== 0 ? (
        <>
            <img className="back-card" src="/cards/back_light.png" alt="Card back" />
            <img className="trump-card" src={`/cards/${trump.name}.png`} alt={trump.name} />
            <p className="deck-count">{deck.length}</p>
        </>
    ) : (
        <img className="clipped" src={`/cards/${trump.suite}_A.png`} alt={trump.suite} />
    )}
</div>
    )
}

export default Deck