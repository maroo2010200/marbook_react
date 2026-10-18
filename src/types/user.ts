export interface User {
  id: number;
  name: string;
  username: string | null;
  email: string;
  bio?: string | null;
  isEmailVerified: boolean;
  birthdate: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: number;
  name: string;
  username: string | null;
  email: string;
  bio: string | null;
  birthdate: string;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing: boolean;
  isMe: boolean;
}

export interface UserProfileUpdateDto {
  name: string;
  username?: string | null;
  bio?: string | null;
  birthdate: string;
}

export interface UserSummary {
  id: number;
  username: string | null;
  name: string;
}
