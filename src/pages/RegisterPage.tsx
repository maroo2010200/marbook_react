import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [isResendError, setIsResendError] = useState(false);
  const navigate = useNavigate();

  const { register, resendVerificationEmail } = useAuth();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    try {
      await register({
        email,
        name,
        username: username || null,
        password,
        birthdate,
      });
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Register failed");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage("");
    setIsResendError(false);
    try {
      const result = await resendVerificationEmail(email);
      setResendMessage(result);
    } catch (err) {
      setIsResendError(true);
      if (axios.isAxiosError(err)) {
        setResendMessage(
          err.response?.data?.message ?? err.message ?? "Resend failed",
        );
      } else {
        setResendMessage("Something went wrong. Please try again.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: "40px auto",
          padding: "32px 28px",
          backgroundColor: "var(--bg-card)",
          borderRadius: 12,
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-md)",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#2b8a3e", margin: "0 0 14px", fontSize: 24 }}>Registration successful!</h1>

        {/* 1. Only show the original message if resendMessage hasn't been set yet */}
        {!resendMessage && (
          <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.5 }}>
            We've sent a verification email to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>. Please
            check your inbox and click the verification link to activate your
            account.
          </p>
        )}

        {/* 2. Display the message once the button is clicked (Green for success, Red for error) */}
        {resendMessage && (
          <p style={{ color: isResendError ? "#e02424" : "#2b8a3e", marginTop: "8px", fontSize: 14 }}>{resendMessage}</p>
        )}

        {/* 3. Button Container to keep spacing uniform and prevent alignment breaks */}
        <div style={{ marginTop: "24px", display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          {email && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              style={{
                backgroundColor: resendLoading ? "var(--bg-hover)" : "orange",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: resendLoading ? "not-allowed" : "pointer",
                opacity: resendLoading ? 0.7 : 1,
                fontWeight: 600,
              }}
            >
              {resendLoading ? "Resending..." : "Resend verification email"}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setSuccess(false);
              setError("");
              setResendMessage("");
              setIsResendError(false);
              navigate("/login");
            }}
            style={{
              backgroundColor: "var(--bg-hover)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "40px auto",
        padding: "32px 28px",
        backgroundColor: "var(--bg-card)",
        borderRadius: 12,
        border: "1px solid var(--border-color)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <h1
        style={{
          margin: "0 0 20px",
          fontSize: 26,
          fontWeight: 700,
          color: "var(--text-primary)",
          textAlign: "center",
        }}
      >
        Create a New Account
      </h1>

      {error && (
        <div
          style={{
            backgroundColor: "#ffebe8",
            color: "#e02424",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <input
          type="email"
          placeholder="Email *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Full Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Username (optional)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password *"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="date"
          placeholder="Birthdate *"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          required
        />

        <button
          type="submit"
          style={{
            marginTop: 6,
            padding: "12px",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;
