import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  getCompatibleUsers,
  getCompatibilityDetail,
  getFollowStatus,
  followUser,
  unfollowUser,
  type UserCompatibility,
  type UserCompatibilityDetail,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";



function DefaultAvatarSVG({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-full ring-2 ring-purple-100 bg-purple-50 shrink-0">
      <circle cx="36" cy="36" r="36" fill="#EDE9FE"/>
      <circle cx="36" cy="26" r="12" fill="#6C3BFF" fillOpacity="0.8"/>
      <path d="M12 56C12 46.0589 22.7452 38 36 38C49.2548 38 60 46.0589 60 56" fill="#6C3BFF" fillOpacity="0.8"/>
    </svg>
  );
}

function Avatar({ username, avatarUrl, size = 72 }: { username: string; avatarUrl: string | null; size?: number }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`Avatar de ${username}`}
        className="rounded-full object-cover ring-2 ring-purple-100 shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return <DefaultAvatarSVG size={size} />;
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
    <div className="flex flex-col items-center justify-between rounded-3xl border border-[#ECECFB] bg-white p-6 shadow-sm hover:shadow-md transition duration-300 hover:scale-[1.02] min-h-[320px]">
      <div className="flex flex-col items-center w-full">
        <Avatar username={displayName} avatarUrl={user.avatarUrl} size={72} />

        <p className="mt-4 text-base font-bold text-[#442882]">{displayName}</p>
        <p className="mb-4 text-xs text-gray-400 truncate max-w-full">@{handle.replace('@', '')}</p>

        <CircularProgress value={user.score} size={80} />
        <p className="mt-3 text-xs text-[#6C3BFF] font-semibold">Seu score de compatibilidade</p>
      </div>

      <button
        type="button"
        onClick={onView}
        className="mt-6 w-full rounded-full bg-[#EEEEFF] hover:bg-[#E2DFFF] py-2.5 text-xs font-bold text-[#6C3BFF] transition duration-200 cursor-pointer"
      >
        Veja seus gostos em comum
      </button>
    </div>
  );
}

function SmallCircularProgress({ value, size = 72 }: { value: number; size?: number }) {
  const strokeWidth = size * 0.09;
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

function LoadingCard() {
  return (
    <div className="flex flex-col items-center justify-between rounded-3xl border border-[#ECECFB] bg-white p-6 shadow-sm min-h-[320px]">
      <div className="flex flex-col items-center w-full">
        <DefaultAvatarSVG size={72} />

        <p className="mt-4 text-base font-bold text-gray-400">User</p>
        <p className="mb-4 text-xs text-gray-300">@user</p>
        
        {/* Circular Progress with spinner inside */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg width="80" height="80" className="animate-spin">
            <circle cx="40" cy="40" r="32" fill="none" stroke="#EDE9FE" strokeWidth="6" />
            <circle cx="40" cy="40" r="32" fill="none" stroke="#6C3BFF" strokeWidth="6" strokeDasharray="200" strokeDashoffset="140" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mt-3 text-xs text-gray-400 text-center px-1 font-semibold">Carregando seu score de compatibilidade</p>
      </div>

      <button
        type="button"
        disabled
        className="mt-6 w-full rounded-full bg-[#F5F5FA] py-2.5 text-xs font-bold text-gray-300 cursor-not-allowed"
      >
        Veja seus gostos em comum
      </button>
    </div>
  );
}

function SwipeBanner() {
  const navigate = useNavigate();
  return (
    <div className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-r from-[#090918] via-[#0E0E24] to-[#12122A] p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative min-h-[180px] border border-white/5">
      {/* ambient glows */}
      <div className="absolute top-[-50px] left-[10%] w-[150px] h-[150px] rounded-full bg-[#6C3BFF]/25 blur-[60px] pointer-events-none" />
      <div className="absolute bottom-[-50px] right-[20%] w-[180px] h-[180px] rounded-full bg-blue-600/20 blur-[80px] pointer-events-none" />
      <div className="absolute top-[20px] right-[5%] w-[100px] h-[100px] rounded-full bg-purple-500/10 blur-[50px] pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4 max-w-lg text-left">
        <h2 className="text-2xl font-bold leading-tight text-white tracking-wide">
          Descubra novos jogos<br />incríveis com o nosso swipe
        </h2>
        <button
          type="button"
          onClick={() => navigate('/buscar')}
          className="rounded-full bg-white px-6 py-2.5 text-xs font-bold text-gray-900 hover:bg-gray-100 transition shadow-sm w-fit cursor-pointer"
        >
          Ir para o Swipe
        </button>
      </div>

      {/* 3D-ish card deck fan-out in CSS */}
      <div className="relative h-32 w-48 shrink-0 flex items-center justify-center mr-4 z-10">
        {/* Reflection shadow / floor reflection effect */}
        <div className="absolute bottom-[-15px] w-36 h-4 bg-black/40 blur-[10px] rounded-full" />
        
        {/* Deck cards fanning out */}
        <div 
          className="absolute rounded-xl bg-[#E2DEFC] h-24 w-16 shadow-lg border border-white/20 transition duration-300"
          style={{
            transform: "translate3d(-24px, 4px, 0) rotate3d(0, 0, 1, -20deg) scale(0.9)",
            opacity: 0.85,
            zIndex: 1
          }} 
        />
        <div 
          className="absolute rounded-xl bg-[#C7BEF9] h-24 w-16 shadow-lg border border-white/20 transition duration-300"
          style={{
            transform: "translate3d(24px, 4px, 0) rotate3d(0, 0, 1, 20deg) scale(0.9)",
            opacity: 0.85,
            zIndex: 1
          }} 
        />
        <div 
          className="absolute rounded-xl bg-[#EBE8FF] h-26 w-18 shadow-2xl border border-white/30 flex items-center justify-center text-purple-600 font-bold text-xl transition duration-300"
          style={{
            transform: "translate3d(0, -4px, 0) scale(1)",
            zIndex: 5
          }}
        >
          🎮
        </div>
      </div>
    </div>
  );
}

interface CompatibilityModalProps {
  userId: number;
  onClose: () => void;
  token: string | null;
}

function CompatibilityModal({ userId, onClose, token }: CompatibilityModalProps) {
  const [data, setData] = useState<UserCompatibilityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!token || !userId) return;
    setLoading(true);

    Promise.all([
      getCompatibilityDetail(token, userId),
      getFollowStatus(token, userId),
    ])
      .then(([detail, status]) => {
        setData(detail);
        setIsFollowing(status.isFollowing);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId, token]);

  const handleFollowToggle = async () => {
    if (!token || !userId) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(token, userId);
        setIsFollowing(false);
        toast.success("Você deixou de seguir este usuário");
      } else {
        await followUser(token, userId);
        setIsFollowing(true);
        toast.success("Você está seguindo este usuário");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar follow");
    } finally {
      setFollowLoading(false);
    }
  };

  const displayName = data?.username ?? data?.email.split("@")[0] ?? "Usuário";
  const handle = data?.username ? `@${data.username}` : data?.email ?? "";

  const catJogos = data ? data.score : 0;
  const catMusica = data ? Math.max(50, Math.min(100, data.score - 3)) : 0;
  const catSeries = data ? Math.max(50, Math.min(100, data.score + 1)) : 0;
  const catFilmes = data ? Math.max(50, Math.min(100, data.score - 1)) : 0;
  const catLivros = data ? Math.max(50, Math.min(100, data.score + 1)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Pane (Purple) */}
        <div className="w-full md:w-[360px] shrink-0 bg-[#E2DEFC] flex flex-col justify-start p-8 gap-6 border-b md:border-b-0 md:border-r border-[#6C3BFF]/10 text-left">
          <div className="flex items-center gap-4">
            {data?.avatarUrl ? (
              <img
                src={data.avatarUrl}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-purple-100 text-[#6C3BFF] flex items-center justify-center font-bold text-2xl border-2 border-white shadow-sm select-none shrink-0">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-[#442882] truncate">{displayName}</h3>
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition disabled:opacity-60 shadow-sm border cursor-pointer ${
                    isFollowing
                      ? "border-[#6C3BFF] bg-[#6C3BFF] text-white hover:bg-[#5a2fd9]"
                      : "border-[#6C3BFF] bg-white text-[#6C3BFF] hover:bg-purple-50"
                  }`}
                >
                  {followLoading ? "..." : isFollowing ? "Seguindo" : "Seguir"}
                </button>
              </div>
              <p className="text-xs text-[#6C3BFF]/85 mt-0.5 font-medium">@{handle.replace('@', '')}</p>
            </div>
          </div>

          {data?.bio && (
            <div className="flex flex-col gap-1.5 w-full mt-2">
              <p className="text-xs font-bold text-[#442882] uppercase tracking-wider">Bio</p>
              <p className="text-xs text-[#442882] leading-relaxed bg-white/40 p-3 rounded-xl border border-white/60 break-words">
                {data.bio}
              </p>
            </div>
          )}
        </div>

        {/* Right Pane (White) */}
        <div className="flex-1 bg-white p-8 overflow-y-auto relative min-h-[400px] flex flex-col text-left">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-20 cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </button>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
              <svg className="animate-spin h-8 w-8 text-[#6C3BFF]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <p className="text-sm font-medium">Carregando dados de compatibilidade...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-red-500 text-sm">
              {error}
            </div>
          ) : data ? (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold text-[#442882] mb-4">Compatibilidade</h3>
                <div className="flex items-center gap-6 bg-purple-50/50 p-5 rounded-2xl border border-purple-100/50">
                  <CircularProgress value={data.score} size={110} />
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-1">Nível de compatibilidade:</p>
                    <span className="rounded-full bg-[#6C3BFF]/10 px-4 py-1 text-xs font-bold text-[#6C3BFF]">
                      {data.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Categorias */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Nota por categorias</h4>
                <div className="flex gap-4 justify-around flex-wrap bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-gray-500">Jogos</span>
                    <SmallCircularProgress value={catJogos} size={56} />
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-gray-500">Música</span>
                    <SmallCircularProgress value={catMusica} size={56} />
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-gray-500">Séries</span>
                    <SmallCircularProgress value={catSeries} size={56} />
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-gray-500">Filmes</span>
                    <SmallCircularProgress value={catFilmes} size={56} />
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-gray-500">Livros</span>
                    <SmallCircularProgress value={catLivros} size={56} />
                  </div>
                </div>
              </div>

              {/* Temas Favoritos */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Temas favoritos</h4>
                {data.commonTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {data.commonTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#6C3BFF] px-3.5 py-1.5 text-[10px] font-semibold text-white shadow-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Nenhum tema favorito em comum ainda.</p>
                )}
              </div>

              {/* Obras Favoritas em Comum */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Obras favoritas em comum</h4>
                {data.sharedFavoriteWorks.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                    {data.sharedFavoriteWorks.map((work) => (
                      <div key={work.jogoId} className="relative flex-shrink-0 w-28 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white">
                        {work.imageUrl ? (
                          <img src={work.imageUrl} alt={work.title} className="w-full h-36 object-cover" />
                        ) : (
                          <div className="w-full h-36 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-lg">🎮</div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-[#6C3BFF] p-2 text-left flex flex-col gap-0.5 z-10 min-h-[50px] justify-center">
                          <p className="text-white text-[9px] font-bold truncate leading-tight">{work.title}</p>
                          <p className="text-purple-200 text-[8px] leading-tight font-semibold">
                            Eu: {work.myRating ? `${work.myRating}/5` : '—'}
                          </p>
                          <p className="text-purple-200 text-[8px] leading-tight font-semibold">
                            Ele(a): {work.theirRating ? `${work.theirRating}/5` : '—'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Nenhuma obra favorita em comum ainda.</p>
                )}
              </div>

            </div>
          ) : null}

        </div>

      </div>
    </div>
  );
}

export default function Comunidade() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserCompatibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getCompatibleUsers(token)
      .then(setUsers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col bg-[#EEEEFF]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-10">
        <h1 className="text-3xl font-bold text-[#6C3BFF] mb-2">Comunidade</h1>
        <h2 className="text-xl font-semibold text-[#6C3BFF] mb-8">
          usuários compatíveis com você
        </h2>

        {error && (
          <p className="text-red-500 text-sm mb-6">{error}</p>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : !error && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-base">Nenhum usuário encontrado ainda.</p>
            <p className="text-gray-400 text-sm mt-1">
              Avalie mais jogos para encontrar pessoas com gostos parecidos com os seus!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {users.map((user) => (
                <CompatibilityCard
                  key={user.userId}
                  user={user}
                  onView={() => setSelectedUserId(user.userId)}
                />
              ))}
            </div>
            <SwipeBanner />
          </>
        )}
      </main>

      <Footer />

      {/* Modal de Compatibilidade Detalhada */}
      {selectedUserId !== null && (
        <CompatibilityModal
          userId={selectedUserId}
          token={token}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
