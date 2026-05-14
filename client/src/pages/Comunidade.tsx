import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getCompatibleUsers, type UserCompatibility } from "../services/api";

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-gray-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function Avatar({ avatarUrl, size = 72 }: { avatarUrl: string | null; size?: number }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="Avatar"
        className="rounded-full object-cover ring-2 ring-purple-100"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-purple-100"
      style={{ width: size, height: size }}
    >
      <UserIcon />
    </div>
  );
}

function CircularProgress({ value, size = 72 }: { value: number; size?: number }) {
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#EDE9FE" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="#7C3AED" strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <text
        x="50%" y="50%"
        dominantBaseline="middle" textAnchor="middle"
        fontSize={size * 0.22} fontWeight="700" fill="#1a1a2e"
        style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
      >
        {value}%
      </text>
    </svg>
  );
}

function CompatibilityCard({ user, onView }: { user: UserCompatibility; onView: () => void }) {
  const displayName = user.username ?? user.email.split("@")[0];
  const handle = user.username ? `@${user.username}` : user.email;

  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:scale-[1.02] hover:shadow-md">
      <Avatar avatarUrl={user.avatarUrl} size={72} />

      <p className="mt-3 text-sm font-semibold text-[#6C3BFF]">{displayName}</p>
      <p className="mb-4 text-xs text-gray-400 truncate max-w-full">{handle}</p>

      <CircularProgress value={user.score} size={80} />
      <p className="mt-2 text-xs text-gray-500">Seu score de compatibilidade</p>

      <button
        type="button"
        onClick={onView}
        className="mt-4 w-full rounded-full border border-[#6C3BFF] px-4 py-2 text-xs font-medium text-[#6C3BFF] transition hover:bg-[#6C3BFF] hover:text-white"
      >
        Veja seus gostos em comum
      </button>
    </div>
  );
}

export default function Comunidade() {
  const [users, setUsers] = useState<UserCompatibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    getCompatibleUsers(token)
      .then(setUsers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-10">
        <h1 className="text-3xl font-bold text-[#6C3BFF] mb-2">Comunidade</h1>
        <h2 className="text-xl font-semibold text-[#6C3BFF] mb-8">
          usuários compatíveis com você
        </h2>

        {loading && (
          <p className="text-gray-400 text-sm">Carregando usuários...</p>
        )}

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-500 text-base">Nenhum usuário encontrado ainda.</p>
            <p className="text-gray-400 text-sm mt-1">
              Avalie mais jogos para encontrar pessoas com gostos parecidos com os seus!
            </p>
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {users.map((user) => (
              <CompatibilityCard
                key={user.userId}
                user={user}
                onView={() => navigate(`/comunidade/${user.userId}`)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
