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
    try {
      const result = await resendVerificationEmail(email);
      setResendMessage(result);
    } catch (err) {
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
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1 style={{ color: "green" }}>Registration successful!</h1>

        {/* 1. Only show the original message if resendMessage hasn't been set yet */}
        {!resendMessage && (
          <p style={{ color: "green" }}>
            We've sent a verification email to <strong>{email}</strong>. Please
            check your inbox and click the verification link to activate your
            account.
          </p>
        )}

        {email && (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            style={{
              marginTop: "16px",
              backgroundColor: "orange",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {resendLoading ? "Resending..." : "Resend verification email"}
          </button>
        )}

        {/* 2. Display the success message once the button is clicked */}
        {resendMessage && (
          <p style={{ color: "green", marginTop: "8px" }}>{resendMessage}</p>
        )}

        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setError("");
            navigate("/login");
          }}
          style={{
            marginTop: "16px",
            marginLeft: "8px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Register</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="date"
          placeholder="Birthdate"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
        />

        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default RegisterPage;
