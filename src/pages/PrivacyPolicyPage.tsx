import { Link } from "react-router-dom";
import { MarshmallowLogo } from "../components/MarshmallowLogo";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function PrivacyPolicyPage() {
  const { isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-page)",
        color: "var(--text-primary)",
        paddingBottom: 60,
      }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-card)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            to={isAuthenticated ? "/feed" : "/"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <MarshmallowLogo size={32} />
            <span style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>
              Marshmallow
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                background: "none",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-full)",
                padding: "6px 12px",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{isDark ? "☀️" : "🌙"}</span>
              <span>{isDark ? "Light" : "Dark"}</span>
            </button>

            <Link
              to={isAuthenticated ? "/feed" : "/login"}
              style={{
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                padding: "7px 16px",
                borderRadius: "var(--radius-full)",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(201, 107, 50, 0.25)",
              }}
            >
              {isAuthenticated ? "Back to Feed →" : "Log In →"}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{ maxWidth: 880, margin: "0 auto", padding: "36px 20px 0" }}>
        {/* Hero Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 36,
            padding: "30px 24px",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              color: "#059669",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 14,
            }}
          >
            <span>🛡️</span>
            <span>Zero-Leak & Data Protection Guarantee</span>
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: "0 0 10px",
              letterSpacing: "-0.5px",
            }}
          >
            Privacy Policy & Data Safety
          </h1>

          <p
            style={{
              fontSize: 15,
              color: "var(--text-secondary)",
              maxWidth: 620,
              margin: "0 auto 16px",
              lineHeight: 1.6,
            }}
          >
            At Marshmallow, your privacy and trust are sacred. We believe social media should be a cozy,
            safe campfire — not a surveillance engine. Here is our plain-language commitment to protecting
            your identity, content, and personal information.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              fontSize: 12,
              color: "var(--text-tertiary)",
              flexWrap: "wrap",
            }}
          >
            <span>📅 Last Updated: November 2026</span>
            <span>•</span>
            <span>⏱️ 4 min read</span>
            <span>•</span>
            <Link
              to="/terms"
              style={{
                color: "var(--primary)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              View Terms of Service →
            </Link>
          </div>
        </div>

        {/* Security Highlights Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              padding: "20px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🚫</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>Never Sold or Shared</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              We never sell, rent, or monetize your personal data or browsing activity with third-party advertisers or brokers.
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔐</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>Encrypted Credentials</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              Passwords are salted and cryptographically hashed. We never see or store your raw password in plain text.
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>SSL / TLS In Transit</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              All network communications and database connections on Neon use mandatory SSL encryption.
            </p>
          </div>
        </div>

        {/* Full Policy Sections */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-color)",
            padding: "32px 28px",
            boxShadow: "var(--shadow-card)",
            display: "flex",
            flexDirection: "column",
            gap: 28,
            lineHeight: 1.65,
          }}
        >
          {/* Section 1 */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
              1. Our Zero-Leak & No-Sale Pledge
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 10px" }}>
              Your trust is our highest priority. We explicitly promise that:
            </p>
            <ul style={{ paddingLeft: 20, color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>
                <strong>We will never sell your personal information</strong> to data brokers, ad networks, or external companies.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>We do not run tracking cookies</strong> across external websites to monitor your online behavior outside Marshmallow.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>We do not train third-party AI models</strong> on your private chats, direct messages, or private posts.
              </li>
              <li>
                <strong>No hidden telemetry:</strong> Only the bare minimum diagnostic logs needed to maintain service stability and prevent spam are collected.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
              2. What Information We Collect & Why
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 10px" }}>
              We only collect data necessary to provide a functioning social network:
            </p>
            <ul style={{ paddingLeft: 20, color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>
                <strong>Account Credentials:</strong> Your display name, unique @handle (username), email address (used for secure login and email verification), birthdate (to verify you meet the age requirement of 13+), and an encrypted password hash.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>Profile Details (Optional):</strong> Your bio, profile avatar photo, and profile cover image.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>User Content:</strong> The posts you write, photos you upload, comments you leave, roasts (likes) you give, and reposts you share.
              </li>
              <li>
                <strong>Direct Communications:</strong> 1-on-1 private chat messages sent between you and other users on the platform.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
              3. How We Store & Secure Your Data
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 10px" }}>
              We employ strict, modern security engineering practices across every layer of the application:
            </p>
            <ul style={{ paddingLeft: 20, color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>
                <strong>Password Protection:</strong> Passwords are transformed using industry-standard one-way cryptographic hashing algorithms with individual cryptographic salts. Neither our team nor anyone else can reverse or read your password.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>Database Encryption:</strong> Our PostgreSQL database on Neon runs in enterprise-grade AWS data centers with hardware encryption at rest (AES-256) and mandatory TLS/SSL communication links (`SSL Mode=Require`).
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>Authentication Tokens:</strong> Sessions use JSON Web Tokens (JWT) signed with high-entropy cryptographic keys, expiring automatically to prevent session hijacking.
              </li>
              <li>
                <strong>Rate Limiting & Abuse Prevention:</strong> Authentication, posting, and search endpoints are guarded by rate limiters to deflect brute-force attacks and automated scrapers.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
              4. Audience & Visibility Controls
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 10px" }}>
              You maintain total control over who sees every piece of content you post:
            </p>
            <ul style={{ paddingLeft: 20, color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>
                <strong>Public:</strong> Available to all registered users on Marshmallow and visible across the community feed.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>Followers Only:</strong> Restricted exclusively to accounts that follow your profile. Non-followers cannot see these posts.
              </li>
              <li>
                <strong>Private (Only Me):</strong> Accessible only to you. Perfect for personal notes, drafts, or private archives.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
              5. Private Messages & Chat Confidentiality
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 10px" }}>
              Direct messages sent through the Marshmallow Chat Dock are private between the conversation
              participants. Only users in the conversation can view the messages. Real-time message events
              are delivered exclusively over authenticated SignalR sockets scoped to the recipient’s user ID.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
              6. Your Rights: Right to Edit, Delete & Erasure
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 10px" }}>
              In full accordance with global privacy principles (including GDPR and CCPA ideals):
            </p>
            <ul style={{ paddingLeft: 20, color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>
                <strong>Right to Edit:</strong> You can edit your posts, bio, and profile details whenever you choose.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>Right to Delete:</strong> You can permanently delete any post, photo, or comment. When deleted, it is removed immediately from the database and public caches.
              </li>
              <li>
                <strong>Right to Account Erasure:</strong> You can permanently delete your entire account and all associated data at any time from your <strong>Settings &rarr; Account Information</strong> page.
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section style={{ borderTop: "1px solid var(--divider)", paddingTop: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              7. Questions & Data Protection Inquiries
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              If you have any questions about this Privacy Policy, your personal data, or security concerns,
              please reach out through your account settings or open an inquiry on our{" "}
              <a
                href="https://github.com/maroo2010200"
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "underline" }}
              >
                GitHub Community
              </a>
              .
            </p>
          </section>
        </div>

        {/* Bottom Navigation Link */}
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Link
            to={isAuthenticated ? "/feed" : "/register"}
            style={{
              color: "var(--primary)",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            ← {isAuthenticated ? "Return to Marshmallow Feed" : "Ready to join? Sign Up Now"}
          </Link>
        </div>
      </main>
    </div>
  );
}
