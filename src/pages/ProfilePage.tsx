import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { usersApi } from "../api/users";
import { followsApi } from "../api/follows";
import { likesApi } from "../api/likes";
import type { UserProfile, UserSummary } from "../types/user";
import type { Post, PostVisibility } from "../types/posts";
import { usePosts } from "../hooks/usePosts";
import { PostCard } from "../components/PostCard";
import { CommentsModal } from "../components/CommentsModal";
import { EditProfileModal } from "../components/EditProfileModal";
import { PostComposer } from "../components/PostComposer";
import { LightboxModal } from "../components/LightboxModal";
import { ImageAdjustModal } from "../components/ImageAdjustModal";
import { mediaApi } from "../api/media";
import { chatApi } from "../api/chat";
import { ChatIcon } from "../components/ChatIcon";
import { Avatar } from "../components/Avatar";
import { MainLayout } from "../components/layout/MainLayout";
import { getMediaUrl, getPostOptimizedUrl } from "../utils/media";

function formatMemberDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function formatBirthdate(dateString?: string): string {
  if (!dateString) return "Not provided";
  try {
    const [year, month, day] = dateString.split("-").map(Number);
    if (!year || !month || !day) return dateString;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function ProfilePage() {
  const { id: rawId } = useParams<{ id: string }>();
  const { user: currentUser, isAuthenticated, updateUser } = useAuth();
  const { openFloatingChat } = useChat();
  const navigate = useNavigate();

  const targetUserId =
    rawId === "me" || !rawId
      ? currentUser?.id
      : Number.parseInt(rawId, 10);

  const isMe = Boolean(
    (currentUser?.id && targetUserId && currentUser.id === targetUserId) ||
    rawId === "me" ||
    !rawId
  );

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Active Tab: 'posts' | 'about' | 'followers' | 'following' | 'photos'
  type ProfileTab = "posts" | "about" | "followers" | "following" | "photos";
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  // Followers & Following lists
  const [followersList, setFollowersList] = useState<UserSummary[]>([]);
  const [isFollowersLoading, setIsFollowersLoading] = useState(false);
  const [followersLoaded, setFollowersLoaded] = useState(false);

  const [followingList, setFollowingList] = useState<UserSummary[]>([]);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [followingLoaded, setFollowingLoaded] = useState(false);

  const [cardFollowMap, setCardFollowMap] = useState<Record<number, boolean>>({});
  const [cardFollowLoading, setCardFollowLoading] = useState<Record<number, boolean>>({});

  // Follow state
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);
  const [isHoveringFollowBtn, setIsHoveringFollowBtn] = useState(false);

  // Edit Profile modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Avatar upload & adjuster & lightbox state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [adjustModalState, setAdjustModalState] = useState<{
    isOpen: boolean;
    imageSrc: string;
    fileName: string;
  }>({
    isOpen: false,
    imageSrc: "",
    fileName: "",
  });

  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Fetch Profile data
  const fetchProfile = useCallback(async () => {
    if (!targetUserId || Number.isNaN(targetUserId)) {
      setProfileError("Invalid user profile ID");
      setProfileLoading(false);
      return;
    }

    try {
      setProfileLoading(true);
      setProfileError(null);
      const data = await usersApi.getUserProfile(targetUserId);
      setProfile(data);
    } catch {
      setProfileError("Failed to load user profile. The user may not exist.");
    } finally {
      setProfileLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Posts stream for this user
  const {
    posts,
    loading: postsLoading,
    loadingMore,
    error: postsError,
    loadMoreError,
    hasMore,
    loadMore,
    updatePost,
    removePost,
    createPost,
  } = usePosts(1, 10, {
    userId: targetUserId && !Number.isNaN(targetUserId) ? targetUserId : undefined,
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll intersection observer
  useEffect(() => {
    if (activeTab !== "posts") return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !postsLoading && !loadingMore) {
          loadMore();
        }
      },
      { root: null, rootMargin: "300px", threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, postsLoading, loadingMore, loadMore, activeTab]);

  // Photos extracted from posts
  const profilePhotos = useMemo(() => {
    const list: string[] = [];
    for (const p of posts) {
      if (p.imageUrls && p.imageUrls.length > 0) {
        for (const url of p.imageUrls) {
          if (!list.includes(url)) list.push(url);
        }
      }
    }
    return list;
  }, [posts]);

  // Fetch followers and following when tabs are switched
  useEffect(() => {
    if (activeTab === "followers" && !followersLoaded && profile) {
      setIsFollowersLoading(true);
      followsApi
        .getFollowers(profile.id, 1, 50)
        .then((res) => {
          const items = res.items || [];
          setFollowersList(items);
          setCardFollowMap((prev) => {
            const next = { ...prev };
            for (const item of items) {
              if (next[item.id] === undefined && item.isFollowing !== undefined) {
                next[item.id] = item.isFollowing;
              }
            }
            return next;
          });
          setFollowersLoaded(true);
        })
        .catch(() => { })
        .finally(() => setIsFollowersLoading(false));
    }
  }, [activeTab, followersLoaded, profile]);

  useEffect(() => {
    if (activeTab === "following" && !followingLoaded && profile) {
      setIsFollowingLoading(true);
      followsApi
        .getFollowing(profile.id, 1, 50)
        .then((res) => {
          const items = res.items || [];
          setFollowingList(items);
          setCardFollowMap((prev) => {
            const next = { ...prev };
            for (const item of items) {
              if (next[item.id] === undefined) {
                next[item.id] = isMe ? true : (item.isFollowing ?? false);
              }
            }
            return next;
          });
          setFollowingLoaded(true);
        })
        .catch(() => { })
        .finally(() => setIsFollowingLoading(false));
    }
  }, [activeTab, followingLoaded, profile, isMe]);

  useEffect(() => {
    setFollowersLoaded(false);
    setFollowingLoaded(false);
  }, [targetUserId]);

  const handleToggleCardFollow = async (
    targetId: number,
    currentlyFollowing: boolean
  ) => {
    const nextState = !currentlyFollowing;
    setCardFollowLoading((prev) => ({ ...prev, [targetId]: true }));
    setCardFollowMap((prev) => ({ ...prev, [targetId]: nextState }));

    try {
      if (currentlyFollowing) {
        await followsApi.unfollow(targetId);
        if (isMe) {
          setProfile((prev) =>
            prev
              ? { ...prev, followingCount: Math.max(0, prev.followingCount - 1) }
              : null
          );
        }
      } else {
        await followsApi.follow(targetId);
        if (isMe) {
          setProfile((prev) =>
            prev ? { ...prev, followingCount: prev.followingCount + 1 } : null
          );
        }
      }
    } catch {
      setCardFollowMap((prev) => ({ ...prev, [targetId]: currentlyFollowing }));
    } finally {
      setCardFollowLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  // Likes state for posts
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(() => {
    try {
      const storageKey = `marbook_likes_${currentUser?.id ?? "guest"}`;
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set<number>(JSON.parse(saved)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });

  const likingPostIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (posts.length > 0) {
      setLikedPostIds((prev) => {
        let changed = false;
        const next = new Set(prev);
        for (const p of posts) {
          if (p.isLiked && !next.has(p.id)) {
            next.add(p.id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [posts]);

  // Toggle Like handler
  const handleToggleLike = async (postId: number) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (likingPostIdsRef.current.has(postId)) return;
    likingPostIdsRef.current.add(postId);

    const targetPost = posts.find((p) => p.id === postId);
    const isCurrentlyLiked = Boolean(targetPost?.isLiked ?? likedPostIds.has(postId));
    const currentLikesCount = targetPost?.likesCount ?? (isCurrentlyLiked ? 1 : 0);
    const nextLiked = !isCurrentlyLiked;
    const optimisticCount = nextLiked
      ? currentLikesCount + 1
      : Math.max(0, currentLikesCount - 1);

    const updated = new Set(likedPostIds);
    if (nextLiked) updated.add(postId);
    else updated.delete(postId);
    setLikedPostIds(updated);

    updatePost(postId, { isLiked: nextLiked, likesCount: optimisticCount });

    try {
      if (nextLiked) {
        await likesApi.likePost(postId);
      } else {
        await likesApi.unlikePost(postId);
      }
    } catch {
      // Revert on failure
      const reverted = new Set(likedPostIds);
      if (isCurrentlyLiked) reverted.add(postId);
      else reverted.delete(postId);
      setLikedPostIds(reverted);
      updatePost(postId, { isLiked: isCurrentlyLiked, likesCount: currentLikesCount });
    } finally {
      likingPostIdsRef.current.delete(postId);
    }
  };

  // Comments modal state
  const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const handleOpenComments = (post: Post) => {
    setSelectedPostForComments(post);
    setIsCommentsOpen(true);
  };

  const handleCloseComments = () => {
    setIsCommentsOpen(false);
    setSelectedPostForComments(null);
  };

  // Follow / Unfollow toggle
  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!profile || isFollowLoading) return;

    const currentlyFollowing = profile.isFollowing;
    const nextFollowing = !currentlyFollowing;

    // Optimistic UI update
    setIsFollowLoading(true);
    setFollowError(null);
    setProfile((prev) =>
      prev
        ? {
          ...prev,
          isFollowing: nextFollowing,
          followersCount: Math.max(
            0,
            prev.followersCount + (nextFollowing ? 1 : -1)
          ),
        }
        : null
    );

    try {
      if (nextFollowing) {
        await followsApi.follow(profile.id);
      } else {
        await followsApi.unfollow(profile.id);
      }
    } catch {
      // Rollback on error
      setProfile((prev) =>
        prev
          ? {
            ...prev,
            isFollowing: currentlyFollowing,
            followersCount: Math.max(
              0,
              prev.followersCount + (currentlyFollowing ? 1 : -1)
            ),
          }
          : null
      );
      setFollowError(
        nextFollowing
          ? "Failed to follow user. Please try again."
          : "Failed to unfollow user. Please try again."
      );
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Post deletion in profile -> updates local post list and profile post count
  const handlePostDeleted = (postId: number) => {
    removePost(postId);
    setProfile((prev) =>
      prev ? { ...prev, postsCount: Math.max(0, prev.postsCount - 1) } : null
    );
  };

  // Post creation on own profile -> updates local posts and profile post count
  const handleCreatePost = async (
    content: string,
    visibility?: PostVisibility,
    imageUrls?: string[]
  ) => {
    const newPost = await createPost(content, visibility, imageUrls);
    setProfile((prev) =>
      prev ? { ...prev, postsCount: prev.postsCount + 1 } : null
    );
    return newPost;
  };

  const [isStartingChat, setIsStartingChat] = useState(false);

  const handleStartChat = async () => {
    if (!profile || isStartingChat) return;
    setIsStartingChat(true);
    try {
      const conv = await chatApi.startConversation(profile.id);
      openFloatingChat(conv.id);
    } catch (err) {
      console.error("Failed to start conversation:", err);
    } finally {
      setIsStartingChat(false);
    }
  };

  // Avatar file selection -> Opens ImageAdjustModal for zooming/panning
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setAdjustModalState({
      isOpen: true,
      imageSrc: objectUrl,
      fileName: file.name,
    });
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleAdjustAvatarConfirm = async (croppedFile: File) => {
    setAdjustModalState((prev) => ({ ...prev, isOpen: false }));
    if (!profile) return;
    setIsUploadingAvatar(true);
    try {
      const url = await mediaApi.upload(croppedFile, "avatars");
      const updated = await usersApi.updateMyProfile({
        name: profile.name,
        birthdate: profile.birthdate,
        avatarUrl: url,
      });
      setProfile(updated);
      updateUser({ avatarUrl: url });
    } catch {
      alert("Failed to upload avatar image.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (profileLoading) {
    return (
      <div
        style={{
          maxWidth: 720,
          margin: "40px auto",
          padding: "0 16px",
          textAlign: "center",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: "inline-block",
            width: 38,
            height: 38,
            border: "3px solid var(--border-color)",
            borderTopColor: "var(--primary)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ marginTop: 14, color: "var(--text-secondary)", fontSize: 15 }}>
          Loading profile...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "40px auto",
          padding: "32px 20px",
          textAlign: "center",
          backgroundColor: "var(--bg-card)",
          borderRadius: 12,
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-sm)",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 20, color: "var(--text-primary)" }}>
          Profile Not Found
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>
          {profileError ?? "The user you are looking for does not exist."}
        </p>
        <Link
          to="/feed"
          style={{
            display: "inline-block",
            padding: "8px 18px",
            backgroundColor: "var(--primary)",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <MainLayout>
      {/* Profile Card Header (Matching Socialio / Screenshot) */}
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: 16,
          boxShadow: "var(--shadow-card)",
          border: "1px solid var(--border-color)",
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        {/* Cover Accent Banner */}
        <div
          className="profile-cover-wrap"
          style={{
            background: profile.coverUrl
              ? `url(${getMediaUrl(profile.coverUrl)}) center/cover no-repeat`
              : "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)",
            cursor: profile.coverUrl ? "pointer" : "default",
          }}
          onClick={() => {
            if (profile.coverUrl) {
              setLightboxImages([profile.coverUrl]);
              setLightboxIndex(0);
              setIsLightboxOpen(true);
            }
          }}
        >
          {/* Dark gradient overlay for text contrast */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.2) 50%, transparent 100%)",
              pointerEvents: "none",
            }}
          />

          {/* User Name & Handle on Cover Banner (Beside Avatar) */}
          <div className="profile-header-name-box">
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.3px",
                textShadow: "0 2px 6px rgba(0,0,0,0.5)",
                lineHeight: 1.2,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {profile.name}
            </h1>
            {/* Followers and Following stats */}
            <div className="profile-header-stats">
              <button
                type="button"
                className={`profile-header-stats-btn ${activeTab === "followers" ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab("followers");
                }}
              >
                <strong>{profile.followersCount ?? 0}</strong>
                <span>{profile.followersCount === 1 ? "Follower" : "Followers"}</span>
              </button>
              <button
                type="button"
                className={`profile-header-stats-btn ${activeTab === "following" ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab("following");
                }}
              >
                <strong>{profile.followingCount ?? 0}</strong>
                <span>Following</span>
              </button>
            </div>
          </div>

          {/* Edit Profile Button on bottom-right of Cover */}
          {isMe && (
            <button
              type="button"
              id="profile-edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditModalOpen(true);
              }}
              style={{
                position: "absolute",
                bottom: 18,
                right: 20,
                backgroundColor: "rgba(0, 0, 0, 0.55)",
                backdropFilter: "blur(8px)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                transition: "all 0.15s ease",
                zIndex: 3,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.55)";
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Edit Profile</span>
            </button>
          )}

          {/* Avatar overlapping bottom left */}
          <div
            className="profile-avatar-anchor"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: "relative" }}>
              <Avatar
                src={profile.avatarUrl}
                name={profile.name}
                size={104}
                fontSize={40}
                style={{
                  border: "4px solid var(--bg-card)",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.18)",
                  cursor: profile.avatarUrl ? "pointer" : "default",
                  backgroundColor: "var(--bg-card)",
                }}
                onClick={() => {
                  if (profile.avatarUrl) {
                    setLightboxImages([profile.avatarUrl]);
                    setLightboxIndex(0);
                    setIsLightboxOpen(true);
                  }
                }}
              />

              {isMe && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarUpload}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      avatarInputRef.current?.click();
                    }}
                    disabled={isUploadingAvatar}
                    title="Update profile picture"
                    style={{
                      position: "absolute",
                      bottom: 4,
                      right: 4,
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: "var(--bg-card)",
                      border: "2px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "var(--shadow-sm)",
                      fontSize: 13,
                      color: "var(--text-primary)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                      e.currentTarget.style.transform = "scale(1.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-card)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    📷
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation & Action Bar under Cover (Matching the screenshot) */}
        <div className="profile-tabs-bar">
          {/* Tabs: Timeline, About, Followers, Following, Photos (NO NUMBERS) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              height: "100%",
            }}
          >
            {[
              { key: "posts", label: "Timeline" },
              { key: "about", label: "About" },
              { key: "photos", label: "Photos" },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as ProfileTab)}
                  style={{
                    position: "relative",
                    background: "none",
                    border: "none",
                    padding: "16px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "color 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  <span>{tab.label}</span>
                  {/* Underline indicator */}
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 8,
                        right: 8,
                        height: 3,
                        backgroundColor: "#1877f2",
                        borderRadius: "3px 3px 0 0",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
            {!isMe && (
              <>
                <button
                  type="button"
                  id="profile-message-btn"
                  onClick={handleStartChat}
                  disabled={isStartingChat}
                  style={{
                    backgroundColor: "var(--bg-hover)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-full)",
                    padding: "6px 14px",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: isStartingChat ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                  }}
                >
                  <ChatIcon size={14} />
                  {isStartingChat ? "Opening..." : "Message"}
                </button>

                <button
                  type="button"
                  id="profile-follow-btn"
                  onClick={handleToggleFollow}
                  disabled={isFollowLoading}
                  onMouseEnter={() => setIsHoveringFollowBtn(true)}
                  onMouseLeave={() => setIsHoveringFollowBtn(false)}
                  style={{
                    backgroundColor: profile.isFollowing
                      ? isHoveringFollowBtn
                        ? "#fee2e2"
                        : "var(--bg-hover)"
                      : "var(--primary)",
                    color: profile.isFollowing
                      ? isHoveringFollowBtn
                        ? "#ef4444"
                        : "var(--text-primary)"
                      : "#ffffff",
                    border: profile.isFollowing
                      ? isHoveringFollowBtn
                        ? "1px solid #fca5a5"
                        : "1px solid var(--border-color)"
                      : "none",
                    borderRadius: "var(--radius-full)",
                    padding: "6px 18px",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: isFollowLoading ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isFollowLoading
                    ? "Updating..."
                    : profile.isFollowing
                      ? isHoveringFollowBtn
                        ? "Unfollow"
                        : "Following"
                      : "+ Follow"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Follow error alert */}
        {followError && (
          <div
            style={{
              margin: "12px 24px",
              backgroundColor: "#ffebe8",
              color: "#e02424",
              padding: "8px 12px",
              borderRadius: 6,
              fontSize: 13,
            }}
          >
            {followError}
          </div>
        )}
      </div>

      {/* Tab: Posts */}
      {activeTab === "posts" && (
        <div>
          {/* Post Composer on own profile */}
          {isMe && (
            <div style={{ marginBottom: 16 }}>
              <PostComposer onPostCreated={handleCreatePost} />
            </div>
          )}

          {postsLoading && posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div
                style={{
                  display: "inline-block",
                  width: 30,
                  height: 30,
                  border: "3px solid #e4e6eb",
                  borderTopColor: "#1877f2",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <p style={{ color: "#65676b", fontSize: 14, marginTop: 10 }}>
                Loading posts...
              </p>
            </div>
          ) : postsError ? (
            <div
              style={{
                backgroundColor: "#ffebe8",
                color: "#e02424",
                padding: "16px",
                borderRadius: 12,
                textAlign: "center",
                fontSize: 14,
              }}
            >
              {postsError}
            </div>
          ) : posts.length === 0 ? (
            <div
              style={{
                backgroundColor: "var(--bg-card)",
                borderRadius: 12,
                padding: "48px 24px",
                textAlign: "center",
                boxShadow: "var(--shadow-sm)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div style={{ fontSize: 42, marginBottom: 10 }}>📝</div>
              <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "var(--text-primary)" }}>
                No Posts Yet
              </h3>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
                {isMe
                  ? "You haven't shared any posts yet. Use the composer above to share your first post!"
                  : `${profile.name} hasn't posted anything yet.`}
              </p>
            </div>
          ) : (
            <div>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isLiked={Boolean(
                    post.isLiked ?? likedPostIds.has(post.id)
                  )}
                  currentUserId={currentUser?.id}
                  onToggleLike={handleToggleLike}
                  onOpenComments={handleOpenComments}
                  onPostUpdated={(updated) => updatePost(post.id, updated)}
                  onPostDeleted={handlePostDeleted}
                />
              ))}

              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} style={{ height: 20 }} />

              {/* Loading More Spinner */}
              {loadingMore && (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div
                    style={{
                      display: "inline-block",
                      width: 24,
                      height: 24,
                      border: "3px solid var(--border-color)",
                      borderTopColor: "var(--primary)",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                </div>
              )}

              {/* Load more error retry */}
              {loadMoreError && (
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <span style={{ color: "#e02424", fontSize: 13, marginRight: 8 }}>
                    {loadMoreError}
                  </span>
                  <button
                    type="button"
                    onClick={loadMore}
                    style={{
                      backgroundColor: "transparent",
                      color: "var(--primary)",
                      border: "none",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* End of posts indicator */}
              {!hasMore && posts.length > 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    padding: "20px 0 10px",
                  }}
                >
                  ✓ You've seen all posts by {profile.name}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: About (Matching 2-column icon grid from screenshot) */}
      {activeTab === "about" && (
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: 16,
            boxShadow: "var(--shadow-card)",
            border: "1px solid var(--border-color)",
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          {/* Card Header */}
          <div
            style={{
              padding: "18px 24px",
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              About
            </h2>
          </div>

          {/* 2-Column Info Grid */}
          <div
            style={{
              padding: 24,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {/* 1. Name & Username */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "rgba(37, 99, 235, 0.12)",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {profile.name
                  .split(" ")
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "U"}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {profile.name}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {profile.username ? `@${profile.username}` : "Marbook Member"}
                </div>
              </div>
            </div>

            {/* 2. Joined Date */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "rgba(147, 51, 234, 0.12)",
                  color: "#9333ea",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                📅
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Joined {formatMemberDate(profile.createdAt)}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Member since registration
                </div>
              </div>
            </div>

            {/* 3. Birthday */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "rgba(245, 158, 11, 0.12)",
                  color: "#f59e0b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                🎂
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Born {formatBirthdate(profile.birthdate)}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {profile.birthdate ? "Date of birth" : "Not specified"}
                </div>
              </div>
            </div>

            {/* 4. Email */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                ✉️
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {profile.email}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Verified email address
                </div>
              </div>
            </div>

            {/* 5. Network Stats */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "rgba(236, 72, 153, 0.12)",
                  color: "#ec4899",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                👥
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {profile.followersCount} Followers · {profile.followingCount} Following
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {profile.postsCount} posts shared
                </div>
              </div>
            </div>

            {/* 6. Bio */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "rgba(99, 102, 241, 0.12)",
                  color: "#6366f1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                💬
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {profile.bio || "No bio added yet"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Personal bio
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {selectedPostForComments && (
        <CommentsModal
          isOpen={isCommentsOpen}
          post={selectedPostForComments}
          onClose={handleCloseComments}
          onCommentAdded={(_newComment) => {
            const pid = selectedPostForComments.id;
            updatePost(pid, (prev) => ({
              ...prev,
              commentsCount: (prev.commentsCount ?? 0) + 1,
            }));
            setSelectedPostForComments((prev) =>
              prev ? { ...prev, commentsCount: (prev.commentsCount ?? 0) + 1 } : null
            );
          }}
          onCommentDeleted={(deletedCount) => {
            const pid = selectedPostForComments.id;
            updatePost(pid, (prev) => ({
              ...prev,
              commentsCount: Math.max(0, (prev.commentsCount ?? 0) - deletedCount),
            }));
            setSelectedPostForComments((prev) =>
              prev
                ? {
                  ...prev,
                  commentsCount: Math.max(
                    0,
                    (prev.commentsCount ?? 0) - deletedCount
                  ),
                }
                : null
            );
          }}
        />
      )}

      {/* Edit Profile Modal */}
      {isMe && profile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          profile={profile}
          onClose={() => setIsEditModalOpen(false)}
          onProfileUpdated={(updated) => setProfile(updated)}
        />
      )}

      {/* Tab: Followers */}
      {activeTab === "followers" && (
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-card)",
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Followers
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  margin: "4px 0 0",
                }}
              >
                People who follow {profile.name}
              </p>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-secondary)",
              }}
            >
              {profile.followersCount} {profile.followersCount === 1 ? "Follower" : "Followers"}
            </span>
          </div>

          {isFollowersLoading && followersList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div
                style={{
                  display: "inline-block",
                  width: 32,
                  height: 32,
                  border: "3px solid var(--border-color)",
                  borderTopColor: "var(--primary)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 12 }}>
                Loading followers...
              </p>
            </div>
          ) : followersList.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "var(--text-secondary)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 6,
                }}
              >
                No followers yet
              </h3>
              <p style={{ fontSize: 14, maxWidth: 360, margin: "0 auto" }}>
                When someone follows {isMe ? "you" : profile.name}, they will appear here.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 14,
              }}
            >
              {followersList.map((follower) => {
                const isTargetMe = currentUser?.id === follower.id;
                const isFollowing = cardFollowMap[follower.id] ?? (follower.isFollowing ?? false);
                const isLoading = cardFollowLoading[follower.id] ?? false;

                return (
                  <div
                    key={follower.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: 12,
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-primary)",
                      transition: "box-shadow 0.15s ease",
                    }}
                  >
                    <Link
                      to={`/profile/${follower.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        textDecoration: "none",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <Avatar
                        src={follower.avatarUrl}
                        name={follower.name}
                        size={46}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {follower.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          @{follower.username}
                        </div>
                      </div>
                    </Link>

                    {isAuthenticated && !isTargetMe && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleToggleCardFollow(follower.id, isFollowing)}
                        style={{
                          flexShrink: 0,
                          padding: "6px 14px",
                          borderRadius: "var(--radius-full)",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: isLoading ? "not-allowed" : "pointer",
                          border: isFollowing
                            ? "1px solid var(--border-color)"
                            : "none",
                          backgroundColor: isFollowing
                            ? "transparent"
                            : "var(--primary)",
                          color: isFollowing
                            ? "var(--text-secondary)"
                            : "#ffffff",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {isLoading ? "..." : isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Following */}
      {activeTab === "following" && (
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-card)",
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Following
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  margin: "4px 0 0",
                }}
              >
                Accounts followed by {profile.name}
              </p>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-secondary)",
              }}
            >
              {profile.followingCount} Following
            </span>
          </div>

          {isFollowingLoading && followingList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div
                style={{
                  display: "inline-block",
                  width: 32,
                  height: 32,
                  border: "3px solid var(--border-color)",
                  borderTopColor: "var(--primary)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 12 }}>
                Loading following...
              </p>
            </div>
          ) : followingList.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "var(--text-secondary)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 6,
                }}
              >
                Not following anyone yet
              </h3>
              <p style={{ fontSize: 14, maxWidth: 360, margin: "0 auto" }}>
                When {isMe ? "you follow" : `${profile.name} follows`} people, they will appear here.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 14,
              }}
            >
              {followingList.map((followedUser) => {
                const isTargetMe = currentUser?.id === followedUser.id;
                const isFollowing = cardFollowMap[followedUser.id] ?? (isMe ? true : (followedUser.isFollowing ?? false));
                const isLoading = cardFollowLoading[followedUser.id] ?? false;

                return (
                  <div
                    key={followedUser.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: 12,
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-primary)",
                      transition: "box-shadow 0.15s ease",
                    }}
                  >
                    <Link
                      to={`/profile/${followedUser.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        textDecoration: "none",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <Avatar
                        src={followedUser.avatarUrl}
                        name={followedUser.name}
                        size={46}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {followedUser.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          @{followedUser.username}
                        </div>
                      </div>
                    </Link>

                    {isAuthenticated && !isTargetMe && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleToggleCardFollow(followedUser.id, isFollowing)}
                        style={{
                          flexShrink: 0,
                          padding: "6px 14px",
                          borderRadius: "var(--radius-full)",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: isLoading ? "not-allowed" : "pointer",
                          border: isFollowing
                            ? "1px solid var(--border-color)"
                            : "none",
                          backgroundColor: isFollowing
                            ? "transparent"
                            : "var(--primary)",
                          color: isFollowing
                            ? "var(--text-secondary)"
                            : "#ffffff",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {isLoading ? "..." : isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Photos */}
      {activeTab === "photos" && (
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-card)",
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Photos
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  margin: "4px 0 0",
                }}
              >
                Photos uploaded by {profile.name}
              </p>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-secondary)",
              }}
            >
              {profilePhotos.length} {profilePhotos.length === 1 ? "Photo" : "Photos"}
            </span>
          </div>

          {profilePhotos.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "var(--text-secondary)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 6,
                }}
              >
                No photos yet
              </h3>
              <p style={{ fontSize: 14, maxWidth: 360, margin: "0 auto" }}>
                Photos attached to {isMe ? "your posts" : `${profile.name}'s posts`} will appear here in the gallery.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                gap: 12,
              }}
            >
              {profilePhotos.map((photoUrl, idx) => (
                <div
                  key={photoUrl}
                  onClick={() => {
                    setLightboxImages(profilePhotos);
                    setLightboxIndex(idx);
                    setIsLightboxOpen(true);
                  }}
                  style={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    cursor: "pointer",
                    backgroundColor: "var(--bg-hover)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                  onMouseEnter={(e) => {
                    const img = e.currentTarget.querySelector("img");
                    if (img) img.style.transform = "scale(1.06)";
                    const overlay = e.currentTarget.querySelector(
                      ".photo-overlay"
                    ) as HTMLElement | null;
                    if (overlay) overlay.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    const img = e.currentTarget.querySelector("img");
                    if (img) img.style.transform = "scale(1)";
                    const overlay = e.currentTarget.querySelector(
                      ".photo-overlay"
                    ) as HTMLElement | null;
                    if (overlay) overlay.style.opacity = "0";
                  }}
                >
                  <img
                    src={getPostOptimizedUrl(photoUrl, 400)}
                    alt={`Photo ${idx + 1}`}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.25s ease",
                      display: "block",
                    }}
                  />
                  <div
                    className="photo-overlay"
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0,
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        backgroundColor: "rgba(0, 0, 0, 0.55)",
                        backdropFilter: "blur(4px)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox for profile photo / cover / gallery */}
      <LightboxModal
        isOpen={isLightboxOpen}
        images={lightboxImages}
        initialIndex={lightboxIndex}
        onClose={() => setIsLightboxOpen(false)}
      />

      {/* Image Adjuster for Avatar */}
      <ImageAdjustModal
        isOpen={adjustModalState.isOpen}
        imageSrc={adjustModalState.imageSrc}
        fileName={adjustModalState.fileName}
        aspectRatio={1}
        cropShape="round"
        title="Adjust Profile Picture"
        onConfirm={handleAdjustAvatarConfirm}
        onCancel={() =>
          setAdjustModalState((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </MainLayout>
  );
}
