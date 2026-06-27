import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { SocketProvider } from './Context/socketContext.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './Context/userContext.tsx'
import { LanguageProvider } from './i18n/LanguageProvider.tsx'
import { ToastProvider } from './Context/toastContext.tsx'

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <LanguageProvider>
            <ToastProvider>
                <SocketProvider>
                    <UserProvider>
                        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                            <App />
                        </GoogleOAuthProvider>
                    </UserProvider>
                </SocketProvider>
            </ToastProvider>
        </LanguageProvider>
    </BrowserRouter>
)
