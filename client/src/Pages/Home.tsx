import { useEffect, useState } from 'react'
import { useUser } from '../Context/userContext'
import { useSockets } from '../Context/socketContext'
import { useNavigate } from 'react-router-dom'
import '../styles/home.css'
import Img from './Components/Img'

const Home = () => {
    const [roomId, setRoomId] = useState('')
    const { user, logOut } = useUser()
    const { rooms, joinRoom, getRooms } = useSockets()
    const navigate = useNavigate()
    
    useEffect(() => {
        getRooms()
    }, [])

    const handleCreateRoom = () => {
        joinRoom(roomId)
        setRoomId('')
        navigate(`/lobby/${roomId}`)
    }

    const handleRoomJoin = (roomID: string) => {
        joinRoom(roomID)
        navigate(`/lobby/${roomID}`)
    }

    if (!user) {
        return <div>Loading...</div>
    }

    return (
        <div className="lobby-container">
            <div className="lobby-content">
                <div className="user-profile-header">
                    <Img src={user.picture} alt={user.username} className="user-avatar" />
                    <div>
                        <h2 className="user-name">{user.username}</h2>
                        <p className="user-id">ID: {user.id}</p>
                    </div>
                    <button className="logout-button" onClick={logOut}>Log Out</button>
                </div>

                <div className="create-room-section">
                    <h3 className="section-title">Create New Room</h3>

                    <div className="create-room-form">
                        <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value.toLowerCase().replace(' ', '').slice(0, 14))} placeholder="Enter room ID..." className="room-input" />
                        <button onClick={handleCreateRoom} disabled={!roomId.trim()} className={`create-button ${!roomId.trim() ? 'disabled' : ''}`}>
                            Create Room
                        </button>
                    </div>
                </div>

                <div className="rooms-list-section">
                    <h3 className="section-title">Available Rooms ({rooms.length})</h3>

                    <div className="rooms-list">
                        {rooms.map((room) => (
                            <div key={room.id} className="room-card">
                                <div className="room-info">
                                    <h4 className="room-name">{room.id}</h4>
                                    <div className="room-players">
                                        <span>
                                            {room.playerCount} {room.playerCount === 1 ? 'player' : 'players'}
                                        </span>
                                    </div>
                                </div>

                                <button onClick={() => handleRoomJoin(room.id)} className="join-button">
                                    Join Room
                                </button>
                            </div>
                        ))}
                    </div>

                    {rooms.length === 0 && (
                        <div className="empty-state">
                            <p>No rooms available. Create one to get started!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Home
