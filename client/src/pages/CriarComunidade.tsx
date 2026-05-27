import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { createCommunity, type CommunityType } from "../services/api";
import toast from "react-hot-toast";

export default function CriarComunidade() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [type, setType] = useState<CommunityType>("public");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [gameInput, setGameInput] = useState("");
  const [games, setGames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const addGame = () => {
    const g = gameInput.trim();
    if (g && !games.includes(g) && games.length < 20) {
      setGames([...games, g]);
      setGameInput("");
    }
  };

  const removeGame = (game: string) => setGames(games.filter((g) => g !== game));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { navigate("/login"); return; }
    if (!name.trim()) { toast.error("Nome é obrigatório"); return; }

    setLoading(true);
    try {
      const community = await createCommunity(token, {
        name: name.trim(),
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
        type,
        tags,
        games,
      });
      toast.success("Comunidade criada!");
      navigate(`/comunidades/${community.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar comunidade");
    } finally {
      setLoading(false);
    }
  };

  const TYPE_OPTIONS: { value: CommunityType; label: string; desc: string }[] = [
    { value: "public", label: "Pública", desc: "Qualquer pessoa pode entrar livremente" },
    { value: "private", label: "Privada", desc: "Entrada mediante aprovação do moderador" },
    { value: "invite", label: "Por código", desc: "Acesso restrito a quem possui o código" },
  ];

  return (
    <div className="min-h-screen bg-[#FFFBFE]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          type="button"
          onClick={() => navigate("/comunidades")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Criar comunidade</h1>
        <p className="text-sm text-gray-500 mb-8">Crie um espaço para jogadores com interesses em comum.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="Ex: Fãs de RPG Brasileiro"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{name.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Sobre o que é essa comunidade?"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL da imagem (banner)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de acesso</label>
            <div className="space-y-2">
              {TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${type === opt.value ? "border-purple-400 bg-purple-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={opt.value}
                    checked={type === opt.value}
                    onChange={() => setType(opt.value)}
                    className="mt-0.5 accent-purple-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (temas, gêneros)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Ex: rpg, aventura..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <button type="button" onClick={addTag} className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl text-sm text-gray-700 transition-colors">
                Adicionar
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-purple-900">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Games */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jogos associados</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={gameInput}
                onChange={(e) => setGameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGame(); } }}
                placeholder="Ex: Zelda: Breath of the Wild..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <button type="button" onClick={addGame} className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl text-sm text-gray-700 transition-colors">
                Adicionar
              </button>
            </div>
            {games.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {games.map((game) => (
                  <span key={game} className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-full">
                    {game}
                    <button type="button" onClick={() => removeGame(game)} className="hover:text-indigo-900">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/comunidades")}
              className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Criando..." : "Criar comunidade"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
