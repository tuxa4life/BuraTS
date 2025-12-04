import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { SocketProvider } from './Context/socketContext.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './Context/userContext.tsx'

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <UserProvider>
            <SocketProvider>
                <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                    <App />
                </GoogleOAuthProvider>
            </SocketProvider>
        </UserProvider>
    </BrowserRouter>
)
