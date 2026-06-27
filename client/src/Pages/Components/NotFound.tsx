import { useNavigate } from 'react-router-dom'
import StatusScreen from './StatusScreen'
import { useLanguage } from '../../i18n/useLanguage'

// Fallback for a game or room that doesn't exist (anymore).
const NotFound = ({ title, message }: { title: string, message: string }) => {
    const navigate = useNavigate()
    const { t } = useLanguage()

    return <StatusScreen title={title} message={message} action={{ label: t('common.backToHome'), onClick: () => navigate('/') }} />
}

export default NotFound
