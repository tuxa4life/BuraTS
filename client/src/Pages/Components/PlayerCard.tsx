import Img from "./Img"

const PlayerCard = ({username, picture, position, isActive = false}: {username: string, picture: string, position: string, isActive: boolean}) => {
    return <div className={`player-bubble ${position} ${isActive ? 'active' : ''}`}>
        <div className="player-bubble-avatar">
            <Img src={picture}/>
        </div>
        <p className="player-bubble-username">{username}</p>
    </div>
}

export default PlayerCard