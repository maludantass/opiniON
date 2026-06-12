import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import { ReviewCard } from "./Home";
import {
  getFollowingFeed, getFollowingTrending, getMyFollowing,
  likePost, unlikePost,
  type FeedPost, type TrendingGame, type PublicUser,
} from "../services/api";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------------
// Sidebar widgets
// ---------------------------------------------------------------------------
function CriarPublicacaoWidget() {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="font-bold text-gray-900 mb-4">Criar publicação</p>
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Compartilhe experiências com seus amigos!
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate("/publicacao")}
        className="w-full rounded-xl bg-[#6C3BFF] py-2.5 text-sm font-semibold text-white hover:bg-[#5b30e0] transition"
      >
        Publicar
      </button>
    </div>
  );
}

function AmigosWidget({ users }: { users: PublicUser[] }) {
  if (users.length === 0) return null;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="font-bold text-gray-900 mb-4">Quem você segue</p>
      <div className="flex flex-col gap-3">
        {users.map((u) => {
          const name = u.username ?? `Usuário #${u.id}`;
          const initials = name.slice(0, 2).toUpperCase();
          return (
            <div key={u.id} className="flex items-center gap-3">
              <div className="shrink-0">
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt={name} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-purple-100 text-[#6C3BFF] flex items-center justify-center text-[11px] font-bold select-none">
                    {initials}
                  </div>
                )}
              </div>
              <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmAltaWidget({ games }: { games: TrendingGame[] }) {
  if (games.length === 0) return null;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="font-bold text-gray-900 mb-4">Em alta nos amigos</p>
      <div className="flex flex-col gap-4">
        {games.map((g, i) => (
          <div key={g.id} className="flex items-center gap-3">
            <span className="text-xl font-bold text-gray-200 w-5 shrink-0 leading-none">{i + 1}</span>
            {g.imageUrl ? (
              <img src={g.imageUrl} alt={g.title} className="h-10 w-8 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="h-10 w-8 rounded-lg bg-gradient-to-br from-[#E8DFFF] to-[#A58BDE] shrink-0" />
            )}
            <p className="text-xs font-semibold text-gray-800 leading-snug">{g.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Seguindo() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<PublicUser[]>([]);
  const [trending, setTrending] = useState<TrendingGame[]>([]);

  useEffect(() => {
    if (!token || !user?.id) return;
    setLoading(true);
    Promise.all([
      getFollowingFeed(token),
      getMyFollowing(token, user.id),
      getFollowingTrending(token),
    ])
      .then(([feedPosts, followingUsers, trendingGames]) => {
        setPosts(feedPosts);
        setFriends(followingUsers);
        setTrending(trendingGames);
      })
      .catch(() => toast.error("Erro ao carregar feed"))
      .finally(() => setLoading(false));
  }, [token, user?.id]);

  const handleToggleLike = async (postId: number) => {
    if (!token) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const isLiked = post.liked ?? false;
    const prevCount = post.likesCount ?? 0;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !isLiked, likesCount: isLiked ? Math.max(0, prevCount - 1) : prevCount + 1 }
          : p
      )
    );
    try {
      if (isLiked) await unlikePost(token, postId);
      else await likePost(token, postId);
    } catch {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, liked: isLiked, likesCount: prevCount } : p))
      );
      toast.error("Erro ao curtir");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#EEEEFF]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
          {/* Feed */}
          <section>
            <h1 className="text-3xl font-bold text-[#6C3BFF] mb-1">
              Feed
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              Veja o que quem você segue está jogando e comentando
            </p>

            {loading ? (
              <div className="flex flex-col gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-9 w-9 rounded-full bg-gray-100" />
                      <div className="h-3 w-28 rounded bg-gray-100" />
                    </div>
                    <div className="flex gap-3 mb-3">
                      <div className="h-16 w-16 rounded-xl bg-gray-100 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 rounded bg-gray-100" />
                        <div className="h-3 w-1/2 rounded bg-gray-100" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-gray-100" />
                      <div className="h-3 w-5/6 rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                <p className="text-4xl mb-3">👥</p>
                <p className="font-semibold text-gray-800 mb-1">
                  Nada por aqui ainda
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  Siga outros gamers para ver as postagens deles aqui.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/comunidade")}
                  className="px-6 py-2 rounded-xl bg-[#6C3BFF] text-white text-sm font-semibold hover:bg-[#5b30e0] transition"
                >
                  Encontrar gamers
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {posts.map((post) => (
                  <ReviewCard
                    key={post.id}
                    post={post}
                    favorited={post.liked ?? false}
                    onFavorite={() => handleToggleLike(post.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col gap-5">
            <CriarPublicacaoWidget />
            <AmigosWidget users={friends} />
            <EmAltaWidget games={trending} />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
