import { useNavigate, useParams } from 'react-router-dom'
import { useSockets } from '../Context/socketContext'
import '../styles/game.css'
import PlayerCard from './Components/PlayerCard'
import { useUser } from '../Context/userContext'
import CardSelection from './Components/CardSelection'
import Deck from './Components/Deck'
import Scoreboard from './Components/Scoreboard'
import { useEffect, useState } from 'react'
import type { Card } from '../types'
import PlayedCards from './Components/PlayedCards'

const Game = () => {
    const [selected, setSelected] = useState<Card[]>([])
    const [remaining, setRemaining] = useState<number | null>(null)

    const { game, message, messageState, gameOver, playHand, offerDavi, respondDavi, dismissGameOver, rematch, joinRoom } = useSockets()
    const { user } = useUser()
    const navigate = useNavigate()
    const { roomID } = useParams()

    // Re-attach this socket to the room on (re)mount — e.g. after a refresh or
    // reconnect — so the server can clear our disconnected flag and resume.
    // Intentionally excludes `joinRoom` from deps: it gets a new identity on
    // every SocketProvider render, so including it would re-fire on every
    // game-data update and cause an infinite join-room loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (roomID && user) joinRoom(roomID)
    }, [roomID, user])

    // Live countdown for the pause/reconnect window.
    const pauseEndsAt = game?.pauseEndsAt ?? null
    const isPaused = !!game?.paused
    useEffect(() => {
        if (!isPaused || !pauseEndsAt) {
            setRemaining(null)
            return
        }
        const tick = () => setRemaining(Math.max(0, Math.ceil((pauseEndsAt - Date.now()) / 1000)))
        tick()
        const interval = setInterval(tick, 500)
        return () => clearInterval(interval)
    }, [isPaused, pauseEndsAt])

    if (gameOver) {
        return (
            <div className="game-container">
                <div className="pause-overlay">
                    <div className="pause-card">
                        <h2>Game over</h2>
                        <p>{gameOver.message}</p>

                        <div className="gameover-scores">
                            {gameOver.teams.map((team, i) => (
                                <div key={i} className="gameover-team">
                                    <span className="gameover-team-names">{team.names.filter(Boolean).join(' & ')}</span>
                                    <span className="gameover-team-points">{team.points}</span>
                                </div>
                            ))}
                        </div>

                        <div className="davi-actions">
                            <button className="davi-button accept" onClick={rematch}>Rematch</button>
                            <button className="davi-button decline" onClick={dismissGameOver}>Back to home</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!game || !game.trump) {
        return (
            <div>
                Game not found. <u onClick={() => navigate('/')}>Click here to go back</u>
            </div>
        )
    }

    const myIndex = game.players.findIndex((p) => p.id === user?.id)
    if (myIndex === -1) return null
    const myTurn = myIndex === game.turn

    const waitingFor = game.disconnected
        .map((id) => game.players.find((p) => p.id === id)?.username)
        .filter((name): name is string => !!name)

    const davi = game.davi
    const daviFromName = davi.from !== undefined ? game.players[davi.from]?.username : ''
    const daviToName = davi.to !== undefined ? game.players[davi.to]?.username : ''
    const amChallenged = davi.pending && davi.to === myIndex
    const canRaiseDavi = davi.level < MAX_DAVI

    const handlePlayHand = () => {
        if (game.paused || game.davi.pending) return
        playHand(selected, myIndex)
        setSelected([])
    }

    const handleDavi = () => {
        if (game.paused || game.davi.pending) return
        if (!myTurn) return
        offerDavi()
    }

    const actionsLocked = game.paused || game.davi.pending
    const canShowControls = myTurn && !actionsLocked && game.players[myIndex].played.length === 0 && game.players[myIndex].hand.length !== 0

    const rotated = [game.players[myIndex], game.players[(myIndex + 1) % 4], game.players[(myIndex + 2) % 4], game.players[(myIndex + 3) % 4]]
    const positions = ['bottom', 'left', 'top', 'right']

    const playerCards = rotated.map((player, i) => {
        return <PlayerCard key={player.id} username={player.username} picture={player.picture} position={positions[i]} isActive={game.turn === (myIndex + i) % 4} />
    })

    const playedHands = rotated.map((player, i) => {
        return <PlayedCards key={`played-${player.id}`} played={player.played} position={positions[i]} />
    })

    return (
        <div className="game-container">
            {playerCards}
            {playedHands}

            { messageState && <p className='game-message'>{message}</p> }

            <button onClick={handlePlayHand} className={`play-button ${canShowControls ? 'visible' : ''}`}>PLAY</button>
            <button onClick={handleDavi} className={`multiplier-button ${canShowControls ? 'visible' : ''}`}>{game.multiplier}x</button>

            <CardSelection selected={selected} setSelected={setSelected} hand={game.players[myIndex].hand} trump={game.trump} />
            <Deck deck={game.deck} trump={game.trump} />
            <Scoreboard players={game.players} />

            { davi.pending && (
                <div className="pause-overlay">
                    <div className="pause-card davi-card">
                        <h2>
                            {daviFromName} offered <span className="davi-word">{daviWord(davi.level)}</span> to {daviToName}
                        </h2>

                        {amChallenged ? (
                            <div className="davi-actions">
                                <button className="davi-button accept" onClick={() => respondDavi('accept')}>Accept</button>
                                {canRaiseDavi && (
                                    <button className="davi-button raise" onClick={() => respondDavi('challenge')}>{daviWord(davi.level + 1)}</button>
                                )}
                                <button className="davi-button decline" onClick={() => respondDavi('decline')}>Decline</button>
                            </div>
                        ) : (
                            <p className="pause-note">Waiting for {daviToName} response…</p>
                        )}
                    </div>
                </div>
            )}

            { game.paused && (
                <div className="pause-overlay">
                    <div className="pause-card">
                        <h2>Game paused</h2>
                        <p>Waiting for {waitingFor.length ? waitingFor.join(', ') : 'a player'} to reconnect…</p>
                        <div className="pause-countdown">{formatRemaining(remaining)}</div>
                        <p className="pause-note">The game will end and everyone returns to the main page if they don't return in time.</p>
                    </div>
                </div>
            )}
        </div>
    )
}

const formatRemaining = (seconds: number | null): string => {
    if (seconds === null) return '2:00'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

const MAX_DAVI = 11

// Old Iranian counting words used for the davi (doubling) levels.
const DAVI_WORDS: Record<number, string> = {
    2: 'davi',
    3: 'se',
    4: 'chari',
    5: 'panji',
    6: 'shashi',
    7: 'hafti',
    8: 'hashti',
    9: 'noi',
    10: 'dahi',
    11: 'yazdahi',
}

const daviWord = (level: number): string => DAVI_WORDS[level] ?? `${level}`

export default Game
