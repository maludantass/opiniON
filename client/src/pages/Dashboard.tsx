import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  getCompatibleUsers,
  getMyRatings,
  getDashboardStats,
  type UserCompatibility,
  type UserRating,
  type DashboardStats,
  type GostoGame,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const PURPLE = "#6C3BFF";
const PURPLE_LIGHT = "#A78BFA";

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function UserInitials({ username, avatarUrl }: { username: string | null; avatarUrl: string | null }) {
  const initials = (username ?? "?").slice(0, 2).toUpperCase();
  if (avatarUrl) {
    return <img src={avatarUrl} alt={username ?? ""} className="h-20 w-20 rounded-full object-cover" />;
  }
  return (
    <div className="h-20 w-20 rounded-full bg-[#6C3BFF] flex items-center justify-center text-white text-2xl font-bold select-none">
      {initials}
    </div>
  );
}

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Meus Jogos", path: "/buscar" },
  { label: "Listas", path: null },
  { label: "Curtidos", path: null },
  { label: "Configurações", path: null },
];

function Sidebar({ stats, currentPath }: { stats: DashboardStats | null; currentPath: string }) {
  const navigate = useNavigate();
  const perfil = stats?.perfilResumo;
  const displayName = perfil?.username ?? "Usuário";
  const handle = perfil?.username ? `@${perfil.username}` : "";

  return (
    <aside className="w-52 shrink-0 flex flex-col gap-6">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col items-center gap-3">
        <UserInitials username={perfil?.username ?? null} avatarUrl={perfil?.avatarUrl ?? null} />
        <div className="text-center min-w-0 w-full">
          <p className="font-bold text-gray-800 text-sm truncate">{displayName}</p>
          {handle && <p className="text-xs text-gray-400 truncate">{handle}</p>}
        </div>
        <div className="w-full grid grid-cols-2 gap-2 text-center border-t border-gray-100 pt-3">
          <div>
            <p className="text-base font-bold text-[#6C3BFF]">{perfil?.reviewsCount ?? 0}</p>
            <p className="text-[10px] text-gray-400">Reviews</p>
          </div>
          <div>
            <p className="text-base font-bold text-[#6C3BFF]">{perfil?.conexoesCount ?? 0}</p>
            <p className="text-[10px] text-gray-400">Conexões</p>
          </div>
        </div>
        <div className="w-full text-center border-t border-gray-100 pt-2">
          <p className="text-base font-bold text-[#6C3BFF]">{perfil?.comunidadesCount ?? 0}</p>
          <p className="text-[10px] text-gray-400">Comunidades</p>
        </div>
      </div>

      <nav className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = item.path === currentPath;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.path) {
                  navigate(item.path);
                } else {
                  toast("Em breve!", { icon: "🚧" });
                }
              }}
              className={`w-full text-left px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-[#6C3BFF] text-white"
                  : "text-gray-600 hover:bg-purple-50"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

// ─── Metric cards ────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, delta, accent = false, children,
}: {
  label: string;
  value: string | number;
  sub?: string;
  delta?: string;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm flex flex-col gap-2 ${accent ? "bg-[#6C3BFF] border-[#5b30e0]" : "bg-white border-gray-200"}`}>
      <span className={`text-xs uppercase tracking-wide font-medium ${accent ? "text-purple-200" : "text-gray-400"}`}>{label}</span>
      <span className={`text-3xl font-bold leading-tight ${accent ? "text-white" : "text-gray-900"}`}>{value}</span>
      {children}
      {delta && (
        <span className={`text-xs flex items-center gap-1 ${accent ? "text-purple-200" : "text-green-600"}`}>
          <span>↑</span>{delta}
        </span>
      )}
      {sub && !children && (
        <span className={`text-xs ${accent ? "text-purple-100" : "text-gray-500"}`}>{sub}</span>
      )}
    </div>
  );
}

function GameTasteCard({ label, game }: { label: string; game: GostoGame | null }) {
  if (!game) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide font-medium text-gray-400">{label}</span>
        <p className="text-xs text-gray-400 py-4 text-center">Avalie mais jogos para descobrir</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-3">
      <span className="text-xs uppercase tracking-wide font-medium text-gray-400">{label}</span>
      <div className="flex items-center gap-3">
        {game.imageUrl ? (
          <img src={game.imageUrl} alt={game.title} className="h-14 w-14 rounded-xl object-cover shrink-0 shadow-sm" />
        ) : (
          <div className="h-14 w-14 rounded-xl bg-purple-100 flex items-center justify-center text-xl shrink-0">🎮</div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">{game.title}</p>
          <p className="text-xs text-gray-400 mt-1">Nota média: <span className="font-semibold text-gray-700">{game.notaMedia}</span></p>
          <p className="text-xs text-gray-400">Sua nota: <span className="font-semibold text-[#6C3BFF]">{game.suaNota}</span></p>
        </div>
      </div>
    </div>
  );
}

// ─── Maior match card com avatar do usuário ────────────────────────────────

function MaiorMatchCard({ user }: { user: UserCompatibility | null }) {
  const name = user ? (user.username ?? user.email.split("@")[0]) : null;
  const initials = name ? name.slice(0, 2).toUpperCase() : "?";

  return (
    <div className="rounded-2xl border border-[#5b30e0] bg-[#6C3BFF] p-5 shadow-sm flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wide font-medium text-purple-200">Maior match</span>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold text-white">{user ? `${user.score}%` : "—"}</span>
        {user && (
          <div className="flex items-center gap-2">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={name ?? ""} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-white truncate max-w-[100px]">{name}</p>
              {user.username && <p className="text-xs text-purple-200">@{user.username}</p>}
            </div>
          </div>
        )}
      </div>
      {!user && <p className="text-xs text-purple-200">Avalie jogos para descobrir</p>}
    </div>
  );
}

// ─── Gráfico de atividade por mês ─────────────────────────────────────────

function MonthlyActivityChart({ ratings }: { ratings: UserRating[] }) {
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of ratings) {
      if (r.createdAt) {
        const month = r.createdAt.slice(0, 7);
        counts.set(month, (counts.get(month) ?? 0) + 1);
      }
    }
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
      return { label, count: counts.get(key) ?? 0 };
    });
  }, [ratings]);

  const peak = Math.max(...data.map((d) => d.count), 0);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} width={20} />
        <Tooltip
          formatter={(v: any) => [`${v} interação(ões)`, "Atividade"]}
          contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e5e7eb" }}
          cursor={{ fill: "#F3F0FF" }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.count === peak && peak > 0 ? PURPLE : PURPLE_LIGHT} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── DNA Gamer radar ──────────────────────────────────────────────────────────

function DnaGamerChart({ data }: { data: { tag: string; count: number }[] }) {
  if (!data.length) {
    return <p className="text-xs text-gray-400 py-16 text-center">Avalie jogos para revelar seu DNA Gamer</p>;
  }

  const radarData = data.slice(0, 6).map((d) => ({ tag: d.tag, count: d.count }));
  const useRadar = radarData.length >= 3;

  return useRadar ? (
    <ResponsiveContainer width="100%" height={180}>
      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={65}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="tag" tick={{ fontSize: 10, fill: "#374151", fontWeight: 500 }} />
        <PolarRadiusAxis angle={90} domain={[0, Math.max(...radarData.map((d) => d.count))]} tick={false} axisLine={false} />
        <Radar name="DNA" dataKey="count" stroke={PURPLE} fill={PURPLE} fillOpacity={0.25} strokeWidth={2} />
        <Tooltip
          formatter={(v: any) => [`${v} interação(ões)`, "DNA"]}
          contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e5e7eb" }}
        />
      </RadarChart>
    </ResponsiveContainer>
  ) : (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={radarData} barCategoryGap="30%">
        <XAxis dataKey="tag" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} width={20} />
        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e5e7eb" }} cursor={{ fill: "#F3F0FF" }} />
        <Bar dataKey="count" fill={PURPLE} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Top 5 com anel circular ──────────────────────────────────────────────────

function CircularProgressRing({ score, size = 72 }: { score: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={PURPLE} strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserCompatCircle({ user, onView }: { user: UserCompatibility; onView: (id: number) => void }) {
  const RING_SIZE = 72;
  const AVATAR_SIZE = 52;
  const name = user.username ?? user.email.split("@")[0];
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onView(user.userId)}
      className="flex flex-col items-center gap-2 group"
    >
      <div style={{ position: "relative", width: RING_SIZE, height: RING_SIZE }}>
        <CircularProgressRing score={user.score} size={RING_SIZE} />
        <div className="absolute inset-0 flex items-center justify-center">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={name}
              style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
              className="rounded-full object-cover"
            />
          ) : (
            <div
              style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
              className="rounded-full bg-purple-100 flex items-center justify-center text-[#6C3BFF] font-bold text-sm"
            >
              {initials}
            </div>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-800 truncate max-w-[80px] group-hover:text-[#6C3BFF] transition">{name}</p>
        {user.username && <p className="text-[10px] text-gray-400 truncate max-w-[80px]">@{user.username}</p>}
        <p className="text-sm font-bold text-[#6C3BFF]">{user.score}%</p>
      </div>
    </button>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-gray-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { token } = useAuth();
  const [users, setUsers] = useState<UserCompatibility[]>([]);
  const [ratings, setRatings] = useState<UserRating[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    Promise.all([
      getCompatibleUsers(token),
      getMyRatings(token),
      getDashboardStats(token),
    ])
      .then(([u, r, s]) => {
        setUsers(u);
        setRatings(r);
        setStats(s);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const bestMatch = users[0] ?? null;
  const top5 = users.slice(0, 5);
  const avgScore = top5.length
    ? Math.round(top5.reduce((s, u) => s + u.score, 0) / top5.length)
    : 0;
  const avgLabel = avgScore >= 70 ? "Alta" : avgScore >= 40 ? "Média" : "Baixa";

  const tagData = stats?.myTagDistribution ?? [];
  const gustoPopular = stats?.gustoPopular ?? null;
  const gustoRaro = stats?.gustoRaro ?? null;
  const curtidas = stats?.curtidas ?? { total: 0, esteMes: 0 };
  const mediaNotas = stats?.mediaNotas ?? null;
  const jogosAvaliados = ratings.filter((r) => r.rating !== null).length;
  const jogosEsteMes = stats?.jogosAvaliadosEsteMes ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-10">
        {loading ? (
          <p className="text-gray-400 text-sm">Carregando dados...</p>
        ) : (
          <div className="flex gap-6">
            {/* ── Sidebar ── */}
            <Sidebar stats={stats} currentPath={pathname} />

            {/* ── Conteúdo principal ── */}
            <div className="flex-1 min-w-0 flex flex-col gap-5">

              {/* Linha 1: métricas principais */}
              <div className="grid grid-cols-3 gap-4">
                <MaiorMatchCard user={bestMatch} />

                <MetricCard
                  label="Curtidas recebidas"
                  value={curtidas.total}
                  delta={curtidas.esteMes > 0 ? `+${curtidas.esteMes} este mês` : undefined}
                />

                <MetricCard
                  label="Jogos Avaliados"
                  value={jogosAvaliados}
                  delta={jogosEsteMes > 0 ? `+${jogosEsteMes} este mês` : undefined}
                />
              </div>

              {/* Linha 2: métricas secundárias */}
              <div className="grid grid-cols-3 gap-4">
                <MetricCard
                  label="Média de Notas"
                  value={mediaNotas !== null ? mediaNotas.toFixed(1) : "—"}
                  delta={mediaNotas !== null && mediaNotas >= 3.5 ? "acima da média" : undefined}
                />

                <GameTasteCard label="Seu gosto popular" game={gustoPopular} />

                <GameTasteCard label="Seu gosto raro" game={gustoRaro} />
              </div>

              {/* Linha 3: gráficos */}
              <div className="grid grid-cols-2 gap-4">
                <ChartCard title="Atividade por mês">
                  <MonthlyActivityChart ratings={ratings} />
                </ChartCard>

                <ChartCard title="Seu DNA Gamer">
                  <DnaGamerChart data={tagData} />
                </ChartCard>
              </div>

              {/* Linha 4: top 5 */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-700 mb-5">Seu top 5 de compatibilidade</h2>
                {top5.length > 0 ? (
                  <>
                    <div className="flex items-start justify-around gap-4">
                      {top5.map((u) => (
                        <UserCompatCircle key={u.userId} user={u} onView={(id) => navigate(`/compatibilidade/${id}`)} />
                      ))}
                    </div>
                    <p className="mt-5 text-sm text-gray-500 border-t border-gray-100 pt-4">
                      Média de compatibilidade geral:{" "}
                      <span className="font-bold text-[#6C3BFF]">{avgScore}% - {avgLabel}</span>
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-gray-400 py-4 text-center">
                    Nenhum usuário encontrado. Avalie mais jogos para gerar compatibilidade.
                  </p>
                )}
              </div>

            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
