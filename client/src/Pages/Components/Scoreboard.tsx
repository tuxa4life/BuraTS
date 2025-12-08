import type { Player } from "../../types"

const Scoreboard = ({ players }: { players: Player[] }) => {
    const team1 = [players[0], players[2]]
    const team2 = [players[1], players[3]]

    const team1Points = team1.reduce((sum, p) => sum + p.points, 0)
    const team2Points = team2.reduce((sum, p) => sum + p.points, 0)

    return (
        <div className="scoreboard">
            <h3>Points</h3>
            <div className="team-score">
                <span className="team-name">{`${team1[0].username} & ${team1[1].username}`}</span>
                <span className="team-points">{team1Points}</span>
            </div>
            <div className="team-score">
                <span className="team-name">{`${team2[0].username} & ${team2[1].username}`}</span>
                <span className="team-points">{team2Points}</span>
            </div>
        </div>
    )
}

export default Scoreboard
