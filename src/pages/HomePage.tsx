import { useAuth } from "../context/AuthContext"

function HomePage() {
  const { token, user } = useAuth();

  console.log("token from context", token);
  console.log("user from context", user);
  return (
    <div>
      <h1>Welcome to Marbook</h1>
    </div>
  )
}

export default HomePage