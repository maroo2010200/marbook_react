import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Navigate, Link } from "react-router-dom";
import axios from "axios";
import { MarshmallowLogo } from "../components/MarshmallowLogo";
import { MarshmallowLoader } from "../components/MarshmallowLoader";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resendError, setResendError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();
  const { login, resendVerificationEmail, isAuthenticated } = useAuth();

  // If already authenticated, redirect straight to feed
  if (isAuthenticated) {
    return <Navigate to="/feed" replace />;
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setResendError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/feed");
    } catch (err: any) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setResendError("");
    setResendLoading(true);
    try {
      const result = await resendVerificationEmail(email);
      setResendError(result);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setResendError(
          err.response?.data?.message ?? err.message ?? "Resend failed",
        );
      } else {
        setResendError("Resend failed. Please try again.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        backgroundColor: "var(--bg-page)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Warm Ambient Glow */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "350px",
          background:
            "radial-gradient(circle, rgba(201, 107, 50, 0.12) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: "420px",
          width: "100%",
          padding: "36px 32px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-lg)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header with Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              margin: "0 auto 14px",
              borderRadius: "50%",
              backgroundColor: "var(--primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--primary)",
              boxShadow: "0 4px 16px rgba(201, 107, 50, 0.2)",
            }}
          >
            <MarshmallowLogo size={32} />
          </div>

          <h1
            style={{
              margin: "0 0 6px",
              fontSize: "24px",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.5px",
            }}
          >
            Welcome Back
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "var(--text-secondary)",
            }}
          >
            Pull up a chair by the campfire
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              fontSize: "13px",
              marginBottom: "18px",
              lineHeight: 1.4,
            }}
          >
            <div>{error}</div>

            {error.toLowerCase().includes("verify") ? (
              <div style={{ marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  {resendLoading ? "Sending verification email..." : "Resend verification email →"}
                </button>
              </div>
            ) : (
              <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
                Forgot your password?{" "}
                <Link
                  to="/forgot-password"
                  style={{
                    color: "var(--primary)",
                    fontWeight: 700,
                    textDecoration: "underline",
                  }}
                >
                  Reset it here →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              htmlFor="login-email"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "6px",
              }}
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "14px",
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
            />
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <label
                htmlFor="login-password"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Password
              </label>

              <Link
                to="/forgot-password"
                style={{
                  fontSize: "12px",
                  color: "var(--primary)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Forgot password?
              </Link>
            </div>

            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "14px",
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              padding: "13px",
              borderRadius: "var(--radius-full)",
              backgroundColor: loading ? "var(--bg-hover)" : "var(--primary)",
              color: loading ? "var(--text-secondary)" : "#ffffff",
              border: "none",
              fontSize: "15px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 14px rgba(201, 107, 50, 0.35)",
              transition: "transform 0.15s ease, background-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? "Signing in..." : "Log In to Marshmallow"}
          </button>

          {/* Mini Marshmallow Loader when loading */}
          {loading && (
            <div style={{ textAlign: "center", marginTop: "2px" }}>
              <MarshmallowLoader
                size="sm"
                label="Toasting credentials over the fire..."
              />
            </div>
          )}
        </form>

        {resendError && (
          <p
            style={{
              color: "#2b8a3e",
              fontSize: "13px",
              textAlign: "center",
              marginTop: "14px",
              lineHeight: 1.4,
            }}
          >
            {resendError}
          </p>
        )}

        {/* Switch to Register */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid var(--divider)",
            textAlign: "center",
            fontSize: "14px",
            color: "var(--text-secondary)",
          }}
        >
          New to the campfire?{" "}
          <Link
            to="/register"
            style={{
              color: "var(--primary)",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Join Marshmallow →
          </Link>
        </div>
      </div>
    </div>
  );
}
