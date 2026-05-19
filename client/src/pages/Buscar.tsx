import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CATEGORIES = [
  { id: 1, name: 'Luta' },
  { id: 2, name: 'On-line' },
  { id: 3, name: 'Crime' },
  { id: 4, name: 'Clássicos' },
  { id: 5, name: 'Simulador' },
  { id: 6, name: 'Guerra' },
  { id: 7, name: 'Sobrevivência' },
  { id: 8, name: 'Histórico' },
  { id: 9, name: 'Luta' },
  { id: 10, name: 'On-line' },
  { id: 11, name: 'Crime' },
  { id: 12, name: 'Clássicos' },
  { id: 13, name: 'Simulador' },
  { id: 14, name: 'Guerra' },
  { id: 15, name: 'Sobrevivência' },
  { id: 16, name: 'Histórico' },
  { id: 17, name: 'Esportes' },
  { id: 18, name: 'Ação' },
  { id: 19, name: 'RPG' },
  { id: 20, name: 'Corrida' },
];

const MOCK_GAMES = [
  { id: 1, title: 'The Sims 4', desc: 'Solte a imaginação e crie um mundo único de Sims para se expressar! Explore e personalize cada detalhe, dos Sims às casas e muito mais.', rating: '4/5' },
  { id: 2, title: 'Dispatch', desc: 'Gerencie uma equipe de heróis e planeje quem enviar para as emergências, tudo enquanto equilibra a política do escritório, relacionamentos pessoais e sua própria jornada para se tornar um herói.', rating: '5/5' },
  { id: 3, title: 'Grand Theft Auto V', desc: 'Três criminosos com perfis completamente diferentes se unem para realizar golpes perigosos e sobreviver em uma cidade dominada pelo crime, corrupção e traição. Inspirado em Grand Theft Auto V.', rating: '5/5' },
  { id: 4, title: 'Terraria', desc: 'Em um mundo aberto repleto de mistérios, perigos e criaturas fantásticas, o jogador explora, constrói, minera e enfrenta inimigos poderosos para sobreviver e descobrir segredos escondidos em cada canto de Terraria.', rating: '3/5' },
  { id: 5, title: 'Fortnite', desc: 'Em uma ilha em constante mudança, jogadores enfrentam batalhas intensas, constroem estratégias e sobrevivem até o fim em confrontos cheios de ação e eventos dinâmicos em Fortnite.', rating: '2/5' },
  { id: 6, title: 'Ghost of Yotei', desc: 'Em uma jornada marcada por vingança e honra, uma guerreira percorre terras perigosas enfrentando inimigos implacáveis e desafios intensos em busca de seu próprio destino em Ghost of Yotei.', rating: '5/5' },
  { id: 7, title: 'Detroit: Become Human', desc: 'Em um futuro onde androides convivem com humanos, três personagens seguem caminhos distintos que colocam em jogo liberdade, preconceito e escolhas capazes de mudar o destino da sociedade em Detroit: Become Human.', rating: '5/5' },
  { id: 8, title: 'Candy Crush Saga', desc: 'Em um mundo colorido e cheio de desafios, jogadores combinam doces e resolvem quebra-cabeças cada vez mais difíceis para avançar por fases divertidas e viciantes em Candy Crush Saga.', rating: '3/5' },
];

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78a5.5 5.5 0 0 0 1.06-8.84z" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CategoryCard({ name, bgColor }: { name: string; bgColor: string }) {
  return (
    <div className={`relative h-28 overflow-hidden rounded-xl ${bgColor} shadow-sm transition hover:scale-105 hover:shadow-md cursor-pointer flex items-center`}>
      <div className="h-[90%] w-16 ml-1 bg-gradient-to-br from-blue-400 via-sky-300 to-amber-300 rounded-md shadow-inner flex-shrink-0" />
      <div className="flex-1 flex items-end justify-center pl-1 pr-1 pb-4">
        <span className="font-medium text-white tracking-wider text-sm truncate">{name}</span>
      </div>
    </div>
  );
}

function GameResultCard({ game }: { game: typeof MOCK_GAMES[0] }) {
  return (
    <div className="flex bg-white rounded-2xl p-4 shadow-sm border border-gray-100 gap-4 transition hover:shadow-md">
      {/* Imagem do Jogo (Placeholder) */}
      <div className="w-24 h-36 flex-shrink-0 rounded-xl bg-gradient-to-br from-red-400 via-pink-300 to-yellow-300 shadow-inner overflow-hidden" />
      
      <div className="flex flex-col flex-1 py-1 overflow-hidden">
        <h3 className="font-bold text-gray-900 text-sm mb-1">{game.title}</h3>
        <p className="text-[10px] text-gray-500 leading-relaxed flex-1 line-clamp-4">
          {game.desc}
        </p>
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px] font-medium text-gray-800">Nota: {game.rating}</span>
          <div className="flex gap-3 text-gray-900">
            <button className="transition hover:text-[#6C3BFF]" aria-label="Curtir jogo"><HeartIcon /></button>
            <button className="transition hover:text-[#6C3BFF]" aria-label="Salvar jogo"><BookmarkIcon /></button>
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGames = MOCK_GAMES.filter(game => 
    game.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            
            {searchQuery.length > 0 ? (
              // Modo Busca - Exibir Resultados
              <>
                <h2 className="mb-6 text-xl font-bold text-[#6C3BFF]">
                  Resultados da sua busca
                </h2>

                {filteredGames.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredGames.map(game => (
                      <GameResultCard key={game.id} game={game} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhum jogo encontrado para "{searchQuery}".</p>
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
                      <CategoryCard key={`${cat.id}-${index}`} name={cat.name} bgColor={bgColor} />
                    );
                  })}
                </div>

                <button className="mt-12 w-full rounded-full bg-[#F3F0FF] py-4 text-center font-semibold text-[#6C3BFF] transition hover:bg-[#EBE5FF]">
                  Ver mais categorias
                </button>
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
    </div>
  );
}
