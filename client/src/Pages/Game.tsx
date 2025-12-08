import { useNavigate } from 'react-router-dom'
import { useSockets } from '../Context/socketContext'
import '../styles/game.css'
import PlayerCard from './Components/PlayerCard'
import { useUser } from '../Context/userContext'
import CardSelection from './Components/CardSelection'
import Deck from './Components/Deck'
import Scoreboard from './Components/Scoreboard'
import { useState } from 'react'
import type { Card } from '../types'
import PlayedCards from './Components/PlayedCards'

const Game = () => {
    const [selected, setSelected] = useState<Card[]>([])

    const { game, playHand } = useSockets()
    const { user } = useUser()
    const navigate = useNavigate()

    if (!game || !game.trump) {
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
    
    const playedHands = rotated.map((player, i) => {
        return <PlayedCards key={`played-${player.id}`} played={player.played} position={positions[i]} />
    })

    return <div className="game-container">
        { playerCards }
        { playedHands }

        <button onClick={() => playHand(selected)} className={`play-button ${(myTurn && game.players[myIndex].played.length === 0)  ? 'visible' : ''}`}>PLAY</button>
        { myTurn && <button className='multiplier-button'>{game.multiplier}x</button> }

        <CardSelection selected={selected} setSelected={setSelected} hand={game.players[myIndex].hand} trump={game.trump} />
        <Deck deck={game.deck} trump={game.trump} />
        <Scoreboard players={game.players} />
    </div>
}

export default Game
