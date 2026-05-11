import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import PrivateRoute from './components/PrivateRoute';

function App() {
    return (
        <Router>
            <Routes>

                {/* Login e Cadastro */}
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />

                {/* Home protegida */}
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <Home />
                        </PrivateRoute>
                    }
                />

            </Routes>
        </Router>
    );
}

export default App;