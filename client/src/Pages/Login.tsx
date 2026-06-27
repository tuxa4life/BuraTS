import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import '../styles/login.css'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../Context/useUser'
import { useEffect } from 'react'
import { loadStoredUser } from '../utils/storage'
import { useLanguage } from '../i18n/useLanguage'

interface JwtData {
    name: string
    picture: string
    sub: string
}

const Login = () => {
    const { setUser } = useUser()
    const { t } = useLanguage()
    const navigate = useNavigate()

    const handleResponse = (resp: CredentialResponse): void => {
        const { name, picture, sub } = jwtDecode<JwtData>(resp.credential || 'null')
        setUser({ id: sub, username: name, picture })

        navigate('/')
    }

    useEffect(() => {
        if (loadStoredUser()) navigate('/')
    }, [navigate])

    return (
        <div className="login-container">
            <div className="background-animation">
                <div className="circle circle-1"></div>
                <div className="circle circle-2"></div>
                <div className="circle circle-3"></div>
            </div>

            <div className="login-card">
                <h1 className="login-title">Bura 4 Kaca 5 Karta</h1>
                <h2 className="login-sub-title">{t('login.welcome')}</h2>
                <p className="login-subtitle">{t('login.subtitle')}</p>

                <div className="login-wrapper">
                    <GoogleLogin onSuccess={handleResponse} onError={() => alert(t('login.error'))} />
                </div>
            </div>
        </div>
    )
}

export default Login
