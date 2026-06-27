import type { Player } from "../../types"
import { useLanguage } from "../../i18n/useLanguage"

const Scoreboard = ({ players }: { players: Player[] }) => {
    const { t } = useLanguage()
    return (
        <div className="scoreboard">
            <h3>{t('game.points')}</h3>
            <div className="team-score">
                <span className="team-name">{`${players[0].username} & ${players[2].username}`}</span>
                <span className="team-points">{players[0].points}</span>
            </div>
            <div className="team-score">
                <span className="team-name">{`${players[1].username} & ${players[3].username}`}</span>
                <span className="team-points">{players[1].points}</span>
            </div>
        </div>
    )
}

export default Scoreboard
