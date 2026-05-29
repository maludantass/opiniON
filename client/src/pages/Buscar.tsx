import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { getJogos, getMyRatings, upsertRating, type Jogo, type UserRating } from '../services/api';
import { HeartIcon, BookmarkIcon, SearchIcon } from '../components/icons';
import { useAuth } from '../contexts/AuthContext';
import AddToListaModal from '../components/AddToListaModal';

const CATEGORIES = [
  { id: 1, name: 'Ação', tag: 'Action' },
  { id: 2, name: 'Aventura', tag: 'Adventure' },
  { id: 3, name: 'RPG', tag: 'RPG' },
  { id: 4, name: 'Simulação', tag: 'Simulation' },
  { id: 5, name: 'Estratégia', tag: 'Strategy' },
  { id: 6, name: 'Indie', tag: 'Indie' },
  { id: 7, name: 'Casual', tag: 'Casual' },
  { id: 8, name: 'Terror', tag: 'Horror' },
  { id: 9, name: 'Puzzle', tag: 'Puzzle' },
  { id: 10, name: 'Multijogador', tag: 'Multiplayer' },
  { id: 11, name: 'Tiro', tag: 'Shooter' },
  { id: 12, name: 'Anime', tag: 'Anime' },
  { id: 13, name: 'Pixel Art', tag: 'Pixel Graphics' },
  { id: 14, name: 'Rica em História', tag: 'Story Rich' },
  { id: 15, name: 'Cooperativo', tag: 'Co-op' },
  { id: 16, name: 'Um Jogador', tag: 'Singleplayer' },
  { id: 17, name: 'Visual Novel', tag: 'Visual Novel' },
  { id: 18, name: 'Exploração', tag: 'Exploration' },
  { id: 19, name: 'Gratuito', tag: 'Free to Play' },
  { id: 20, name: 'Ação e Aventura', tag: 'Action-Adventure' },
];

function CategoryCard({ name, bgColor, onClick }: { name: string; bgColor: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-28 w-full overflow-hidden rounded-xl ${bgColor} shadow-sm transition hover:scale-105 hover:shadow-md cursor-pointer flex items-center`}
    >
      <div className="h-[90%] w-16 ml-1 bg-gradient-to-br from-blue-400 via-sky-300 to-amber-300 rounded-md shadow-inner flex-shrink-0" />
      <div className="flex-1 flex items-end justify-center pl-1 pr-1 pb-4">
        <span className="font-medium text-white tracking-wider text-sm truncate">{name}</span>
      </div>
    </button>
  );
}

function GameResultCard({
  game,
  favorited,
  listed,
  onFavorite,
  onList,
  onAddToList,
}: {
  game: Jogo;
  favorited: boolean;
  listed: boolean;
  onFavorite: () => void;
  onList: () => void;
  onAddToList: () => void;
}) {
  return (
    <div className="flex bg-white rounded-2xl p-4 shadow-sm border border-gray-100 gap-4 transition hover:shadow-md">
      {game.imageUrl ? (
        <img
          src={game.imageUrl}
          alt={game.title}
          className="w-24 h-36 flex-shrink-0 rounded-xl object-cover shadow-inner"
        />
      ) : (
        <div className="w-24 h-36 flex-shrink-0 rounded-xl bg-gradient-to-br from-[#6C3BFF] via-[#9B7BFF] to-[#C4ADFF] shadow-inner overflow-hidden flex items-center justify-center">
          <span className="text-white text-xs font-medium text-center px-1">{game.title}</span>
        </div>
      )}

      <div className="flex flex-col flex-1 py-1 overflow-hidden">
        <h3 className="font-bold text-gray-900 text-sm mb-1">{game.title}</h3>
        {game.description && (
          <p className="text-[10px] text-gray-500 leading-relaxed flex-1 line-clamp-4">
            {game.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          {game.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {game.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] bg-[#F3F0FF] text-[#6C3BFF] px-2 py-0.5 rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              type="button"
              onClick={onFavorite}
              aria-label={favorited ? "Descurtir jogo" : "Curtir jogo"}
              className={`transition ${favorited ? "text-[#6C3BFF]" : "text-gray-400 hover:text-[#6C3BFF]"}`}
            >
              <HeartIcon filled={favorited} />
            </button>
            <button
              type="button"
              onClick={onList}
              aria-label={listed ? "Remover da fila" : "Adicionar à fila"}
              className={`transition ${listed ? "text-[#6C3BFF]" : "text-gray-400 hover:text-[#6C3BFF]"}`}
            >
              <BookmarkIcon filled={listed} />
            </button>
            <button
              type="button"
              onClick={onAddToList}
              aria-label="Adicionar a uma lista"
              title="Adicionar a uma lista"
              className="text-gray-400 hover:text-[#6C3BFF] transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SwipeCard() {
  return (
    <aside className="flex h-[620px] flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-b from-[#10101E] to-black p-7 shadow-xl">
      <div>
        <h2 className="text-3xl font-bold leading-tight text-white">
          Descubra novos jogos incríveis com o nosso Swipe
        </h2>
        <button
          type="button"
          aria-label="Ir para o Swipe"
          className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-medium text-gray-900 transition hover:scale-105"
        >
          Ir para o Swipe agora
        </button>
      </div>

      <div className="relative mx-auto mb-6 h-40 w-40">
        <div className="absolute inset-0 rounded-full bg-purple-400/30 blur-3xl" />
        <div className="absolute left-1/2 top-8 h-24 w-20 -translate-x-1/2 rounded-t-2xl bg-[#CDBBFF]" />
        <div className="absolute left-8 top-16 h-20 w-10 rounded-md bg-[#E8DFFF]" />
        <div className="absolute right-8 top-16 h-20 w-10 rounded-md bg-[#E8DFFF]" />
        <div className="absolute left-1/2 top-24 h-20 w-14 -translate-x-1/2 bg-[#A58BDE]" />
      </div>
    </aside>
  );
}

export default function Buscar() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [games, setGames] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(false);
  const [ratingsMap, setRatingsMap] = useState<Map<number, UserRating>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [addToListaGame, setAddToListaGame] = useState<Jogo | null>(null);

  // Carrega ratings do usuário uma vez ao montar
  useEffect(() => {
    if (!token) return;
    getMyRatings(token)
      .then((ratings) => {
        const map = new Map<number, UserRating>();
        ratings.forEach((r) => map.set(r.jogoId, r));
        setRatingsMap(map);
      })
      .catch(() => {});
  }, [token]);

  const handleToggleFavorite = async (game: Jogo) => {
    if (!token) return;
    const current = ratingsMap.get(game.id);
    const newFav = !(current?.favorited ?? false);
    // Atualização otimista
    setRatingsMap((prev) => {
      const next = new Map(prev);
      next.set(game.id, { ...(current ?? { id: 0, userId: 0, jogoId: game.id, rating: null, favorited: false, listed: false, played: false, category: null }), favorited: newFav });
      return next;
    });
    try {
      const updated = await upsertRating(token, game.id, { favorited: newFav });
      setRatingsMap((prev) => { const next = new Map(prev); next.set(game.id, updated); return next; });
      toast.success(newFav ? 'Jogo curtido!' : 'Curtida removida');
    } catch {
      // Reverte em caso de erro
      setRatingsMap((prev) => { const next = new Map(prev); if (current) next.set(game.id, current); else next.delete(game.id); return next; });
      toast.error('Erro ao curtir jogo');
    }
  };

  const handleToggleListed = async (game: Jogo) => {
    if (!token) return;
    const current = ratingsMap.get(game.id);
    const newListed = !(current?.listed ?? false);
    setRatingsMap((prev) => {
      const next = new Map(prev);
      next.set(game.id, { ...(current ?? { id: 0, userId: 0, jogoId: game.id, rating: null, favorited: false, listed: false, played: false, category: null }), listed: newListed });
      return next;
    });
    try {
      const updated = await upsertRating(token, game.id, { listed: newListed });
      setRatingsMap((prev) => { const next = new Map(prev); next.set(game.id, updated); return next; });
      toast.success(newListed ? 'Jogo salvo na lista!' : 'Removido da lista');
    } catch {
      setRatingsMap((prev) => { const next = new Map(prev); if (current) next.set(game.id, current); else next.delete(game.id); return next; });
      toast.error('Erro ao salvar jogo');
    }
  };

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim().length === 0 && !selectedTag) {
      setGames([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const params: { title?: string; tag?: string; limit: number } = { limit: 20 };
        if (searchQuery.trim().length > 0) params.title = searchQuery.trim();
        if (selectedTag) params.tag = selectedTag;
        const results = await getJogos(params);
        setGames(results);
      } catch {
        setGames([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, selectedTag]);

  function handleCategoryClick(tag: string) {
    setSelectedTag(tag);
    setSearchQuery('');
  }

  function handleBackToCategories() {
    setSelectedTag(null);
    setGames([]);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#EEEEFF]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-10">
        <h1 className="mb-8 text-[40px] font-bold text-[#6C3BFF]">Buscar</h1>

        {/* Search Input */}
        <div className="mb-12 relative w-full">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-500">
            <SearchIcon />
          </div>
          <input 
            type="text" 
            placeholder="O que você quer encontrar?" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-gray-200 bg-white py-4 pl-14 pr-6 shadow-sm focus:border-[#6C3BFF] focus:outline-none focus:ring-1 focus:ring-[#6C3BFF] text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
          {/* Left Column - Dynamic (Categories OR Search Results) */}
          <div className="flex flex-col">
            
            {searchQuery.length > 0 || selectedTag ? (
              // Modo Busca - Exibir Resultados
              <>
                <div className="flex items-center gap-3 mb-6">
                  {selectedTag && (
                    <button
                      type="button"
                      onClick={handleBackToCategories}
                      className="flex items-center gap-1 text-sm text-[#6C3BFF] hover:text-[#5328d4] transition font-medium"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      Voltar
                    </button>
                  )}
                  <h2 className="text-xl font-bold text-[#6C3BFF]">
                    {selectedTag ? `Jogos de ${selectedTag}` : 'Resultados da sua busca'}
                  </h2>
                </div>

                {loading ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <svg className="animate-spin h-5 w-5 text-[#6C3BFF]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span>Buscando jogos...</span>
                  </div>
                ) : games.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {games.map(game => (
                      <GameResultCard
                        key={game.id}
                        game={game}
                        favorited={ratingsMap.get(game.id)?.favorited ?? false}
                        listed={ratingsMap.get(game.id)?.listed ?? false}
                        onFavorite={() => handleToggleFavorite(game)}
                        onList={() => handleToggleListed(game)}
                        onAddToList={() => setAddToListaGame(game)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    {selectedTag
                      ? `Nenhum jogo encontrado na categoria "${selectedTag}".`
                      : `Nenhum jogo encontrado para "${searchQuery}".`}
                  </p>
                )}
              </>
            ) : (
              // Modo Categorias (Padrão)
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                  {CATEGORIES.map((cat, index) => {
                    const row = Math.floor(index / 4);
                    const col = index % 4;
                    const isLight = (row + col) % 2 === 0;
                    const bgColor = isLight ? 'bg-[#5352C7]' : 'bg-[#442882]';
                    return (
                      <CategoryCard
                        key={`${cat.id}-${index}`}
                        name={cat.name}
                        bgColor={bgColor}
                        onClick={() => handleCategoryClick(cat.tag)}
                      />
                    );
                  })}
                </div>
              </>
            )}

          </div>

          {/* Right Column - Swipe Card */}
          <div className="hidden lg:block self-start sticky top-10">
            <SwipeCard />
          </div>
        </div>
      </main>

      <Footer />

      {addToListaGame && token && (
        <AddToListaModal
          token={token}
          jogoId={addToListaGame.id}
          jogoTitle={addToListaGame.title}
          onClose={() => setAddToListaGame(null)}
        />
      )}
    </div>
  );
}
