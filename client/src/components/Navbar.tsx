import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  function navClass(path: string) {
    const active = location.pathname === path;
    return active
      ? "bg-purple-700 text-white px-5 py-2 rounded-full text-sm font-medium"
      : "text-gray-700 text-sm hover:text-purple-700 transition-colors";
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setOpenProfileMenu(false);
    navigate("/login");
  };

  return (
    <nav className="w-full bg-[#EEEEFF] px-8 py-3 flex items-center justify-between relative">
      {/* Logo */}
      <Link to="/">
        <img src="/opinion-roxo.png" alt="OpiniOn" className="h-8 w-auto" />
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-8">
        <Link to="/" className={navClass("/")}>Home</Link>
        <Link to="/comunidade" className={navClass("/comunidade")}>Comunidade</Link>
        <Link to="/dashboard" className={navClass("/dashboard")}>Dashboard</Link>
        <Link to="/buscar" className={navClass("/buscar")}>Buscar</Link>
        <Link to="/publicacao" className={navClass("/publicacao")}>Publicação</Link>
      </div>

      {/* Profile dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpenProfileMenu((prev) => !prev)}
          className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center cursor-pointer hover:border-purple-600 transition-colors bg-white"
          aria-label="Abrir menu do perfil"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7280"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>

        {openProfileMenu && (
          <div className="absolute right-0 top-12 w-44 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden z-50">
            <button
              type="button"
              onClick={() => {
                setOpenProfileMenu(false);
                navigate("/perfil");
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
            >
              Ver perfil
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}