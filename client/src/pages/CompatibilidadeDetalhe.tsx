import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowers,
  getCompatibilityDetail,
  type UserCompatibilityDetail,
  type SharedWork,
} from "../services/api";

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-14 h-14 text-gray-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function Avatar({ avatarUrl, size = 96 }: { avatarUrl: string | null; size?: number }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="Avatar"
        className="rounded-full object-cover ring-4 ring-white shadow-md"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-white shadow-md"
      style={{ width: size, height: size }}
    >
      <UserIcon />
    </div>
  );
}

function CircularProgress({ value, size = 140 }: { value: number; size?: number }) {
  const strokeWidth = size * 0.085;
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
        fontSize={size * 0.2} fontWeight="800" fill="#1a1a2e"
        style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
      >
        {value}%
      </text>
    </svg>
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

function GameCard({ work }: { work: SharedWork }) {
  return (
    <div className="relative flex-shrink-0 w-36 rounded-2xl overflow-hidden shadow-sm">
      {work.imageUrl ? (
        <img src={work.imageUrl} alt={work.title} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-sky-300 via-blue-400 to-amber-300" />
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-[#6C3BFF]/90 p-2">
        <p className="text-white text-xs font-semibold truncate">{work.title}</p>
        <p className="text-purple-200 text-xs">
          {work.myRating ? `Sua nota: ${work.myRating}/5` : "Sem nota"}
        </p>
      </div>
    </div>
  );
}

export default function CompatibilidadeDetalhe() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<UserCompatibilityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [followersTotal, setFollowersTotal] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !userId) return;

    const targetId = Number(userId);

    Promise.all([
      getCompatibilityDetail(token, targetId),
      getFollowStatus(token, targetId),
      getFollowers(targetId, { limit: 1 }),
    ])
      .then(([detail, status, followers]) => {
        setData(detail);
        setIsFollowing(status.isFollowing);
        setIsSelf(status.isSelf);
        setFollowersTotal(followers.total);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleFollowToggle = async () => {
    const token = localStorage.getItem("token");
    if (!token || !userId || isSelf) return;

    setFollowLoading(true);
    try {
      const targetId = Number(userId);
      if (isFollowing) {
        await unfollowUser(token, targetId);
        setIsFollowing(false);
        setFollowersTotal((n) => Math.max(0, n - 1));
        toast.success("Você deixou de seguir este usuário");
      } else {
        await followUser(token, targetId);
        setIsFollowing(true);
        setFollowersTotal((n) => n + 1);
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

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-10">
        <button
          type="button"
          onClick={() => navigate("/comunidade")}
          className="mb-6 flex items-center gap-2 text-sm text-[#6C3BFF] hover:underline"
        >
          ← Voltar para Comunidade
        </button>

        {loading && <p className="text-gray-400 text-sm">Carregando compatibilidade...</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {!loading && !error && data && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">

            <div className="rounded-3xl bg-[#d8d3ff] flex flex-col items-center justify-center p-8 gap-4 min-h-[360px]">
              <Avatar avatarUrl={data.avatarUrl} size={100} />
              <div className="text-center">
                <p className="text-xl font-bold text-[#3b1f8c]">{displayName}</p>
                <p className="text-sm text-[#6544ad]">{handle}</p>
                <p className="mt-1 text-xs text-[#6544ad]/80">
                  {followersTotal} {followersTotal === 1 ? "seguidor" : "seguidores"}
                </p>
              </div>
              {!isSelf && (
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`mt-2 rounded-full border-2 px-6 py-2 text-sm font-medium transition disabled:opacity-60 ${
                    isFollowing
                      ? "border-[#6C3BFF] bg-[#6C3BFF] text-white hover:bg-[#5a2fd9]"
                      : "border-[#6C3BFF] bg-white text-[#6C3BFF] hover:bg-[#6C3BFF] hover:text-white"
                  }`}
                >
                  {followLoading
                    ? "..."
                    : isFollowing
                      ? "Deixar de seguir"
                      : "Seguir"}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-8">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#6C3BFF] mb-4">Nota geral</h3>
                <div className="flex items-center gap-8">
                  <CircularProgress value={data.score} size={130} />
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Nível de compatibilidade:</p>
                    <span className="rounded-full border border-gray-300 bg-gray-50 px-4 py-1.5 text-sm font-medium text-gray-700">
                      {data.label}
                    </span>
                    <div className="mt-4 flex flex-col gap-1 text-xs text-gray-500">
                      <span>{data.sharedRatings} jogos avaliados em comum</span>
                      <span>{data.sharedFavorites} favoritos em comum</span>
                      <span>{data.sharedListed} na lista "quero jogar" em comum</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-[#6C3BFF] mb-4 text-center">
                  Nota por categorias
                </h3>
                <div className="flex gap-6 justify-center flex-wrap">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-500">Jogos</span>
                    <SmallCircularProgress value={data.categoryScores.jogos} size={72} />
                  </div>
                </div>
              </div>

              {data.commonTags.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-bold text-[#6C3BFF] mb-3">Temas favoritos</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.commonTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#6C3BFF] px-4 py-1.5 text-xs font-medium text-white"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.sharedFavoriteWorks.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-bold text-[#6C3BFF] mb-4">
                    Jogos em comum
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {data.sharedFavoriteWorks.map((work) => (
                      <GameCard key={work.jogoId} work={work} />
                    ))}
                  </div>
                </div>
              )}

              {data.sharedFavoriteWorks.length === 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
                  <p className="text-sm text-gray-400">Nenhuma obra favorita em comum ainda.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
