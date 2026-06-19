import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { createPost, getJogos, getMyPostForGame, upsertRating } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const CATEGORIAS = [
  "Ação", "Aventura", "RPG", "Estratégia", "Esportes",
  "Corrida", "Simulação", "Terror", "Plataforma", "Puzzle",
  "Luta", "Tiro", "MMO", "Indie", "Outro",
] as const;

const MAX_CATEGORIAS = 10;

function parseCategories(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))];
}

function joinCategories(categories: string[]): string | null {
  if (categories.length === 0) return null;
  return categories.join(", ");
}

function EtiquetasPicker({
  categories,
  onChange,
}: {
  categories: string[];
  onChange: (next: string[]) => void;
}) {
  const [selectValue, setSelectValue] = useState("");

  function addCategory(value: string) {
    if (!value || categories.includes(value) || categories.length >= MAX_CATEGORIAS) return;
    onChange([...categories, value]);
    setSelectValue("");
  }

  function removeCategory(value: string) {
    onChange(categories.filter((cat) => cat !== value));
  }

  const available = CATEGORIAS.filter((cat) => !categories.includes(cat));

  return (
    <div className="flex flex-col gap-2 flex-1">
      <span className="text-white font-semibold text-sm">Etiquetas:</span>
      <div className="flex gap-2">
        <select
          value={selectValue}
          onChange={(e) => {
            const value = e.target.value;
            if (value) addCategory(value);
            else setSelectValue("");
          }}
          disabled={available.length === 0 || categories.length >= MAX_CATEGORIAS}
          className="flex-1 rounded-xl px-4 py-2 text-base text-gray-800 outline-none focus:ring-2 focus:ring-white/40 bg-white disabled:opacity-60"
        >
          <option value="">
            {categories.length >= MAX_CATEGORIAS
              ? "Limite de etiquetas atingido"
              : "Adicionar etiqueta (ex: terror, ação)"}
          </option>
          {available.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => removeCategory(cat)}
              className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-[#5b2fa0] hover:bg-white transition-colors"
              aria-label={`Remover etiqueta ${cat}`}
            >
              {cat}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Jogo {
  id: number;
  title: string;
  imageUrl: string | null;
  releaseYear: number | null;
  tags: string[];
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-3xl transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${star} estrelas`}
        >
          <span style={{ color: star <= (hovered || value) ? "#f59e0b" : "#d1d5db" }}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

function BuscaJogo({ onSelect }: { onSelect: (j: Jogo) => void }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getJogos({ title: search.trim(), limit: 20 });
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-12">
      <h1 className="text-4xl font-extrabold text-white tracking-tight">
        Adicione seu jogo
      </h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Pesquisar jogos..."
        className="w-full max-w-[500px] rounded-xl border-none px-4 py-3 text-base text-gray-800 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white/40"
        style={{ background: "#ffffff" }}
      />

      {search.trim() && (
        <div className="w-full max-w-5xl">
          <h2 className="mb-4 text-lg font-bold text-white border-b border-white/30 pb-2">
            Resultados da sua busca "{search.trim()}"
          </h2>
          {loading ? (
            <p className="text-white/70 text-sm">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="text-white/70 text-sm">Nenhum jogo encontrado.</p>
          ) : (
            <div className="flex gap-5 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
              {results.map((jogo) => (
                <button
                  key={jogo.id}
                  type="button"
                  onClick={() => onSelect(jogo)}
                  className="flex-shrink-0 w-36 flex flex-col items-center gap-2 cursor-pointer group"
                >
                  <div className="w-36 h-48 rounded-2xl overflow-hidden bg-white/20 shadow-lg ring-2 ring-transparent group-hover:ring-white transition-all">
                    {jogo.imageUrl ? (
                      <img src={jogo.imageUrl} alt={jogo.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40 text-xs text-center px-2">
                        Sem imagem
                      </div>
                    )}
                  </div>
                  <span className="text-white text-sm font-semibold text-center leading-tight line-clamp-2 w-full">
                    {jogo.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FormPublicacao({ jogo, onBack }: { jogo: Jogo; onBack: () => void }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [jaJoguei, setJaJoguei] = useState(false);
  const [opiniao, setOpiniao] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    if (!token) { setLoadingExisting(false); return; }
    getMyPostForGame(token, jogo.id)
      .then((data) => {
        if (data?.post) {
          setIsEditing(true);
          setOpiniao(data.post.content);
          if (data.post.category) setCategories(parseCategories(data.post.category));
        }
        if (data?.rating) {
          if (data.rating.rating !== null) setRating(data.rating.rating);
          setJaJoguei(data.rating.played ?? false);
          if (data.rating.category && !data.post?.category) {
            setCategories(parseCategories(data.rating.category));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingExisting(false));
  }, [token, jogo.id]);

  async function handlePublicar() {
    if (!opiniao.trim()) {
      toast.error("Adicione sua opinião antes de publicar.");
      return;
    }

    if (!token) {
      toast.error("Você precisa estar logado.");
      navigate("/login");
      return;
    }

    setSubmitting(true);
    try {
      const category = joinCategories(categories);

      await createPost(token, {
        content: opiniao.trim(),
        jogoId: jogo.id,
        category,
      });

      if (jaJoguei || rating > 0 || category) {
        await upsertRating(token, jogo.id, {
          rating: rating > 0 ? rating : null,
          played: jaJoguei,
          category,
        });
      }

      toast.success(isEditing ? "Review atualizada!" : "Publicado com sucesso!");
      navigate("/seguindo", { state: { publishedGameTitle: jogo.title } });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao publicar.");
    } finally {
      setSubmitting(false);
    }
  }

  const titulo = jogo.releaseYear
    ? `${jogo.title} (${jogo.releaseYear})`
    : jogo.title;

  if (loadingExisting) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-white/80 text-sm font-medium">Carregando dados do jogo...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
        {isEditing ? "Editar review" : "Eu joguei"}
      </h1>
      {isEditing && (
        <p className="text-white/70 text-sm mb-8">
          Você já tem uma review para este jogo. Edite abaixo.
        </p>
      )}
      {!isEditing && <div className="mb-10" />}

      <div className="flex flex-col md:flex-row items-start gap-10 w-full max-w-4xl">
        <div className="flex-shrink-0">
          <div
            className="w-52 h-72 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 cursor-pointer hover:ring-white/50 transition-all"
            onClick={onBack}
            title="Trocar jogo"
          >
            {jogo.imageUrl ? (
              <img src={jogo.imageUrl} alt={jogo.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/10 text-white/40 text-xs text-center px-3">
                Sem imagem
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5">
          <h2 className="text-2xl font-bold text-white">{titulo}</h2>

          <label className="flex items-center gap-3 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={jaJoguei}
              onChange={(e) => setJaJoguei(e.target.checked)}
              className="w-5 h-5 rounded accent-white cursor-pointer"
            />
            <span className="text-white font-medium">Eu já joguei antes</span>
          </label>

          <textarea
            value={opiniao}
            onChange={(e) => setOpiniao(e.target.value)}
            placeholder="Adicione sua opinião..."
            rows={6}
            className="w-full rounded-xl px-4 py-3 text-base text-gray-800 outline-none placeholder:text-gray-400 resize-none focus:ring-2 focus:ring-white/40"
            style={{ background: "#ffffff" }}
          />

          <div className="flex flex-col sm:flex-row gap-6">
            <EtiquetasPicker categories={categories} onChange={setCategories} />

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">Avaliação</span>
                <span className="text-[#a78bfa] text-sm font-medium">0 a 5</span>
              </div>
              <StarRating value={rating} onChange={setRating} />
            </div>
          </div>

          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={handlePublicar}
              disabled={submitting}
              className="rounded-full px-10 py-3 font-semibold text-[#5b2fa0] bg-white hover:bg-white/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg text-base"
            >
              {submitting ? (isEditing ? "Salvando..." : "Publicando...") : (isEditing ? "Salvar alterações" : "Publicar")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Publicacao() {
  const [jogoSelecionado, setJogoSelecionado] = useState<Jogo | null>(null);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col" style={{ background: "#6544ad" }}>
        {jogoSelecionado ? (
          <FormPublicacao
            jogo={jogoSelecionado}
            onBack={() => setJogoSelecionado(null)}
          />
        ) : (
          <BuscaJogo onSelect={setJogoSelecionado} />
        )}
      </main>
    </div>
  );
}