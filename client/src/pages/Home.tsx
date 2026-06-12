import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { HeartIcon, BookmarkIcon, ChatIcon } from '../components/icons';
import { useAuth } from '../contexts/AuthContext';
import {
  getJogos, type Jogo,
  getFeedPosts, type FeedPost,
  getPublicUsers, type PublicUser,
  getMyRatings, upsertRating, type UserRating,
  followUser, unfollowUser,
  likePost, unlikePost,
} from '../services/api';

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



function GameCard({
  title, imageUrl, description,
  favorited = false, listed = false,
  onFavorite, onList,
}: Jogo & { favorited?: boolean; listed?: boolean; onFavorite?: () => void; onList?: () => void }) {
  return (
    <div className="w-44 flex-shrink-0 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition hover:scale-[1.02] hover:shadow-md">
      <GameImage src={imageUrl} title={title} className="h-32 w-full rounded-xl" />

      <div className="mt-3">
        <p className="truncate text-sm font-semibold text-gray-900" title={title}>{title}</p>
        <p className="truncate text-xs text-gray-400">
          {description || 'descrição curta'}
        </p>

        <div className="mt-3 flex gap-4">
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
            aria-label={listed ? "Remover da lista" : "Salvar jogo"}
            className={`transition ${listed ? "text-[#6C3BFF]" : "text-gray-400 hover:text-[#6C3BFF]"}`}
          >
            <BookmarkIcon filled={listed} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReviewCard({
  post,
  favorited = false,
  listed = false,
  onFavorite,
  onList,
}: {
  post: FeedPost;
  favorited?: boolean;
  listed?: boolean;
  onFavorite?: () => void;
  onList?: () => void;
}) {
  const navigate = useNavigate();
  const username = post.user?.username ?? post.user?.email.split('@')[0] ?? 'Usuário';
  const handle = `@${post.user?.username ?? post.user?.email.split('@')[0] ?? 'usuario'}`;
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:scale-[1.01] hover:shadow-md cursor-pointer"
      onClick={() => navigate(`/posts/${post.id}`)}
    >
      <div className="mb-4 flex items-center gap-3">
        {post.user?.avatarUrl ? (
          <img src={post.user.avatarUrl} alt={username} className="h-9 w-9 rounded-full object-cover shadow-sm" />
        ) : (
          <div className="h-9 w-9 rounded-full bg-purple-100 text-[#6C3BFF] flex items-center justify-center font-bold text-xs select-none shadow-sm">
            {initials}
          </div>
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
            {post.rating !== null && (
              <div className="flex gap-0.5 text-amber-500 text-xs mt-1" aria-label={`Avaliação: ${post.rating} de 5`}>
                {Array.from({ length: 5 }, (_, idx) => (
                  <span key={idx} className="text-base leading-none">{idx < post.rating! ? "★" : "☆"}</span>
                ))}
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-1">
              {post.jogo.tags && post.jogo.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="rounded-full border border-[#6C3BFF]/25 bg-white px-2 py-0.5 text-[10px] font-semibold text-[#6C3BFF]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="mb-1 text-sm font-semibold text-gray-900">Review</p>
      <p className="text-xs leading-relaxed text-gray-500 line-clamp-3">{post.content}</p>

      <div className="mt-4 flex gap-5" onClick={(e) => e.stopPropagation()}>
        {onFavorite ? (
          <button
            type="button"
            onClick={onFavorite}
            aria-label={favorited ? "Descurtir review" : "Curtir review"}
            className={`transition flex items-center gap-1.5 ${favorited ? "text-[#6C3BFF]" : "text-gray-400 hover:text-[#6C3BFF]"}`}
          >
            <HeartIcon filled={favorited} />
            <span className="text-xs font-semibold">{post.likesCount ?? 0}</span>
          </button>
        ) : (
          <span className="text-gray-200 flex items-center gap-1.5">
            <HeartIcon />
            <span className="text-xs font-semibold text-gray-300">{post.likesCount ?? 0}</span>
          </span>
        )}
        <button
          type="button"
          onClick={() => navigate(`/posts/${post.id}#comentarios`)}
          aria-label="Ver comentários"
          className="text-gray-400 hover:text-[#6C3BFF] transition flex items-center gap-1.5"
        >
          <ChatIcon />
          <span className="text-xs font-semibold">{post.commentsCount ?? 0}</span>
        </button>
        {post.jogo && onList ? (
          <button
            type="button"
            onClick={onList}
            aria-label={listed ? "Remover da lista" : "Salvar jogo"}
            className={`transition ${listed ? "text-[#6C3BFF]" : "text-gray-400 hover:text-[#6C3BFF]"}`}
          >
            <BookmarkIcon filled={listed} />
          </button>
        ) : (
          <span className="text-gray-200"><BookmarkIcon /></span>
        )}
      </div>
    </div>
  );
}

function ConnectGamersCard() {
  const navigate = useNavigate();
  return (
    <div className="flex w-32 flex-shrink-0 flex-col items-center justify-between rounded-2xl bg-[#442882] p-4 shadow-sm text-center min-h-[190px]">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white mt-1">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <p className="text-xs font-bold text-white leading-snug px-1">
        Conecte-se com outros usuários
      </p>
      <button
        type="button"
        onClick={() => navigate('/buscar')}
        className="rounded-full bg-white px-4 py-1.5 text-[10px] font-bold text-[#442882] hover:bg-gray-100 transition w-full mb-1 shadow-sm"
      >
        Ir agora
      </button>
    </div>
  );
}

function UserCard({
  user,
  isFollowing,
  onFollow,
}: {
  user: PublicUser;
  isFollowing: boolean;
  onFollow: () => void;
}) {
  const name = user.username ?? `Gamer #${user.id}`;
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="flex w-32 flex-shrink-0 flex-col items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:scale-[1.03] hover:shadow-md min-h-[190px]">
      <div className="flex flex-col items-center w-full">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={name} className="rounded-full object-cover" style={{ width: 52, height: 52 }} />
        ) : (
          <div className="h-[52px] w-[52px] rounded-full bg-purple-100 text-[#6C3BFF] flex items-center justify-center font-bold text-sm select-none shadow-sm">
            {initials}
          </div>
        )}
        <p className="mt-3 text-sm font-semibold text-[#6C3BFF] truncate w-full text-center" title={name}>{name}</p>
        <p className="text-[10px] text-gray-400">Gamer</p>
      </div>
      <button
        type="button"
        onClick={onFollow}
        aria-label={isFollowing ? "Deixar de seguir" : "Seguir usuário"}
        className={`rounded-full border px-4 py-1 text-xs transition w-full mt-3 font-semibold ${
          isFollowing
            ? "border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-500"
            : "border-[#6C3BFF] text-[#6C3BFF] hover:bg-[#6C3BFF] hover:text-white"
        }`}
      >
        {isFollowing ? "Seguindo" : "Seguir"}
      </button>
    </div>
  );
}

function SwipeCard() {
  const navigate = useNavigate();
  return (
    <aside className="flex min-h-[620px] flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-b from-[#10101E] to-black p-7 shadow-xl">
      <div>
        <h2 className="text-3xl font-bold leading-tight text-white">
          Descubra novos jogos incríveis com o nosso Swipe
        </h2>

        <button
          type="button"
          onClick={() => navigate("/swipe")}
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
  const { token, user: currentUser } = useAuth();
  const location = useLocation();
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [gamers, setGamers] = useState<PublicUser[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Map<number, UserRating>>(new Map());
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());

  const [showBanner, setShowBanner] = useState(false);
  const [bannerTitle, setBannerTitle] = useState('');

  useEffect(() => {
    if (location.state?.publishedGameTitle) {
      setBannerTitle(location.state.publishedGameTitle);
      setShowBanner(true);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setShowBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    const currentUserId: number | null = currentUser?.id ?? null;

    getJogos({ limit: 12 })
      .then(setJogos)
      .catch(() => {});
    getFeedPosts(token, 6).then(setPosts).catch(() => {});

    getPublicUsers(20)
      .then((all) => setGamers(currentUserId ? all.filter((u) => u.id !== currentUserId).slice(0, 10) : all.slice(0, 10)))
      .catch(() => {});
  }, [currentUser?.id, token]);

  useEffect(() => {
    if (!token) return;
    getMyRatings(token)
      .then((ratings) => {
        const map = new Map<number, UserRating>();
        ratings.forEach((r) => map.set(r.jogoId, r));
        setRatingsMap(map);
      })
      .catch(() => {});
  }, []);

  const handleToggle = async (jogoId: number, field: 'favorited' | 'listed') => {
    if (!token) return;
    const current = ratingsMap.get(jogoId);
    const newVal = !(current?.[field] ?? false);
    setRatingsMap((prev) => {
      const next = new Map(prev);
      next.set(jogoId, { ...(current ?? { id: 0, userId: 0, jogoId, rating: null, favorited: false, listed: false, played: false, category: null }), [field]: newVal });
      return next;
    });
    try {
      const updated = await upsertRating(token, jogoId, { [field]: newVal });
      setRatingsMap((prev) => { const next = new Map(prev); next.set(jogoId, updated); return next; });
      if (field === 'favorited') toast.success(newVal ? 'Jogo curtido!' : 'Curtida removida');
      else toast.success(newVal ? 'Jogo salvo na lista!' : 'Removido da lista');
    } catch {
      setRatingsMap((prev) => {
        const next = new Map(prev);
        if (current) next.set(jogoId, current); else next.delete(jogoId);
        return next;
      });
      toast.error('Erro ao atualizar jogo');
    }
  };

  const handleFollow = async (userId: number) => {
    if (!token) return;
    const isFollowing = followingIds.has(userId);
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (isFollowing) next.delete(userId); else next.add(userId);
      return next;
    });
    try {
      if (isFollowing) {
        await unfollowUser(token, userId);
        toast.success('Deixou de seguir');
      } else {
        await followUser(token, userId);
        toast.success('Seguindo!');
      }
    } catch {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (isFollowing) next.add(userId); else next.delete(userId);
        return next;
      });
      toast.error('Erro ao atualizar follow');
    }
  };

  const handleTogglePostLike = async (postId: number) => {
    if (!token) {
      toast.error('Você precisa estar logado para curtir uma review');
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const isLiked = post.liked ?? false;
    const currentLikesCount = post.likesCount ?? 0;

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            liked: !isLiked,
            likesCount: isLiked ? Math.max(0, currentLikesCount - 1) : currentLikesCount + 1,
          };
        }
        return p;
      })
    );

    try {
      if (isLiked) {
        await unlikePost(token, postId);
        toast.success('Curtida removida da review');
      } else {
        await likePost(token, postId);
        toast.success('Review curtida!');
      }
    } catch {
      // Revert optimistic update
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              liked: isLiked,
              likesCount: currentLikesCount,
            };
          }
          return p;
        })
      );
      toast.error('Erro ao atualizar curtida da review');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#EEEEFF]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-10">
        <div className="flex flex-col gap-12">
          <section>
            <h2 className="mb-5 text-2xl font-bold text-[#6C3BFF]">
              Jogos em destaque
            </h2>

            {showBanner && (
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700 shadow-sm transition-all duration-500">
                <span>✓</span>
                <span>“{bannerTitle}” foi adicionado a seus reviews!</span>
              </div>
            )}

            <div className="flex gap-5 overflow-x-auto pb-3">
              {jogos.length > 0
                ? jogos.map((game) => (
                    <GameCard
                      key={game.id}
                      {...game}
                      favorited={ratingsMap.get(game.id)?.favorited ?? false}
                      listed={ratingsMap.get(game.id)?.listed ?? false}
                      onFavorite={() => handleToggle(game.id, 'favorited')}
                      onList={() => handleToggle(game.id, 'listed')}
                    />
                  ))
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
                  ? posts.map((post) => (
                      <ReviewCard
                        key={post.id}
                        post={post}
                        favorited={post.liked ?? false}
                        listed={post.jogo ? (ratingsMap.get(post.jogo.id)?.listed ?? false) : false}
                        onFavorite={() => handleTogglePostLike(post.id)}
                        onList={post.jogo ? () => handleToggle(post.jogo!.id, 'listed') : undefined}
                      />
                    ))
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
                <ConnectGamersCard />
                {gamers.length > 0
                  ? gamers.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        isFollowing={followingIds.has(user.id)}
                        onFollow={() => handleFollow(user.id)}
                      />
                    ))
                  : Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex w-32 flex-shrink-0 flex-col items-center rounded-2xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
                        <div className="rounded-full bg-gray-100" style={{ width: 52, height: 52 }} />
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