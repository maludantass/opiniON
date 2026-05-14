import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  getCompatibleUsers,
  getCompatibilityDistribution,
  getMyRatings,
  type UserCompatibility,
  type CompatibilityDistribution,
  type UserRating,
} from "../services/api";

const PURPLE = "#6C3BFF";
const COLORS = { Alto: "#6C3BFF", Médio: "#A78BFA", Baixo: "#DDD6FE" };
const RATING_COLOR = "#7C3AED";

// ─── Componentes de suporte ───────────────────────────────────────────────────

function MetricCard({
  label, value, sub,
}: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-3xl font-bold text-[#6C3BFF]">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
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

function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white border border-gray-200 px-3 py-2 shadow text-xs">
      <p className="font-semibold text-gray-700">{payload[0].name}</p>
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

// ─── Gráfico: Proporção de níveis (donut) ────────────────────────────────────

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
        <Tooltip content={<CustomPieTooltip />} />
        <Legend
          formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
          iconType="circle" iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Gráfico: Distribuição de avaliações ─────────────────────────────────────

function RatingDistributionChart({ data }: { data: { star: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis dataKey="star" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={24} />
        <Tooltip
          formatter={(v: number) => [`${v} jogo(s)`, "Avaliações"]}
          contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e5e7eb" }}
          cursor={{ fill: "#F3F0FF" }}
        />
        <Bar dataKey="count" fill={RATING_COLOR} radius={[6, 6, 0, 0]} />
      </BarChart>
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
            <p className="text-xs text-gray-400 truncate">{u.email}</p>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    Promise.all([
      getCompatibleUsers(token),
      getCompatibilityDistribution(token),
      getMyRatings(token),
    ])
      .then(([u, dist, r]) => {
        setUsers(u);
        setDistribution(dist.distribution);
        setRatings(r);
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

  const ratingDist = [1, 2, 3, 4, 5].map((star) => ({
    star: `${star}★`,
    count: ratings.filter((r) => r.rating === star).length,
  }));

  const favoritesCount = ratings.filter((r) => r.favorited).length;
  const listedCount = ratings.filter((r) => r.listed).length;
  const top5 = users.slice(0, 5);

  const mostFrequentLabel = Object.entries(labelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#6C3BFF]">Dashboard analítico</h1>
          <p className="text-sm text-gray-400 mt-1">
            Visão geral da sua compatibilidade e engajamento na plataforma
          </p>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Carregando dados...</p>
        ) : (
          <div className="flex flex-col gap-8">

            {/* ── Cards de métricas ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <MetricCard label="Usuários analisados" value={users.length} sub="na sua rede" />
              <MetricCard label="Score médio" value={`${avgScore}%`} sub="de compatibilidade" />
              <MetricCard label="Nível predominante" value={mostFrequentLabel} sub="entre seus pares" />
              <MetricCard label="Jogos avaliados" value={ratings.length} sub="no total" />
              <MetricCard label="Favoritos" value={favoritesCount} sub={`${listedCount} na lista`} />
            </div>

            {/* ── Linha 1: distribuição de scores + donut ──────────────────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
              <ChartCard
                title="Distribuição de compatibilidade"
                insight="Mostra como seus pares se distribuem por faixa de score. Barras à direita indicam maior afinidade geral da sua rede."
              >
                <ScoreDistributionChart data={distribution} />
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

            {/* ── Linha 2: avaliações + top 5 ──────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
              <ChartCard
                title="Distribuição das suas avaliações"
                insight="Revela seu padrão de avaliação. Predominância de notas altas pode elevar seu score de compatibilidade com outros entusiastas."
              >
                <RatingDistributionChart data={ratingDist} />
              </ChartCard>

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

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
