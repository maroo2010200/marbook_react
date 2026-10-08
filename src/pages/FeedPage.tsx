import { useAuth } from "../context/AuthContext";

function FeedPage() {
  const { user } = useAuth();
console.log(user);

  return (
    <div style={{ padding: "20px", maxWidth: 800, margin: "0 auto" }}>
      <h1>Feed</h1>
      <p>Hello, {user?.name ?? "there"}!</p>
      <p>This is your feed. Posts will appear here.</p>
    </div>
  );
}

export default FeedPage;