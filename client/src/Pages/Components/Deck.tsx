import type { Card } from '../../types'

const Deck = ({count, trump} : {count: number, trump: Card}) => {
    return (
        <div className="deck-container">
    {count !== 0 ? (
        <>
            <img className="back-card" src="/cards/back_light.png" alt="Card back" />
            <img className="trump-card" src={`/cards/${trump.name}.png`} alt={trump.name} />
            <p className="deck-count">{count}</p>
        </>
    ) : (
        <img className="clipped" src={`/cards/${trump.suite}_A.png`} alt={trump.suite} />
    )}
</div>
    )
}

export default Deck