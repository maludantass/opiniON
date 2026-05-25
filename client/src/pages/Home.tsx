import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  getJogos, type Jogo,
  getFeedPosts, type FeedPost,
  getPublicUsers, type PublicUser,
} from '../services/api';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
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

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function GameImage({ src, title, className = '' }: { src?: string | null; title?: string; className?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={title ?? 'Imagem do jogo'}
        className={`object-cover ${className}`}
        loading="lazy"
      />
    );
  }
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

function GameCard({ title, imageUrl, tags, releaseYear }: Jogo) {
  return (
    <div className="w-44 flex-shrink-0 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition hover:scale-[1.02] hover:shadow-md">
      <GameImage src={imageUrl} title={title} className="h-32 w-full rounded-xl" />

      <div className="mt-3">
        <p className="truncate text-sm font-semibold text-gray-900" title={title}>{title}</p>
        <p className="truncate text-xs text-gray-400">
          {tags.slice(0, 2).join(' · ') || (releaseYear ? String(releaseYear) : '—')}
        </p>

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

function ReviewCard({ post }: { post: FeedPost }) {
  const username = post.user?.username ?? post.user?.email.split('@')[0] ?? 'Usuário';
  const handle = `@${post.user?.username ?? post.user?.email.split('@')[0] ?? 'usuario'}`;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:scale-[1.01] hover:shadow-md">
      <div className="mb-4 flex items-center gap-3">
        {post.user?.avatarUrl ? (
          <img src={post.user.avatarUrl} alt={username} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <Avatar size={36} />
        )}
        <div>
          <p className="text-sm font-semibold text-gray-900">{username}</p>
          <p className="text-xs text-gray-400">{handle}</p>
        </div>
      </div>

      {post.jogo && (
        <div className="mb-4 flex gap-3">
          <GameImage src={post.jogo.imageUrl} title={post.jogo.title} className="h-16 w-16 flex-shrink-0 rounded-xl" />
          <div>
            <p className="text-sm font-semibold text-gray-900">{post.jogo.title}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {post.jogo.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="mb-1 text-sm font-semibold text-gray-900">Review</p>
      <p className="text-xs leading-relaxed text-gray-500 line-clamp-3">{post.content}</p>

      <div className="mt-4 flex gap-5 text-gray-400">
        <button type="button" aria-label="Curtir review" className="transition hover:text-[#6C3BFF]"><HeartIcon /></button>
        <button type="button" aria-label="Comentar review" className="transition hover:text-[#6C3BFF]"><ChatIcon /></button>
        <button type="button" aria-label="Salvar review" className="transition hover:text-[#6C3BFF]"><BookmarkIcon /></button>
      </div>
    </div>
  );
}

function UserCard({ user }: { user: PublicUser }) {
  const name = user.username ?? `Gamer #${user.id}`;
  return (
    <div className="flex w-32 flex-shrink-0 flex-col items-center rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:scale-[1.03] hover:shadow-md">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={name} className="h-13 w-13 rounded-full object-cover" style={{ width: 52, height: 52 }} />
      ) : (
        <Avatar size={52} />
      )}
      <p className="mt-3 text-sm font-semibold text-[#6C3BFF] truncate w-full text-center" title={name}>{name}</p>
      <p className="mb-3 text-xs text-gray-400">Gamer</p>
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
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [gamers, setGamers] = useState<PublicUser[]>([]);

  useEffect(() => {
    // Busca todos os jogos e embaralha para mostrar diferentes a cada refresh
    getJogos({ limit: 100 })
      .then((all) => setJogos(shuffle(all).slice(0, 12)))
      .catch(() => {});

    getFeedPosts(6).then(setPosts).catch(() => {});
    getPublicUsers(10).then(setGamers).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#EEEEFF]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-10">
        <div className="flex flex-col gap-12">
          <section>
            <h2 className="mb-5 text-2xl font-bold text-[#6C3BFF]">
              Jogos em destaque
            </h2>

            <div className="flex gap-5 overflow-x-auto pb-3">
              {jogos.length > 0
                ? jogos.map((game) => <GameCard key={game.id} {...game} />)
                : Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="w-44 flex-shrink-0 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm animate-pulse">
                      <div className="h-32 w-full rounded-xl bg-gray-100" />
                      <div className="mt-3 h-3 w-3/4 rounded bg-gray-100" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
                    </div>
                  ))
              }
            </div>
          </section>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
            <section>
              <h2 className="mb-5 text-2xl font-bold text-[#6C3BFF]">
                Reviews da semana
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {posts.length > 0
                  ? posts.map((post) => <ReviewCard key={post.id} post={post} />)
                  : Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-9 w-9 rounded-full bg-gray-100" />
                          <div className="h-3 w-24 rounded bg-gray-100" />
                        </div>
                        <div className="h-16 w-full rounded-xl bg-gray-100 mb-3" />
                        <div className="h-3 w-full rounded bg-gray-100 mb-2" />
                        <div className="h-3 w-3/4 rounded bg-gray-100" />
                      </div>
                    ))
                }
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
                {gamers.length > 0
                  ? gamers.map((user) => <UserCard key={user.id} user={user} />)
                  : Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="flex w-32 flex-shrink-0 flex-col items-center rounded-2xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
                        <div className="h-13 w-13 rounded-full bg-gray-100" style={{ width: 52, height: 52 }} />
                        <div className="mt-3 h-3 w-16 rounded bg-gray-100" />
                        <div className="mt-2 h-3 w-10 rounded bg-gray-100" />
                      </div>
                    ))
                }
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}