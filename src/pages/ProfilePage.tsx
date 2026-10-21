import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usersApi } from "../api/users";
import { followsApi } from "../api/follows";
import { likesApi } from "../api/likes";
import type { UserProfile } from "../types/user";
import type { Post, PostVisibility } from "../types/posts";
import { usePosts } from "../hooks/usePosts";
import { PostCard } from "../components/PostCard";
import { CommentsModal } from "../components/CommentsModal";
import { EditProfileModal } from "../components/EditProfileModal";
import { PostComposer } from "../components/PostComposer";
import { LightboxModal } from "../components/LightboxModal";
import { ImageAdjustModal } from "../components/ImageAdjustModal";
import { mediaApi } from "../api/media";
import { getMediaUrl } from "../utils/media";

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
  const navigate = useNavigate();

  // Determine target user ID: if route is /profile/me or id missing, use currentUser.id
  const targetUserId =
    rawId === "me" || !rawId
      ? currentUser?.id
      : Number.parseInt(rawId, 10);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Active Tab: 'posts' | 'about'
  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");

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

  const isMe = profile?.isMe || (currentUser?.id && profile?.id === currentUser.id);

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

  const authorInitial = (profile.name || "U")[0].toUpperCase();

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "24px auto 60px",
        padding: "0 16px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Profile Card Header */}
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: 16,
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--border-color)",
          overflow: "hidden",
          marginBottom: 20,
          transition: "background-color 0.2s ease, border-color 0.2s ease",
        }}
      >
        {/* Cover Accent Banner */}
        <div
          style={{
            height: 180,
            width: "100%",
            position: "relative",
            background: profile.coverUrl
              ? `url(${getMediaUrl(profile.coverUrl)}) center/cover no-repeat`
              : "linear-gradient(135deg, #1877f2 0%, #00c6ff 100%)",
            cursor: profile.coverUrl ? "pointer" : "default",
          }}
          onClick={() => {
            if (profile.coverUrl) {
              setLightboxImages([profile.coverUrl]);
              setIsLightboxOpen(true);
            }
          }}
        />

        {/* Profile Details Area */}
        <div style={{ padding: "0 24px 24px", position: "relative" }}>
          {/* Avatar floating above cover */}
          <div
            style={{
              position: "relative",
              top: -46,
              marginBottom: -36,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: "50%",
                  backgroundColor: "var(--primary)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                  fontWeight: 700,
                  border: "4px solid var(--bg-card)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  userSelect: "none",
                  overflow: "hidden",
                  cursor: profile.avatarUrl ? "pointer" : "default",
                }}
                onClick={() => {
                  if (profile.avatarUrl) {
                    setLightboxImages([profile.avatarUrl]);
                    setIsLightboxOpen(true);
                  }
                }}
              >
                {profile.avatarUrl ? (
                  <img
                    src={getMediaUrl(profile.avatarUrl)}
                    alt={profile.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  authorInitial
                )}
              </div>

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
                      backgroundColor: "var(--bg-hover)",
                      border: "2px solid var(--bg-card)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      fontSize: 14,
                      color: "var(--text-primary)",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "var(--border-color)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                    }
                  >
                    📷
                  </button>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div>
              {isMe ? (
                <button
                  type="button"
                  id="profile-edit-btn"
                  onClick={() => setIsEditModalOpen(true)}
                  style={{
                    backgroundColor: "var(--bg-hover)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 8,
                    padding: "8px 18px",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--border-color)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                  }
                >
                  <span>✏️</span> Edit Profile
                </button>
              ) : (
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
                        ? "#ffebe8"
                        : "var(--bg-hover)"
                      : "var(--primary)",
                    color: profile.isFollowing
                      ? isHoveringFollowBtn
                        ? "#e02424"
                        : "var(--text-primary)"
                      : "#fff",
                    border:
                      profile.isFollowing
                        ? isHoveringFollowBtn
                          ? "1px solid #f97583"
                          : "1px solid var(--border-color)"
                        : "none",
                    borderRadius: 8,
                    padding: "8px 22px",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: isFollowLoading ? "not-allowed" : "pointer",
                    opacity: isFollowLoading ? 0.7 : 1,
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
              )}
            </div>
          </div>

          {/* User Name & Handle */}
          <div style={{ marginTop: 12 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {profile.name}
            </h1>
            <div style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 2 }}>
              {profile.username ? `@${profile.username}` : "No @username set"}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div
              style={{
                marginTop: 14,
                color: "var(--text-primary)",
                fontSize: 15,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                backgroundColor: "var(--bg-hover)",
                padding: "10px 14px",
                borderRadius: 8,
                borderLeft: "3px solid var(--primary)",
              }}
            >
              {profile.bio}
            </div>
          )}

          {/* Metadata Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              color: "var(--text-secondary)",
              fontSize: 13,
              marginTop: 14,
              flexWrap: "wrap",
            }}
          >
            <span>📅 Joined {formatMemberDate(profile.createdAt)}</span>
            {profile.birthdate && (
              <span>🎂 Born {formatBirthdate(profile.birthdate)}</span>
            )}
          </div>

          {/* Stats Bar */}
          <div
            style={{
              display: "flex",
              gap: 24,
              marginTop: 18,
              paddingTop: 16,
              borderTop: "1px solid var(--divider)",
            }}
          >
            <div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 17,
                  color: "var(--text-primary)",
                  marginRight: 5,
                }}
              >
                {profile.postsCount}
              </span>
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>Posts</span>
            </div>

            <div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 17,
                  color: "var(--text-primary)",
                  marginRight: 5,
                }}
              >
                {profile.followersCount}
              </span>
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>Followers</span>
            </div>

            <div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 17,
                  color: "var(--text-primary)",
                  marginRight: 5,
                }}
              >
                {profile.followingCount}
              </span>
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>Following</span>
            </div>
          </div>

          {/* Follow error alert */}
          {followError && (
            <div
              style={{
                marginTop: 12,
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
      </div>

      {/* Tabs Switcher */}
      <div
        style={{
          display: "flex",
          backgroundColor: "var(--bg-card)",
          borderRadius: 12,
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--border-color)",
          padding: "4px",
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            backgroundColor: activeTab === "posts" ? "var(--bg-hover)" : "transparent",
            color: activeTab === "posts" ? "var(--primary)" : "var(--text-secondary)",
            fontWeight: activeTab === "posts" ? 700 : 600,
            fontSize: 14,
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          Posts ({profile.postsCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("about")}
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            backgroundColor: activeTab === "about" ? "var(--bg-hover)" : "transparent",
            color: activeTab === "about" ? "var(--primary)" : "var(--text-secondary)",
            fontWeight: activeTab === "about" ? 700 : 600,
            fontSize: 14,
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          About
        </button>
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

      {/* Tab: About */}
      {activeTab === "about" && (
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: 12,
            boxShadow: "var(--shadow-sm)",
            border: "1px solid var(--border-color)",
            padding: "24px",
          }}
        >
          <h2
            style={{
              margin: "0 0 18px",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            About {profile.name}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingBottom: 12,
                borderBottom: "1px solid var(--divider)",
              }}
            >
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>Full Name</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                {profile.name}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingBottom: 12,
                borderBottom: "1px solid var(--divider)",
              }}
            >
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>Username</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                {profile.username ? `@${profile.username}` : "None"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingBottom: 12,
                borderBottom: "1px solid var(--divider)",
              }}
            >
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>Email</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                {profile.email}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingBottom: 12,
                borderBottom: "1px solid var(--divider)",
              }}
            >
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>Birthday</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                {formatBirthdate(profile.birthdate)}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingBottom: 12,
                borderBottom: "1px solid var(--divider)",
              }}
            >
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>Member Since</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                {formatMemberDate(profile.createdAt)}
              </span>
            </div>

            {profile.bio && (
              <div>
                <span
                  style={{
                    display: "block",
                    color: "var(--text-secondary)",
                    fontSize: 14,
                    marginBottom: 6,
                  }}
                >
                  Bio
                </span>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-primary)",
                    fontSize: 14,
                    lineHeight: 1.6,
                    backgroundColor: "var(--bg-hover)",
                    padding: "12px 16px",
                    borderRadius: 8,
                  }}
                >
                  {profile.bio}
                </p>
              </div>
            )}
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

      {/* Lightbox for profile photo / cover */}
      <LightboxModal
        isOpen={isLightboxOpen}
        images={lightboxImages}
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
    </div>
  );
}
