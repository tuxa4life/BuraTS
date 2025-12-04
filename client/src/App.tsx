import { Route, Routes, useNavigate } from 'react-router-dom'
import Login from './Pages/Login'
import { useEffect } from 'react'
import { useUser } from './Context/userContext'
import Home from './Pages/Home'
import './styles/vars.css'

const App = () => {
    const { isLoggedIn } = useUser()
    const navigate = useNavigate()

    useEffect(() => {
        if (!isLoggedIn) navigate('/login')
    }, [])

    return <div>
        <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/login' element={<Login />} />
        </Routes>
    </div>
}

export default App