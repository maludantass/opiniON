const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface Jogo {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  tags: string[];
  releaseYear: number | null;
  platforms: string[];
}

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export interface UserCompatibility {
  userId: number;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  score: number;
  label: "Alto" | "Médio" | "Baixo";
  sharedRatings: number;
  sharedFavorites: number;
  sharedListed: number;
}

export interface SharedWork {
  jogoId: number;
  title: string;
  imageUrl: string | null;
  myRating: number | null;
  theirRating: number | null;
}

export interface UserCompatibilityDetail extends UserCompatibility {
  categoryScores: { jogos: number };
  sharedFavoriteWorks: SharedWork[];
  commonTags: string[];
}

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function loginUser(payload: LoginPayload) {
  const response = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Erro ao fazer login");
  return result.data;
}

export async function registerUser(payload: RegisterPayload) {
  const response = await fetch(`${API_URL}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Erro ao cadastrar");
  return result.data;
}

export async function getCompatibleUsers(token: string): Promise<UserCompatibility[]> {
  const response = await fetch(`${API_URL}/compatibility/users`, {
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Erro ao buscar usuários compatíveis");
  return result.data;
}

export async function getCompatibilityDetail(
  token: string,
  userId: number,
): Promise<UserCompatibilityDetail> {
  const response = await fetch(`${API_URL}/compatibility/users/${userId}`, {
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Erro ao buscar compatibilidade");
  return result.data;
}

export interface CompatibilityDistribution {
  range: string;
  min: number;
  max: number;
  count: number;
}

export interface CompatibilityAnalytics {
  distribution: CompatibilityDistribution[];
  total: number;
}

export interface UserRating {
  id: number;
  userId: number;
  jogoId: number;
  rating: number | null;
  favorited: boolean;
  listed: boolean;
  played: boolean;
  category: string | null;
  createdAt?: string;
  jogo?: Jogo;
}

export interface GostoGame {
  jogoId: number;
  title: string;
  imageUrl: string | null;
  notaMedia: number;
  suaNota: number;
}

export interface DashboardStats {
  topFavoritedGame: {
    jogoId: number;
    title: string;
    imageUrl: string | null;
    favoritesCount: number;
  } | null;
  myTagDistribution: { tag: string; count: number }[];
  rareTaste: {
    percentage: number;
    rareFavoritesCount: number;
    totalFavoritesCount: number;
  } | null;
  primeiroAmor: {
    jogoId: number;
    title: string;
    imageUrl: string | null;
    createdAt: string;
  } | null;
  perfilResumo: {
    username: string | null;
    avatarUrl: string | null;
    reviewsCount: number;
    conexoesCount: number;
    comunidadesCount: number;
  };
  curtidas: { total: number; esteMes: number };
  mediaNotas: number | null;
  jogosAvaliadosEsteMes: number;
  gustoPopular: GostoGame | null;
  gustoRaro: GostoGame | null;
}

export async function getCompatibilityDistribution(token: string): Promise<CompatibilityAnalytics> {
  const response = await fetch(`${API_URL}/compatibility/distribution`, {
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Erro ao buscar distribuição");
  return result.data;
}

export async function getMyRatings(token: string): Promise<UserRating[]> {
  const response = await fetch(`${API_URL}/compatibility/ratings`, {
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Erro ao buscar avaliações");
  return result.data;
}

export async function upsertRating(
  token: string,
  jogoId: number,
  values: {
    rating?: number | null;
    favorited?: boolean;
    listed?: boolean;
    played?: boolean;
    category?: string | null;
  },
): Promise<UserRating> {
  const response = await fetch(`${API_URL}/compatibility/ratings`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ jogoId, ...values }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || result.message || "Erro ao avaliar jogo");
  return result.data;
}

export interface FeedPost {
  id: number;
  content: string;
  createdAt: string;
  rating: number | null;
  user: { id: number; username: string | null; avatarUrl: string | null; email: string } | null;
  jogo: { id: number; title: string; imageUrl: string | null; tags: string[] } | null;
  likesCount?: number;
  liked?: boolean;
}

export interface PublicUser {
  id: number;
  username: string | null;
  avatarUrl: string | null;
}

export async function getFeedPosts(token?: string | null, limit = 6): Promise<FeedPost[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_URL}/posts/feed?limit=${limit}`, { headers });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Erro ao buscar feed");
  return result.data;
}

export async function getPublicUsers(limit = 10): Promise<PublicUser[]> {
  const response = await fetch(`${API_URL}/users/public?limit=${limit}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Erro ao buscar usuários");
  return result.data;
}

export async function getJogos(params?: { limit?: number; offset?: number; title?: string; tag?: string }): Promise<Jogo[]> {
  const query = new URLSearchParams();
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  if (params?.title) query.set("title", params.title);
  if (params?.tag) query.set("tag", params.tag);
  const qs = query.toString();
  const response = await fetch(`${API_URL}/jogos${qs ? `?${qs}` : ""}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Erro ao buscar jogos");
  return result.data;
}

export async function getDashboardStats(token: string): Promise<DashboardStats> {
  const response = await fetch(`${API_URL}/compatibility/stats`, {
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Erro ao buscar estatísticas");
  return result.data;
}

export interface PublicFollowUser {
  id: number;
  username: string | null;
  avatarUrl: string | null;
}

export interface FollowListResponse {
  items: PublicFollowUser[];
  total: number;
}

export interface FollowStatus {
  isFollowing: boolean;
  isSelf: boolean;
}

function parseApiError(
  result: { error?: string; message?: string },
  fallback: string,
): never {
  throw new Error(result.error || result.message || fallback);
}

export async function followUser(
  token: string,
  userId: number,
): Promise<{ following: boolean }> {
  const response = await fetch(`${API_URL}/users/${userId}/follow`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao seguir usuário");
  return result.data;
}

export async function unfollowUser(
  token: string,
  userId: number,
): Promise<{ following: boolean }> {
  const response = await fetch(`${API_URL}/users/${userId}/follow`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao deixar de seguir");
  return result.data;
}

export async function getFollowStatus(
  token: string,
  userId: number,
): Promise<FollowStatus> {
  const response = await fetch(`${API_URL}/users/${userId}/follow-status`, {
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao verificar follow");
  return result.data;
}

export async function getFollowers(
  userId: number,
  params?: { limit?: number; offset?: number },
): Promise<FollowListResponse> {
  const query = new URLSearchParams();
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  const qs = query.toString();
  const response = await fetch(
    `${API_URL}/users/${userId}/followers${qs ? `?${qs}` : ""}`,
  );
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao buscar seguidores");
  return result.data;
}

export async function getFollowing(
  userId: number,
  params?: { limit?: number; offset?: number },
): Promise<FollowListResponse> {
  const query = new URLSearchParams();
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  const qs = query.toString();
  const response = await fetch(
    `${API_URL}/users/${userId}/following${qs ? `?${qs}` : ""}`,
  );
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao buscar seguindo");
  return result.data;
}

// ─── Communities ────────────────────────────────────────────────────────────

export type CommunityType = "public" | "private" | "invite";
export type MemberStatus = "pending" | "active" | "banned";

export interface Community {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  type: CommunityType;
  ownerId: number;
  tags: string[];
  games: string[];
  memberCount: number;
  memberStatus: MemberStatus | null;
  createdAt: string;
}

export interface CommunityMember {
  userId: number;
  status: MemberStatus;
  joinedAt: string;
  isOwner: boolean;
  user: { id: number; username: string | null; avatarUrl: string | null; email: string } | null;
}

export interface CommunityPost {
  id: number;
  communityId: number | null;
  content: string;
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
  createdAt: string;
  user: { id: number; username: string | null; avatarUrl: string | null; email: string } | null;
}

export interface CommunityEvent {
  id: number;
  communityId: number;
  creatorId: number;
  title: string;
  description: string | null;
  eventDate: string;
  rsvpCount: number;
  userRsvp: boolean;
  createdAt: string;
}

export interface CommunityChallenge {
  id: number;
  communityId: number;
  creatorId: number;
  title: string;
  description: string | null;
  goal: number;
  currentProgress: number;
  startDate: string;
  endDate: string;
  userContribution: number;
  contributorsCount: number;
  createdAt: string;
}

export interface CommunityInvite {
  id: number;
  communityId: number;
  community: { id: number; name: string; imageUrl: string | null; type: string } | null;
  inviter: { id: number; username: string | null; avatarUrl: string | null; email: string } | null;
  status: string;
  createdAt: string;
}

export interface CommunityListResponse {
  items: Community[];
  total: number;
}

export async function listCommunities(
  token?: string,
  params?: { search?: string; limit?: number; offset?: number },
): Promise<CommunityListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  const qs = query.toString();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_URL}/communities${qs ? `?${qs}` : ""}`, { headers });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao buscar comunidades");
  return result.data;
}

export async function getMyCommunities(token: string): Promise<Community[]> {
  const response = await fetch(`${API_URL}/communities/my`, { headers: authHeaders(token) });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao buscar minhas comunidades");
  return result.data;
}

export async function getCommunityById(id: number, token?: string): Promise<Community> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_URL}/communities/${id}`, { headers });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao buscar comunidade");
  return result.data;
}

export async function createCommunity(
  token: string,
  payload: { name: string; description?: string | null; imageUrl?: string | null; type: CommunityType; tags?: string[]; games?: string[] },
): Promise<Community> {
  const response = await fetch(`${API_URL}/communities`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao criar comunidade");
  return result.data;
}

export async function updateCommunity(
  token: string,
  id: number,
  payload: { name?: string; description?: string | null; imageUrl?: string | null; tags?: string[]; games?: string[] },
): Promise<Community> {
  const response = await fetch(`${API_URL}/communities/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao atualizar comunidade");
  return result.data;
}

export async function deleteCommunity(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_URL}/communities/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao excluir comunidade");
}

export async function joinCommunity(token: string, id: number): Promise<{ status: string }> {
  const response = await fetch(`${API_URL}/communities/${id}/join`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao entrar na comunidade");
  return result.data;
}

export async function joinCommunityByCode(token: string, code: string): Promise<Community> {
  const response = await fetch(`${API_URL}/communities/join/${code}`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao entrar com código");
  return result.data;
}

export async function leaveCommunity(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_URL}/communities/${id}/leave`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao sair da comunidade");
}

export async function getCommunityMembers(id: number, token?: string): Promise<CommunityMember[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_URL}/communities/${id}/members`, { headers });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao buscar membros");
  return result.data;
}

export async function sendCommunityInvite(token: string, communityId: number, inviteeId: number): Promise<void> {
  const response = await fetch(`${API_URL}/communities/${communityId}/invite`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ inviteeId }),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao enviar convite");
}

export async function getMyInvites(token: string): Promise<CommunityInvite[]> {
  const response = await fetch(`${API_URL}/communities/invites`, { headers: authHeaders(token) });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao buscar convites");
  return result.data;
}

export async function respondInvite(token: string, inviteId: number, accept: boolean): Promise<void> {
  const response = await fetch(`${API_URL}/communities/invites/${inviteId}/respond`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ accept }),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao responder convite");
}

export async function getCommunityPosts(id: number, token?: string, params?: { limit?: number; offset?: number }): Promise<CommunityPost[]> {
  const query = new URLSearchParams();
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  const qs = query.toString();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_URL}/communities/${id}/posts${qs ? `?${qs}` : ""}`, { headers });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao buscar posts");
  return result.data;
}

export async function createCommunityPost(
  token: string,
  communityId: number,
  payload: { content: string; mediaUrl?: string | null; mediaType?: "image" | "video" | null },
): Promise<CommunityPost> {
  const response = await fetch(`${API_URL}/communities/${communityId}/posts`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao publicar");
  return result.data;
}

export async function deleteCommunityPost(token: string, communityId: number, postId: number): Promise<void> {
  const response = await fetch(`${API_URL}/communities/${communityId}/posts/${postId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao excluir post");
}

export async function getCommunityEvents(id: number, token?: string): Promise<CommunityEvent[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_URL}/communities/${id}/events`, { headers });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao buscar eventos");
  return result.data;
}

export async function createCommunityEvent(
  token: string,
  communityId: number,
  payload: { title: string; description?: string | null; eventDate: string },
): Promise<CommunityEvent> {
  const response = await fetch(`${API_URL}/communities/${communityId}/events`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao criar evento");
  return result.data;
}

export async function rsvpEvent(token: string, communityId: number, eventId: number): Promise<void> {
  const response = await fetch(`${API_URL}/communities/${communityId}/events/${eventId}/rsvp`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao confirmar presença");
}

export async function unrsvpEvent(token: string, communityId: number, eventId: number): Promise<void> {
  const response = await fetch(`${API_URL}/communities/${communityId}/events/${eventId}/rsvp`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao cancelar presença");
}

export async function getCommunityChallenge(id: number, token?: string): Promise<CommunityChallenge[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_URL}/communities/${id}/challenges`, { headers });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao buscar desafios");
  return result.data;
}

export async function createCommunityChallenge(
  token: string,
  communityId: number,
  payload: { title: string; description?: string | null; goal: number; startDate: string; endDate: string },
): Promise<CommunityChallenge> {
  const response = await fetch(`${API_URL}/communities/${communityId}/challenges`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao criar desafio");
  return result.data;
}

export async function contributeToChallenge(
  token: string,
  communityId: number,
  challengeId: number,
  amount = 1,
): Promise<{ currentProgress: number; goal: number }> {
  const response = await fetch(`${API_URL}/communities/${communityId}/challenges/${challengeId}/contribute`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ amount }),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao contribuir para desafio");
  return result.data;
}

export interface CommunityPendingRequest {
  userId: number;
  requestedAt: string;
  user: { id: number; username: string | null; avatarUrl: string | null; email: string } | null;
}

export async function getPendingRequests(
  token: string,
  communityId: number,
): Promise<CommunityPendingRequest[]> {
  const response = await fetch(`${API_URL}/communities/${communityId}/requests`, {
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao buscar solicitações pendentes");
  return result.data;
}

export async function createPost(
  token: string,
  payload: {
    content: string;
    jogoId?: number | null;
    category?: string | null;
    mediaUrl?: string | null;
    mediaType?: 'image' | 'video' | null;
  },
): Promise<void> {
  const response = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, 'Erro ao criar publicação');
}

export async function likePost(token: string, postId: number): Promise<void> {
  const response = await fetch(`${API_URL}/posts/${postId}/like`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao curtir post");
}

export async function unlikePost(token: string, postId: number): Promise<void> {
  const response = await fetch(`${API_URL}/posts/${postId}/like`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao descurtir post");
}

export async function approveRequest(
  token: string,
  communityId: number,
  userId: number,
): Promise<void> {
  const response = await fetch(`${API_URL}/communities/${communityId}/requests/${userId}/approve`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao aprovar solicitação");
}

export async function rejectRequest(
  token: string,
  communityId: number,
  userId: number,
): Promise<void> {
  const response = await fetch(`${API_URL}/communities/${communityId}/requests/${userId}/reject`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao rejeitar solicitação");
}

export async function updateUserProfile(
  token: string,
  userId: number,
  payload: { username?: string | null; avatarUrl?: string | null; bio?: string | null },
): Promise<{ id: number; email: string; username: string | null; avatarUrl: string | null; bio: string | null }> {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) parseApiError(result, "Erro ao atualizar perfil");
  return result.data;
}