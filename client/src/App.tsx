import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Comunidade from './pages/Comunidade';
import Comunidades from './pages/Comunidades';
import ComunidadeDetalhe from './pages/ComunidadeDetalhe';
import CriarComunidade from './pages/CriarComunidade';
import CompatibilidadeDetalhe from './pages/CompatibilidadeDetalhe';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import Publicacao from './pages/Publicacao';
import Buscar from './pages/Buscar';
import Perfil from './pages/Perfil';
import NotFound from './pages/NotFound';

function App() {
    return (
        <Router>
            <Toaster position="top-right" />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />

                <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
                <Route path="/comunidade" element={<PrivateRoute><Comunidade /></PrivateRoute>} />
                <Route path="/compatibilidade/:userId" element={<PrivateRoute><CompatibilidadeDetalhe /></PrivateRoute>} />
                <Route path="/comunidades" element={<PrivateRoute><Comunidades /></PrivateRoute>} />
                <Route path="/comunidades/criar" element={<PrivateRoute><CriarComunidade /></PrivateRoute>} />
                <Route path="/comunidades/:id" element={<PrivateRoute><ComunidadeDetalhe /></PrivateRoute>} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/buscar" element={<PrivateRoute><Buscar /></PrivateRoute>} />
                <Route path="/publicacao" element={<PrivateRoute><Publicacao /></PrivateRoute>} />
                <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default App;
