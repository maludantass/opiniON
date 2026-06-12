import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import {
  getPostById, likePost, unlikePost,
  getPostComments, createPostComment, deletePostComment,
  type FeedPost, type PostComment,
} from "../services/api";
import { HeartIcon } from "../components/icons";
import toast from "react-hot-toast";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}m atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d atrás`;
  return new Date(date).toLocaleDateString("pt-BR");
}

function CommentItem({
  comment,
  canDelete,
  onDelete,
}: {
  comment: PostComment;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const username = comment.user?.username ?? comment.user?.email?.split("@")[0] ?? "Usuário";
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
      {comment.user?.avatarUrl ? (
        <img src={comment.user.avatarUrl} alt={username} className="h-8 w-8 rounded-full object-cover shrink-0" />
      ) : (
        <div className="h-8 w-8 rounded-full bg-purple-100 text-[#6C3BFF] flex items-center justify-center text-[10px] font-bold shrink-0 select-none">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-xs font-semibold text-gray-800 truncate">{username}</p>
          <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(comment.createdAt)}</span>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="ml-auto text-[10px] text-red-400 hover:text-red-600 transition shrink-0"
            >
              Excluir
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
}

export default function PostDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [post, setPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPostById(Number(id), token)
      .then(setPost)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, token]);

  useEffect(() => {
    if (!id) return;
    setCommentsLoading(true);
    getPostComments(Number(id))
      .then(setComments)
      .catch(() => toast.error("Erro ao carregar comentários"))
      .finally(() => setCommentsLoading(false));
  }, [id]);

  useEffect(() => {
    if (window.location.hash === "#comentarios") {
      document.getElementById("comentarios")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading, commentsLoading]);

  async function handleLike() {
    if (!token || !post) {
      if (!token) { navigate("/login"); return; }
      return;
    }
    setLiking(true);
    try {
      if (post.liked) {
        await unlikePost(token, post.id);
        setPost({ ...post, liked: false, likesCount: (post.likesCount ?? 1) - 1 });
      } else {
        await likePost(token, post.id);
        setPost({ ...post, liked: true, likesCount: (post.likesCount ?? 0) + 1 });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao curtir");
    } finally {
      setLiking(false);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !post) {
      navigate("/login");
      return;
    }
    const content = newComment.trim();
    if (!content) return;

    setSubmitting(true);
    try {
      const created = await createPostComment(token, post.id, content);
      setComments((prev) => [...prev, created]);
      setNewComment("");
      setPost((prev) => prev ? { ...prev, commentsCount: (prev.commentsCount ?? 0) + 1 } : prev);
      toast.success("Comentário publicado!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao comentar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!token || !post) return;
    try {
      await deletePostComment(token, post.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setPost((prev) => prev ? { ...prev, commentsCount: Math.max(0, (prev.commentsCount ?? 1) - 1) } : prev);
      toast.success("Comentário removido");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    }
  }

  const username = post?.user?.username ?? post?.user?.email?.split("@")[0] ?? "Usuário";
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition mb-6"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Voltar
        </button>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 animate-pulse">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-gray-100" />
              <div className="flex flex-col gap-2">
                <div className="h-3 w-28 rounded bg-gray-100" />
                <div className="h-2.5 w-20 rounded bg-gray-100" />
              </div>
            </div>
            <div className="flex gap-4 mb-6">
              <div className="h-28 w-20 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 w-3/4 rounded bg-gray-100" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-5/6 rounded bg-gray-100" />
              <div className="h-3 w-4/6 rounded bg-gray-100" />
            </div>
          </div>
        ) : notFound || !post ? (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-12 text-center">
            <div className="text-4xl mb-3">😕</div>
            <p className="font-semibold text-gray-800 mb-1">Post não encontrado</p>
            <p className="text-sm text-gray-400 mb-6">Este post pode ter sido removido.</p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-6 py-2 rounded-xl bg-[#6C3BFF] text-white text-sm font-medium hover:bg-[#5b30e0] transition"
            >
              Ir para Home
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-5 border-b border-gray-100">
                {post.user?.avatarUrl ? (
                  <img
                    src={post.user.avatarUrl}
                    alt={username}
                    className="h-10 w-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-[#6C3BFF] flex items-center justify-center text-white text-sm font-bold shrink-0 select-none">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{username}</p>
                  {post.user?.username && (
                    <p className="text-xs text-gray-400">@{post.user.username.toLowerCase().replace(/\s+/g, "")}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 shrink-0">{timeAgo(post.createdAt)}</span>
              </div>

              {post.jogo && (
                <div className="flex gap-4 p-5 border-b border-gray-100">
                  {post.jogo.imageUrl ? (
                    <img
                      src={post.jogo.imageUrl}
                      alt={post.jogo.title}
                      className="h-28 w-20 rounded-xl object-cover shrink-0 shadow-sm"
                    />
                  ) : (
                    <div className="h-28 w-20 rounded-xl bg-purple-100 flex items-center justify-center text-2xl shrink-0">
                      🎮
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 leading-snug">{post.jogo.title}</p>
                    {post.rating !== null && (
                      <div className="flex items-center gap-0.5 mt-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span
                            key={i}
                            className={`text-lg leading-none ${i < post.rating! ? "text-amber-400" : "text-gray-200"}`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="ml-1.5 text-xs text-gray-500 font-medium">{post.rating}/5</span>
                      </div>
                    )}
                    {post.jogo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {post.jogo.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3F0FF] text-[#6C3BFF] font-semibold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="p-5">
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-purple-400 bg-purple-50 px-2 py-0.5 rounded-full mb-3">
                  Review
                </span>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>

              <div className="flex items-center gap-5 px-5 py-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleLike}
                  disabled={liking}
                  aria-label={post.liked ? "Descurtir post" : "Curtir post"}
                  className={`flex items-center gap-1.5 transition disabled:opacity-50 ${
                    post.liked ? "text-[#6C3BFF]" : "text-gray-400 hover:text-[#6C3BFF]"
                  }`}
                >
                  <HeartIcon filled={!!post.liked} />
                  <span className="text-xs font-semibold">{post.likesCount ?? 0}</span>
                </button>
                <span className="text-xs text-gray-400">
                  {post.commentsCount ?? comments.length} comentário{(post.commentsCount ?? comments.length) !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <section id="comentarios" className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Comentários</h2>
              </div>

              {token ? (
                <form onSubmit={handleSubmitComment} className="p-5 border-b border-gray-100">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva um comentário..."
                    rows={3}
                    maxLength={2000}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/30 resize-none"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={submitting || !newComment.trim()}
                      className="px-5 py-2 rounded-xl bg-[#6C3BFF] text-white text-sm font-semibold hover:bg-[#5b30e0] transition disabled:opacity-50"
                    >
                      {submitting ? "Publicando..." : "Comentar"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-5 border-b border-gray-100 text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-sm text-[#6C3BFF] hover:underline"
                  >
                    Faça login para comentar
                  </button>
                </div>
              )}

              <div className="px-5 py-2">
                {commentsLoading ? (
                  <div className="py-6 text-center text-sm text-gray-400 animate-pulse">Carregando comentários...</div>
                ) : comments.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    Nenhum comentário ainda. Seja o primeiro!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      canDelete={user?.id === comment.user?.id}
                      onDelete={() => handleDeleteComment(comment.id)}
                    />
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
