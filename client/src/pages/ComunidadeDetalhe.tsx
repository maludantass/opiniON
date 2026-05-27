import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import {
  getCommunityById,
  getCommunityPosts,
  createCommunityPost,
  deleteCommunityPost,
  getCommunityEvents,
  createCommunityEvent,
  rsvpEvent,
  unrsvpEvent,
  getCommunityChallenge,
  createCommunityChallenge,
  contributeToChallenge,
  getCommunityMembers,
  leaveCommunity,
  deleteCommunity,
  updateCommunity,
  joinCommunity,
  sendCommunityInvite,
  getFollowing,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  type Community,
  type CommunityPost,
  type CommunityEvent,
  type CommunityChallenge,
  type CommunityMember,
  type PublicFollowUser,
  type CommunityPendingRequest,
} from "../services/api";

type Tab = "feed" | "eventos" | "desafios" | "membros" | "solicitacoes";

const TYPE_LABEL: Record<string, string> = { public: "Pública", private: "Privada", invite: "Por convite" };

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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDateOnly(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ComunidadeDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const communityId = Number(id);
  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(localStorage.getItem("user") ?? "null"); } catch { return null; } })();
  const currentUserId: number | null = user?.id ?? null;

  const [community, setCommunity] = useState<Community | null>(null);
  const [tab, setTab] = useState<Tab>("feed");
  const [loadingCommunity, setLoadingCommunity] = useState(true);

  // Feed
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);

  // Events
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [submittingEvent, setSubmittingEvent] = useState(false);

  // Challenges
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDesc, setChallengeDesc] = useState("");
  const [challengeGoal, setChallengeGoal] = useState("10");
  const [challengeStart, setChallengeStart] = useState("");
  const [challengeEnd, setChallengeEnd] = useState("");
  const [submittingChallenge, setSubmittingChallenge] = useState(false);

  // Members
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Pending Requests (Moderator only)
  const [pendingRequests, setPendingRequests] = useState<CommunityPendingRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showInviteCode, setShowInviteCode] = useState(false);

  // Invite followers modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [followingList, setFollowingList] = useState<PublicFollowUser[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<number>>(new Set());
  const [invitingId, setInvitingId] = useState<number | null>(null);

  const isOwner = community?.ownerId === currentUserId;
  const isMember = community?.memberStatus === "active";
  const canInteract = isMember || isOwner;

  const handleOpenInviteModal = async () => {
    if (!token || !currentUserId) { navigate("/login"); return; }
    setShowInviteModal(true);
    if (followingList.length > 0) return;
    setLoadingFollowing(true);
    try {
      const res = await getFollowing(currentUserId, { limit: 100 });
      setFollowingList(res.items);
    } catch {
      toast.error("Erro ao carregar lista de seguidores");
    } finally {
      setLoadingFollowing(false);
    }
  };

  const handleSendInvite = async (inviteeId: number) => {
    if (!token) return;
    setInvitingId(inviteeId);
    try {
      await sendCommunityInvite(token, communityId, inviteeId);
      setInvitedIds((prev) => new Set(prev).add(inviteeId));
      toast.success("Convite enviado!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar convite");
    } finally {
      setInvitingId(null);
    }
  };

  const loadCommunity = useCallback(async () => {
    setLoadingCommunity(true);
    try {
      const c = await getCommunityById(communityId, token ?? undefined);
      setCommunity(c);
      if (c.ownerId === currentUserId && token) {
        getPendingRequests(token, communityId).then(setPendingRequests).catch(() => {});
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Comunidade não encontrada");
      navigate("/comunidades");
    } finally {
      setLoadingCommunity(false);
    }
  }, [communityId, token, navigate, currentUserId]);

  useEffect(() => { loadCommunity(); }, [loadCommunity]);

  useEffect(() => {
    if (!community) return;
    if (tab === "feed") {
      setLoadingPosts(true);
      getCommunityPosts(communityId, token ?? undefined)
        .then(setPosts)
        .catch(() => {})
        .finally(() => setLoadingPosts(false));
    } else if (tab === "eventos") {
      setLoadingEvents(true);
      getCommunityEvents(communityId, token ?? undefined)
        .then(setEvents)
        .catch(() => {})
        .finally(() => setLoadingEvents(false));
    } else if (tab === "desafios") {
      setLoadingChallenges(true);
      getCommunityChallenge(communityId, token ?? undefined)
        .then(setChallenges)
        .catch(() => {})
        .finally(() => setLoadingChallenges(false));
    } else if (tab === "membros") {
      setLoadingMembers(true);
      getCommunityMembers(communityId, token ?? undefined)
        .then(setMembers)
        .catch(() => {})
        .finally(() => setLoadingMembers(false));
    } else if (tab === "solicitacoes" && isOwner) {
      setLoadingRequests(true);
      getPendingRequests(token!, communityId)
        .then(setPendingRequests)
        .catch(() => {})
        .finally(() => setLoadingRequests(false));
    }
  }, [tab, community, communityId, token, isOwner]);

  const handleApproveRequest = async (userId: number) => {
    if (!token) return;
    try {
      await approveRequest(token, communityId, userId);
      setPendingRequests((prev) => prev.filter((r) => r.userId !== userId));
      toast.success("Solicitação aprovada!");
      if (tab === "membros") {
        getCommunityMembers(communityId, token ?? undefined).then(setMembers).catch(() => {});
      }
      setCommunity((prev) => prev ? { ...prev, memberCount: prev.memberCount + 1 } : null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao aprovar");
    }
  };

  const handleRejectRequest = async (userId: number) => {
    if (!token) return;
    try {
      await rejectRequest(token, communityId, userId);
      setPendingRequests((prev) => prev.filter((r) => r.userId !== userId));
      toast.success("Solicitação rejeitada.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao rejeitar");
    }
  };

  const handleJoin = async () => {
    if (!token) { navigate("/login"); return; }
    try {
      await joinCommunity(token, communityId);
      toast.success(community?.type === "private" ? "Solicitação enviada!" : "Você entrou na comunidade!");
      loadCommunity();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar");
    }
  };

  const handleLeave = async () => {
    if (!token || !window.confirm("Deseja sair desta comunidade?")) return;
    try {
      await leaveCommunity(token, communityId);
      toast.success("Você saiu da comunidade.");
      navigate("/comunidades");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao sair");
    }
  };

  const handleDelete = async () => {
    if (!token || !window.confirm("Tem certeza que quer encerrar esta comunidade? Essa ação é irreversível.")) return;
    try {
      await deleteCommunity(token, communityId);
      toast.success("Comunidade encerrada.");
      navigate("/comunidades");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao encerrar");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingEdit(true);
    try {
      const updated = await updateCommunity(token, communityId, {
        name: editName,
        description: editDesc || null,
        imageUrl: editImageUrl || null,
      });
      setCommunity(updated);
      setShowEditModal(false);
      toast.success("Comunidade atualizada!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSavingEdit(false);
    }
  };

  const openEditModal = () => {
    if (!community) return;
    setEditName(community.name);
    setEditDesc(community.description ?? "");
    setEditImageUrl(community.imageUrl ?? "");
    setShowEditModal(true);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !postContent.trim()) return;
    setSubmittingPost(true);
    try {
      const post = await createCommunityPost(token, communityId, { content: postContent.trim() });
      setPosts([post, ...posts]);
      setPostContent("");
      toast.success("Publicado!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao publicar");
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!token || !window.confirm("Excluir publicação?")) return;
    try {
      await deleteCommunityPost(token, communityId, postId);
      setPosts(posts.filter((p) => p.id !== postId));
      toast.success("Post excluído.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmittingEvent(true);
    try {
      const evt = await createCommunityEvent(token, communityId, {
        title: eventTitle,
        description: eventDesc || null,
        eventDate,
      });
      setEvents([...events, evt].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()));
      setShowEventForm(false);
      setEventTitle(""); setEventDesc(""); setEventDate("");
      toast.success("Evento criado!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar evento");
    } finally {
      setSubmittingEvent(false);
    }
  };

  const handleRsvp = async (evt: CommunityEvent) => {
    if (!token) { navigate("/login"); return; }
    try {
      if (evt.userRsvp) {
        await unrsvpEvent(token, communityId, evt.id);
        setEvents(events.map((e) => e.id === evt.id ? { ...e, userRsvp: false, rsvpCount: e.rsvpCount - 1 } : e));
      } else {
        await rsvpEvent(token, communityId, evt.id);
        setEvents(events.map((e) => e.id === evt.id ? { ...e, userRsvp: true, rsvpCount: e.rsvpCount + 1 } : e));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmittingChallenge(true);
    try {
      const ch = await createCommunityChallenge(token, communityId, {
        title: challengeTitle,
        description: challengeDesc || null,
        goal: Number(challengeGoal),
        startDate: challengeStart,
        endDate: challengeEnd,
      });
      setChallenges([ch, ...challenges]);
      setShowChallengeForm(false);
      setChallengeTitle(""); setChallengeDesc(""); setChallengeGoal("10"); setChallengeStart(""); setChallengeEnd("");
      toast.success("Desafio criado!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar desafio");
    } finally {
      setSubmittingChallenge(false);
    }
  };

  const handleContribute = async (ch: CommunityChallenge) => {
    if (!token) { navigate("/login"); return; }
    try {
      const result = await contributeToChallenge(token, communityId, ch.id, 1);
      setChallenges(challenges.map((c) =>
        c.id === ch.id
          ? { ...c, currentProgress: result.currentProgress, userContribution: c.userContribution + 1 }
          : c,
      ));
      toast.success("+1 contribuição registrada!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao contribuir");
    }
  };

  const handleShowInviteCode = async () => {
    if (!token) return;
    if (inviteCode) { setShowInviteCode(true); return; }
    try {
      const res = await fetch(`${(import.meta.env.VITE_API_URL || "http://localhost:3000/api")}/communities/${communityId}/invite-code`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.message);
      setInviteCode(result.data.inviteCode);
      setShowInviteCode(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  if (loadingCommunity) {
    return (
      <div className="min-h-screen bg-[#FFFBFE]">
        <Navbar />
        <div className="flex items-center justify-center py-32 text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (!community) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "feed", label: "Feed" },
    { id: "eventos", label: "Eventos" },
    { id: "desafios", label: "Desafios" },
    { id: "membros", label: "Membros" },
  ];

  if (isOwner) {
    tabs.push({
      id: "solicitacoes",
      label: `Solicitações${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ""}`,
    });
  }

  return (
    <div className="min-h-screen bg-[#FFFBFE]">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white relative overflow-hidden">
        {community.imageUrl && (
          <div className="absolute inset-0 opacity-20 overflow-hidden pointer-events-none" style={{ maxHeight: 220 }}>
            <img src={community.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="max-w-5xl mx-auto px-4 py-8 relative">
          <button
            type="button"
            onClick={() => navigate("/comunidades")}
            className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Comunidades
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{TYPE_LABEL[community.type]}</span>
              </div>
              <h1 className="text-2xl font-bold">{community.name}</h1>
              {community.description && (
                <p className="text-white/80 text-sm mt-1 max-w-lg">{community.description}</p>
              )}
              <p className="text-white/60 text-xs mt-2">{community.memberCount} {community.memberCount === 1 ? "membro" : "membros"}</p>
              {community.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {community.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {isOwner && (
                <>
                  <button type="button" onClick={openEditModal} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                    Editar
                  </button>
                  {community.type === "invite" && (
                    <button type="button" onClick={handleShowInviteCode} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                      Ver código
                    </button>
                  )}
                  <button type="button" onClick={handleDelete} className="bg-red-500/80 hover:bg-red-500 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                    Encerrar
                  </button>
                </>
              )}
              {(isMember || isOwner) && (
                <button type="button" onClick={handleOpenInviteModal} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                  Convidar
                </button>
              )}
              {isMember && !isOwner && (
                <button type="button" onClick={handleLeave} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                  Sair
                </button>
              )}
              {!isMember && !isOwner && community.memberStatus !== "pending" && community.type !== "invite" && (
                <button type="button" onClick={handleJoin} className="bg-white text-purple-700 hover:bg-white/90 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                  {community.type === "private" ? "Solicitar entrada" : "Entrar"}
                </button>
              )}
              {community.memberStatus === "pending" && (
                <span className="bg-white/20 px-4 py-2 rounded-xl text-sm">Solicitação pendente</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {!canInteract ? (
        <div className="max-w-md mx-auto my-16 p-8 bg-white border border-gray-100 rounded-3xl shadow-lg text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-2xl text-purple-600 mb-4 animate-bounce">
            🔒
          </div>
          <h3 className="font-bold text-lg text-gray-800 mb-2">Comunidade Privada</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Esta comunidade é restrita a membros. Solicite entrada para participar do feed, eventos e desafios.
          </p>
          {community.memberStatus === "pending" ? (
            <span className="w-full text-center bg-gray-100 text-gray-600 py-3 rounded-2xl text-sm font-semibold animate-pulse">
              Solicitação Pendente de Aprovação
            </span>
          ) : community.type === "invite" ? (
            <span className="w-full text-center bg-purple-50 text-purple-600 py-3 rounded-2xl text-sm font-semibold">
              Entrada Apenas por Convite Direto ou Código
            </span>
          ) : (
            <button
              onClick={handleJoin}
              className="w-full bg-purple-600 text-white hover:bg-purple-700 py-3 rounded-2xl text-sm font-semibold shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              Solicitar Entrada
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-4 flex gap-0">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ── FEED ── */}
        {tab === "feed" && (
          <div className="max-w-2xl mx-auto space-y-4">
            {canInteract && (
              <form onSubmit={handleCreatePost} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Compartilhe algo com a comunidade..."
                  rows={3}
                  className="w-full resize-none text-sm text-gray-700 focus:outline-none placeholder-gray-400"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={submittingPost || !postContent.trim()}
                    className="bg-purple-600 text-white px-4 py-1.5 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {submittingPost ? "Publicando..." : "Publicar"}
                  </button>
                </div>
              </form>
            )}

            {loadingPosts ? (
              <div className="text-center py-8 text-gray-400">Carregando...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-3xl mb-2">📝</div>
                <p className="text-gray-500 text-sm">Nenhuma publicação ainda.</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm overflow-hidden">
                        {post.user?.avatarUrl
                          ? <img src={post.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          : (post.user?.username?.[0] ?? post.user?.email?.[0] ?? "?").toUpperCase()
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{post.user?.username ?? post.user?.email ?? "Usuário"}</p>
                        <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
                      </div>
                    </div>
                    {(post.user?.id === currentUserId || isOwner) && (
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.content}</p>
                  {post.mediaUrl && post.mediaType === "image" && (
                    <img src={post.mediaUrl} alt="" className="mt-3 rounded-xl w-full max-h-64 object-cover" />
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── EVENTOS ── */}
        {tab === "eventos" && (
          <div className="max-w-2xl mx-auto space-y-4">
            {canInteract && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEventForm((v) => !v)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  + Novo evento
                </button>
              </div>
            )}

            {showEventForm && (
              <form onSubmit={handleCreateEvent} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="font-semibold text-gray-800">Criar evento</h3>
                <input
                  type="text"
                  placeholder="Título do evento"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <textarea
                  placeholder="Descrição (opcional)"
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                />
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowEventForm(false)} className="flex-1 border border-gray-200 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                  <button type="submit" disabled={submittingEvent} className="flex-1 bg-purple-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                    {submittingEvent ? "..." : "Criar"}
                  </button>
                </div>
              </form>
            )}

            {loadingEvents ? (
              <div className="text-center py-8 text-gray-400">Carregando...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-gray-500 text-sm">Nenhum evento agendado.</p>
              </div>
            ) : (
              events.map((evt) => (
                <div key={evt.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{evt.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${new Date(evt.eventDate) > new Date() ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {new Date(evt.eventDate) > new Date() ? "Próximo" : "Encerrado"}
                    </span>
                  </div>
                  {evt.description && <p className="text-sm text-gray-500 mb-3">{evt.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span>📅 {formatDate(evt.eventDate)}</span>
                    <span>👥 {evt.rsvpCount} {evt.rsvpCount === 1 ? "confirmado" : "confirmados"}</span>
                  </div>
                  {canInteract && new Date(evt.eventDate) > new Date() && (
                    <button
                      type="button"
                      onClick={() => handleRsvp(evt)}
                      className={`text-sm px-4 py-1.5 rounded-xl font-medium transition-colors ${evt.userRsvp ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}
                    >
                      {evt.userRsvp ? "Cancelar presença" : "Confirmar presença"}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── DESAFIOS ── */}
        {tab === "desafios" && (
          <div className="max-w-2xl mx-auto space-y-4">
            {canInteract && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowChallengeForm((v) => !v)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  + Novo desafio
                </button>
              </div>
            )}

            {showChallengeForm && (
              <form onSubmit={handleCreateChallenge} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="font-semibold text-gray-800">Criar desafio coletivo</h3>
                <input
                  type="text"
                  placeholder="Título do desafio"
                  value={challengeTitle}
                  onChange={(e) => setChallengeTitle(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <textarea
                  placeholder="Descrição (opcional)"
                  value={challengeDesc}
                  onChange={(e) => setChallengeDesc(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Meta (contribuições)</label>
                    <input
                      type="number"
                      value={challengeGoal}
                      onChange={(e) => setChallengeGoal(e.target.value)}
                      min="1"
                      required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Início</label>
                    <input type="date" value={challengeStart} onChange={(e) => setChallengeStart(e.target.value)} required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Fim</label>
                    <input type="date" value={challengeEnd} onChange={(e) => setChallengeEnd(e.target.value)} required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowChallengeForm(false)} className="flex-1 border border-gray-200 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                  <button type="submit" disabled={submittingChallenge} className="flex-1 bg-purple-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                    {submittingChallenge ? "..." : "Criar"}
                  </button>
                </div>
              </form>
            )}

            {loadingChallenges ? (
              <div className="text-center py-8 text-gray-400">Carregando...</div>
            ) : challenges.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-3xl mb-2">🏆</div>
                <p className="text-gray-500 text-sm">Nenhum desafio ativo.</p>
              </div>
            ) : (
              challenges.map((ch) => {
                const progressPct = Math.min(100, Math.round((ch.currentProgress / ch.goal) * 100));
                const isActive = new Date() >= new Date(ch.startDate) && new Date() <= new Date(ch.endDate);
                return (
                  <div key={ch.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-800">{ch.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {isActive ? "Ativo" : "Encerrado"}
                      </span>
                    </div>
                    {ch.description && <p className="text-sm text-gray-500 mb-3">{ch.description}</p>}

                    <div className="text-xs text-gray-400 mb-3">
                      {formatDateOnly(ch.startDate)} → {formatDateOnly(ch.endDate)} · {ch.contributorsCount} {ch.contributorsCount === 1 ? "contribuidor" : "contribuidores"}
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progresso coletivo</span>
                        <span>{ch.currentProgress} / {ch.goal}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="text-right text-xs text-gray-400 mt-0.5">{progressPct}%</div>
                    </div>

                    {ch.userContribution > 0 && (
                      <p className="text-xs text-purple-600 mb-2">Sua contribuição: {ch.userContribution}</p>
                    )}

                    {canInteract && isActive && (
                      <button
                        type="button"
                        onClick={() => handleContribute(ch)}
                        className="text-sm px-4 py-1.5 rounded-xl font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                      >
                        +1 Contribuir
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── MEMBROS ── */}
        {tab === "membros" && (
          <div className="max-w-2xl mx-auto">
            {loadingMembers ? (
              <div className="text-center py-8 text-gray-400">Carregando...</div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.userId} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm overflow-hidden flex-shrink-0">
                      {m.user?.avatarUrl
                        ? <img src={m.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : (m.user?.username?.[0] ?? m.user?.email?.[0] ?? "?").toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.user?.username ?? m.user?.email ?? "Usuário"}</p>
                      <p className="text-xs text-gray-400">Desde {new Date(m.joinedAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                    {m.isOwner && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Moderador</span>
                    )}
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="text-center py-16 text-gray-400">Nenhum membro encontrado.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── SOLICITAÇÕES ── */}
        {tab === "solicitacoes" && isOwner && (
          <div className="max-w-2xl mx-auto">
            {loadingRequests ? (
              <div className="text-center py-8 text-gray-400">Carregando...</div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📬</div>
                <p className="text-gray-500 font-medium">Nenhuma solicitação pendente.</p>
                <p className="text-xs text-gray-400 mt-1">Quando alguém solicitar para entrar nesta comunidade privada, você poderá aceitar ou recusar aqui.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 mb-2">{pendingRequests.length} {pendingRequests.length === 1 ? "solicitação pendente" : "solicitações pendentes"}</p>
                {pendingRequests.map((req) => (
                  <div key={req.userId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm overflow-hidden flex-shrink-0">
                      {req.user?.avatarUrl
                        ? <img src={req.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : (req.user?.username?.[0] ?? req.user?.email?.[0] ?? "?").toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{req.user?.username ?? req.user?.email ?? `Usuário #${req.userId}`}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Solicitou em {new Date(req.requestedAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRejectRequest(req.userId)}
                        className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                      >
                        Recusar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveRequest(req.userId)}
                        className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-xl hover:bg-purple-700 transition-colors font-medium cursor-pointer"
                      >
                        Aceitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )}

      {/* Edit modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="font-bold text-gray-800 mb-4">Editar comunidade</h2>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Nome</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Descrição</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">URL da imagem</label>
                <input type="url" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 border border-gray-200 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={savingEdit} className="flex-1 bg-purple-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50">{savingEdit ? "..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite followers modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-800">Convidar pessoas</h2>
                <p className="text-xs text-gray-500 mt-0.5">Seus seguidos que você pode convidar</p>
              </div>
              <button type="button" onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="overflow-y-auto flex-1 p-3">
              {loadingFollowing ? (
                <div className="text-center py-8 text-gray-400 text-sm">Carregando...</div>
              ) : followingList.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">👥</div>
                  <p className="text-sm text-gray-500">Você ainda não segue ninguém.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {followingList.map((u) => {
                    const alreadyMember = members.some((m) => m.userId === u.id);
                    const alreadyInvited = invitedIds.has(u.id);
                    const isSending = invitingId === u.id;
                    return (
                      <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50">
                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm overflow-hidden flex-shrink-0">
                          {u.avatarUrl
                            ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                            : (u.username?.[0] ?? "?").toUpperCase()
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{u.username ?? `Usuário #${u.id}`}</p>
                        </div>
                        {alreadyMember ? (
                          <span className="text-xs text-gray-400">Membro</span>
                        ) : alreadyInvited ? (
                          <span className="text-xs text-green-600 font-medium">Convidado ✓</span>
                        ) : (
                          <button
                            type="button"
                            disabled={isSending}
                            onClick={() => handleSendInvite(u.id)}
                            className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
                          >
                            {isSending ? "..." : "Convidar"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100">
              <button type="button" onClick={() => setShowInviteModal(false)} className="w-full border border-gray-200 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite code modal */}
      {showInviteCode && inviteCode && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <h2 className="font-bold text-gray-800 mb-2">Código de convite</h2>
            <p className="text-xs text-gray-500 mb-4">Compartilhe este código para convidar pessoas</p>
            <div className="bg-gray-100 rounded-xl px-4 py-3 font-mono text-lg font-bold tracking-widest text-gray-800 mb-4 select-all">
              {inviteCode}
            </div>
            <button
              type="button"
              onClick={() => { navigator.clipboard?.writeText(inviteCode); toast.success("Código copiado!"); }}
              className="w-full bg-purple-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-purple-700 mb-2 transition-colors"
            >
              Copiar código
            </button>
            <button type="button" onClick={() => setShowInviteCode(false)} className="w-full border border-gray-200 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
