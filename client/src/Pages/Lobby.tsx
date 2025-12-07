import { useState, useEffect } from 'react'
import '../styles/lobby.css'
import { useSockets } from '../Context/socketContext'
import { useUser } from '../Context/userContext'
import { useNavigate, useParams } from 'react-router-dom'
import Img from './Components/Img'

const Lobby = () => {
    const { game, leaveRoom, joinRoom, triggerStart } = useSockets()
    const { user } = useUser()
    const [copied, setCopied] = useState(false)

    const navigate = useNavigate()
    const { roomID } = useParams()

    useEffect(() => {
        if (roomID && !game && user) {
            joinRoom(roomID)
        }
    }, [roomID, game, user, joinRoom])

    if (!game) {
        return (
            <div>
                CANNOT FIND THE GAME. <u onClick={() => navigate('/')}>Click here to go back</u>
            </div>
        )
    }

    const isCreator = game.players[0]?.id === user?.id
    const canStart = game.players.length === 4

    const handleCopyRoomId = () => {
        const url = window.location.origin + `/lobby/${game.id}`
        navigator.clipboard
            .writeText(url)
            .then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            })
            .catch(() => alert('cannot copy'))
    }

    const handleStartGame = () => {
        triggerStart()
    }

    const handleLeaveRoom = () => {
        if (roomID) {
            leaveRoom()
            navigate('/')
        }
    }

    return (
        <div className="lobby-container">
            <div className="background-circle circle-top" />
            <div className="background-circle circle-bottom" />

            <div className="lobby-card">
                <div className="lobby-header">
                    <h1 className="lobby-title">Game Lobby</h1>
                    <p className="lobby-subtitle">Waiting for players to join</p>
                </div>

                <div className="room-id-container">
                    <div className="room-id-label">Room ID</div>
                    <div className="room-id-content">
                        <span className="room-id-text">{game.id}</span>
                        <button onClick={handleCopyRoomId} className={`copy-button ${copied ? 'copied' : ''}`}>
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                <div className="section">
                    <div className="section-label">Room Creator</div>
                    <div className="creator-card">
                        <Img src={game.players[0].picture} alt={game.players[0].username} className="creator-avatar" />
                        <div className="creator-info">
                            <div className="creator-username">{game.players[0].username}</div>
                            <div className="creator-badge">Host</div>
                        </div>
                    </div>
                </div>

                <div className="section">
                    <div className="section-label players-label">
                        <span>Players</span>
                        <span className={game.players.length === 4 ? 'full' : ''}>{game.players.length} / 4</span>
                    </div>
                    <div className="players-list">
                        {game.players.slice(1).map((player) => (
                            <div key={player.id} className="player-card">
                                <Img src={player.picture} alt={player.username} className="player-avatar" />
                                <div className="player-username">{player.username}</div>
                            </div>
                        ))}
                        {[...Array(Math.max(0, 4 - game.players.length))].map((_, i) => (
                            <div key={`empty-${i}`} className="player-card empty">
                                Waiting for player...
                            </div>
                        ))}
                    </div>
                </div>

                <div className="actions">
                    {isCreator && (
                        <button onClick={handleStartGame} disabled={!canStart} className={`start-button ${canStart ? 'enabled' : 'disabled'}`}>
                            Start Game
                        </button>
                    )}
                    <button onClick={handleLeaveRoom} className="leave-button">
                        Leave Room
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Lobby
