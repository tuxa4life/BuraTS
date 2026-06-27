import { useState, useEffect } from 'react'
import '../styles/lobby.css'
import { useSockets } from '../Context/useSockets'
import { useUser } from '../Context/useUser'
import { useNavigate, useParams } from 'react-router-dom'
import Img from './Components/Img'
import NotFound from './Components/NotFound'
import StatusScreen, { TimedFallback } from './Components/StatusScreen'
import type { Player } from '../types'
import { useLanguage } from '../i18n/useLanguage'
import { useToast } from '../Context/useToast'

// How long to keep showing "Joining…" before concluding the room isn't there.
// The connection gate in App already guarantees the socket is up, so a real
// join answers in well under a second.
const JOIN_TIMEOUT_MS = 10 * 1000

const Lobby = () => {
    const { game, leaveRoom, joinRoom, triggerStart, setTeam } = useSockets()
    const { user } = useUser()
    const { t } = useLanguage()
    const { showToast } = useToast()
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
            <TimedFallback
                timeoutMs={JOIN_TIMEOUT_MS}
                loading={<StatusScreen loading title={t('lobby.joining.title')} message={t('lobby.joining.message')} />}
                fallback={<NotFound title={t('lobby.notFound.title')} message={t('lobby.notFound.message')} />}
            />
        )
    }

    const hostId = game.players[0]?.id
    const myTeam = game.players.find((p) => p.id === user?.id)?.team
    const team0 = game.players.filter((p) => p.team === 0)
    const team1 = game.players.filter((p) => p.team === 1)
    const isCreator = hostId === user?.id
    const canStart = team0.length === 2 && team1.length === 2

    const handleCopyRoomId = () => {
        const url = window.location.origin + `/lobby/${game.id}`
        navigator.clipboard
            .writeText(url)
            .then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            })
            .catch(() => showToast('lobby.cannotCopy'))
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

    const renderTeam = (players: Player[], teamIndex: number, label: string) => (
        <div className="team-column">
            <div className="team-header">
                <span>{label}</span>
                <span className={`team-count ${players.length === 2 ? 'full' : ''}`}>{players.length} / 2</span>
            </div>

            <div className="team-players">
                {players.map((player) => (
                    <div key={player.id} className="player-card">
                        <Img src={player.picture} alt={player.username} className="player-avatar" />
                        <div className="player-username">{player.username}</div>
                        {player.id === hostId && <span className="host-badge">{t('lobby.host')}</span>}
                    </div>
                ))}
                {Array.from({ length: Math.max(0, 2 - players.length) }).map((_, i) => (
                    <div key={`empty-${teamIndex}-${i}`} className="player-card empty">
                        {t('lobby.emptySlot')}
                    </div>
                ))}
            </div>

            {myTeam !== teamIndex && (
                <button className="join-team-button" onClick={() => setTeam(teamIndex)}>
                    {t('lobby.joinTeam', { team: label })}
                </button>
            )}
        </div>
    )

    return (
        <div className="lobby-container">
            <div className="background-circle circle-top" />
            <div className="background-circle circle-bottom" />

            <div className="lobby-card">
                <div className="lobby-header">
                    <h1 className="lobby-title">{t('lobby.title')}</h1>
                    <p className="lobby-subtitle">{t('lobby.subtitle')}</p>
                </div>

                <div className="room-id-container">
                    <div className="room-id-label">{t('lobby.roomId')}</div>
                    <div className="room-id-content">
                        <span className="room-id-text">{game.id}</span>
                        <button onClick={handleCopyRoomId} className={`copy-button ${copied ? 'copied' : ''}`}>
                            {copied ? t('lobby.copied') : t('lobby.copy')}
                        </button>
                    </div>
                </div>

                <div className="teams-container">
                    {renderTeam(team0, 0, t('lobby.team1'))}
                    {renderTeam(team1, 1, t('lobby.team2'))}
                </div>

                {!canStart && <p className="team-hint">{t('lobby.teamHint', { count: game.players.length })}</p>}

                <div className="actions">
                    {isCreator && (
                        <button onClick={handleStartGame} disabled={!canStart} className={`start-button ${canStart ? 'enabled' : 'disabled'}`}>
                            {t('lobby.startGame')}
                        </button>
                    )}
                    <button onClick={handleLeaveRoom} className="leave-button">
                        {t('lobby.leaveRoom')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Lobby
