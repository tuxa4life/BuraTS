import type { CSSProperties } from "react"
import type { Card } from "../../types"

const PlayedCards = ({played, position}: {played: Card[], position: string}) => {
    const rendered = played.map((card) => {
        return <img key={`played-${card.name}`} src={`/cards/${card.name}.png`} alt={card.name} />
    })

    // Past 3 cards a centred row gets too wide for phones, so feed the count to
    // the mobile stylesheet as an overlap amount (CSS-only on larger screens).
    const overlap = played.length > 3 ? (played.length - 3) * 16 : 0
    const style = { ['--played-overlap']: `${overlap}px` } as CSSProperties

    return <div className={`played-cards ${position}`} style={style}>
        { rendered }
    </div>
}

export default PlayedCards