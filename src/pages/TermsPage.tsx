import { Link } from "react-router-dom";
import { MarshmallowLogo } from "../components/MarshmallowLogo";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function TermsPage() {
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
              backgroundColor: "rgba(201, 107, 50, 0.12)",
              color: "var(--primary)",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 14,
            }}
          >
            <span>📜</span>
            <span>Community Guidelines & Legal Agreement</span>
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
            Terms of Service
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
            These terms define the rules for participating in the Marshmallow community.
            By gathering around our campfire, you agree to treat fellow members with warmth,
            respect community safety, and follow these simple standards.
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
            <span>⏱️ 3 min read</span>
            <span>•</span>
            <Link
              to="/privacy"
              style={{
                color: "var(--primary)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              View Privacy Policy →
            </Link>
          </div>
        </div>

        {/* Policy Sections */}
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
              1. Acceptance of Terms
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              By creating an account, browsing the feed, or using any feature on Marshmallow, you agree to
              be bound by these Terms of Service and our{" "}
              <Link to="/privacy" style={{ color: "var(--primary)", fontWeight: 600 }}>
                Privacy Policy
              </Link>
              . If you do not agree to these terms, you may not register or use the service.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
              2. Campfire Code of Conduct (Community Safety)
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 10px" }}>
              Marshmallow is built on friendliness and mutual respect. To keep our community safe for everyone:
            </p>
            <ul style={{ paddingLeft: 20, color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>
                <strong>No Harassment or Bullying:</strong> Do not threaten, stalk, intimidate, or demean others.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>Respectful Roasting:</strong> While Marshmallow features friendly &ldquo;Roasts&rdquo; (our campfire-themed equivalent of likes and cheerful banter), malicious insults, hate speech, racism, or attacks on protected characteristics are strictly forbidden.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>No Illegal or Harmful Content:</strong> You must not upload or share content that is illegal, defamatory, sexually exploitative, promotes self-harm, or encourages violence.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>No Impersonation or Deception:</strong> You may not impersonate real people, brands, or staff members, nor use deceptive usernames.
              </li>
              <li>
                <strong>No Spam or Abuse:</strong> Automated bot posting, mass unsolicited messaging, scraping, and platform attacks are strictly forbidden.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
              3. Account Security & Eligibility
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 10px" }}>
              To ensure safety across the platform:
            </p>
            <ul style={{ paddingLeft: 20, color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>
                <strong>Minimum Age:</strong> You must be at least 13 years old (or the legal age required in your country) to register an account.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>Credential Safety:</strong> You are responsible for safeguarding your password. Do not share your login credentials with anyone.
              </li>
              <li>
                <strong>Account Responsibility:</strong> You are responsible for all activity conducted through your registered account.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
              4. Content Ownership & Rights
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "0 0 10px" }}>
              <strong>You own your content:</strong> Marshmallow does not claim ownership over the text, images, or ideas you post.
            </p>
            <ul style={{ paddingLeft: 20, color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>
                <strong>Hosting License:</strong> By posting content, you grant Marshmallow a worldwide, royalty-free license solely to host, cache, route, display, and format your content as directed by your visibility settings (Public, Followers, or Private).
              </li>
              <li>
                <strong>Attribution on Reposts:</strong> When other users repost your public posts, Marshmallow automatically credits and preserves your original authorship.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
              5. Account Termination & Enforcement
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              We reserve the right to suspend or terminate accounts, or remove content, that violates these
              Terms of Service or harms the community. You may also delete your account at any time with zero
              penalty through your Settings page.
            </p>
          </section>

          {/* Section 6 */}
          <section style={{ borderTop: "1px solid var(--divider)", paddingTop: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              6. Disclaimers & Updates
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              Marshmallow is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.
              We may update these terms from time to time. Any material updates will be clearly reflected
              on this page with an updated effective date.
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
