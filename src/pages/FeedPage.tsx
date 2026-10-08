import { useAuth } from "../context/AuthContext";
import { usePosts } from "../hooks/usePosts";

function FeedPage() {
  const { user } = useAuth();
  const { posts, loading, error } = usePosts();

  return (
    <div style={{ padding: "20px", maxWidth: 800, margin: "0 auto" }}>
      <h1>Feed</h1>
      <p>Hello, {user?.name ?? "there"}!</p>
      

      {loading && <p style={{padding: "20px"}}>Loading your feed...</p>}

      {error && <p style={{color: "red", padding: "20px"}}>{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <p>No posts yet.</p>
      )}

      {!loading &&
        posts.map((post) => (
          <article
            key={post.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <strong>{post.userName}</strong>
            <p>{post.content}</p>
            <small>
              {new Date(post.createdAt).toLocaleString()}
            </small>
          </article>
        ))}
    </div>
  );
}

export default FeedPage;