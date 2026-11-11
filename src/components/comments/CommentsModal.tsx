import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCommentsModal } from "../../hooks/useCommentsModal";
import { CommentItem } from "./CommentItem";
import { CommentInput } from "./CommentInput";
import type { Post } from "../../types/posts";
import type { Comment } from "../../types/comments";
import { Avatar } from "../Avatar";
import { MarshmallowLoader } from "../MarshmallowLoader";
import { PostImagesGrid } from "../posts/PostImagesGrid";
import { LightboxModal } from "../LightboxModal";
import { parseRichText } from "../../utils/richText";

interface CommentsModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: (comment: Comment) => void;
  onCommentDeleted?: (deletedCount: number, deletedCommentId?: number) => void;
}

export function CommentsModal({
  post,
  isOpen,
  onClose,
  onCommentAdded,
  onCommentDeleted,
}: CommentsModalProps) {
  const { user, isAuthenticated } = useAuth();

  const {
    comments,
    loading,
    loadingMore,
    error,
    loadMoreError,
    hasMore,
    newComment,
    submitting,
    submitError,
    replyingTo,
    expandedCommentIds,
    loadingRepliesCommentIds,
    scrollContainerRef,
    sentinelRef,
    inputRef,
    setNewComment,
    attachedImageUrl,
    setAttachedImageUrl,
    isUploadingImage,
    setIsUploadingImage,
    loadInitialComments,
    loadMoreComments,
    handleContainerScroll,
    handleToggleCommentLike,
    handleToggleReplies,
    handleStartReply,
    handleCancelReply,
    handleSubmit,
    handleEditComment,
    handleDeleteComment,
    handleTogglePinComment,
  } = useCommentsModal({ isOpen, post, onCommentAdded, onCommentDeleted });

  const [lightboxState, setLightboxState] = useState<{
    images: string[];
    index: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setLightboxState(null);
    }
  }, [isOpen, post?.id]);

  // Handle Escape key to close modal (let LightboxModal handle Escape first when open)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !lightboxState) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, lightboxState]);

  if (!isOpen || !post) return null;

  const formatPostDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const postDate = formatPostDate(post.createdAt);
  const hasCaption = Boolean(post.content?.trim());
  const hasMedia = Boolean(post.imageUrls && post.imageUrls.length > 0);
  const hasRepost = Boolean(post.originalPostId);
  const showPostPreview = hasCaption || hasMedia || hasRepost;

  const renderPostPreviewMedia = (urls: string[] | undefined, maxHeight: number) => {
    if (!urls || urls.length === 0) return null;
    return (
      <PostImagesGrid
        images={urls}
        maxHeight={maxHeight}
        onImageClick={(idx) => setLightboxState({ images: urls, index: idx })}
      />
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "var(--modal-overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: 12,
          maxWidth: 620,
          width: "100%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border-color)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid var(--divider)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar src={post.userAvatarUrl} name={post.userName} size={36} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
                {post.userName}
              </div>
              <small style={{ color: "var(--text-secondary)", fontSize: 11 }}>
                {postDate}
              </small>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: "4px 8px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable Comments & Post Details */}
        <div
          ref={scrollContainerRef}
          onScroll={handleContainerScroll}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Post Content & Media Preview */}
          {showPostPreview && (
            <div
              style={{
                paddingBottom: 16,
                borderBottom: "1px solid var(--divider)",
              }}
            >
              {hasCaption && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    lineHeight: 1.5,
                    color: "var(--text-primary)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  <strong style={{ marginRight: 6 }}>{post.userName}</strong>
                  {parseRichText(post.content, {
                    linkColor: "#1877f2",
                    hidePureMediaUrl: false,
                  }).nodes}
                </p>
              )}

              {hasMedia && (
                <div style={{ marginTop: hasCaption ? 8 : 0 }}>
                  {renderPostPreviewMedia(post.imageUrls, 360)}
                </div>
              )}

              {hasRepost && (
                <div
                  style={{
                    marginTop: hasCaption || hasMedia ? 12 : 0,
                    borderRadius: 10,
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-hover)",
                    padding: "12px 14px",
                  }}
                >
                  {post.originalPost ? (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <Avatar
                          src={post.originalPost.userAvatarUrl}
                          name={post.originalPost.userName}
                          size={28}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                            {post.originalPost.userName}
                          </div>
                          <small style={{ color: "var(--text-secondary)", fontSize: 11 }}>
                            {formatPostDate(post.originalPost.createdAt)}
                          </small>
                        </div>
                      </div>

                      {post.originalPost.content?.trim() && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: 14,
                            lineHeight: 1.45,
                            color: "var(--text-primary)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {parseRichText(post.originalPost.content, {
                            linkColor: "#1877f2",
                            hidePureMediaUrl: false,
                          }).nodes}
                        </p>
                      )}

                      {renderPostPreviewMedia(post.originalPost.imageUrls, 320)}
                    </>
                  ) : (
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        fontStyle: "italic",
                      }}
                    >
                      Original post is no longer available.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Initial Loading Spinner */}
          {loading && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <MarshmallowLoader size="md" label="Toasting comments..." />
            </div>
          )}

          {/* Initial Load Error with Retry */}
          {error && (
            <div
              style={{
                textAlign: "center",
                padding: "20px 0",
                color: "#e02424",
                fontSize: 13,
              }}
            >
              <p style={{ margin: "0 0 8px" }}>{error}</p>
              <button
                type="button"
                onClick={loadInitialComments}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #e02424",
                  background: "#fff",
                  color: "#e02424",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && comments.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "30px 0",
                color: "var(--text-secondary)",
                fontSize: 14,
              }}
            >
              No comments yet. Be the first to comment!
            </div>
          )}

          {/* Recursive Comments Tree */}
          {!loading &&
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                depth={0}
                expandedCommentIds={expandedCommentIds}
                loadingRepliesCommentIds={loadingRepliesCommentIds}
                onToggleReplies={handleToggleReplies}
                onToggleLike={handleToggleCommentLike}
                onStartReply={handleStartReply}
                currentUserId={user?.id}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
                postAuthorId={post.userId}
                onTogglePinComment={handleTogglePinComment}
              />
            ))}

          {/* Bottom Sentinel for Infinite Scroll */}
          {hasMore && !loading && (
            <div ref={sentinelRef} style={{ height: 1 }} />
          )}

          {/* Loading More Indicator */}
          {loadingMore && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 0",
              }}
            >
              <MarshmallowLoader size="sm" inline label="Toasting more comments..." />
            </div>
          )}

          {/* Pagination Load More Error */}
          {loadMoreError && (
            <div
              style={{
                textAlign: "center",
                padding: "10px 0",
                color: "#e02424",
                fontSize: 12,
              }}
            >
              <p style={{ margin: "0 0 6px" }}>{loadMoreError}</p>
              <button
                type="button"
                onClick={loadMoreComments}
                style={{
                  padding: "4px 10px",
                  borderRadius: 4,
                  border: "1px solid #e02424",
                  background: "var(--bg-hover)",
                  color: "#e02424",
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* End of Comments Indicator */}
          {!loading && !hasMore && comments.length > 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "14px 0 6px",
                color: "var(--text-secondary)",
                fontSize: 12,
              }}
            >
              All comments loaded
            </div>
          )}
        </div>

        {/* Modal Footer / Comment Input */}
        <CommentInput
          isAuthenticated={isAuthenticated}
          replyingTo={replyingTo}
          newComment={newComment}
          submitting={submitting}
          submitError={submitError}
          inputRef={inputRef}
          onChangeComment={setNewComment}
          onCancelReply={handleCancelReply}
          onSubmit={handleSubmit}
          attachedImageUrl={attachedImageUrl}
          onAttachImage={setAttachedImageUrl}
          isUploadingImage={isUploadingImage}
          onUploadingChange={setIsUploadingImage}
        />
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <LightboxModal
          isOpen={Boolean(lightboxState)}
          images={lightboxState?.images ?? []}
          initialIndex={lightboxState?.index ?? 0}
          onClose={() => setLightboxState(null)}
        />
      </div>
    </div>
  );
}
