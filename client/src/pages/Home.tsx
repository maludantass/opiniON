import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const GAMES = [
  { id: 1, title: 'Nome do jogo', desc: 'descrição curta' },
  { id: 2, title: 'Nome do jogo', desc: 'descrição curta' },
  { id: 3, title: 'Nome do jogo', desc: 'descrição curta' },
  { id: 4, title: 'Nome do jogo', desc: 'descrição curta' },
  { id: 5, title: 'Nome do jogo', desc: 'descrição curta' },
  { id: 6, title: 'Nome do jogo', desc: 'descrição curta' },
];

const REVIEWS = [
  {
    id: 1,
    user: 'User 1',
    handle: '@user1perfil',
    game: 'Título do jogo',
    tags: ['tag 1', 'tag2', 'tag 3'],
    review: 'Lorem ipsum dolor sit amet consectetur. Nisl rutrum fermentum ac commodo.',
  },
  {
    id: 2,
    user: 'User 1',
    handle: '@user1perfil',
    game: 'Título do jogo',
    tags: ['tag 1', 'tag2', 'tag 3'],
    review: 'Lorem ipsum dolor sit amet consectetur. Nisl rutrum fermentum ac commodo.',
  },
  {
    id: 3,
    user: 'User 1',
    handle: '@user1perfil',
    game: 'Título do jogo',
    tags: ['tag 1', 'tag2', 'tag 3'],
    review: 'Lorem ipsum dolor sit amet consectetur. Nisl rutrum fermentum ac commodo.',
  },
  {
    id: 4,
    user: 'User 1',
    handle: '@user1perfil',
    game: 'Título do jogo',
    tags: ['tag 1', 'tag2', 'tag 3'],
    review: 'Lorem ipsum dolor sit amet consectetur. Nisl rutrum fermentum ac commodo.',
  },
  {
    id: 5,
    user: 'User 1',
    handle: '@user1perfil',
    game: 'Título do jogo',
    tags: ['tag 1', 'tag2', 'tag 3'],
    review: 'Lorem ipsum dolor sit amet consectetur. Nisl rutrum fermentum ac commodo.',
  },
  {
    id: 6,
    user: 'User 1',
    handle: '@user1perfil',
    game: 'Título do jogo',
    tags: ['tag 1', 'tag2', 'tag 3'],
    review: 'Lorem ipsum dolor sit amet consectetur. Nisl rutrum fermentum ac commodo.',
  },
];

const GAMERS = [
  { id: 1, name: 'User', type: 'User' },
  { id: 2, name: 'User', type: 'User' },
  { id: 3, name: 'User', type: 'User' },
  { id: 4, name: 'User', type: 'User' },
  { id: 5, name: 'User', type: 'User' },
  { id: 6, name: 'User', type: 'User' },
  { id: 7, name: 'User', type: 'User' },
];

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

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function GameImage({ className = '' }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Imagem do jogo"
      className={`bg-gradient-to-br from-sky-300 via-blue-400 to-amber-300 ${className}`}
    />
  );
}

function Avatar({ size = 36 }: { size?: number }) {
  return (
    <div
      role="img"
      aria-label="Avatar do usuário"
      className="rounded-full bg-gray-300"
      style={{ width: size, height: size }}
    />
  );
}

function GameCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="w-44 flex-shrink-0 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition hover:scale-[1.02] hover:shadow-md">
      <GameImage className="h-32 w-full rounded-xl" />

      <div className="mt-3">
        <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
        <p className="truncate text-xs text-gray-400">{desc}</p>

        <div className="mt-3 flex gap-4 text-gray-400">
          <button type="button" aria-label="Curtir jogo" className="transition hover:text-[#6C3BFF]">
            <HeartIcon />
          </button>

          <button type="button" aria-label="Salvar jogo" className="transition hover:text-[#6C3BFF]">
            <BookmarkIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ user, handle, game, tags, review }: { user: string; handle: string; game: string; tags: string[]; review: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:scale-[1.01] hover:shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <Avatar size={36} />

        <div>
          <p className="text-sm font-semibold text-gray-900">{user}</p>
          <p className="text-xs text-gray-400">{handle}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-3">
        <GameImage className="h-16 w-16 flex-shrink-0 rounded-xl" />

        <div>
          <p className="text-sm font-semibold text-gray-900">{game}</p>

          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag: string, i: number) => (
              <span
                key={i}
                className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="mb-1 text-sm font-semibold text-gray-900">Review</p>
      <p className="text-xs leading-relaxed text-gray-500">{review}</p>

      <div className="mt-4 flex gap-5 text-gray-400">
        <button type="button" aria-label="Curtir review" className="transition hover:text-[#6C3BFF]">
          <HeartIcon />
        </button>

        <button type="button" aria-label="Comentar review" className="transition hover:text-[#6C3BFF]">
          <ChatIcon />
        </button>

        <button type="button" aria-label="Salvar review" className="transition hover:text-[#6C3BFF]">
          <BookmarkIcon />
        </button>
      </div>
    </div>
  );
}

function UserCard({ name, type }: { name: string; type: string }) {
  return (
    <div className="flex w-32 flex-shrink-0 flex-col items-center rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:scale-[1.03] hover:shadow-md">
      <Avatar size={52} />

      <p className="mt-3 text-sm font-semibold text-[#6C3BFF]">{name}</p>
      <p className="mb-3 text-xs text-gray-400">{type}</p>

      <button
        type="button"
        aria-label="Seguir usuário"
        className="rounded-full border border-[#6C3BFF] px-4 py-1 text-xs text-[#6C3BFF] transition hover:bg-[#6C3BFF] hover:text-white"
      >
        Seguir
      </button>
    </div>
  );
}

function SwipeCard() {
  return (
    <aside className="flex min-h-[620px] flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-b from-[#10101E] to-black p-7 shadow-xl">
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

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-10">
        <div className="flex flex-col gap-12">
          <section>
            <h2 className="mb-5 text-2xl font-bold text-[#6C3BFF]">
              Jogos em destaque
            </h2>

            <div className="flex gap-5 overflow-x-auto pb-3">
              {GAMES.map((game) => (
                <GameCard key={game.id} {...game} />
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
            <section>
              <h2 className="mb-5 text-2xl font-bold text-[#6C3BFF]">
                Reviews da semana
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {REVIEWS.map((review) => (
                  <ReviewCard key={review.id} {...review} />
                ))}
              </div>
            </section>

            <div className="hidden lg:block">
              <SwipeCard />
            </div>
          </div>

          <section>
            <h2 className="mb-5 text-2xl font-bold text-[#6C3BFF]">
              Conheça mais gamers »
            </h2>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex gap-5 overflow-x-auto pb-2">
                {GAMERS.map((gamer) => (
                  <UserCard key={gamer.id} {...gamer} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}