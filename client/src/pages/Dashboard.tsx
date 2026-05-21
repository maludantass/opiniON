import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  getCompatibleUsers,
  getCompatibilityDistribution,
  getMyRatings,
  getDashboardStats,
  type UserCompatibility,
  type CompatibilityDistribution,
  type UserRating,
  type DashboardStats,
} from "../services/api";

const PURPLE = "#6C3BFF";
const PURPLE_LIGHT = "#A78BFA";
const COLORS = { Alto: "#6C3BFF", Médio: "#A78BFA", Baixo: "#DDD6FE" };

const TAG_PALETTE = [
  "#6C3BFF", "#7C3AED", "#8B5CF6", "#A78BFA",
  "#C4B5FD", "#9333EA", "#7E22CE", "#6D28D9",
];

// ─── Componentes de suporte ───────────────────────────────────────────────────

function MetricCard({
  label, value, sub, hint, accent = false,
}: { label: string; value: string | number; sub?: string; hint?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm flex flex-col gap-1 ${accent ? "bg-[#6C3BFF] border-[#5b30e0]" : "bg-white border-gray-200"}`}>
      <span className={`text-xs uppercase tracking-wide ${accent ? "text-purple-200" : "text-gray-400"}`}>{label}</span>
      <span className={`text-2xl font-bold leading-tight truncate ${accent ? "text-white" : "text-[#6C3BFF]"}`}>{value}</span>
      {sub && <span className={`text-xs font-medium ${accent ? "text-purple-100" : "text-gray-600"}`}>{sub}</span>}
      {hint && (
        <span className={`text-xs mt-1 leading-snug ${accent ? "text-purple-200" : "text-gray-400"}`}>{hint}</span>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-bold text-[#6C3BFF] mb-3">{children}</h2>
  );
}

function ChartCard({ title, children, insight }: { title: string; children: React.ReactNode; insight?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <SectionTitle>{title}</SectionTitle>
      {children}
      {insight && (
        <p className="mt-3 text-xs text-gray-400 italic border-t border-gray-100 pt-3">{insight}</p>
      )}
    </div>
  );
}

// ─── Tooltip customizado ──────────────────────────────────────────────────────

function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white border border-gray-200 px-3 py-2 shadow text-xs">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-[#6C3BFF]">{payload[0].value} usuário(s)</p>
    </div>
  );
}

// ─── Gráfico: Distribuição de scores ─────────────────────────────────────────

function ScoreDistributionChart({ data }: { data: CompatibilityDistribution[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={24} />
        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#F3F0FF" }} />
        <Bar dataKey="count" fill={PURPLE} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── DNA Gamer: Radar + lista de % ───────────────────────────────────────────

function DnaGamerChart({ data }: { data: { tag: string; count: number }[] }) {
  if (!data.length) {
    return <p className="text-xs text-gray-400 py-16 text-center">Avalie jogos para revelar seu DNA Gamer</p>;
  }

  const total = data.reduce((s, d) => s + d.count, 0);
  const radarData = data.slice(0, 6).map((d) => ({
    tag: d.tag,
    count: d.count,
    pct: Math.round((d.count / total) * 100),
  }));

  const useRadar = radarData.length >= 3;

  return (
    <div className="flex flex-col gap-4">
      {useRadar ? (
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={80}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="tag"
              tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
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
              formatter={(v: number, _: string, props: { payload?: { tag: string; pct: number } }) => [
                `${v} interação(ões) · ${props.payload?.pct ?? 0}%`,
                props.payload?.tag ?? "",
              ]}
              contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e5e7eb" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={radarData} barCategoryGap="30%">
            <XAxis dataKey="tag" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} width={20} />
            <Tooltip
              formatter={(v: number) => [`${v} interação(ões)`, "Tags"]}
              contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e5e7eb" }}
              cursor={{ fill: "#F3F0FF" }}
            />
            <Bar dataKey="count" fill={PURPLE} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      <div className="flex flex-wrap gap-2">
        {radarData.map((d, i) => (
          <span
            key={d.tag}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: TAG_PALETTE[i % TAG_PALETTE.length] }}
          >
            {d.tag}
            <span className="opacity-80">{d.pct}%</span>
          </span>
        ))}
        {data.length > 6 && (
          <span className="flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
            +{data.length - 6} categorias
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Banner: Primeiro Amor ────────────────────────────────────────────────────

function PrimeiroAmorBanner({ jogoTitle, createdAt, imageUrl }: { jogoTitle: string; createdAt: string; imageUrl: string | null }) {
  const date = new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#6C3BFF] to-[#9333EA] p-6 shadow-sm text-white flex items-center gap-5">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={jogoTitle}
          className="h-16 w-16 rounded-xl object-cover flex-shrink-0 shadow-md"
        />
      ) : (
        <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 text-2xl">
          🕰️
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-purple-200 mb-1">
          Primeiro Amor · O Início de Tudo
        </p>
        <p className="text-base font-bold leading-snug">
          Sua jornada no opiniON começou aqui!
        </p>
        <p className="mt-1 text-sm text-purple-100">
          Em <span className="font-semibold text-white">{date}</span>, você avaliou{" "}
          <span className="font-semibold text-white">"{jogoTitle}"</span> — e nunca mais parou.
        </p>
      </div>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-10 select-none">🎮</div>
    </div>
  );
}

// ─── Gráfico: Atividade por mês ───────────────────────────────────────────────

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
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
      return { label, count: counts.get(key) ?? 0 };
    });
  }, [ratings]);

  const peak = Math.max(...data.map((d) => d.count), 0);
  const peakMonth = data.find((d) => d.count === peak && peak > 0);

  return (
    <>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="25%">
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} width={20} />
          <Tooltip
            formatter={(v: number) => [`${v} interação(ões)`, "Atividade"]}
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
      {peakMonth && (
        <p className="mt-2 text-xs text-gray-400 italic">
          Pico em <span className="font-semibold text-[#6C3BFF]">{peakMonth.label}</span> com {peakMonth.count} interação(ões)
        </p>
      )}
    </>
  );
}

// ─── Proporção de níveis (donut) ──────────────────────────────────────────────

function CompatibilityLevelChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data} cx="50%" cy="50%"
          innerRadius={55} outerRadius={80}
          paddingAngle={3} dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS] ?? "#ccc"} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number, name: string) => [`${v} usuário(s)`, name]}
          contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e5e7eb" }}
        />
        <Legend
          formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
          iconType="circle" iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Ranking de compatíveis ───────────────────────────────────────────────────

function TopUsersTable({ users, onView }: { users: UserCompatibility[]; onView: (id: number) => void }) {
  const labelColor = { Alto: "bg-purple-100 text-purple-700", Médio: "bg-violet-50 text-violet-500", Baixo: "bg-gray-100 text-gray-500" };
  return (
    <div className="flex flex-col gap-2">
      {users.map((u, i) => (
        <div key={u.userId} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 hover:bg-purple-50 transition">
          <span className="text-sm font-bold text-[#6C3BFF] w-5 text-center">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {u.username ?? u.email.split("@")[0]}
            </p>
            <p className="text-xs text-gray-400 truncate">{u.sharedRatings} avaliações em comum</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${labelColor[u.label]}`}>
            {u.label}
          </span>
          <span className="text-sm font-bold text-[#6C3BFF] w-10 text-right">{u.score}%</span>
          <button
            type="button"
            onClick={() => onView(u.userId)}
            className="text-xs text-[#6C3BFF] hover:underline ml-1 whitespace-nowrap"
          >
            Ver →
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserCompatibility[]>([]);
  const [distribution, setDistribution] = useState<CompatibilityDistribution[]>([]);
  const [ratings, setRatings] = useState<UserRating[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    Promise.all([
      getCompatibleUsers(token),
      getCompatibilityDistribution(token),
      getMyRatings(token),
      getDashboardStats(token),
    ])
      .then(([u, dist, r, s]) => {
        setUsers(u);
        setDistribution(dist.distribution);
        setRatings(r);
        setStats(s);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── métricas derivadas ──────────────────────────────────────────────────────
  const avgScore = users.length
    ? Math.round(users.reduce((s, u) => s + u.score, 0) / users.length)
    : 0;

  const labelCounts = users.reduce(
    (acc, u) => { acc[u.label] = (acc[u.label] ?? 0) + 1; return acc; },
    {} as Record<string, number>,
  );

  const pieData = (["Alto", "Médio", "Baixo"] as const)
    .map((name) => ({ name, value: labelCounts[name] ?? 0 }))
    .filter((d) => d.value > 0);

  const mostFrequentLabel = Object.entries(labelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const bestMatch = users[0] ?? null;
  const top5 = users.slice(0, 5);

  const topGame = stats?.topFavoritedGame ?? null;
  const tagData = stats?.myTagDistribution ?? [];
  const rareTaste = stats?.rareTaste ?? null;
  const primeiroAmor = stats?.primeiroAmor ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#6C3BFF]">Dashboard analítico</h1>
          <p className="text-sm text-gray-400 mt-1">
            Insights reais sobre seus gostos e compatibilidade na plataforma
          </p>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Carregando dados...</p>
        ) : (
          <div className="flex flex-col gap-8">

            {/* ── Cards de métricas ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <MetricCard
                accent
                label="Melhor match"
                value={bestMatch ? `${bestMatch.score}%` : "—"}
                sub={bestMatch ? `@${bestMatch.username ?? bestMatch.email.split("@")[0]}` : "Avalie jogos para descobrir"}
              />
              <MetricCard
                label="Compatibilidade média"
                value={`${avgScore}%`}
                sub={`Nível predominante: ${mostFrequentLabel}`}
              />
              <MetricCard
                label="Jogo mais amado da plataforma"
                value={topGame ? topGame.title : "—"}
                sub={topGame ? `${topGame.favoritesCount} pessoa(s) favoritaram` : "Nenhum dado ainda"}
              />
              <MetricCard
                label="Jogos avaliados"
                value={ratings.filter((r) => r.rating !== null).length}
                sub={`${ratings.filter((r) => r.favorited).length} favoritados`}
              />
              <MetricCard
                label="Gosto raro"
                value={rareTaste ? `${rareTaste.percentage}%` : "—"}
                sub={
                  rareTaste
                    ? `${rareTaste.rareFavoritesCount} de ${rareTaste.totalFavoritesCount} favoritos são obscuros`
                    : "Favorite jogos para descobrir"
                }
                hint={
                  rareTaste
                    ? "Jogos favoritados por você que no máximo 2 outras pessoas da plataforma já tocaram"
                    : undefined
                }
              />
            </div>

            {/* ── Banner: Primeiro Amor ─────────────────────────────────────── */}
            {primeiroAmor && (
              <PrimeiroAmorBanner
                jogoTitle={primeiroAmor.title}
                createdAt={primeiroAmor.createdAt}
                imageUrl={primeiroAmor.imageUrl}
              />
            )}

            {/* ── Linha 1: distribuição de scores + atividade por mês ──────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard
                title="Distribuição de compatibilidade"
                insight="Como seus pares se distribuem por faixa de score. Barras à direita = maior afinidade geral."
              >
                <ScoreDistributionChart data={distribution} />
              </ChartCard>

              <ChartCard title="Atividade por mês">
                <MonthlyActivityChart ratings={ratings} />
              </ChartCard>
            </div>

            {/* ── Linha 2: categorias + proporção de nível ─────────────────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
              <ChartCard
                title="Seu DNA Gamer"
                insight="Distribuição das categorias dos jogos com que você mais interagiu. Quanto mais puxado para uma ponta, mais focado é o seu gosto."
              >
                <DnaGamerChart data={tagData} />
              </ChartCard>

              <ChartCard
                title="Proporção por nível"
                insight="Alto ≥70% · Médio ≥40% · Baixo <40%"
              >
                {pieData.length > 0 ? (
                  <CompatibilityLevelChart data={pieData} />
                ) : (
                  <p className="text-xs text-gray-400 py-16 text-center">Sem dados suficientes</p>
                )}
              </ChartCard>
            </div>

            {/* ── Linha 3: top 5 ────────────────────────────────────────────── */}
            <ChartCard
              title="Top 5 usuários mais compatíveis"
              insight="Ranking dos usuários com maior afinidade com você, com base em avaliações, favoritos e listas em comum."
            >
              {top5.length > 0 ? (
                <TopUsersTable users={top5} onView={(id) => navigate(`/comunidade/${id}`)} />
              ) : (
                <p className="text-xs text-gray-400 py-4 text-center">
                  Nenhum usuário encontrado. Avalie mais jogos para gerar compatibilidade.
                </p>
              )}
            </ChartCard>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
