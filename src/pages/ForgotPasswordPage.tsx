import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { forgotPassword } from "../api/auth";
import { MarshmallowLogo } from "../components/MarshmallowLogo";
import { MarshmallowLoader } from "../components/MarshmallowLoader";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/feed" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError("");
    setLoading(true);

    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Failed to request password reset. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
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
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
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
            {submitted ? "Check Your Email" : "Forgot Password?"}
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            {submitted
              ? `We sent reset instructions to ${email}. Check your inbox to set a new password.`
              : "Enter your account email and we'll send you a link to reset your campfire password."}
          </p>
        </div>

        {submitted ? (
          <div>
            <div
              style={{
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                color: "#16a34a",
                border: "1px solid rgba(34, 197, 94, 0.25)",
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                lineHeight: 1.5,
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              ✉️ Link sent! The reset link expires in <strong>1 hour</strong>. If you don't see it, be sure to check your spam folder.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                to="/login"
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--primary)",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 700,
                  textAlign: "center",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(201, 107, 50, 0.35)",
                  display: "inline-block",
                  boxSizing: "border-box",
                }}
              >
                Back to Login →
              </Link>

              <button
                type="button"
                onClick={() => setSubmitted(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-tertiary)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "6px",
                }}
              >
                Try a different email
              </button>
            </div>
          </div>
        ) : (
          <>
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
                {error}
              </div>
            )}

            {/* Forgot Password Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label
                  htmlFor="forgot-email"
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
                  id="forgot-email"
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
                {loading ? "Sending link..." : "Send Reset Link"}
              </button>

              {loading && (
                <div style={{ textAlign: "center", marginTop: "2px" }}>
                  <MarshmallowLoader size="sm" label="Sending reset link..." />
                </div>
              )}
            </form>

            {/* Back to Login */}
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
              Remembered your password?{" "}
              <Link
                to="/login"
                style={{
                  color: "var(--primary)",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Back to Login →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

