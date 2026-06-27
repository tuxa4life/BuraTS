import { useNavigate, useParams } from 'react-router-dom'
import { useSockets } from '../Context/useSockets'
import '../styles/game.css'
import PlayerCard from './Components/PlayerCard'
import { useUser } from '../Context/useUser'
import CardSelection from './Components/CardSelection'
import Deck from './Components/Deck'
import Scoreboard from './Components/Scoreboard'
import { useEffect, useState } from 'react'
import type { Card } from '../types'
import PlayedCards from './Components/PlayedCards'
import Chat from './Components/Chat'
import NotFound from './Components/NotFound'
import StatusScreen, { TimedFallback } from './Components/StatusScreen'
import { useLanguage } from '../i18n/useLanguage'

// How long to keep showing "Joining…" before concluding the game isn't there.
// The connection gate in App already guarantees the socket is up, so a real
// rejoin answers in well under a second.
const JOIN_TIMEOUT_MS = 10 * 1000

const Game = () => {
    const [selected, setSelected] = useState<Card[]>([])

    const { game, message, gameOver, chatMessages, sendChat, playHand, offerDavi, respondDavi, dismissGameOver, rematch, joinRoom, leaveRoom } = useSockets()
    const { user } = useUser()
    const { t } = useLanguage()
    const { roomID } = useParams()
    const navigate = useNavigate()

    // Leave prompt: stepping away keeps the seat (game pauses, rejoinable);
    // quitting forfeits and ends the game for all four players.
    const [showLeave, setShowLeave] = useState(false)
    const handleStepAway = () => {
        leaveRoom('step-away')
        navigate('/')
    }
    const handleQuit = () => {
        leaveRoom('quit')
        navigate('/')
    }

    // Re-attach this socket to the room on (re)mount — e.g. after a refresh or
    // reconnect — so the server can clear our disconnected flag and resume.
    // joinRoom is memoized with a stable identity, so it is safe in the deps.
    useEffect(() => {
        if (roomID && user) joinRoom(roomID)
    }, [roomID, user, joinRoom])

    // Live countdown for the pause/reconnect window. State is only written from
    // the interval callback (never synchronously in the effect), and each tick
    // is tagged with its window's deadline so a value left over from an earlier
    // pause is ignored. Until the first tick the display falls back to '2:00',
    // which is exactly what a fresh window shows anyway.
    const pauseEndsAt = game?.pauseEndsAt ?? null
    const isPaused = !!game?.paused
    const [tick, setTick] = useState<{ endsAt: number, remaining: number } | null>(null)
    useEffect(() => {
        if (!isPaused || !pauseEndsAt) return
        const interval = setInterval(() => {
            setTick({ endsAt: pauseEndsAt, remaining: Math.max(0, Math.ceil((pauseEndsAt - Date.now()) / 1000)) })
        }, 500)
        return () => clearInterval(interval)
    }, [isPaused, pauseEndsAt])
    const remaining = tick && tick.endsAt === pauseEndsAt ? tick.remaining : null

    if (gameOver) {
        return (
            <div className="game-container">
                <div className="pause-overlay">
                    <div className="pause-card">
                        <h2>{t('game.over')}</h2>
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
                            <button className="davi-button accept" onClick={rematch}>{t('game.rematch')}</button>
                            <button className="davi-button decline" onClick={dismissGameOver}>{t('common.backToHome')}</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!game || !game.trump) {
        return (
            <TimedFallback
                timeoutMs={JOIN_TIMEOUT_MS}
                loading={<StatusScreen loading title={t('game.joining.title')} message={t('game.joining.message')} />}
                fallback={<NotFound title={t('game.notFound.title')} message={t('game.notFound.message')} />}
            />
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

    // Only opponents get a bubble in the top bar — you're always the bottom seat.
    const opponentCards = rotated
        .map((player, i) => (
            <PlayerCard key={player.id} username={player.username} picture={player.picture} position={positions[i]} isActive={game.turn === (myIndex + i) % 4} />
        ))
        .slice(1)

    const playedHands = rotated.map((player, i) => {
        return <PlayedCards key={`played-${player.id}`} played={player.played} position={positions[i]} />
    })

    return (
        <div className="game-container">
            <Chat messages={chatMessages} sendChat={sendChat} currentUserId={user?.id} />

            <button className="leave-game-button" onClick={() => setShowLeave(true)}>Leave</button>

            <div className="top-bar">
                <Scoreboard players={game.players} />
                <div className="opponents-row">{opponentCards}</div>
            </div>

            <div className="table-felt">
                <div className="felt">
                    {playedHands}
                    <Deck count={game.deckCount} trump={game.trump} />
                    { message && <p className='game-message'>{message}</p> }
                </div>
            </div>

            <div className="hand-dock">
                <div className="action-row">
                    <button onClick={handlePlayHand} className={`play-button ${canShowControls ? 'visible' : ''}`}>{t('game.play')}</button>
                    <button onClick={handleDavi} className={`multiplier-button ${canShowControls ? 'visible' : ''}`}>{game.multiplier}x</button>
                </div>
                <CardSelection selected={selected} setSelected={setSelected} hand={game.players[myIndex].hand} trump={game.trump} />
            </div>

            { davi.pending && (
                <div className="pause-overlay">
                    <div className="pause-card davi-card">
                        <h2>
                            {/* Interpolate names but leave {word} in place, then split on it so the
                                davi word keeps its emphasis span regardless of word order per language. */}
                            {t('game.daviOffered', { from: daviFromName ?? '', to: daviToName ?? '' })
                                .split('{word}')
                                .flatMap((part, i) => (i === 0 ? [part] : [<span key={i} className="davi-word">{daviWord(davi.level)}</span>, part]))}
                        </h2>

                        {amChallenged ? (
                            <div className="davi-actions">
                                <button className="davi-button accept" onClick={() => respondDavi('accept')}>{t('game.accept')}</button>
                                {canRaiseDavi && (
                                    <button className="davi-button raise" onClick={() => respondDavi('challenge')}>{daviWord(davi.level + 1)}</button>
                                )}
                                <button className="davi-button decline" onClick={() => respondDavi('decline')}>{t('game.decline')}</button>
                            </div>
                        ) : (
                            <p className="pause-note">{t('game.waitingResponse', { name: daviToName ?? '' })}</p>
                        )}
                    </div>
                </div>
            )}

            { showLeave && (
                <div className="pause-overlay">
                    <div className="pause-card">
                        <h2>{t('game.leaveTitle')}</h2>
                        <p><strong>{t('game.stepAway')}</strong> {t('game.stepAwayDesc')}</p>
                        <p><strong>{t('game.quit')}</strong> {t('game.quitDesc')}</p>
                        <div className="davi-actions">
                            <button className="davi-button accept" onClick={handleStepAway}>{t('game.stepAway')}</button>
                            <button className="davi-button decline" onClick={handleQuit}>{t('game.quitGame')}</button>
                            <button className="davi-button raise" onClick={() => setShowLeave(false)}>{t('game.cancel')}</button>
                        </div>
                    </div>
                </div>
            )}

            { game.paused && (
                <div className="pause-overlay">
                    <div className="pause-card">
                        <h2>{t('game.paused')}</h2>
                        <p>{t('game.waitingReconnect', { names: waitingFor.length ? waitingFor.join(', ') : t('game.aPlayer') })}</p>
                        <div className="pause-countdown">{formatRemaining(remaining)}</div>
                        <p className="pause-note">{t('game.pauseNote')}</p>
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

// Must match MAX_DAVI in server/src/game.ts — the server enforces the cap.
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
