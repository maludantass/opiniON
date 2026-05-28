import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import {
  listCommunities,
  getMyCommunities,
  getMyInvites,
  respondInvite,
  joinCommunity,
  joinCommunityByCode,
  type Community,
  type CommunityInvite,
  type CommunityListResponse,
} from "../services/api";
import toast from "react-hot-toast";

const TYPE_LABEL: Record<string, string> = {
  public: "Pública",
  private: "Privada",
  invite: "Por convite",
};

const TYPE_COLOR: Record<string, string> = {
  public: "bg-green-100 text-green-700",
  private: "bg-orange-100 text-orange-700",
  invite: "bg-purple-100 text-purple-700",
};

function CommunityCard({
  community,
  currentUserId,
  token,
  onJoined,
}: {
  community: Community;
  currentUserId: number | null;
  token: string | null;
  onJoined: (c: Community) => void;
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isMember = community.memberStatus === "active";
  const isPending = community.memberStatus === "pending";
  const isOwner = currentUserId === community.ownerId;

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) { navigate("/login"); return; }
    setLoading(true);
    try {
      await joinCommunity(token, community.id);
      toast.success(community.type === "private" ? "Solicitação enviada!" : "Você entrou na comunidade!");
      onJoined({ ...community, memberStatus: community.type === "private" ? "pending" : "active" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/comunidades/${community.id}`)}
    >
      <div className="h-28 bg-gradient-to-br from-purple-400 to-indigo-500 relative overflow-hidden">
        {community.imageUrl && (
          <img src={community.imageUrl} alt={community.name} className="w-full h-full object-cover" />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{community.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-medium ${TYPE_COLOR[community.type] ?? "bg-gray-100 text-gray-600"}`}>
            {TYPE_LABEL[community.type] ?? community.type}
          </span>
        </div>

        {community.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{community.description}</p>
        )}

        <div className="flex items-center gap-2 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span className="text-xs text-gray-500">{community.memberCount} {community.memberCount === 1 ? "membro" : "membros"}</span>
        </div>

        {community.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {community.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {!isOwner && !isMember && !isPending && (
          <button
            type="button"
            disabled={loading || community.type === "invite"}
            onClick={handleJoin}
            className="w-full text-sm font-medium py-1.5 rounded-xl transition-colors disabled:opacity-50 bg-purple-600 text-white hover:bg-purple-700 disabled:cursor-not-allowed"
          >
            {loading ? "..." : community.type === "invite" ? "Requer código" : community.type === "private" ? "Solicitar entrada" : "Entrar"}
          </button>
        )}
        {isMember && !isOwner && (
          <div className="text-center text-xs text-green-600 font-medium py-1.5">Membro</div>
        )}
        {isPending && (
          <div className="text-center text-xs text-orange-500 font-medium py-1.5">Solicitação pendente</div>
        )}
        {isOwner && (
          <div className="text-center text-xs text-purple-600 font-medium py-1.5">Moderador</div>
        )}
      </div>
    </div>
  );
}

function InviteCard({
  invite,
  onRespond,
}: {
  invite: CommunityInvite;
  onRespond: (id: number, accept: boolean) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);

  const handle = async (accept: boolean) => {
    setLoading(accept ? "accept" : "reject");
    try {
      await onRespond(invite.id, accept);
      if (accept && invite.communityId) {
        navigate(`/comunidades/${invite.communityId}`);
      }
    } finally {
      setLoading(null);
    }
  };

  const communityName = invite.community?.name ?? "Comunidade";
  const inviterName = invite.inviter?.username ?? invite.inviter?.email ?? "Alguém";
  const communityType = invite.community?.type ?? "public";

  return (
    <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4 flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex-shrink-0 overflow-hidden">
        {invite.community?.imageUrl && (
          <img src={invite.community.imageUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{communityName}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          <span className="font-medium text-gray-700">{inviterName}</span> convidou você para participar
        </p>
        <span className={`inline-block text-xs mt-1.5 px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[communityType] ?? "bg-gray-100 text-gray-500"}`}>
          {TYPE_LABEL[communityType] ?? communityType}
        </span>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => handle(false)}
          className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loading === "reject" ? "..." : "Recusar"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => handle(true)}
          className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading === "accept" ? "..." : "Aceitar"}
        </button>
      </div>
    </div>
  );
}

type Tab = "discover" | "mine" | "invites";

export default function Comunidades() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [tab, setTab] = useState<Tab>("discover");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [result, setResult] = useState<CommunityListResponse>({ items: [], total: 0 });
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [invites, setInvites] = useState<CommunityInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [joiningCode, setJoiningCode] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    listCommunities(token ?? undefined, { search: debouncedSearch || undefined, limit: 24 })
      .then(setResult)
      .catch(() => toast.error("Erro ao buscar comunidades"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, token]);

  useEffect(() => {
    if (!token) return;
    getMyCommunities(token).then(setMyCommunities).catch(() => {});
    getMyInvites(token).then(setInvites).catch(() => {});
  }, [token]);

  const handleJoined = (updated: Community) => {
    setResult((prev) => ({
      ...prev,
      items: prev.items.map((c) => (c.id === updated.id ? updated : c)),
    }));
    if (updated.memberStatus === "active") {
      setMyCommunities((prev) => {
        const exists = prev.find((c) => c.id === updated.id);
        return exists ? prev.map((c) => (c.id === updated.id ? updated : c)) : [updated, ...prev];
      });
    }
  };

  const handleRespondInvite = async (inviteId: number, accept: boolean) => {
    if (!token) return;
    try {
      await respondInvite(token, inviteId, accept);
      setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
      if (accept) {
        toast.success("Convite aceito! Bem-vindo à comunidade.");
        getMyCommunities(token).then(setMyCommunities).catch(() => {});
      } else {
        toast.success("Convite recusado.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao responder convite");
      throw err;
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { navigate("/login"); return; }
    if (!codeInput.trim()) return;
    setJoiningCode(true);
    try {
      const community = await joinCommunityByCode(token, codeInput.trim());
      toast.success(`Você entrou em "${community.name}"!`);
      setCodeInput("");
      navigate(`/comunidades/${community.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Código inválido");
    } finally {
      setJoiningCode(false);
    }
  };

  const displayList = tab === "mine" ? myCommunities : result.items;

  return (
    <div className="min-h-screen bg-[#FFFBFE]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comunidades</h1>
            <p className="text-sm text-gray-500 mt-1">Encontre grupos com os mesmos interesses</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/comunidades/criar")}
            className="bg-purple-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            + Criar comunidade
          </button>
        </div>

        {/* Join by code */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Entrar por código de convite</p>
          <form onSubmit={handleJoinByCode} className="flex gap-2">
            <input
              type="text"
              placeholder="Cole o código aqui..."
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <button
              type="submit"
              disabled={joiningCode || !codeInput.trim()}
              className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {joiningCode ? "..." : "Entrar"}
            </button>
          </form>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-full p-1 w-fit mb-6">
          <button
            type="button"
            onClick={() => setTab("discover")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === "discover" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500"}`}
          >
            Descobrir
          </button>
          {token && (
            <button
              type="button"
              onClick={() => setTab("mine")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === "mine" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500"}`}
            >
              Minhas comunidades
              {myCommunities.length > 0 && (
                <span className="ml-1.5 bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded-full">{myCommunities.length}</span>
              )}
            </button>
          )}
          {token && (
            <button
              type="button"
              onClick={() => setTab("invites")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors relative ${tab === "invites" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500"}`}
            >
              Convites
              {invites.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{invites.length}</span>
              )}
            </button>
          )}
        </div>

        {/* Search (discover tab only) */}
        {tab === "discover" && (
          <div className="relative mb-6">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar por nome ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            />
          </div>
        )}

        {/* Invites tab */}
        {tab === "invites" && (
          <div className="max-w-2xl space-y-3">
            {invites.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📬</div>
                <p className="text-gray-500">Nenhum convite pendente.</p>
                <p className="text-sm text-gray-400 mt-1">Quando alguém te convidar para uma comunidade, aparecerá aqui.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-2">{invites.length} {invites.length === 1 ? "convite pendente" : "convites pendentes"}</p>
                {invites.map((inv) => (
                  <InviteCard key={inv.id} invite={inv} onRespond={handleRespondInvite} />
                ))}
              </>
            )}
          </div>
        )}

        {/* Discover / Mine tabs */}
        {tab !== "invites" && (
          <>
            {loading && tab === "discover" ? (
              <div className="text-center py-16 text-gray-400">Carregando...</div>
            ) : displayList.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🌐</div>
                <p className="text-gray-500">
                  {tab === "mine" ? "Você ainda não faz parte de nenhuma comunidade." : search ? `Nenhuma comunidade encontrada para "${search}".` : "Nenhuma comunidade encontrada."}
                </p>
                {tab === "mine" && (
                  <button type="button" onClick={() => setTab("discover")} className="mt-3 text-purple-600 text-sm underline">
                    Descobrir comunidades
                  </button>
                )}
              </div>
            ) : (
              <>
                {tab === "discover" && (
                  <p className="text-xs text-gray-400 mb-4">{result.total} {result.total === 1 ? "comunidade" : "comunidades"} encontradas</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {displayList.map((community) => (
                    <CommunityCard
                      key={community.id}
                      community={community}
                      currentUserId={user?.id ?? null}
                      token={token}
                      onJoined={handleJoined}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
