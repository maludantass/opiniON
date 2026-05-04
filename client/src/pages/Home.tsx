import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// ─── Dados mock ────────────────────────────────────────────────────────────────

const GAMES = [
    { id: 1, title: 'Nome do jogo', desc: 'descrição curta' },
    { id: 2, title: 'Nome do jogo', desc: 'descrição curta' },
    { id: 3, title: 'Nome do jogo', desc: 'descrição curta' },
    { id: 4, title: 'Nome do jogo', desc: 'descrição curta' },
    { id: 5, title: 'Nome do jogo', desc: 'descrição curta' },
];

const REVIEWS = [
    { id: 1, user: 'User 1', handle: '@user1perfil', game: 'Titulo do jogo', tags: ['tag 1', 'tag2', 'tag 3'], review: 'Lorem ipsum dolor sit amet consectetur. Nisl rutrum fermentum ac commodo.' },
    { id: 2, user: 'User 1', handle: '@user1perfil', game: 'Titulo do jogo', tags: ['tag 1', 'tag2', 'tag 3'], review: 'Lorem ipsum dolor sit amet consectetur. Nisl rutrum fermentum ac commodo.' },
    { id: 3, user: 'User 1', handle: '@user1perfil', game: 'Titulo do jogo', tags: ['tag 1', 'tag2', 'tag 3'], review: 'Lorem ipsum dolor sit amet consectetur. Nisl rutrum fermentum ac commodo.' },
    { id: 4, user: 'User 1', handle: '@user1perfil', game: 'Titulo do jogo', tags: ['tag 1', 'tag2', 'tag 3'], review: 'Lorem ipsum dolor sit amet consectetur. Nisl rutrum fermentum ac commodo.' },
    { id: 5, user: 'User 1', handle: '@user1perfil', game: 'Titulo do jogo', tags: ['tag 1', 'tag2', 'tag 3'], review: 'Lorem ipsum dolor sit amet consectetur. Nisl rutrum fermentum ac commodo.' },
    { id: 6, user: 'User 1', handle: '@user1perfil', game: 'Titulo do jogo', tags: ['tag 1', 'tag2', 'tag 3'], review: 'Lorem ipsum dolor sit amet consectetur. Nisl rutrum fermentum ac commodo.' },
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

// ─── Ícones ─────────────────────────────────────────────────────────────────

function HeartIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
    );
}

function BookmarkIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
    );
}

function ChatIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
    );
}

// ─── Placeholder jogo ─────────────────────────────────────────

function GameImage({ className = '' }: { className?: string }) {
    return (
        <div
            role="img"
            aria-label="Imagem do jogo"
            className={`bg-gradient-to-br from-sky-300 via-blue-400 to-amber-300 relative overflow-hidden ${className}`}
        />
    );
}

// ─── Avatar ───────────────────────────────────────────────────

function Avatar({ size = 32 }: { size?: number }) {
    return (
        <div
            role="img"
            aria-label="Avatar do usuário"
            className="rounded-full bg-gray-300"
            style={{ width: size, height: size }}
        />
    );
}

// ─── GameCard ─────────────────────────────────────────────────

function GameCard({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border p-2 w-36 flex-shrink-0">
            <GameImage className="rounded-lg w-full h-28" />

            <div className="mt-2 px-1">
                <p className="font-semibold text-sm truncate">{title}</p>
                <p className="text-gray-400 text-xs truncate">{desc}</p>

                <div className="flex gap-3 mt-2 text-gray-400">
                    <button type="button" aria-label="Curtir jogo">
                        <HeartIcon />
                    </button>

                    <button type="button" aria-label="Salvar jogo">
                        <BookmarkIcon />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── ReviewCard ───────────────────────────────────────────────

function ReviewCard({ user, handle, game, tags, review }: any) {
    return (
        <div className="bg-white rounded-xl shadow-sm border p-4">

            <div className="flex items-center gap-2 mb-3">
                <Avatar size={32} />
                <div>
                    <p className="font-semibold text-sm">{user}</p>
                    <p className="text-gray-400 text-xs">{handle}</p>
                </div>
            </div>

            <div className="flex gap-3 mb-3">
                <GameImage className="w-16 h-16 rounded-lg" />

                <div>
                    <p className="font-semibold text-sm">{game}</p>

                    <div className="flex flex-wrap gap-1 mt-1">
                        {tags.map((tag: string, i: number) => (
                            <span key={i} className="border rounded-full px-2 text-xs">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <p className="font-semibold text-sm mb-1">Review</p>
            <p className="text-xs text-gray-500">{review}</p>

            <div className="flex gap-4 mt-3 text-gray-400">
                <button type="button" aria-label="Curtir review">
                    <HeartIcon />
                </button>

                <button type="button" aria-label="Comentar review">
                    <ChatIcon />
                </button>

                <button type="button" aria-label="Salvar review">
                    <BookmarkIcon />
                </button>
            </div>
        </div>
    );
}

// ─── UserCard ─────────────────────────────────────────────────

function UserCard({ name, type }: { name: string; type: string }) {
    return (
        <div className="flex flex-col items-center p-4 border rounded-xl bg-white shadow-sm w-28 flex-shrink-0">
            <Avatar size={52} />

            <p className="text-purple-700 font-semibold text-sm mt-2">{name}</p>
            <p className="text-gray-400 text-xs mb-2">{type}</p>

            <button
                type="button"
                aria-label="Seguir usuário"
                className="border border-purple-600 text-purple-600 text-xs px-4 py-1 rounded-full"
            >
                Seguir
            </button>
        </div>
    );
}

// ─── SwipeCard ───────────────────────────────────────────────

function SwipeCard() {
    return (
        <div className="bg-gray-950 rounded-2xl p-6 h-full min-h-[520px] sticky top-4">
            <h2 className="text-white text-2xl font-bold mb-6">
                Descubra novos jogos incríveis com o nosso Swipe
            </h2>

            <button
                type="button"
                aria-label="Ir para o Swipe"
                className="bg-gray-200 text-sm px-5 py-2 rounded-full"
            >
                Ir para o Swipe agora
            </button>
        </div>
    );
}

// ─── Home ───────────────────────────────────────────────────

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            <Navbar />

            <main className="flex gap-6 px-8 py-8 max-w-[1200px] mx-auto w-full flex-1">

                <div className="flex-1 flex flex-col gap-10">

                    <section>
                        <h2 className="text-purple-700 text-2xl font-bold mb-4">
                            Jogos em destaque
                        </h2>

                        <div className="flex gap-4 overflow-x-auto">
                            {GAMES.map(game => (
                                <GameCard key={game.id} {...game} />
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-purple-700 text-2xl font-bold mb-4">
                            Reviews da semana
                        </h2>

                        <div className="grid grid-cols-3 gap-4">
                            {REVIEWS.map(r => (
                                <ReviewCard key={r.id} {...r} />
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-purple-700 text-2xl font-bold mb-4">
                            Conheça mais gamers »
                        </h2>

                        <div className="bg-white rounded-xl border shadow-sm p-4">
                            <div className="flex gap-4 overflow-x-auto">
                                {GAMERS.map(g => (
                                    <UserCard key={g.id} {...g} />
                                ))}
                            </div>
                        </div>
                    </section>

                </div>

                <div className="w-64 flex-shrink-0">
                    <SwipeCard />
                </div>

            </main>

            <Footer />

        </div>
    );
}