import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { SocketProvider } from './Context/socketContext.tsx'

createRoot(document.getElementById('root')!).render(
    <SocketProvider>
        <App />
    </SocketProvider>
)
