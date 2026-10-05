import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 20px",
        borderBottom: "1px solid #ddd",
      }}
    >
      <Link to="/" style={{ textDecoration: "none", fontWeight: "bold" }}>
        Marbook
      </Link>

      <div style={{ display: "flex", gap: "12px" }}>
        {isAuthenticated ? (
          <button type="button" onClick={logout}>
            Logout
          </button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
