import type { Card } from "../../types"

const PlayedCards = ({played, position}: {played: Card[], position: string}) => {
    const rendered = played.map((card) => {
        return <img key={`played-${card.name}`} src={`/cards/${card.name}.png`} alt={card.name} />
    })

    return <div className={`played-cards ${position}`}>
        { rendered }
    </div>
}

export default PlayedCards