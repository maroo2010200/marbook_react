import { useAuth } from "../context/AuthContext"

function HomePage() {
  const { token, user, logout} = useAuth();

  console.log("token from context", token);
  console.log("user from context", user);
  return (
    <div>
      <h1>Welcome to Marbook</h1>
      <button type="button" onClick={logout}>Logout</button>
    </div>
  )
}

export default HomePage