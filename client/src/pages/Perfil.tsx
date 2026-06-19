import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  deleteUser,
  getMinhasListas,
  createLista,
  deleteLista,
  updateLista,
  addJogoToLista,
  getMyPosts,
  updatePost,
  deletePost,
  type UserCompatibility,
  type UserRating,
  type DashboardStats,
  type GostoGame,
  type Lista,
  type FeedPost,
} from "../services/api";
import AddToListaModal from "../components/AddToListaModal";
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
          formatter={(value) => [`${Number(value ?? 0)} interação(ões)`, "Atividade"]}
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
          formatter={(value) => [`${Number(value ?? 0)} interação(ões)`, "DNA"]}
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

type JogosFilter = "todos" | "salvos" | "publicados";

function isPassOnly(r: UserRating): boolean {
  return !r.favorited && r.rating === null && !r.listed && !r.played && !r.category;
}

function MeusJogosTab({ ratings, myPosts }: { ratings: UserRating[]; myPosts: FeedPost[] }) {
  const [filter, setFilter] = useState<JogosFilter>("todos");
  const [sort, setSort] = useState<"nota" | "recente">("nota");
  const [visible, setVisible] = useState(10);

  const publishedJogoIds = useMemo(
    () => new Set(myPosts.map((p) => p.jogo?.id).filter(Boolean)),
    [myPosts],
  );

  const counts = useMemo(
    () => ({
      todos: ratings.filter((r) => !isPassOnly(r)).length,
      salvos: ratings.filter((r) => r.favorited).length,
      publicados: ratings.filter((r) => r.jogo && publishedJogoIds.has(r.jogo.id)).length,
    }),
    [ratings, publishedJogoIds],
  );

  const FILTERS: { key: JogosFilter; label: string }[] = [
    { key: "todos", label: `Todos (${counts.todos})` },
    { key: "salvos", label: `Jogos salvos (${counts.salvos})` },
    { key: "publicados", label: `Publicados (${counts.publicados})` },
  ];

  const filtered = useMemo(() => {
    let base: UserRating[];
    switch (filter) {
      case "salvos":
        base = ratings.filter((r) => r.favorited);
        break;
      case "publicados":
        base = ratings.filter((r) => r.jogo && publishedJogoIds.has(r.jogo.id));
        break;
      default:
        base = ratings.filter((r) => !isPassOnly(r));
    }
    if (sort === "nota") {
      return [...base].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return [...base].sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    );
  }, [ratings, filter, sort, publishedJogoIds]);

  const filterTitle: Record<JogosFilter, string> = {
    todos: "Todos os Jogos",
    salvos: "Jogos Salvos",
    publicados: "Publicados",
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
                      {rating.favorited ? "Salvo" : rating.rating !== null ? "Avaliado" : "Na fila"}
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

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "há 1 dia";
  if (days < 7) return `há ${days} dias`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "há 1 semana";
  if (weeks < 4) return `há ${weeks} semanas`;
  const months = Math.floor(days / 30);
  if (months === 1) return "há 1 mês";
  return `há ${months} meses`;
}

function CreateListaModal({
  onClose,
  onCreate,
  ratings,
}: {
  onClose: () => void;
  onCreate: (data: { title: string; description: string; type: "public" | "private"; jogoIds: number[] }) => Promise<void>;
  ratings: UserRating[];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"public" | "private">("public");
  const [saving, setSaving] = useState(false);
  const [selectedJogoIds, setSelectedJogoIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");

  const availableJogos = useMemo(
    () =>
      ratings
        .filter((r) => r.jogo)
        .map((r) => r.jogo!)
        .filter((j) => j.title.toLowerCase().includes(search.toLowerCase())),
    [ratings, search],
  );

  function toggleJogo(jogoId: number) {
    setSelectedJogoIds((prev) =>
      prev.includes(jogoId) ? prev.filter((id) => id !== jogoId) : [...prev, jogoId],
    );
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("Digite um título para a lista");
      return;
    }
    setSaving(true);
    try {
      await onCreate({ title, description, type, jogoIds: selectedJogoIds });
    } finally {
      setSaving(false);
    }
  }

  const selectedJogos = ratings
    .filter((r) => r.jogo && selectedJogoIds.includes(r.jogoId))
    .map((r) => r.jogo!);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-800">Nova lista</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Melhores RPGs de todos os tempos"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva sua lista..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Jogos ({selectedJogoIds.length} selecionado{selectedJogoIds.length !== 1 ? "s" : ""})
            </label>

            {selectedJogos.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedJogos.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => toggleJogo(j.id)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#6C3BFF] text-white font-medium hover:bg-[#5b30e0] transition"
                  >
                    {j.title}
                    <span className="ml-0.5 text-purple-200 text-[10px]">×</span>
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nos meus jogos..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200 mb-1"
            />

            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
              {availableJogos.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  {ratings.length === 0 ? "Nenhum jogo avaliado ainda." : "Nenhum jogo encontrado."}
                </p>
              ) : (
                availableJogos.map((jogo) => {
                  const selected = selectedJogoIds.includes(jogo.id);
                  return (
                    <button
                      key={jogo.id}
                      type="button"
                      onClick={() => toggleJogo(jogo.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition border-b border-gray-50 last:border-0 ${
                        selected ? "bg-purple-50" : "hover:bg-gray-50"
                      }`}
                    >
                      {jogo.imageUrl ? (
                        <img
                          src={jogo.imageUrl}
                          alt={jogo.title}
                          className="h-8 w-6 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-6 rounded bg-purple-100 flex items-center justify-center text-xs shrink-0">🎮</div>
                      )}
                      <span className={`flex-1 truncate font-medium ${selected ? "text-[#6C3BFF]" : "text-gray-700"}`}>
                        {jogo.title}
                      </span>
                      {selected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6C3BFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Visibilidade
            </label>
            <div className="flex gap-2">
              {(["public", "private"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                    type === t
                      ? "bg-[#6C3BFF] text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-purple-50"
                  }`}
                >
                  {t === "public" ? "Pública" : "Privada"}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="w-full bg-[#6C3BFF] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#5b30e0] transition disabled:opacity-60"
          >
            {saving ? "Criando..." : "Criar lista"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditPostModal({
  post,
  onClose,
  onSave,
}: {
  post: FeedPost;
  onClose: () => void;
  onSave: (postId: number, content: string) => Promise<void>;
}) {
  const [content, setContent] = useState(post.content);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("A review não pode estar vazia");
      return;
    }
    setSaving(true);
    try {
      await onSave(post.id, content.trim());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800">Editar review</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        {post.jogo && (
          <p className="text-xs text-gray-400 mb-3 truncate">
            {post.jogo.title}
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="Escreva sua review..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !content.trim()}
              className="flex-1 bg-[#6C3BFF] text-white rounded-xl py-2 text-sm font-medium hover:bg-[#5b30e0] transition disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditListaModal({
  lista,
  onClose,
  onSave,
}: {
  lista: Lista;
  onClose: () => void;
  onSave: (id: number, data: { title: string; description: string; type: "public" | "private" }) => Promise<void>;
}) {
  const [title, setTitle] = useState(lista.title);
  const [description, setDescription] = useState(lista.description ?? "");
  const [type, setType] = useState<"public" | "private">(lista.type);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("Digite um título para a lista");
      return;
    }
    setSaving(true);
    try {
      await onSave(lista.id, { title, description, type });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-800">Editar lista</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da lista"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Descreva sua lista..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Visibilidade
            </label>
            <div className="flex gap-2">
              {(["public", "private"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                    type === t
                      ? "bg-[#6C3BFF] text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-purple-50"
                  }`}
                >
                  {t === "public" ? "Pública" : "Privada"}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="w-full bg-[#6C3BFF] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#5b30e0] transition disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ListaCard({
  lista,
  onDelete,
  onEdit,
}: {
  lista: Lista;
  onDelete: (id: number) => void;
  onEdit?: (lista: Lista) => void;
}) {
  const timeAgo = formatTimeAgo(lista.updatedAt);
  const jogos = lista.jogos ?? [];
  const displayJogos = jogos.slice(0, 3);
  const extra = jogos.length - 3;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-[#6C3BFF] flex-1 min-w-0 leading-snug">
          {lista.title}
        </h3>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
            lista.type === "public"
              ? "bg-purple-100 text-purple-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {lista.type === "public" ? "Pública" : "Privada"}
        </span>
      </div>

      <p className="text-xs text-gray-400">
        {lista.jogoIds.length} {lista.jogoIds.length === 1 ? "jogo" : "jogos"} · atualizada {timeAgo}
      </p>

      {jogos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {displayJogos.map((j) => (
            <span
              key={j.id}
              className="text-[10px] px-2.5 py-1 rounded-full bg-[#6C3BFF] text-white font-medium truncate max-w-[120px]"
            >
              {j.title}
            </span>
          ))}
          {extra > 0 && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#A78BFA] text-white font-medium">
              +{extra}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          ♡ 0 curtidas
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          ○ 0 comentários
        </span>
        <div className="ml-auto flex items-center gap-3">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(lista)}
              className="text-[10px] text-[#6C3BFF] hover:text-[#5b30e0] transition"
            >
              Editar
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(lista.id)}
            className="text-[10px] text-red-400 hover:text-red-600 transition"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  );
}

function ListasTab({
  token,
  listas,
  setListas,
  ratings,
}: {
  token: string;
  listas: Lista[];
  setListas: React.Dispatch<React.SetStateAction<Lista[]>>;
  ratings: UserRating[];
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingLista, setEditingLista] = useState<Lista | null>(null);

  async function handleCreate(data: {
    title: string;
    description: string;
    type: "public" | "private";
    jogoIds: number[];
  }) {
    try {
      let nova = await createLista(token, data);
      for (const jogoId of data.jogoIds) {
        try {
          nova = await addJogoToLista(token, nova.id, jogoId);
        } catch {
          // continue adding other games even if one fails
        }
      }
      setListas((prev) => [nova, ...prev]);
      setShowModal(false);
      toast.success("Lista criada!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar lista");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteLista(token, id);
      setListas((prev) => prev.filter((l) => l.id !== id));
      toast.success("Lista removida");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover lista");
    }
  }

  async function handleEdit(
    id: number,
    data: { title: string; description: string; type: "public" | "private" },
  ) {
    try {
      const updated = await updateLista(token, id, data);
      setListas((prev) => prev.map((l) => (l.id === id ? updated : l)));
      setEditingLista(null);
      toast.success("Lista atualizada!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar lista");
      throw e;
    }
  }

  return (
    <>
      {showModal && (
        <CreateListaModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
          ratings={ratings}
        />
      )}
      {editingLista && (
        <EditListaModal
          lista={editingLista}
          onClose={() => setEditingLista(null)}
          onSave={handleEdit}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        {listas.map((lista) => (
          <ListaCard
            key={lista.id}
            lista={lista}
            onDelete={handleDelete}
            onEdit={setEditingLista}
          />
        ))}

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded-2xl border-2 border-dashed border-purple-200 bg-white p-6 flex flex-col items-center justify-center gap-3 hover:border-purple-400 hover:bg-purple-50 transition cursor-pointer min-h-[140px]"
        >
          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-[#6C3BFF] text-2xl font-light">
            +
          </div>
          <p className="text-sm font-semibold text-gray-700">
            Criar uma nova lista
          </p>
          <span className="px-4 py-1.5 rounded-full bg-[#6C3BFF] text-white text-xs font-medium">
            Criar agora
          </span>
        </button>
      </div>
    </>
  );
}

// ─── Salvos Tab ───────────────────────────────────────────────────────────────

type SalvosFilter = "jogos" | "listas" | "reviews";

function SalvosTab({
  ratings,
  listas,
  token,
  myPosts,
  setMyPosts,
}: {
  ratings: UserRating[];
  listas: Lista[];
  token: string;
  myPosts: FeedPost[];
  setMyPosts: React.Dispatch<React.SetStateAction<FeedPost[]>>;
}) {
  const [sub, setSub] = useState<SalvosFilter>("jogos");
  const [visible, setVisible] = useState(6);
  const [addToListaRating, setAddToListaRating] = useState<UserRating | null>(null);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);

  async function handleDeletePost(postId: number) {
    if (!window.confirm("Excluir esta review?")) return;
    try {
      await deletePost(token, postId);
      setMyPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Review excluída.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    }
  }

  async function handleUpdatePost(postId: number, content: string) {
    await updatePost(token, postId, { content });
    setMyPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content } : p)),
    );
    setEditingPost(null);
    toast.success("Review atualizada!");
  }

  const favorited = useMemo(
    () => ratings.filter((r) => r.favorited),
    [ratings],
  );

  const SUB_TABS: { key: SalvosFilter; label: string }[] = [
    { key: "jogos", label: `Jogos (${favorited.length})` },
    { key: "listas", label: `Listas (${listas.length})` },
    { key: "reviews", label: `Reviews (${myPosts.length})` },
  ];

  return (
    <div>
      {addToListaRating && addToListaRating.jogo && (
        <AddToListaModal
          token={token}
          jogoId={addToListaRating.jogoId}
          jogoTitle={addToListaRating.jogo.title}
          onClose={() => setAddToListaRating(null)}
        />
      )}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={handleUpdatePost}
        />
      )}

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
                    className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white hover:shadow-md transition group"
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
                      <button
                        type="button"
                        onClick={() => setAddToListaRating(rating)}
                        title="Adicionar a uma lista"
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-500 hover:text-[#6C3BFF] transition opacity-0 group-hover:opacity-100"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                          <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                      </button>
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
      ) : sub === "reviews" ? (
        myPosts.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm bg-white rounded-2xl border border-gray-200 shadow-sm">
            Você ainda não publicou nenhuma review. Acesse{" "}
            <span className="text-[#6C3BFF] font-medium">Publicação</span> para criar uma.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {myPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition"
              >
                {post.user && (
                  <div className="flex items-center gap-2">
                    {post.user.avatarUrl ? (
                      <img src={post.user.avatarUrl} alt={post.user.username ?? ""} className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-[#6C3BFF] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {(post.user.username ?? post.user.email).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {post.user.username ?? post.user.email.split("@")[0]}
                      </p>
                      {post.user.username && (
                        <p className="text-[10px] text-gray-400 truncate">
                          @{post.user.username.toLowerCase().replace(/\s+/g, "")}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {post.jogo && (
                  <div className="flex items-center gap-3">
                    {post.jogo.imageUrl ? (
                      <img src={post.jogo.imageUrl} alt={post.jogo.title} className="h-16 w-12 rounded-lg object-cover shrink-0 shadow-sm" />
                    ) : (
                      <div className="h-16 w-12 rounded-lg bg-purple-100 flex items-center justify-center text-xl shrink-0">🎮</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{post.jogo.title}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {post.jogo.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[9px] bg-[#F3F0FF] text-[#6C3BFF] px-1.5 py-0.5 rounded-full font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {post.rating !== null && (
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-gray-400">Nota</p>
                        <p className="text-base font-bold text-[#6C3BFF]">{post.rating.toFixed(1)}</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-purple-400 bg-purple-50 px-2 py-0.5 rounded-full">
                    Review
                  </span>
                  <p className="text-[11px] text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400">
                    ♡ {post.likesCount ?? 0} curtidas
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingPost(post)}
                      className="text-[10px] text-[#6C3BFF] hover:text-[#5b30e0] transition"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="text-[10px] text-red-400 hover:text-red-600 transition"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : sub === "listas" ? (
        listas.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm bg-white rounded-2xl border border-gray-200 shadow-sm">
            Nenhuma lista criada ainda. Crie listas na aba Listas.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {listas.map((lista) => (
              <ListaCard key={lista.id} lista={lista} onDelete={() => {}} />
            ))}
          </div>
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

function SettingsToggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      type="button"
      title={label ?? (checked ? "Desativar" : "Ativar")}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? "bg-[#6C3BFF]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SettingsAccordion({
  label,
  open,
  onToggle,
  danger,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-4 text-sm font-medium transition hover:bg-gray-50 ${
          danger ? "text-red-500" : "text-gray-700"
        }`}
      >
        <span>{label}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""} ${danger ? "text-red-400" : "text-gray-400"}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

function SettingsToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <SettingsToggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

function useLocalToggle(key: string, defaultValue = true) {
  const [value, setValue] = useState<boolean>(() => {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored === "true" : defaultValue;
  });
  function toggle() {
    setValue((v) => {
      localStorage.setItem(key, String(!v));
      return !v;
    });
  }
  return [value, toggle] as const;
}

function ConfiguracoesTab({
  token,
  userId,
}: {
  token: string;
  userId: number;
}) {
  const navigate = useNavigate();
  const { user, updateUserLocal, logout } = useAuth();

  // Dados pessoais
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);

  // Accordions
  const [openSection, setOpenSection] = useState<string | null>(null);
  function toggleSection(key: string) {
    setOpenSection((prev) => (prev === key ? null : key));
  }

  // Notificações (localStorage)
  const [notifCurtidas, toggleNotifCurtidas] = useLocalToggle("opinion_notif_curtidas");
  const [notifComentarios, toggleNotifComentarios] = useLocalToggle("opinion_notif_comentarios");
  const [notifConexoes, toggleNotifConexoes] = useLocalToggle("opinion_notif_conexoes");

  // Privacidade (localStorage)
  const [perfilPrivado, togglePerfilPrivado] = useLocalToggle("opinion_perfil_privado", false);

  // Excluir conta
  const [deleting, setDeleting] = useState(false);

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
      setOpenSection(null);
      toast.success("Perfil atualizado!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteUser(token, userId);
      logout();
      navigate("/login");
      toast.success("Conta excluída.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir conta");
      setDeleting(false);
    }
  }

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200";

  return (
    <div className="flex flex-col gap-4 max-w-lg">

      {/* ── Perfil ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Perfil</p>
        </div>

        <SettingsAccordion
          label="Dados pessoais"
          open={openSection === "dados"}
          onToggle={() => toggleSection("dados")}
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Nome de usuário</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@seu_username"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte um pouco sobre você..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">URL do avatar</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className={inputClass}
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
        </SettingsAccordion>

        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Privacidade</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {perfilPrivado ? "Perfil privado" : "Perfil público"}
            </p>
          </div>
          <SettingsToggle checked={perfilPrivado} onChange={togglePerfilPrivado} label="Alternar privacidade do perfil" />
        </div>
      </div>

      {/* ── Notificações ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Notificações</p>
        </div>
        <SettingsToggleRow
          label="Curtidas"
          description="Seja notificado de curtidas nos seus posts"
          checked={notifCurtidas}
          onChange={toggleNotifCurtidas}
        />
        <SettingsToggleRow
          label="Comentários"
          description="Seja notificado de comentários nos seus reviews"
          checked={notifComentarios}
          onChange={toggleNotifComentarios}
        />
        <SettingsToggleRow
          label="Novas conexões"
          description="Seja notificado quando alguém novo te seguir"
          checked={notifConexoes}
          onChange={toggleNotifConexoes}
        />
      </div>

      {/* ── Conta ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Conta</p>
        </div>

        <SettingsAccordion
          label="Alterar e-mail"
          open={openSection === "email"}
          onToggle={() => toggleSection("email")}
        >
          <p className="text-sm text-gray-400 py-2">Em breve — esta funcionalidade estará disponível em uma próxima versão.</p>
        </SettingsAccordion>

        <SettingsAccordion
          label="Alterar senha"
          open={openSection === "senha"}
          onToggle={() => toggleSection("senha")}
        >
          <p className="text-sm text-gray-400 py-2">Em breve — esta funcionalidade estará disponível em uma próxima versão.</p>
        </SettingsAccordion>

        <SettingsAccordion
          label="Adicionar telefone"
          open={openSection === "telefone"}
          onToggle={() => toggleSection("telefone")}
        >
          <p className="text-sm text-gray-400 py-2">Em breve — esta funcionalidade estará disponível em uma próxima versão.</p>
        </SettingsAccordion>

        <SettingsAccordion
          label="Excluir conta"
          open={openSection === "excluir"}
          onToggle={() => toggleSection("excluir")}
          danger
        >
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-red-700">Esta ação não pode ser desfeita.</p>
            <p className="text-xs text-red-500 leading-relaxed">
              Todos os seus dados, posts e avaliações serão permanentemente removidos.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpenSection(null)}
                className="flex-1 border border-gray-200 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition"
              >
                {deleting ? "Excluindo..." : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </SettingsAccordion>
      </div>

    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const VALID_TABS: ProfileTab[] = ["dashboard", "jogos", "listas", "salvos", "configuracoes"];

export default function Perfil() {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as ProfileTab | null;
  const activeTab: ProfileTab = VALID_TABS.includes(tabParam as ProfileTab) ? (tabParam as ProfileTab) : "dashboard";

  function setActiveTab(tab: ProfileTab) {
    setSearchParams({ tab }, { replace: true });
  }

  const [ratings, setRatings] = useState<UserRating[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserCompatibility[]>([]);
  const [listas, setListas] = useState<Lista[]>([]);
  const [myPosts, setMyPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getCompatibleUsers(token),
      getMyRatings(token),
      getDashboardStats(token),
      getMinhasListas(token),
      getMyPosts(token),
    ])
      .then(([u, r, s, l, p]) => {
        setUsers(u);
        setRatings(r);
        setStats(s);
        setListas(l);
        setMyPosts(p);
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
              {activeTab === "jogos" && <MeusJogosTab ratings={ratings} myPosts={myPosts} />}
              {activeTab === "listas" && token && (
                <ListasTab token={token} listas={listas} setListas={setListas} ratings={ratings} />
              )}
              {activeTab === "salvos" && token && (
                <SalvosTab ratings={ratings} listas={listas} token={token} myPosts={myPosts} setMyPosts={setMyPosts} />
              )}
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