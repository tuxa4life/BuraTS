import { useNavigate } from 'react-router-dom'
import StatusScreen from './StatusScreen'

// Fallback for a game or room that doesn't exist (anymore).
const NotFound = ({ title, message }: { title: string, message: string }) => {
    const navigate = useNavigate()

    return <StatusScreen title={title} message={message} action={{ label: 'Back to home', onClick: () => navigate('/') }} />
}

export default NotFound
