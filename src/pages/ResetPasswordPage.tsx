import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { resetPassword } from "../api/auth";
import { MarshmallowLogo } from "../components/MarshmallowLogo";
import { MarshmallowLoader } from "../components/MarshmallowLoader";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing or invalid password reset token.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please make sure both passwords are the same.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ??
            "Invalid or expired password reset link. Please request a new one."
        );
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
            {success ? "Password Updated! 🎉" : "Set New Password"}
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            {success
              ? "Your password has been changed. You can now log in to the campfire."
              : "Choose a secure password of at least 6 characters for your account."}
          </p>
        </div>

        {/* Missing Token Warning */}
        {!token && !success && (
          <div>
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                lineHeight: 1.5,
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              Missing or expired password reset link. Please request a new link to proceed.
            </div>

            <Link
              to="/forgot-password"
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
                display: "inline-block",
                boxSizing: "border-box",
                boxShadow: "0 4px 14px rgba(201, 107, 50, 0.35)",
              }}
            >
              Request New Link →
            </Link>
          </div>
        )}

        {/* Success State */}
        {success && (
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
              Your password has been reset successfully.
            </div>

            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                border: "none",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(201, 107, 50, 0.35)",
              }}
            >
              Go to Login →
            </button>
          </div>
        )}

        {/* Reset Form */}
        {token && !success && (
          <>
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
                {error.toLowerCase().includes("expired") && (
                  <div style={{ marginTop: "6px" }}>
                    <Link
                      to="/forgot-password"
                      style={{
                        color: "var(--primary)",
                        fontWeight: 700,
                        textDecoration: "underline",
                        fontSize: "12px",
                      }}
                    >
                      Request a fresh reset link →
                    </Link>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* New Password */}
              <div>
                <label
                  htmlFor="new-password"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "6px",
                  }}
                >
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "12px 40px 12px 14px",
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
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: 0,
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirm-password"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "6px",
                  }}
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
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
                {loading ? "Updating password..." : "Set New Password"}
              </button>

              {loading && (
                <div style={{ textAlign: "center", marginTop: "2px" }}>
                  <MarshmallowLoader size="sm" label="Updating your credentials..." />
                </div>
              )}
            </form>

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
              <Link
                to="/login"
                style={{
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                ← Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

