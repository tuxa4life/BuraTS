import { useEffect, useState } from 'react'
import { useUser } from '../Context/useUser'
import { useSockets } from '../Context/useSockets'
import { useNavigate } from 'react-router-dom'
import '../styles/home.css'
import Img from './Components/Img'
import { useLanguage } from '../i18n/useLanguage'

const Home = () => {
    const [roomId, setRoomId] = useState('')
    const { user, logOut } = useUser()
    const { rooms, joinRoom, getRooms } = useSockets()
    const { t } = useLanguage()
    const navigate = useNavigate()
    
    useEffect(() => {
        getRooms()
    }, [getRooms])

    const handleCreateRoom = () => {
        joinRoom(roomId)
        setRoomId('')
        navigate(`/lobby/${roomId}`)
    }

    const handleRoomJoin = (roomID: string) => {
        joinRoom(roomID)
        navigate(`/lobby/${roomID}`)
    }

    // Rejoin a room the user already has a seat in. Started games drop straight
    // back to the table; a (rare) lobby membership returns to the lobby.
    const handleRejoin = (room: { id: string; started: boolean }) => {
        joinRoom(room.id)
        navigate(room.started ? `/game/${room.id}` : `/lobby/${room.id}`)
    }

    if (!user) {
        return <div>{t('common.loading')}</div>
    }

    // "Your Games": rooms the user is seated in (typically a started game they
    // stepped away from). "Available Rooms": open lobbies they aren't already in
    // and that still have a free seat. Started games the user isn't part of are
    // hidden — there's nothing to join there.
    const myGames = rooms.filter((room) => room.players.some((p) => p.id === user.id))
    const availableRooms = rooms.filter(
        (room) => !room.started && room.playerCount < 4 && !room.players.some((p) => p.id === user.id)
    )

    return (
        <div className="lobby-container">
            <div className="lobby-content">
                <div className="user-profile-header">
                    <Img src={user.picture} alt={user.username} className="user-avatar" />
                    <div>
                        <h2 className="user-name">{user.username}</h2>
                        <p className="user-id">ID: {user.id}</p>
                    </div>
                    <button className="logout-button" onClick={logOut}>{t('home.logOut')}</button>
                </div>

                <div className="create-room-section">
                    <h3 className="section-title">{t('home.createNewRoom')}</h3>

                    <div className="create-room-form">
                        <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value.toLowerCase().replace(/\s/g, '').slice(0, 14))} placeholder={t('home.roomIdPlaceholder')} className="room-input" />
                        <button onClick={handleCreateRoom} disabled={!roomId.trim()} className={`create-button ${!roomId.trim() ? 'disabled' : ''}`}>
                            {t('home.createRoom')}
                        </button>
                    </div>
                </div>

                {myGames.length > 0 && (
                    <div className="rooms-list-section">
                        <h3 className="section-title">{t('home.yourGames', { count: myGames.length })}</h3>

                        <div className="rooms-list">
                            {myGames.map((room) => (
                                <div key={room.id} className="room-card">
                                    <div className="room-info">
                                        <h4 className="room-name">{room.id}</h4>
                                        <div className="room-players">
                                            <span className="room-status">{room.started ? t('home.inProgress') : t('home.inLobby')}</span>
                                            <span>
                                                {room.playerCount} {room.playerCount === 1 ? t('common.player') : t('common.players')}
                                            </span>
                                        </div>
                                    </div>

                                    <button onClick={() => handleRejoin(room)} className="join-button rejoin-button">
                                        {t('home.rejoin')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="rooms-list-section">
                    <h3 className="section-title">{t('home.availableRooms', { count: availableRooms.length })}</h3>

                    <div className="rooms-list">
                        {availableRooms.map((room) => (
                            <div key={room.id} className="room-card">
                                <div className="room-info">
                                    <h4 className="room-name">{room.id}</h4>
                                    <div className="room-players">
                                        <span>
                                            {room.playerCount} {room.playerCount === 1 ? t('common.player') : t('common.players')}
                                        </span>
                                    </div>
                                </div>

                                <button onClick={() => handleRoomJoin(room.id)} className="join-button">
                                    {t('home.joinRoom')}
                                </button>
                            </div>
                        ))}
                    </div>

                    {availableRooms.length === 0 && (
                        <div className="empty-state">
                            <p>{t('home.noRooms')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Home
