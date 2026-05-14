import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Comunidade from './pages/Comunidade';
import CompatibilidadeDetalhe from './pages/CompatibilidadeDetalhe';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
    return (
        <Router>
            <Toaster position="top-right" />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />

                <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
                <Route path="/comunidade" element={<PrivateRoute><Comunidade /></PrivateRoute>} />
                <Route path="/comunidade/:userId" element={<PrivateRoute><CompatibilidadeDetalhe /></PrivateRoute>} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            </Routes>
        </Router>
    );
}

export default App;