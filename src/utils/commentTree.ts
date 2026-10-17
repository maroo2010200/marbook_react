import type { Comment } from "../types/comments";

/**
 * Recursively searches the comment tree for a comment or reply with targetId.
 */
export function findCommentInTree(
  list: Comment[],
  targetId: number
): Comment | null {
  for (const c of list) {
    if (c.id === targetId) return c;
    if (c.replies && c.replies.length > 0) {
      const found = findCommentInTree(c.replies, targetId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Recursively updates a single comment or reply matching targetId in the comment tree.
 */
export function updateCommentInTree(
  list: Comment[],
  targetId: number,
  updater: (c: Comment) => Comment
): Comment[] {
  return list.map((c) => {
    if (c.id === targetId) {
      return updater(c);
    }
    if (c.replies && c.replies.length > 0) {
      return {
        ...c,
        replies: updateCommentInTree(c.replies, targetId, updater),
      };
    }
    return c;
  });
}

/**
 * Attaches fetched replies to a comment anywhere in the tree and updates its reply count.
 */
export function attachRepliesInTree(
  list: Comment[],
  targetId: number,
  fetchedReplies: Comment[]
): Comment[] {
  return list.map((c) => {
    if (c.id === targetId) {
      return {
        ...c,
        replies: fetchedReplies,
        replyCount: Math.max(c.replyCount ?? 0, fetchedReplies.length),
      };
    }
    if (c.replies && c.replies.length > 0) {
      return {
        ...c,
        replies: attachRepliesInTree(c.replies, targetId, fetchedReplies),
      };
    }
    return c;
  });
}

/**
 * Finds all ancestor IDs above targetId in the tree so they can all be expanded or updated.
 */
export function getAncestorIds(
  list: Comment[],
  targetId: number,
  path: number[] = []
): number[] | null {
  for (const c of list) {
    if (c.id === targetId) {
      return path;
    }
    if (c.replies && c.replies.length > 0) {
      const found = getAncestorIds(c.replies, targetId, [...path, c.id]);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Adds a new reply to its parent comment and increments replyCount on the parent
 * and every ancestor comment in the thread up to the root.
 */
export function addReplyAndIncrementAncestors(
  list: Comment[],
  targetParentId: number,
  ancestorIds: number[],
  newReply: Comment
): Comment[] {
  const idsToIncrement = new Set([targetParentId, ...ancestorIds]);

  const traverse = (items: Comment[]): Comment[] => {
    return items.map((c) => {
      const isTarget = c.id === targetParentId;
      const shouldIncrement = idsToIncrement.has(c.id);
      const updatedReplies =
        c.replies && c.replies.length > 0 ? traverse(c.replies) : c.replies;

      if (isTarget) {
        const currentReplies = updatedReplies ?? [];
        return {
          ...c,
          replyCount: (c.replyCount ?? 0) + 1,
          replies: [...currentReplies, newReply],
        };
      }

      if (shouldIncrement) {
        return {
          ...c,
          replyCount: (c.replyCount ?? 0) + 1,
          replies: updatedReplies,
        };
      }

      return updatedReplies !== c.replies
        ? { ...c, replies: updatedReplies }
        : c;
    });
  };

  return traverse(list);
}
