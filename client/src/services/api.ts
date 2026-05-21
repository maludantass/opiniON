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
  createdAt?: string;
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

export interface FeedPost {
  id: number;
  content: string;
  createdAt: string;
  user: { id: number; username: string | null; avatarUrl: string | null; email: string } | null;
  jogo: { id: number; title: string; imageUrl: string | null; tags: string[] } | null;
}

export interface PublicUser {
  id: number;
  username: string | null;
  avatarUrl: string | null;
}

export async function getFeedPosts(limit = 6): Promise<FeedPost[]> {
  const response = await fetch(`${API_URL}/posts/feed?limit=${limit}`);
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

export async function getJogos(params?: { limit?: number; offset?: number; title?: string }): Promise<Jogo[]> {
  const query = new URLSearchParams();
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  if (params?.title) query.set("title", params.title);
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