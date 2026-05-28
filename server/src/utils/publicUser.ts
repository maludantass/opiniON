import type { User } from '../models/User.js';

export interface PublicProfileUser {
    id: number;
    username: string | null;
    avatarUrl: string | null;
    bio: string | null;
}

type PublicProfileFields = Pick<User, 'id' | 'username' | 'avatarUrl' | 'bio'>;

export function toPublicProfileUser(user: PublicProfileFields): PublicProfileUser {
    return {
        id: user.id,
        username: user.username ?? null,
        avatarUrl: user.avatarUrl ?? null,
        bio: user.bio ?? null,
    };
}
