import { useNavigate } from 'react-router-dom'
import { useSockets } from '../Context/socketContext'
import '../styles/game.css'
import PlayerCard from './Components/PlayerCard'
import { useUser } from '../Context/userContext'

const Game = () => {
    const { game } = useSockets()
    const { user } = useUser()
    const navigate = useNavigate()

    if (!game) {
        return <div>Game not found. <u onClick={() => navigate('/')}>Click here to go back</u></div>
        
    }

    const myIndex = game.players.findIndex((p) => p.id === user?.id)
    if (myIndex === -1) return null
    const myTurn = myIndex === game.turn

    const rotated = [game.players[myIndex], game.players[(myIndex + 1) % 4], game.players[(myIndex + 2) % 4], game.players[(myIndex + 3) % 4]]
    const positions = ['bottom', 'left', 'top', 'right']

    const playerCards = rotated.map((player, i) => {
        return <PlayerCard key={player.id} username={player.username} picture={player.picture} position={positions[i]} isActive={game.turn === (myIndex + i) % 4} />
    })
    

    return <div className="game-container">
        {myTurn && <h1>YOUR TURN</h1>}
        {playerCards}
    </div>
}

export default Game
