import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  getCompatibleUsers,
  getMyRatings,
  getDashboardStats,
  updateUserProfile,
  type UserCompatibility,
  type UserRating,
  type DashboardStats,
  type GostoGame,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";

type ProfileTab =
  | "dashboard"
  | "jogos"
  | "listas"
  | "salvos"
  | "configuracoes";

const PURPLE = "#6C3BFF";
const PURPLE_LIGHT = "#A78BFA";

const SIDEBAR_TABS: { key: ProfileTab; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "jogos", label: "Meus Jogos" },
  { key: "listas", label: "Listas" },
  { key: "salvos", label: "Salvos" },
  { key: "configuracoes", label: "Configurações" },
];

// ─── Shared ───────────────────────────────────────────────────────────────────

function UserAvatar({
  username,
  avatarUrl,
}: {
  username: string | null;
  avatarUrl: string | null;
}) {
  const initials = (username ?? "?").slice(0, 2).toUpperCase();
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username ?? ""}
        className="h-20 w-20 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="h-20 w-20 rounded-full bg-[#6C3BFF] flex items-center justify-center text-white text-2xl font-bold select-none">
      {initials}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function ProfileSidebar({
  stats,
  activeTab,
  onTabChange,
  fallbackUser,
}: {
  stats: DashboardStats | null;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  fallbackUser: { username: string | null; avatarUrl: string | null };
}) {
  const perfil = stats?.perfilResumo;
  const displayName = perfil?.username ?? fallbackUser.username ?? "Usuário";
  const handle = displayName
    ? `@${displayName.toLowerCase().replace(/\s+/g, "")}`
    : "";

  return (
    <aside className="w-52 shrink-0 flex flex-col gap-4">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col items-center gap-3">
        <UserAvatar
          username={perfil?.username ?? fallbackUser.username}
          avatarUrl={perfil?.avatarUrl ?? fallbackUser.avatarUrl}
        />
        <div className="text-center min-w-0 w-full">
          <p className="font-bold text-gray-800 text-sm truncate">
            {displayName}
          </p>
          {handle && (
            <p className="text-xs text-gray-400 truncate">{handle}</p>
          )}
        </div>
        <div className="w-full grid grid-cols-2 gap-2 text-center border-t border-gray-100 pt-3">
          <div>
            <p className="text-base font-bold text-[#6C3BFF]">
              {perfil?.reviewsCount ?? 0}
            </p>
            <p className="text-[10px] text-gray-400">Reviews</p>
          </div>
          <div>
            <p className="text-base font-bold text-[#6C3BFF]">
              {perfil?.conexoesCount ?? 0}
            </p>
            <p className="text-[10px] text-gray-400">Conexões</p>
          </div>
        </div>
        <div className="w-full text-center border-t border-gray-100 pt-2">
          <p className="text-base font-bold text-[#6C3BFF]">
            {perfil?.comunidadesCount ?? 0}
          </p>
          <p className="text-[10px] text-gray-400">Comunidades</p>
        </div>
      </div>

      <nav className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {SIDEBAR_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`w-full text-left px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-[#6C3BFF] text-white"
                : "text-gray-600 hover:bg-purple-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  delta,
  accent = false,
  children,
}: {
  label: string;
  value: string | number;
  delta?: string;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm flex flex-col gap-2 ${
        accent
          ? "bg-[#6C3BFF] border-[#5b30e0]"
          : "bg-white border-gray-200"
      }`}
    >
      <span
        className={`text-xs uppercase tracking-wide font-medium ${
          accent ? "text-purple-200" : "text-gray-400"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-3xl font-bold leading-tight ${
          accent ? "text-white" : "text-gray-900"
        }`}
      >
        {value}
      </span>
      {children}
      {delta && (
        <span
          className={`text-xs flex items-center gap-1 ${
            accent ? "text-purple-200" : "text-green-600"
          }`}
        >
          <span>↑</span>
          {delta}
        </span>
      )}
    </div>
  );
}

function GameTasteCard({
  label,
  game,
}: {
  label: string;
  game: GostoGame | null;
}) {
  if (!game) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide font-medium text-gray-400">
          {label}
        </span>
        <p className="text-xs text-gray-400 py-4 text-center">
          Avalie mais jogos para descobrir
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-3">
      <span className="text-xs uppercase tracking-wide font-medium text-gray-400">
        {label}
      </span>
      <div className="flex items-center gap-3">
        {game.imageUrl ? (
          <img
            src={game.imageUrl}
            alt={game.title}
            className="h-14 w-14 rounded-xl object-cover shrink-0 shadow-sm"
          />
        ) : (
          <div className="h-14 w-14 rounded-xl bg-purple-100 flex items-center justify-center text-xl shrink-0">
            🎮
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">
            {game.title}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Nota média:{" "}
            <span className="font-semibold text-gray-700">{game.notaMedia}</span>
          </p>
          <p className="text-xs text-gray-400">
            Sua nota:{" "}
            <span className="font-semibold text-[#6C3BFF]">{game.suaNota}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function MaiorMatchCard({ user }: { user: UserCompatibility | null }) {
  const name = user ? (user.username ?? user.email.split("@")[0]) : null;
  const initials = name ? name.slice(0, 2).toUpperCase() : "?";

  return (
    <div className="rounded-2xl border border-[#5b30e0] bg-[#6C3BFF] p-5 shadow-sm flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wide font-medium text-purple-200">
        Maior match
      </span>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold text-white">
          {user ? `${user.score}%` : "—"}
        </span>
        {user && (
          <div className="flex items-center gap-2">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={name ?? ""}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-white truncate max-w-[100px]">
                {name}
              </p>
              {user.username && (
                <p className="text-xs text-purple-200">@{user.username}</p>
              )}
            </div>
          </div>
        )}
      </div>
      {!user && (
        <p className="text-xs text-purple-200">Avalie jogos para descobrir</p>
      )}
    </div>
  );
}

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
      const label = d
        .toLocaleString("pt-BR", { month: "short" })
        .replace(".", "");
      return { label, count: counts.get(key) ?? 0 };
    });
  }, [ratings]);

  const peak = Math.max(...data.map((d) => d.count), 0);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          width={20}
        />
        <Tooltip
          formatter={(v: number) => [`${v} interação(ões)`, "Atividade"]}
          contentStyle={{
            borderRadius: 12,
            fontSize: 12,
            border: "1px solid #e5e7eb",
          }}
          cursor={{ fill: "#F3F0FF" }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.count === peak && peak > 0 ? PURPLE : PURPLE_LIGHT}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function DnaGamerChart({ data }: { data: { tag: string; count: number }[] }) {
  if (!data.length) {
    return (
      <p className="text-xs text-gray-400 py-16 text-center">
        Avalie jogos para revelar seu DNA Gamer
      </p>
    );
  }
  const radarData = data
    .slice(0, 6)
    .map((d) => ({ tag: d.tag, count: d.count }));
  const useRadar = radarData.length >= 3;

  return useRadar ? (
    <ResponsiveContainer width="100%" height={180}>
      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={65}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="tag"
          tick={{ fontSize: 10, fill: "#374151", fontWeight: 500 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, Math.max(...radarData.map((d) => d.count))]}
          tick={false}
          axisLine={false}
        />
        <Radar
          name="DNA"
          dataKey="count"
          stroke={PURPLE}
          fill={PURPLE}
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(v: number) => [`${v} interação(ões)`, "DNA"]}
          contentStyle={{
            borderRadius: 12,
            fontSize: 12,
            border: "1px solid #e5e7eb",
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  ) : (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={radarData} barCategoryGap="30%">
        <XAxis
          dataKey="tag"
          tick={{ fontSize: 11, fill: "#374151" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          width={20}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            fontSize: 12,
            border: "1px solid #e5e7eb",
          }}
          cursor={{ fill: "#F3F0FF" }}
        />
        <Bar dataKey="count" fill={PURPLE} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function CircularProgressRing({
  score,
  size = 72,
}: {
  score: number;
  size?: number;
}) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  return (
    <svg
      width={size}
      height={size}
      style={{
        transform: "rotate(-90deg)",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={PURPLE}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserCompatCircle({
  user,
  onView,
}: {
  user: UserCompatibility;
  onView: (id: number) => void;
}) {
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
      <div
        style={{ position: "relative", width: RING_SIZE, height: RING_SIZE }}
      >
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
        <p className="text-xs font-semibold text-gray-800 truncate max-w-[80px] group-hover:text-[#6C3BFF] transition">
          {name}
        </p>
        {user.username && (
          <p className="text-[10px] text-gray-400 truncate max-w-[80px]">
            @{user.username}
          </p>
        )}
        <p className="text-sm font-bold text-[#6C3BFF]">{user.score}%</p>
      </div>
    </button>
  );
}

function DashboardTab({
  ratings,
  stats,
  users,
}: {
  ratings: UserRating[];
  stats: DashboardStats | null;
  users: UserCompatibility[];
}) {
  const navigate = useNavigate();

  const bestMatch = users[0] ?? null;
  const top5 = users.slice(0, 5);
  const avgScore = top5.length
    ? Math.round(top5.reduce((s, u) => s + u.score, 0) / top5.length)
    : 0;
  const avgLabel =
    avgScore >= 70 ? "Alta" : avgScore >= 40 ? "Média" : "Baixa";

  const tagData = stats?.myTagDistribution ?? [];
  const gustoPopular = stats?.gustoPopular ?? null;
  const gustoRaro = stats?.gustoRaro ?? null;
  const curtidas = stats?.curtidas ?? { total: 0, esteMes: 0 };
  const mediaNotas = stats?.mediaNotas ?? null;
  const jogosAvaliados = ratings.filter((r) => r.rating !== null).length;
  const jogosEsteMes = stats?.jogosAvaliadosEsteMes ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-4">
        <MaiorMatchCard user={bestMatch} />
        <MetricCard
          label="Curtidas recebidas"
          value={curtidas.total}
          delta={
            curtidas.esteMes > 0
              ? `+${curtidas.esteMes} este mês`
              : undefined
          }
        />
        <MetricCard
          label="Jogos Avaliados"
          value={jogosAvaliados}
          delta={jogosEsteMes > 0 ? `+${jogosEsteMes} este mês` : undefined}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Média de Notas"
          value={mediaNotas !== null ? mediaNotas.toFixed(1) : "—"}
          delta={
            mediaNotas !== null && mediaNotas >= 3.5
              ? "acima da média"
              : undefined
          }
        />
        <GameTasteCard label="Seu gosto popular" game={gustoPopular} />
        <GameTasteCard label="Seu gosto raro" game={gustoRaro} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">
            Atividade por mês
          </h2>
          <MonthlyActivityChart ratings={ratings} />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">
            Seu DNA Gamer
          </h2>
          <DnaGamerChart data={tagData} />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-700 mb-5">
          Seu top 5 de compatibilidade
        </h2>
        {top5.length > 0 ? (
          <>
            <div className="flex items-start justify-around gap-4">
              {top5.map((u) => (
                <UserCompatCircle
                  key={u.userId}
                  user={u}
                  onView={(id) => navigate(`/compatibilidade/${id}`)}
                />
              ))}
            </div>
            <p className="mt-5 text-sm text-gray-500 border-t border-gray-100 pt-4">
              Média de compatibilidade geral:{" "}
              <span className="font-bold text-[#6C3BFF]">
                {avgScore}% - {avgLabel}
              </span>
            </p>
          </>
        ) : (
          <p className="text-xs text-gray-400 py-4 text-center">
            Nenhum usuário encontrado. Avalie mais jogos para gerar
            compatibilidade.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Meus Jogos Tab ───────────────────────────────────────────────────────────

type JogosFilter = "todos" | "zerados" | "jogando" | "na_fila" | "dropados";

function getStatusLabel(rating: UserRating): string {
  if (rating.played) return "Zerado";
  if (rating.favorited) return "Jogando";
  if (rating.listed) return "Na fila";
  return "Avaliado";
}

function applyJogosFilter(
  ratings: UserRating[],
  filter: JogosFilter,
): UserRating[] {
  switch (filter) {
    case "todos":
      return ratings;
    case "zerados":
      return ratings.filter((r) => r.played);
    case "jogando":
      return ratings.filter((r) => r.favorited && !r.played);
    case "na_fila":
      return ratings.filter((r) => r.listed);
    case "dropados":
      return ratings.filter(
        (r) => r.category === "dropado" || r.category === "dropped",
      );
    default:
      return ratings;
  }
}

function MeusJogosTab({ ratings }: { ratings: UserRating[] }) {
  const [filter, setFilter] = useState<JogosFilter>("todos");
  const [sort, setSort] = useState<"nota" | "recente">("nota");
  const [visible, setVisible] = useState(10);

  const counts = useMemo(
    () => ({
      todos: ratings.length,
      zerados: ratings.filter((r) => r.played).length,
      jogando: ratings.filter((r) => r.favorited && !r.played).length,
      na_fila: ratings.filter((r) => r.listed).length,
      dropados: ratings.filter(
        (r) => r.category === "dropado" || r.category === "dropped",
      ).length,
    }),
    [ratings],
  );

  const FILTERS: { key: JogosFilter; label: string }[] = [
    { key: "todos", label: `Todos (${counts.todos})` },
    { key: "zerados", label: `Zerados (${counts.zerados})` },
    { key: "jogando", label: `Jogando (${counts.jogando})` },
    { key: "na_fila", label: `Na fila (${counts.na_fila})` },
    { key: "dropados", label: `Dropados (${counts.dropados})` },
  ];

  const filtered = useMemo(() => {
    const f = applyJogosFilter(ratings, filter);
    if (sort === "nota") {
      return [...f].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return [...f].sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    );
  }, [ratings, filter, sort]);

  const filterTitle: Record<JogosFilter, string> = {
    todos: "Todos os Jogos",
    zerados: "Zerados",
    jogando: "Jogando",
    na_fila: "Na fila",
    dropados: "Dropados",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-gray-100 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setFilter(f.key);
              setVisible(10);
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f.key
                ? "bg-[#6C3BFF] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "nota" | "recente")}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            <option value="nota">Ordenar por nota</option>
            <option value="recente">Mais recente</option>
          </select>
        </div>
      </div>

      <div className="px-5 py-3 bg-[#EEEEFF] border-b border-purple-100">
        <h2 className="text-sm font-bold text-gray-700">{filterTitle[filter]}</h2>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">
          Nenhum jogo nesta categoria ainda.
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-50">
            {filtered.slice(0, visible).map((rating) => {
              const jogo = rating.jogo;
              if (!jogo) return null;
              return (
                <div
                  key={rating.id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition"
                >
                  {jogo.imageUrl ? (
                    <img
                      src={jogo.imageUrl}
                      alt={jogo.title}
                      className="h-16 w-12 rounded-lg object-cover shrink-0 shadow-sm"
                    />
                  ) : (
                    <div className="h-16 w-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-400 text-xl shrink-0">
                      🎮
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {jogo.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {getStatusLabel(rating)}
                    </p>
                  </div>
                  {rating.rating !== null && (
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-gray-400">Nota:</p>
                      <p className="text-lg font-bold text-gray-900">
                        {rating.rating.toFixed(1)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {visible < filtered.length && (
            <div className="p-4 text-center border-t border-gray-100">
              <button
                type="button"
                onClick={() => setVisible((v) => v + 10)}
                className="px-6 py-2 rounded-full border border-gray-300 text-sm text-gray-600 hover:bg-purple-50 hover:border-purple-300 transition"
              >
                Carregar mais
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Listas Tab ───────────────────────────────────────────────────────────────

function ListasTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="text-center">
        <p className="text-base font-semibold text-gray-700 mb-1">
          Você ainda não tem listas
        </p>
        <p className="text-xs text-gray-400">
          Crie listas para organizar seus jogos favoritos
        </p>
      </div>
      <button
        type="button"
        onClick={() => toast("Em breve!", { icon: "🚧" })}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6C3BFF] text-white text-sm font-medium hover:bg-[#5b30e0] transition"
      >
        <span className="text-lg leading-none">+</span> Criar nova lista
      </button>
    </div>
  );
}

// ─── Salvos Tab ───────────────────────────────────────────────────────────────

type SalvosFilter = "jogos" | "listas" | "reviews";

function SalvosTab({ ratings }: { ratings: UserRating[] }) {
  const [sub, setSub] = useState<SalvosFilter>("jogos");
  const [visible, setVisible] = useState(6);

  const favorited = useMemo(
    () => ratings.filter((r) => r.favorited),
    [ratings],
  );

  const SUB_TABS: { key: SalvosFilter; label: string }[] = [
    { key: "jogos", label: `Jogos (${favorited.length})` },
    { key: "listas", label: "Listas (0)" },
    { key: "reviews", label: "Reviews (0)" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setSub(t.key);
              setVisible(6);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              sub === t.key
                ? "bg-[#6C3BFF] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-purple-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === "jogos" ? (
        favorited.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm bg-white rounded-2xl border border-gray-200 shadow-sm">
            Nenhum jogo salvo ainda. Favorite jogos para vê-los aqui.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              {favorited.slice(0, visible).map((rating) => {
                const jogo = rating.jogo;
                if (!jogo) return null;
                return (
                  <div
                    key={rating.id}
                    className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white hover:shadow-md transition"
                  >
                    <div className="relative aspect-[3/4]">
                      {jogo.imageUrl ? (
                        <img
                          src={jogo.imageUrl}
                          alt={jogo.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-purple-100 flex items-center justify-center text-3xl">
                          🎮
                        </div>
                      )}
                      {rating.rating !== null && (
                        <div className="absolute bottom-2 right-2 bg-[#6C3BFF] text-white text-sm font-bold px-2 py-1 rounded-lg shadow">
                          {rating.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {jogo.title}
                      </p>
                      {jogo.tags.length > 0 && (
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                          {jogo.tags.slice(0, 3).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {visible < favorited.length && (
              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + 6)}
                  className="px-6 py-2 rounded-full border border-gray-300 text-sm text-gray-600 hover:bg-purple-50 hover:border-purple-300 transition"
                >
                  Ver mais
                </button>
              </div>
            )}
          </>
        )
      ) : (
        <div className="py-16 text-center text-gray-400 text-sm bg-white rounded-2xl border border-gray-200 shadow-sm">
          Em breve!
        </div>
      )}
    </div>
  );
}

// ─── Configurações Tab ────────────────────────────────────────────────────────

function ConfiguracoesTab({
  token,
  userId,
}: {
  token: string;
  userId: number;
}) {
  const { user, updateUserLocal } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateUserProfile(token, userId, {
        username: username || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
      });
      updateUserLocal({
        username: updated.username,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
      });
      toast.success("Perfil atualizado!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
      <h2 className="text-base font-bold text-gray-800 mb-5">
        Configurações de Perfil
      </h2>
      <div className="flex flex-col gap-4 max-w-md">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Nome de usuário
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@seu_username"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conte um pouco sobre você..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            URL do avatar
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#6C3BFF] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#5b30e0] transition disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Perfil() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("dashboard");
  const [ratings, setRatings] = useState<UserRating[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserCompatibility[]>([]);
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
      .catch(() => toast.error("Erro ao carregar dados do perfil"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-10">
        {loading ? (
          <p className="text-gray-400 text-sm">Carregando perfil...</p>
        ) : (
          <div className="flex gap-6">
            <ProfileSidebar
              stats={stats}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              fallbackUser={{
                username: user?.username ?? null,
                avatarUrl: user?.avatarUrl ?? null,
              }}
            />
            <div className="flex-1 min-w-0">
              {activeTab === "dashboard" && (
                <DashboardTab ratings={ratings} stats={stats} users={users} />
              )}
              {activeTab === "jogos" && <MeusJogosTab ratings={ratings} />}
              {activeTab === "listas" && <ListasTab />}
              {activeTab === "salvos" && <SalvosTab ratings={ratings} />}
              {activeTab === "configuracoes" && token && user && (
                <ConfiguracoesTab token={token} userId={user.id} />
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
