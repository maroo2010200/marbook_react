# Marbook Frontend — Architecture, Design Decisions & Interview Guide

This guide provides a comprehensive breakdown of the frontend architecture of **Marbook** (a Facebook-like social media web application built with React, Vite, and TypeScript). It is designed to give you deep technical mastery of every feature, design pattern, and trade-off, enabling you to clearly explain your code in any frontend or full-stack software engineering interview.

---

## Table of Contents
1. [Core Architecture & Tech Stack Selection](#1-core-architecture--tech-stack-selection)
2. [API Layer & HTTP Client Design](#2-api-layer--http-client-design)
3. [Authentication & Session Lifecycle](#3-authentication--session-lifecycle)
4. [Feed Architecture & High-Performance Infinite Scrolling](#4-feed-architecture--high-performance-infinite-scrolling)
5. [Post & Comment CRUD Lifecycle](#5-post--comment-crud-lifecycle)
6. [Recursive Nested Comments & Tree Synchronization](#6-recursive-nested-comments--tree-synchronization)
7. [Canvas-Based Image Adjuster (Zero-Dependency Pan/Zoom/Crop)](#7-canvas-based-image-adjuster-zero-dependency-panzoomcrop)
8. [Adaptive Multi-Image Grid & Fullscreen Lightbox](#8-adaptive-multi-image-grid--fullscreen-lightbox)
9. [Rich Text Parsing, Giphy CDN Conversion & Autolinking](#9-rich-text-parsing-giphy-cdn-conversion--autolinking)
10. [Optimistic UI Patterns & State Rollbacks](#10-optimistic-ui-patterns--state-rollbacks)
11. [Top Frontend Interview Questions & Deep-Dive Answers](#11-top-frontend-interview-questions--deep-dive-answers)
12. [Dark Mode Architecture & Implementation Deep-Dive](#12-dark-mode-architecture--implementation-deep-dive)
13. [Real-Time Direct Messaging (Chat) Architecture & Implementation Deep-Dive](#13-real-time-direct-messaging-chat-architecture--implementation-deep-dive)
14. [Search Engine, Live Quick Preview & Tabbed Results Architecture](#14-search-engine-live-quick-preview--tabbed-results-architecture)
15. [Facebook-Style Fixed & Sticky Responsive Layout Architecture](#15-facebook-style-fixed--sticky-responsive-layout-architecture)
16. [Settings Page & Account Security Lifecycle Architecture](#16-settings-page--account-security-lifecycle-architecture)
17. [Unified Live Debounced Discovery Engine & Dynamic Explore Feed](#17-unified-live-debounced-discovery-engine--dynamic-explore-feed)

---

## 1. Core Architecture & Tech Stack Selection

### The Stack
- **Framework**: React 19 + TypeScript
- **Bundler / Dev Server**: Vite
- **Routing**: React Router DOM (v7)
- **HTTP Client**: Axios
- **Styling**: Vanilla CSS / Inline Design System (Zero external UI component libraries)

### Why Vite over Create React App (CRA) or Webpack?
- **Problem**: CRA uses Webpack, which bundles the entire application before starting the dev server. As an application grows, dev server boot times and Hot Module Replacement (HMR) become slow (often 20–40 seconds).
- **Solution**: Vite leverages native ES Modules (ESM) in modern browsers and uses `esbuild` (written in Go) for pre-bundling dependencies. It only compiles files as the browser requests them.
- **Interview Takeaway**: *"Vite gives us sub-second server startup and instant HMR regardless of project size because it offloads module resolution to browser-native ESM."*

### Why Context API + Custom Hooks instead of Redux / Zustand?
- **Problem**: Developers often introduce heavy state libraries (Redux Toolkit, MobX) prematurely, adding significant boilerplate (actions, reducers, dispatchers, selectors) for state that is either localized or server-cached.
- **Solution**: We categorized state into two distinct types:
  1. **Global App State (Authentication)**: Handled via React Context (`AuthContext`). It rarely changes (login, logout, avatar update), avoiding unnecessary re-renders.
  2. **Feature/Server State (Feed, Comments)**: Encapsulated inside custom hooks (`usePosts`, `useCommentsModal`). Components subscribe only to the slice of state they care about.
- **Interview Takeaway**: *"We followed the principle of 'Colocate state where it belongs'. Auth is global via Context; feed and comments lifecycle state are modularized into custom hooks. This keeps the bundle tiny and prevents global re-render cascades."*

---

## 2. API Layer & HTTP Client Design

All API calls are centralized under `src/api/` using a configured Axios singleton (`src/api/api.ts`).

### How It Works
```typescript
// src/api/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5244/api",
  headers: { "Content-Type": "application/json" },
});

// Automatic JWT Token Injection via Request Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("marbook_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Why Axios instead of native `fetch`?
1. **Automatic JSON Transformation**: `fetch` requires two steps (`await res.json()`), whereas Axios automatically transforms request and response data.
2. **Centralized Interceptors**: We attach our JWT token in one place without repeating headers on every request.
3. **Unified Error Handling**: `fetch` does not reject HTTP error statuses (like `401 Unauthorized` or `400 Bad Request`); Axios automatically rejects non-2xx status codes into a standard `catch` block.

---

## 3. Authentication & Session Lifecycle

### Architecture (`src/context/AuthContext.tsx`)
1. **Registration**:
   - Users register via `POST /api/auth/register`.
   - **Crucial Security Decision**: Registration does **not** auto-login the user. The user stays on a confirmation screen until they click the verification link in their email.
2. **Login**:
   - `POST /api/auth/login` returns a JWT token and a User object.
   - The token and user profile are saved to `localStorage` (`marbook_token`, `marbook_user`).
   - The user state is placed into `AuthContext` to trigger a re-render of navigation headers.
3. **Token Persistence**:
   - On page reload, `AuthContext` rehydrates its state from `localStorage`. If a user clears their storage or clicks Logout, the token is destroyed and the route redirects to `/login`.

---

## 4. Feed Architecture & High-Performance Infinite Scrolling

### The Challenge
Rendering a social media feed with hundreds of posts and heavy images can quickly cause browser memory spikes, layout thrashing, and scroll stutter if built naively.

### The Solution: `IntersectionObserver` Sentinel
Instead of attaching a `scroll` event listener to `window` (which triggers dozens of times per second and forces recalculations on the main thread), we place a lightweight 1px invisible "sentinel" div at the bottom of the feed:

```tsx
// Inside FeedPage.tsx
const sentinelRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  const sentinel = sentinelRef.current;
  if (!sentinel) return;

  const observer = new IntersectionObserver(
    (entries) => {
      // Fires ONLY when the sentinel enters the viewport
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        loadMore();
      }
    },
    { threshold: 0.1 }
  );

  observer.observe(sentinel);
  return () => observer.disconnect(); // Prevent memory leaks
}, [hasMore, loadingMore, loading, loadMore]);
```

### Feed Audience Switcher ("For You" vs "Following")
- The feed supports two views:
  - **For You**: Global public posts.
  - **Following**: Posts from users the current authenticated user follows.
- Switching tabs immediately cancels existing pagination, resets `posts` to empty, and requests page 1 with `followingOnly=true/false`.

---

## 5. Post & Comment CRUD Lifecycle

### Post Creation (`src/components/PostComposer.tsx`)
- **Audience Privacy Control**: Users select visibility via a dropdown (`Public 🌐`, `Followers Only 👥`, `Only Me 🔒`), mapped to the backend `PostVisibility` enum.
- **Image-Only Posts Allowed**: Post content is optional if photos are attached. The validation checks `hasContent || hasImages`.
- **Pre-Upload Photo Adjustment**: When a user selects a photo, it opens directly inside the canvas image adjuster so they can reposition or crop it before uploading.

### Post Edit & Delete (`src/components/PostCard.tsx`)
- **Author Ownership Check**: The three-dots menu (`...`) only renders if `post.userId === currentUser.id`.
- **Inline Editing**: Allows updating post text, removing existing images (`✕`), adding new images, or readjusting existing thumbnails (`✂️ Adjust`).
- **Confirmation Modal**: Deleting triggers a modal dialog to prevent accidental deletion.

---

## 6. Recursive Nested Comments & Tree Synchronization

### The Challenge
Facebook and Instagram comments support root comments and unlimited or multi-tier nested replies. Displaying these requires recursive rendering, and adding a reply must update ancestor reply counts all the way up the tree.

### 1. Recursive Component Tree (`CommentItem.tsx`)
If a comment has replies, `CommentItem` renders itself recursively, increasing the `depth` counter:

```tsx
// src/components/comments/CommentItem.tsx
{isExpanded && comment.replies && comment.replies.map((reply) => (
  <CommentItem
    key={reply.id}
    comment={reply}
    depth={depth + 1}
    onToggleLike={onToggleLike}
    onStartReply={onStartReply}
    // ...
  />
))}
```

### 2. Visual Branch Guides
To create Facebook/YouTube-style nested threads, vertical branch lines and curved elbow lines (`└─`) are rendered dynamically based on `depth > 0`.

### 3. Tree Immutability & Ancestor Count Propagation
When a user adds a reply 3 levels deep:
1. The new comment is inserted under `targetParentId`.
2. All ancestor comments above it have their `replyCount` incremented by 1 using immutable recursive tree traversal.

```typescript
// src/utils/commentTree.ts
export function addReplyAndIncrementAncestors(
  comments: Comment[],
  targetParentId: number,
  newReply: Comment,
  ancestorIds: Set<number>
): Comment[] {
  return comments.map((comment) => {
    let updated = { ...comment };
    if (ancestorIds.has(comment.id)) {
      updated.replyCount = (updated.replyCount ?? 0) + 1;
    }
    if (comment.id === targetParentId) {
      updated.replies = [...(updated.replies || []), newReply];
    } else if (updated.replies) {
      updated.replies = addReplyAndIncrementAncestors(
        updated.replies,
        targetParentId,
        newReply,
        ancestorIds
      );
    }
    return updated;
  });
}
```

---

## 7. Canvas-Based Image Adjuster (Zero-Dependency Pan/Zoom/Crop)

### Why Build from Scratch?
External packages like `react-image-crop` or `cropperjs` add 50KB+ to the bundle and often suffer from React 19 compatibility issues. We built a native canvas adjuster in [ImageAdjustModal.tsx](file:///e:/marbook-react/src/components/ImageAdjustModal.tsx).

### How It Works: The Coordinate Geometry
1. **Aspect Ratio Clipping Window**:
   Given a max bounding box (e.g. 440px wide by 340px tall) and an aspect ratio $A = \frac{\text{width}}{\text{height}}$, we calculate:
   $$\text{cropW} = 440, \quad \text{cropH} = \frac{\text{cropW}}{A}$$
   If $\text{cropH} > 340$, we clamp:
   $$\text{cropH} = 340, \quad \text{cropW} = \text{cropH} \times A$$

2. **Pan Clamping (No Black Bars)**:
   To ensure the image completely covers the crop box when zoomed in, panning ($x, y$) is clamped dynamically:
   $$\text{maxPanX} = \max\left(0, \frac{\text{renderedWidth} - \text{cropW}}{2}\right)$$
   $$\text{maxPanY} = \max\left(0, \frac{\text{renderedHeight} - \text{cropH}}{2}\right)$$
   Any user drag is clamped between $[-\text{maxPan}, +\text{maxPan}]$.

3. **HTML5 Canvas Export**:
   When the user clicks "Apply & Save", we project the crop window back to the image's original natural resolution and draw to an off-screen `<canvas>`:
   ```typescript
   const sourceX = naturalWidth / 2 - pan.x / currentScale - sourceCropW / 2;
   const sourceY = naturalHeight / 2 - pan.y / currentScale - sourceCropH / 2;

   ctx.drawImage(img, sourceX, sourceY, sourceCropW, sourceCropH, 0, 0, exportW, exportH);
   canvas.toBlob((blob) => {
     const croppedFile = new File([blob], fileName, { type: "image/jpeg" });
     onConfirm(croppedFile);
   }, "image/jpeg", 0.92);
   ```

### Critical Bug Solved: Wheel Zoom Scrolling the Browser
- **Problem**: When users scrolled their mouse wheel to zoom in/out on the canvas, the entire browser window scrolled up and down simultaneously.
- **Root Cause**: In modern React, synthetic `onWheel` event handlers are registered as *passive* by default (`{ passive: true }`), meaning `e.preventDefault()` is ignored by the browser.
- **Solution**: We attached a native, non-passive event listener directly to the container DOM ref:
  ```typescript
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isOpen) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); // Successfully cancels page scroll!
      e.stopPropagation();
      setZoom((prev) => Math.max(1, Math.min(3, prev - e.deltaY * 0.002)));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isOpen]);
  ```

---

## 8. Adaptive Multi-Image Grid & Fullscreen Lightbox

### Adaptive Facebook-Style Layouts (`PostImagesGrid.tsx`)
The grid adapts dynamically based on how many photos a post contains:
- **1 Image**: Full natural aspect ratio up to `maxHeight: 650px` with `objectFit: "contain"` (preventing clipping on vertical/portrait photos).
- **2 Images**: 2 side-by-side equal columns.
- **3 Images**: 1 large hero image on the left, 2 stacked images on the right.
- **4 Images**: 2x2 symmetrical grid.
- **5+ Images**: 2x2 grid where the 4th cell displays a dark frosted overlay with `+N` (e.g., `+3` more photos).

### Fullscreen Lightbox Viewer (`LightboxModal.tsx`)
- Clicking any image in the feed opens the Lightbox.
- **Keyboard Navigation**: Left Arrow (previous), Right Arrow (next), Escape (close).
- **Original Photo Button**: Allows opening the uncompressed CDN link in a new browser tab.
- **Scroll Lock**: Sets `document.body.style.overflow = "hidden"` while open and restores the original value on unmount.

---

## 9. Rich Text Parsing, Giphy CDN Conversion & Autolinking

### The Challenge
When users paste links (e.g. `https://giphy.com/gifs/funny-cat-abc123`), social media apps should not just display raw text; they should render clickable links and embed the animated GIF directly.

### The Solution (`src/utils/richText.tsx`)
1. **Giphy Web Page to Direct CDN Converter**:
   Extracts the Giphy ID from browser URLs and transforms it into the direct media CDN URL:
   $$\text{https://giphy.com/gifs/cat-12345} \longrightarrow \text{https://media.giphy.com/media/12345/giphy.gif}$$
2. **Regex URL Tokenization**:
   Uses an intelligent regex that strips trailing sentence punctuation:
   ```typescript
   export const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;!?"')\]\s])/g;
   ```
3. **Pure Media Detection**:
   If a comment contains *only* a GIF URL, the raw URL text is hidden and only the interactive animated GIF player is rendered.

---

## 10. Optimistic UI Patterns & State Rollbacks

### How Optimistic Updates Work (Example: Comment Like)
To give users a native, snappy experience, the UI must react in 0 milliseconds instead of waiting for network latency:

```typescript
// 1. Snapshot previous state
const previousLiked = target.liked;
const previousCount = target.likeCount;

// 2. Immediately update state optimistically
setComments(prev => updateComment(prev, id, { liked: !previousLiked, likeCount: previousLiked ? previousCount - 1 : previousCount + 1 }));

try {
  // 3. Send request in background
  const res = await commentsApi.toggleCommentLike(id);
  // Reconcile with actual server response
  setComments(prev => updateComment(prev, id, { liked: res.liked ?? res.isLiked, likeCount: res.likeCount }));
} catch {
  // 4. Rollback on network failure
  setComments(prev => updateComment(prev, id, { liked: previousLiked, likeCount: previousCount }));
}
```

### Critical Regression Solved: The "Blinking Red Like" Bug
- **Bug**: Clicking like on a comment made the heart turn red for a fraction of a second, then immediately revert to white.
- **Root Cause**: The backend returned `{ likeCount: 1, isLiked: true }`, but the frontend expected `{ likeCount: 1, liked: true }`. Because `res.liked` was `undefined`, it overwrote `liked: undefined` (falsy) when the API response arrived!
- **Fix**: Implemented fallback resolution:
  ```typescript
  const isLiked = res.liked ?? res.isLiked ?? nextLiked;
  ```

---

## 11. Top Frontend Interview Questions & Deep-Dive Answers

### Q1: "Why did you choose React + Vite over Next.js for this project?"
> *"Marbook's frontend is designed as a rich, single-page application (SPA) client that talks to an independent ASP.NET Core REST API. Next.js excels at Server-Side Rendering (SSR) for public SEO-heavy sites, but Marbook is an authenticated social dashboard with real-time dynamic interactions. Using Vite gave us a lean client-side architecture with instant build times, avoiding the complexity of running a Node.js server layer between React and our .NET API."*

### Q2: "How do you prevent memory leaks when users upload and preview multiple images?"
> *"When generating previews using `URL.createObjectURL(file)`, the browser retains the blob in memory until the document is unloaded. If a user picks and crops multiple photos, this causes memory leaks. We solve this by explicitly invoking `URL.revokeObjectURL(url)` whenever a user confirms a crop, cancels the modal, or when the modal component unmounts."*

### Q3: "How does your infinite scroll implementation differ from listening to window scroll events?"
> *"Listening to `window.onscroll` triggers events on every single pixel movement, leading to excessive function calls and potential layout thrashing (forced reflows) unless debounced. Instead, we use `IntersectionObserver` attached to an empty 1px sentinel element at the bottom of the feed. The browser handles the intersection calculations off the main thread, executing our callback only when the sentinel crosses the viewport threshold."*

### Q4: "Why did you use non-passive event listeners for mouse wheel zooming in the image cropper?"
> *"Chrome and modern browsers make wheel listeners passive by default for smoother scrolling. If an event listener is passive, calling `e.preventDefault()` throws a console warning and the browser scrolls the page anyway. To zoom the image without moving the page, we used `containerRef.current.addEventListener('wheel', handler, { passive: false })`, which explicitly permits `e.preventDefault()`."*

### Q5: "How do you manage complex nested comment trees in React without mutating state?"
> *"React requires state updates to be immutable to detect changes and re-render correctly. For nested reply trees, we wrote a recursive helper function `updateCommentInTree`. It traverses the tree recursively, using array spreading (`[...comments]`) and object spreading (`{ ...comment }`) to create new object references only for the modified nodes and their direct ancestors, leaving untouched subtrees referentially equal for optimal memoization."*

### Q6: "What is the difference between `object-fit: cover` and `object-fit: contain` in social media feeds?"
> *"`cover` scales the image to completely fill the container dimensions, cropping any excess. It is ideal for multi-image grid collages where cells must have identical dimensions. `contain` scales the image so the entire photo is visible within the bounds without clipping. For single photo posts, we used `contain` with a max-height of 650px so that portrait, square, and landscape photos are 100% visible in the feed."*

### Q7: "How do you handle API request authorization across your app?"
> *"We use Axios Request Interceptors. Instead of manually passing `{ headers: { Authorization: ... } }` in every API call, our configured Axios singleton intercepts every outgoing HTTP request, reads the JWT from `localStorage`, and appends the `Bearer <token>` header automatically."*

### Q8: "How does your client handle optimistic UI updates when network latency is high?"
> *"We capture a snapshot of the current state before the network call, immediately update the local React state to reflect the expected outcome (e.g. incrementing likes), and dispatch the API call. If the request succeeds, we reconcile state with the server payload; if it fails, we catch the error and immediately restore the snapshot, notifying the user with an error toast."*

### Q9: "Why didn't you use an off-the-shelf library for the image adjuster?"
> *"Most image cropping libraries carry heavy bundle weight, rely on external CSS stylesheets, and often have compatibility issues across React major versions. Building on the HTML5 Canvas API gave us total control over pan-boundary clamping (preventing empty borders), aspect ratio switching, custom export resolutions (1600px cap), and zero third-party dependencies."*

### Q10: "How do you ensure security against Cross-Site Scripting (XSS) when rendering user-submitted text and autolinks?"
> *"React natively escapes strings embedded in JSX expressions (`{post.content}`), mitigating basic script injection. For rich text with links and mentions, our parser breaks text into discrete tokens: strings remain safe text nodes, while validated URLs are rendered as explicit `<a>` elements with `rel='noopener noreferrer'` and `target='_blank'`, avoiding dangerous `dangerouslySetInnerHTML` methods entirely."*

### Q11: "How did you architect Dark Mode in Marbook, and why use CSS custom properties over React state in every component?"
> *"Instead of passing `isDark` through props or calculating inline styles in every component with JavaScript re-renders, we architected Dark Mode using CSS Custom Properties (CSS variables) driven by a root DOM data attribute (`[data-theme='dark']`). A top-level `ThemeContext` persists the user's choice to `localStorage` and falls back to `window.matchMedia('(prefers-color-scheme: dark)')`. When toggled, only a single DOM attribute is updated on `<html data-theme='...'>`. All components consume standard tokens like `var(--bg-card)` or `var(--text-primary)`, allowing the browser's native C++ rendering engine to instantly update all colors with zero React re-rendering overhead and smooth CSS transition animations."*

### Q12: "How did you implement the real-time Chat feature, what technologies did you choose, and why?"
> *"We implemented 1-on-1 direct messaging using ASP.NET Core SignalR on the backend and `@microsoft/signalr` with a centralized `ChatContext` on the frontend. We chose SignalR over raw WebSockets because it provides automated protocol negotiation (WebSockets with fallback to Server-Sent Events or Long Polling if firewalls block raw sockets), connection pooling, automatic reconnection backoff, and room grouping (`conversation-{id}`). On the frontend, a single persistent Hub connection lives for the duration of the authenticated session. When opening a conversation, the client joins that conversation's SignalR group, sends throttled typing notifications, and appends incoming messages dynamically without requiring page refreshes."*

### Q13: "Why did you choose WebSockets / SignalR over HTTP polling or Server-Sent Events (SSE)?"
> *"HTTP short-polling is inefficient for chat: sending requests every few seconds generates thousands of empty 200/304 HTTP responses, draining client battery and consuming high server CPU. Long-polling improves latency but still incurs HTTP header overhead on every single cycle. Server-Sent Events (SSE) are unidirectional (server-to-client only), requiring clients to use separate HTTP POST requests to send messages, resulting in fragmented transport layers. SignalR leverages WebSockets to provide a true full-duplex, persistent TCP connection with minimal 2-to-10 byte framing overhead, while also supplying automatic reconnection and hub multiplexing."*

### Q14: "How do you synchronize the unread message badge count in the Navbar with an actively open chat conversation without causing race conditions or phantom notifications?"
> *"When a user is actively chatting with someone on the `/messages` page, incoming messages for that conversation should not increment the global unread badge in the Navbar. To achieve this without race conditions or extra re-renders, `ChatContext` maintains a mutable `activeConversationIdRef`. When a `ReceiveMessage` push event arrives from the SignalR hub, we check if `activeConversationIdRef.current === message.conversationId`. If it matches, badge incrementation is suppressed and an immediate background `markAsRead(conversationId)` is dispatched. If the user is on the Feed or viewing a different conversation, the badge increments normally and triggers an unread toast."*

### Q15: "How do typing indicators work in your app without overwhelming the server or causing UI lag?"
> *"Typing indicators can flood networks if dispatched on every keystroke. We designed a dual-sided throttling and expiration architecture:
> 1. **Sender Throttling**: Keystrokes in `MessagesPage` trigger `handleTyping()`, which checks a timestamp ref and throttles calls to `sendTyping(conversationId)` to at most once every 2,000ms.
> 2. **Ephemeral Broadcasting**: The backend SignalR hub broadcasts `UserTyping` directly to the conversation room group without writing to the PostgreSQL database, resulting in near-zero CPU and disk overhead.
> 3. **Receiver Auto-Expiration**: When receiving `UserTyping`, the client stores the typing status and starts a 3,000ms timer. If no subsequent typing event arrives within 3 seconds, the typing indicator automatically clears itself from the UI, ensuring smooth animated dots without orphaned typing bubbles."*

### Q16: "How did you diagnose and solve the infinite re-render / network request loop when opening the chat messages dropdown?"
> *"When opening the message dropdown, the browser triggered hundreds of continuous GET requests to `/api/conversations`. Profiling the component tree revealed a classic React reference instability cycle: `Navbar` rendered `<MessagesDropdown onClose={() => setIsMessagesOpen(false)} />`. Because `onClose` was an inline arrow function, it had a new memory reference on every render. Inside `MessagesDropdown`, a `useEffect` depended on `[onClose, fetchConversations]`. When it ran, `fetchConversations()` updated conversation state in `ChatContext`, which triggered a re-render of `Navbar`, generating a new `onClose` function reference, which triggered the effect again in an infinite loop. We resolved this with three defensive layers:
> 1. Memoized the dropdown closer in `Navbar` using `useCallback`.
> 2. Stored the `onClose` callback in a `useRef` inside `MessagesDropdown` so outside click handlers always access the latest closure without adding it to the effect dependency array.
> 3. Wrapped the entire value object returned by `ChatContext.Provider` in `useMemo` so context consumers only re-render when actual state variables change."*

### Q17: "How did you support rich media (GIFs, images, links) in chat without a dedicated file/media upload service?"
> *"Instead of delaying the chat feature until object storage (like AWS S3) was wired up, we engineered a client-side rich media engine using `richText.tsx`:
> 1. **URL Tokenization & Image Regex**: Message strings are tokenized into plain text and valid URLs. Direct image URLs (`.gif`, `.png`, `.jpg`, `.webp`) and platforms like Giphy, Tenor, and Imgur are recognized dynamically.
> 2. **Giphy Direct CDN Parsing**: URLs from giphy.com are automatically transformed into direct `media.giphy.com` asset links.
> 3. **Curated Reaction GIF Picker**: We built a lightweight zero-dependency `GifPicker` with categorized reactions (Agree, Happy, Mindblown, Thumbs Up, Confused, etc.) that injects CDN URLs into the message payload.
> 4. **Pure Media vs Bubble Layout**: If a message contains only a media URL, the standard speech bubble border and background padding are stripped, rendering a sleek borderless sticker that opens in our fullscreen `LightboxModal` on click."*

---

## 12. Dark Mode Architecture & Implementation Deep-Dive

### 1. The Design Philosophy
Modern production web apps (like Facebook, Twitter/X, GitHub) avoid using heavy JavaScript-based styling re-computations for theme toggling. Instead, they use a **two-tier design token system**:
1. **Semantic CSS Tokens**: Abstract variables defined in `index.css` that represent intent (`--bg-page`, `--bg-card`, `--text-primary`, `--border-color`, `--shadow-md`).
2. **Theme Activation Attribute**: When light, tokens resolve to bright/clean Facebook colors (`#f0f2f5`, `#ffffff`, `#050505`). When `<html data-theme="dark">` is active, the exact same variables resolve to Facebook's dark palette (`#18191a`, `#242526`, `#e4e6eb`).

### 2. The Color Palette Tokens
| Token | Light Mode Value | Dark Mode Value | Usage |
|---|---|---|---|
| `--bg-page` | `#f0f2f5` | `#18191a` | Application background behind cards |
| `--bg-card` | `#ffffff` | `#242526` | Post cards, dropdowns, modals, navbar |
| `--bg-hover` | `#f0f2f5` | `#3a3b3c` | Button hover states, chips, pill badges |
| `--bg-input` | `#f0f2f5` | `#3a3b3c` | Textarea, text inputs, search bar |
| `--text-primary` | `#050505` | `#e4e6eb` | Main post text, author names, headings |
| `--text-secondary` | `#65676b` | `#b0b3b8` | Timestamps, icons, follower counts |
| `--border-color` | `#e4e6eb` | `#393a3b` | Card borders, modal outlines |
| `--divider` | `#efefef` | `#3e4042` | Card separators, list item borders |
| `--primary` | `#1877f2` | `#2d88ff` | Primary action buttons, active links |
| `--modal-overlay` | `rgba(0,0,0,0.65)` | `rgba(0,0,0,0.8)` | Backdrop dimming behind open modals |

### 3. State Management & Lifecycle
```
User clicks Moon/Sun in Navbar
             │
             ▼
ThemeContext.toggleTheme()
             │
             ├─► Updates React State ('light' | 'dark')
             ├─► Sets localStorage.setItem('marbook_theme', theme)
             └─► document.documentElement.setAttribute('data-theme', theme)
                                 │
                                 ▼
                     Browser CSS Engine repaints
                    all var(--...) tokens smoothly (0.2s)
```

### 4. System Preference Fallback
If the user visits Marbook for the first time without having previously chosen a theme, `ThemeContext` automatically checks their operating system preference:
```typescript
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
```
It also attaches an event listener to `window.matchMedia` so if the user's OS changes theme at sunset, Marbook automatically synchronizes!

---

## 13. Real-Time Direct Messaging (Chat) Architecture & Implementation Deep-Dive

### 1. System Topology & Protocol Selection

Direct 1-on-1 messaging requires bidirectional, sub-second communication between users. When designing this system, we evaluated four primary communication paradigms:

| Communication Mechanism | Latency | Server Load | Directionality | Firewall / Proxy Resilience | Verdict |
|---|---|---|---|---|---|
| **Short Polling** (HTTP every 3s) | High (up to 3s delay) | **Severe** (thousands of empty 200/304 requests/min) | Unidirectional (Client $\to$ Server) | High (standard HTTP) | ❌ Rejected (battery drain, high server overhead) |
| **Long Polling** (HTTP suspended) | Medium (new request per message) | Moderate (hanging threads/connections) | Half-Duplex (re-establishes per packet) | High | ❌ Fallback only |
| **Server-Sent Events (SSE)** | Low (< 50ms) | Low | **Unidirectional only** (Server $\to$ Client) | High (HTTP/2 streaming) | ❌ Rejected (requires separate HTTP POST for sends) |
| **SignalR (WebSockets + Multiplexing)** | **Ultra-Low (< 10ms)** | **Minimal** (persistent single TCP socket) | **Full-Duplex** (Bi-directional) | **Guaranteed** (Automatic graceful fallback to SSE/Long-Polling) | ✅ **Selected** |

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Frontend                    │
│                                                        │
│  ┌─────────────────┐             ┌──────────────────┐  │
│  │   ChatContext   │◄───────────►│   MessagesPage   │  │
│  │ (HubConnection) │             │ (Message Stream) │  │
│  └────────┬────────┘             └──────────────────┘  │
└───────────┼────────────────────────────────────────────┘
            │ Full-Duplex Persistent TCP (WebSockets)
            ▼
┌────────────────────────────────────────────────────────┐
│            ASP.NET Core Web API (.NET 10)              │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │          ChatHub (/hubs/chat)                    │  │
│  │  - Maps User ID to Connection ID                 │  │
│  │  - Manages Room Groups ("conversation-{id}")     │  │
│  │  - Dual-Dispatches: Group + Targeted User        │  │
│  │  - Ephemeral Typing Broadcasts                   │  │
│  └────────────────────────┬─────────────────────────┘  │
└───────────────────────────┼────────────────────────────┘
                            │ EF Core
                            ▼
               ┌────────────────────────┐
               │  PostgreSQL Database   │
               │ (Conversations/Direct- │
               │       Messages)        │
               └────────────────────────┘
```

#### Why SignalR over Raw WebSockets?
1. **Automatic Protocol Negotiation**: In enterprise environments or behind restrictive corporate firewalls, raw WebSockets are frequently blocked. SignalR automatically negotiates the best available transport: WebSockets $\to$ Server-Sent Events $\to$ Long Polling.
2. **Built-in Reconnection Backoff**: Native WebSockets disconnect permanently if the network drops. SignalR provides declarative reconnect policies (`withAutomaticReconnect`) with exponential backoff.
3. **Room Groups & User Multiplexing**: SignalR allows organizing connections into logical groups (`Groups.AddToGroupAsync("conversation-12")`) and targeted user delivery (`Clients.User(recipientId)`), eliminating manual connection dictionary plumbing.

---

### 2. Connection Lifecycle & Global State (`ChatContext.tsx`)

#### Single Persistent Hub Architecture
Instead of instantiating a new WebSocket connection on every chat page or component mount, Marbook maintains a **single application-wide Hub connection** managed inside `src/context/ChatContext.tsx`.

```typescript
// src/context/ChatContext.tsx
const connection = new HubConnectionBuilder()
  .withUrl("http://localhost:5244/hubs/chat", {
    accessTokenFactory: () => localStorage.getItem("marbook_token") || "",
  })
  .withAutomaticReconnect([0, 2000, 5000, 10000]) // Exponential retry intervals
  .build();
```

- **Session-Bound Connection**: The socket connection starts automatically when `AuthContext` detects a valid user token and terminates cleanly when the user logs out.
- **Room Joining & Leaving**: When a user navigates to `/messages?conversationId=5`, `MessagesPage` calls `joinConversation(5)` on mount and `leaveConversation(5)` on unmount.
- **Dual-Delivery Backend Reliability**: On the backend, when a message is sent, the server broadcasts to:
  1. `Clients.Group($"conversation-{id}")`: Delivered instantly to any user currently in the conversation room.
  2. `Clients.User(recipientId)`: Delivered directly to the recipient's personal user connection even if they haven't opened the room yet (powering global navbar notification toasts and unread badges).

---

### 3. Active Conversation Tracking & Zero-Delay Unread Sync

#### The UX Problem
If Alice is chatting with Bob on the `/messages` page, any incoming message from Bob should appear in the chat stream instantly, but it **must not** increment the global unread badge in the Navbar. However, if Alice navigates to the Feed, incoming messages *should* increment the unread badge and trigger a notification.

#### The Stale Closure / Infinite Loop Trap
In React, SignalR event listeners registered in `useEffect` capture the state of the component at the time the effect was registered. If we stored `activeConversationId` in simple React state and added it to the `useEffect` dependency array, the socket connection would be torn down and rebuilt every time the user switched chat threads, causing connection storms!

#### The Solution: Mutable `useRef` Synchronization
We decoupled the SignalR push listener from React render cycles using a mutable `useRef`:

```typescript
// Inside ChatContext.tsx
const activeConversationIdRef = useRef<number | null>(null);

const setActiveConversationId = useCallback((id: number | null) => {
  activeConversationIdRef.current = id;
  // If opening an existing room, clear unread count for this room immediately
  if (id) {
    chatApi.markAsRead(id).catch(console.error);
  }
}, []);

// Inside SignalR 'ReceiveMessage' event listener:
connection.on("ReceiveMessage", (message: DirectMessage) => {
  const isCurrentlyInRoom = activeConversationIdRef.current === message.conversationId;

  if (isCurrentlyInRoom) {
    // 1. User is actively viewing this room -> suppress badge increment
    // 2. Immediately tell backend message is read
    chatApi.markAsRead(message.conversationId).catch(console.error);
  } else {
    // User is on Feed or in another conversation -> increment unread badge
    setUnreadCount((prev) => prev + 1);
  }

  // Forward message to active page stream via listener callback
  onReceiveMessageRef.current?.(message);
});
```

- **Result**: Zero reconnection overhead when switching chats, zero race conditions, and instantaneous unread badge synchronization.

---

### 4. Ephemeral Debounced Typing Indicators

Typing indicators give users the feeling of a live, fluid conversation. However, sending a network packet on every single keystroke would create massive network congestion.

```
Sender types keystrokes: 'H' 'e' 'l' 'l' 'o'
         │
         ▼
[handleTyping() Throttled (2,000ms)]
         │
         ▼ (Only 1 network packet sent)
SignalR Hub.SendTyping(conversationId)
         │
         ▼ (Ephemeral broadcast — 0 database writes)
Receiver.on("UserTyping", userId)
         │
         ├─► Displays animated bouncing dots: ● ● ●
         └─► Starts 3,000ms Auto-Clear Timer
```

#### 1. Sender-Side Throttling
In `MessagesPage.tsx`, keystrokes in the message textarea call `handleTyping()`, which uses a `lastTypingSentRef` timestamp to ensure the Hub method is invoked at most once every 2 seconds:

```typescript
const lastTypingSentRef = useRef<number>(0);

const handleTyping = () => {
  const now = Date.now();
  if (now - lastTypingSentRef.current > 2000 && activeConversationId) {
    sendTyping(activeConversationId);
    lastTypingSentRef.current = now;
  }
};
```

#### 2. Ephemeral Hub Dispatch (Zero DB Writes)
In `ChatHub.cs`, the `SendTyping` method immediately forwards `UserTyping` to the room group without touching the database:
```csharp
public async Task SendTyping(long conversationId)
{
    var userId = GetCurrentUserId();
    await Clients.OthersInGroup($"conversation-{conversationId}")
        .SendAsync("UserTyping", conversationId, userId);
}
```

#### 3. Receiver-Side Auto-Expiration
When the recipient receives `UserTyping`, they store the typing status and schedule a 3-second cleanup timer:
```typescript
const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});
const typingTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

const handleUserTyping = (convId: number, userId: number) => {
  if (convId !== activeConversationId) return;

  // Set typing to true
  setTypingUsers((prev) => ({ ...prev, [userId]: true }));

  // Clear existing timer and reset 3-second auto-expiration
  if (typingTimersRef.current[userId]) {
    clearTimeout(typingTimersRef.current[userId]);
  }

  typingTimersRef.current[userId] = setTimeout(() => {
    setTypingUsers((prev) => ({ ...prev, [userId]: false }));
  }, 3000);
};
```

- **Visual Animation**: The typing indicator uses a CSS keyframe bounce (`@keyframes typingBounce`) with staggered animation delays (`animation-delay: 0s, 0.2s, 0.4s`) for authentic messaging bubbles.

---

### 5. Rich Media, Curated Reaction GIFs & Autolinking

Marbook chat supports rich media (images, GIFs, clickable URLs) out of the box without requiring a dedicated file upload or cloud storage service.

#### 1. Regex Tokenization & Auto-Linking (`src/utils/richText.tsx`)
Incoming text messages are parsed into structured tokens:
- **Web links (`https://...`, `http://...`, `www....`)**: Automatically transformed into clickable `<a>` links with `rel="noopener noreferrer"`.
- **Direct Image/GIF URLs**: URLs ending in `.gif`, `.png`, `.jpg`, `.jpeg`, `.webp` or originating from media hosts (Giphy, Tenor, Imgur) are detected via regular expressions.
- **Giphy Web-to-CDN Converter**: If a user pastes `https://giphy.com/gifs/cat-abc123`, the parser extracts the ID (`abc123`) and converts it to the direct animated media asset: `https://media.giphy.com/media/abc123/giphy.gif`.

#### 2. Curated Zero-Dependency Reaction GIF Picker (`GifPicker.tsx`)
To give users instant access to popular reactions without third-party SDK bloat or expired API keys, we built a native GIF drawer with:
- **Curated Category Chips**: Reactions, Agree, Happy, Clapping, Mind Blown, Thumbs Up, Confused, Love, Sad.
- **Instant Search Filtering**: Real-time filtering across titles and categories.
- **Custom URL Insertion**: Allows pasting any direct GIF or image URL directly.

#### 3. Pure Media vs Speech Bubble Layout
A common social media design flaw is placing large stickers or GIFs inside tiny padded chat bubbles. Marbook solves this dynamically:
- **Mixed Content (Text + Media)**: Renders the text in a colored speech bubble (`var(--primary)` for sender, `var(--bg-hover)` for receiver) with an image preview underneath.
- **Pure Media (Standalone Image/GIF)**: When a message contains *only* a media link, bubble backgrounds, borders, and paddings are completely removed. The GIF floats cleanly as an interactive sticker.
- **Fullscreen Lightbox**: Clicking any image or GIF inside the chat opens the application's reusable `LightboxModal` for high-resolution inspection.

---

### 6. Production Post-Mortem: The Infinite Re-Render Loop

#### The Incident
During development, clicking the chat icon in the Navbar to open the `MessagesDropdown` caused the browser to issue **hundreds of consecutive requests per second** to `GET /api/conversations`, locking up the browser thread and flooding backend server logs.

```
Navbar Rendered ──► Generates new inline onClose: () => setIsMessagesOpen(false)
        ▲                                                      │
        │                                                      ▼
ChatContext state updated ◄── MessagesDropdown useEffect runs [onClose, fetchConversations]
(setConversations(...))
```

#### Root Cause Analysis
1. In `Navbar.tsx`, the dropdown was rendered with an inline arrow function:
   ```tsx
   <MessagesDropdown onClose={() => setIsMessagesOpen(false)} />
   ```
   In JavaScript, every render of `Navbar` creates a brand new function object in memory for `onClose`.
2. Inside `MessagesDropdown.tsx`, a `useEffect` hooked into the document click listener to close the dropdown when clicking outside:
   ```tsx
   useEffect(() => {
     // ...
   }, [onClose, fetchConversations]);
   ```
3. Because `fetchConversations()` loads messages and calls `setConversations()` inside `ChatContext`, this state update caused `Navbar` (a consumer of `ChatContext`) to re-render.
4. `Navbar`'s re-render produced a new memory reference for `onClose`.
5. The change in `onClose` reference caused `MessagesDropdown`'s `useEffect` to fire again.
6. **Result**: An uncontrollable recursive re-render loop that flooded the backend with requests until the tab was closed.

#### The Three-Layer Defensive Fix
To make the architecture resilient against reference instability, we applied a three-layer fix:

1. **Memoize Parent Callback (`Navbar.tsx`)**:
   ```typescript
   const handleCloseMessages = useCallback(() => {
     setIsMessagesOpen(false);
   }, []);
   ```
2. **Isolate Callback in Ref (`MessagesDropdown.tsx`)**:
   Stored `onClose` in a mutable `useRef` so outside-click event listeners access the latest closure without including `onClose` in the effect's dependency array:
   ```typescript
   const onCloseRef = useRef(onClose);
   useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
   ```
3. **Memoize Context Provider Value (`ChatContext.tsx`)**:
   Wrapped the entire value exposed by `ChatContext.Provider` in `useMemo`:
   ```typescript
   const contextValue = useMemo(() => ({
     connection,
     conversations,
     unreadCount,
     fetchConversations,
     sendMessage,
     sendTyping,
     markAsRead,
     setActiveConversationId,
   }), [connection, conversations, unreadCount, fetchConversations, sendMessage, sendTyping, markAsRead, setActiveConversationId]);
   ```

- **Outcome**: The infinite loop was eliminated completely. Dropdowns now open with a single optimized network request, and context consumers only re-render when actual state variables change.

---

### 7. Key Takeaways for Full-Stack & Frontend Interviews

When discussing this feature in software engineering interviews, emphasize:
1. **Transport Trade-offs**: Why WebSockets/SignalR was chosen over HTTP polling (bandwidth, latency, battery life) and SSE (full-duplex vs unidirectional).
2. **State Decoupling**: How `useRef` bridges the gap between persistent WebSocket event callbacks and React's declarative re-render cycle.
3. **Throttling & Resource Efficiency**: Ephemeral broadcasting for typing indicators with 2-second client throttling and 3-second receiver auto-expiration, bypassing database overhead.
4. **Resilient Architecture**: How the infinite request loop was systematically diagnosed and solved using React memoization primitives (`useCallback`, `useMemo`, and callback refs).

---

## 14. Search Engine, Live Quick Preview & Tabbed Results Architecture

### 1. Dual-Entity Search Model
Social search requires querying two fundamentally different entities:
1. **People**: Searching user accounts by display name, `@username`, or bio keywords.
2. **Posts**: Searching content bodies across user posts.

Rather than forcing both into a single homogenous list, Marbook handles them via dedicated backend endpoints (`/users/search` and `/posts/search`) and coordinates them on the frontend.

### 2. Unique Search Bar & Quick Preview Dropdown (`SearchBar.tsx`)

#### A. Distinctive UI Design
Unlike standard social media clones, the search bar incorporates:
- **Smooth Expansion**: Width transitions from `280px` to `380px` smoothly when focused via CSS bezier transitions (`max-width 0.25s cubic-bezier(0.16, 1, 0.3, 1)`).
- **Glow & Border**: Highlighted with Marbook's brand color with a subtle multi-layer focus ring (`0 0 0 3px rgba(24, 119, 242, 0.15)`).
- **Clear Action**: A dynamic `✕` button appears when typing to quickly clear input.

#### B. Global Keyboard Accessibility (`Ctrl+K` / `⌘K`)
- Displays an adaptive OS badge (`Ctrl K` on Windows/Linux, `⌘K` on macOS).
- Listens to global `keydown` events: pressing `Ctrl+K` or `⌘K` from anywhere in the app focuses and selects the search input immediately.
- Pressing `Escape` blurs the input and dismisses any active preview dropdown.

#### C. Debounced Parallel Preview Queries
To keep preview responses snappy without overloading the server:
- **Debounce Window**: 250ms debounce timer via `useRef`.
- **Parallel Dispatch**: Executes `Promise.allSettled([usersApi.searchUsers(term, 1, 3), postsApi.searchPosts(term, 1, 3)])`.
- **Fail-Safe Independence**: Using `Promise.allSettled` guarantees that if post search encounters a temporary network issue, user suggestions still render cleanly without throwing an unhandled exception.
- **Categorized Results**: Top 3 matching people and top 3 matching posts are displayed with avatars and snippets, followed by a `"See all results for '...' →"` trigger.

### 3. Dedicated Search Results Page (`SearchPage.tsx`)

#### A. Deep-Linked Tab Navigation
The search page persists both query and active tab in URL query parameters (`/search?q=alex&type=people`).
- **Tabs**: 🔍 **All** (Top 6 users + post feed), 👥 **People** (full grid), 📝 **Posts** (infinite post list).
- Enables browser back/forward history navigation and shareable linkable search results.

#### B. Modular Reusable User Card (`UserCard.tsx`)
Extracted from `SearchPage.tsx` into a standalone component (`src/components/UserCard.tsx`):
- Displays user avatar, name, `@username`, bio preview, and follower counter.
- **Optimistic Follow / Unfollow**: Toggling follow immediately flips button state and increments/decrements follower count locally. If the API rejects the request, state automatically rolls back to previous values.
- **Direct Messaging Trigger**: Includes a quick 💬 action button that opens `/messages?conversationId={userId}`.

#### C. Full Post Integration (`PostCard.tsx`)
- Reuses the existing `<PostCard />` component for search results.
- Preserves full post interaction capabilities: like/unlike animations, media viewer lightbox, and comment thread modal integration directly from search results.

### 4. Key Takeaways for Frontend Interviews

- **"Why debounce search input instead of throttling?"**
  > *"Throttling fires periodically (e.g., every 300ms) regardless of whether the user is still typing, which still sends unwanted requests mid-word. Debouncing waits until the user pauses typing for a set window (250ms), sending only a single request for the completed token."*
- **"Why `Promise.allSettled` over `Promise.all` for multi-category search?"**
  > *"`Promise.all` fails fast if any single promise rejects, meaning an error in post search would discard all user search results. `Promise.allSettled` waits for all requests to finish, allowing us to display whatever results succeeded."*
- **"Why extract `UserCard` into its own component?"**
  > *"Component modularity keeps page controllers focused on query orchestration and pagination, reduces file size, and allows `UserCard` to be reused across Followers modals, Following lists, and Explore pages."*




---

## 15. Facebook-Style Fixed & Sticky Responsive Layout Architecture

### The Problem
Traditional web layouts scroll the entire page, forcing users to scroll back to the very top just to access navigation links, search, or check notifications. Furthermore, restricting the page container to a narrow centered width (e.g., `1280px` centered) creates an awkward visual disconnect on desktop displays: the fixed navbar stretches edge-to-edge with the brand logo at the far left edge, while the sidebar rail sits hundreds of pixels inwards. When users un-maximize or snap the window to half-screen, rigid flex containers with `justify-content: center` push the left panel offscreen into negative coordinates.

### Architectural Solution

#### 1. Fixed Viewport Header (`Navbar.tsx`)
- Configured with `position: fixed; top: 0; left: 0; right: 0; height: 56px; z-index: 1000;`.
- Uses backdrop blur (`backdrop-filter: blur(12px)`) with surface alpha transparency to produce a frosted glass effect over scrolling content.
- Cleaned of redundant search inputs, hosting the brand logo on the far left and action hubs (Messenger, Notifications, Account Profile Dropdown) on the far right.

#### 2. Synchronized Edge-to-Edge Column Alignment
- Both `Navbar.tsx` and `.app-layout-shell` share identical padding bounds:
  ```css
  .app-navbar {
    padding: 0 24px;
  }
  .app-layout-shell {
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 1920px;
    margin: 0 auto;
    padding: 68px 24px 0;
    gap: 24px;
  }
  ```
- **Column Lock**: The Left Navigation Rail's left edge starts at the exact same `24px` column coordinate as the Marshmallow brand logo in the navbar. The Right Auxiliary Rail's right edge ends at the exact same `24px` column coordinate as the navbar account avatar.
- **Centered Feed**: The center stream (`.app-center-stream`) uses `flex: 1; max-width: 680px; margin: 0 auto;`, keeping the main social feed centered between rails.

#### 3. Sticky Rails with Safe Vertical Overflow
- `.app-left-rail` uses `position: sticky; top: 68px; height: calc(100vh - 80px); max-height: calc(100vh - 80px);`.
- Rather than using `justify-content: space-between` (which causes top-boundary clipping when vertical viewport height is low), the rail uses `display: flex; flex-direction: column;` with `margin-top: auto;` on the bottom user card.
- Incorporates a subtle, narrow scrollbar (`scrollbar-width: thin;`) so navigation is always fully accessible even on short laptops.

#### 4. Responsive Icon-Rail Collapse for Minimized / Snapped Windows
- When the window is snapped or resized to half-screen (`@media (max-width: 1023px)`):
  - The right sidebar hides smoothly (`display: none;`).
  - The left rail collapses from `250px` to a sleek `64px` icon rail.
  - Nav pills collapse to `44x44px` circular buttons showing only icons with native tooltips and badge counters.
  - The "Roast a Post" button collapses to a circular `44x44px` button with the `✏️` icon.
  - The user profile card collapses to the circular user avatar.
  - `justify-content: space-between` ensures the rail is anchored to `left: 16px`, preventing off-screen clipping.

---

## 16. Settings Page & Account Security Lifecycle Architecture

### Overview (`SettingsPage.tsx`)
A dedicated user configuration hub registered under the protected route `/settings` and accessible via both the Left Navigation Rail and the Navbar Profile Dropdown Menu. It manages account security, themes, and notification preferences without requiring page reloads.

### Tabbed Layout Structure
1. **🔒 Account & Security**:
   - **Verified Identity Summary**: Displays avatar, display name, email, username, and account verification badge.
   - **Password Rotation Form**:
     - Current password, new password (minimum 6 characters), and confirm password fields.
     - Eye toggles for showing/hiding plaintext passwords.
     - Client-side validation preventing submission if passwords mismatch or do not meet length requirements.
     - Calls `usersApi.changePassword({ currentPassword, newPassword })` with animated `MarshmallowLoader` feedback and error banners.
   - **Danger Zone (Delete Account)**:
     - Prominently isolated with warning callouts explaining irreversible cascade deletion.
     - Confirmation modal requiring explicit password verification before calling `usersApi.deleteAccount({ password })`.
     - Automatically clears tokens, logs the user out, and redirects to `/login`.
2. **🎨 Appearance**:
   - Visual card selectors for "Toasted Cream" (Light) and "Campfire Cocoa" (Dark).
   - Instant live preview switching via `useTheme()`.
3. **🔔 Notifications**:
   - Granular toggle preferences for Likes, Comments, Mentions, and Direct Messages.
   - Persisted in browser `localStorage` for persistent personalization.

---

## 17. Unified Live Debounced Discovery Engine & Dynamic Explore Feed

### Problem
Having search bars in both the top navbar and the Explore page created user confusion. Furthermore, opening the Explore page previously showed an empty search input with no content until a term was typed and Enter was pressed.

### Solution (`SearchPage.tsx`)
1. **Consolidated Search Hub**: Removed the search bar from the navbar, designating `/search` as the single discovery destination.
2. **Instant Debounced Live Search (280ms)**:
   - Typing into the search bar automatically triggers an instant debounced search query after 280ms of inactivity.
   - Users get immediate matching results for users and posts without having to press Enter.
   - A mini campfire marshmallow loader animates inside the search bar while live requests are in flight.
3. **Dynamic Explore Feed on Empty Query**:
   - When the search query is empty (`query === ""`), Explore automatically loads and renders a stream of recent posts via `postsApi.getAll(1, 10)` alongside suggested creators.
   - Full post interactions (likes, comments modal, author links) remain active directly within the Explore feed.
