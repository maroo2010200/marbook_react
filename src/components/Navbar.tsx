import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 24px",
        backgroundColor: "#fff",
        borderBottom: "1px solid #e4e6eb",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <Link
        to={isAuthenticated ? "/feed" : "/"}
        style={{
          textDecoration: "none",
          fontWeight: 800,
          fontSize: 22,
          color: "#1877f2",
          letterSpacing: "-0.5px",
        }}
      >
        Marbook
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {isAuthenticated ? (
          <>
            <Link
              to="/profile/me"
              style={{
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
                color: "#1c1e21",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 10px 4px 6px",
                borderRadius: 20,
                backgroundColor: "#f0f2f5",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#e4e6eb")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#f0f2f5")
              }
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: "#1877f2",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {(user?.name || "U")[0].toUpperCase()}
              </div>
              <span>{user?.name ?? "Profile"}</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                backgroundColor: "transparent",
                border: "1px solid #ccd0d5",
                borderRadius: 6,
                padding: "6px 12px",
                color: "#65676b",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#ffebe8";
                e.currentTarget.style.color = "#e02424";
                e.currentTarget.style.borderColor = "#f97583";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#65676b";
                e.currentTarget.style.borderColor = "#ccd0d5";
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              style={{
                textDecoration: "none",
                color: "#1877f2",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Login
            </Link>
            <Link
              to="/register"
              style={{
                textDecoration: "none",
                backgroundColor: "#1877f2",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                padding: "6px 14px",
                borderRadius: 6,
              }}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
