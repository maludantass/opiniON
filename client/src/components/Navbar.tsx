import { Link } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav className="w-full bg-white border-b border-gray-100 px-8 py-3 flex items-center justify-between">
            {/* Logo */}
            <Link to="/">
                <img
                    src="/opinion-roxo.png"
                    alt="OpiniOn"
                    className="h-8 w-auto"
                />
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-8">
                <button className="bg-purple-700 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-purple-800 transition-colors">
                    Button
                </button>
                <Link to="/comunidade" className="text-gray-700 text-sm hover:text-purple-700 transition-colors">
                    Comunidade
                </Link>
                <Link to="/buscar" className="text-gray-700 text-sm hover:text-purple-700 transition-colors">
                    Buscar
                </Link>
                <Link to="/saiba-mais" className="text-gray-700 text-sm hover:text-purple-700 transition-colors">
                    Saiba mais
                </Link>
            </div>

            {/* Profile icon */}
            <div className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center cursor-pointer hover:border-purple-600 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
            </div>
        </nav>
    );
}