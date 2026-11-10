import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { usersApi } from "../api/users";
import { MainLayout } from "../components/layout/MainLayout";
import { Avatar } from "../components/Avatar";
import { MarshmallowLoader } from "../components/MarshmallowLoader";

type SettingsTab = "account" | "appearance" | "notifications";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Delete Account state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Notification toggles (persisted in localStorage)
  const [notifyLikes, setNotifyLikes] = useState(() => {
    return localStorage.getItem("marshmallow_pref_likes") !== "false";
  });
  const [notifyComments, setNotifyComments] = useState(() => {
    return localStorage.getItem("marshmallow_pref_comments") !== "false";
  });
  const [notifyMentions, setNotifyMentions] = useState(() => {
    return localStorage.getItem("marshmallow_pref_mentions") !== "false";
  });
  const [notifyMessages, setNotifyMessages] = useState(() => {
    return localStorage.getItem("marshmallow_pref_messages") !== "false";
  });

  // Handle password submit
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await usersApi.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(res.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setPasswordError(
        axiosError.response?.data?.message ||
          "Failed to change password. Please ensure your current password is correct."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Please enter your password to confirm deletion.");
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await usersApi.deleteAccount(deletePassword);
      logout();
      navigate("/register");
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setDeleteError(
        axiosError.response?.data?.message ||
          "Failed to delete account. Incorrect password."
      );
      setDeleteLoading(false);
    }
  };

  const handleTogglePref = (
    key: string,
    current: boolean,
    setter: (val: boolean) => void
  ) => {
    const next = !current;
    setter(next);
    localStorage.setItem(key, String(next));
  };

  return (
    <MainLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Page Header */}
        <div
          className="social-widget-card"
          style={{
            padding: "20px 24px",
            background:
              "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-hover) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>⚙️</span>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.3px",
                }}
              >
                Settings &amp; Privacy
              </h1>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                }}
              >
                Manage your account credentials, theme preferences, and security
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 18,
              borderTop: "1px solid var(--border-color)",
              paddingTop: 14,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("account")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: "var(--radius-full)",
                border: "none",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor:
                  activeTab === "account"
                    ? "var(--primary)"
                    : "var(--bg-hover)",
                color: activeTab === "account" ? "#fff" : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              <span>🔒</span>
              <span>Account &amp; Security</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("appearance")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: "var(--radius-full)",
                border: "none",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor:
                  activeTab === "appearance"
                    ? "var(--primary)"
                    : "var(--bg-hover)",
                color:
                  activeTab === "appearance" ? "#fff" : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              <span>🎨</span>
              <span>Appearance</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: "var(--radius-full)",
                border: "none",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor:
                  activeTab === "notifications"
                    ? "var(--primary)"
                    : "var(--bg-hover)",
                color:
                  activeTab === "notifications"
                    ? "#fff"
                    : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              <span>🔔</span>
              <span>Notifications</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ACCOUNT & SECURITY */}
        {activeTab === "account" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Account Overview */}
            <div className="social-widget-card" style={{ padding: "20px" }}>
              <h2
                style={{
                  margin: "0 0 16px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Account Information
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-hover)",
                }}
              >
                <Avatar src={user?.avatarUrl} name={user?.name} size={48} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: "var(--text-primary)",
                    }}
                  >
                    {user?.name}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      marginTop: 2,
                    }}
                  >
                    @{user?.username || "user"} · {user?.email}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: "rgba(34, 197, 94, 0.12)",
                    color: "#16a34a",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <span>✓</span>
                  <span>Verified</span>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="social-widget-card" style={{ padding: "20px" }}>
              <div style={{ marginBottom: 16 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Change Password
                </h2>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}
                >
                  Update your password to keep your Marshmallow account secure
                </p>
              </div>

              {passwordError && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    color: "#dc2626",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "rgba(34, 197, 94, 0.12)",
                    border: "1px solid rgba(34, 197, 94, 0.25)",
                    color: "#16a34a",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  ✓ {passwordSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  {/* Current Password */}
                  <div>
                    <label
                      htmlFor="current-pw"
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: 6,
                      }}
                    >
                      Current Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="current-pw"
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        style={{
                          width: "100%",
                          padding: "10px 42px 10px 14px",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-color)",
                          backgroundColor: "var(--bg-input)",
                          color: "var(--text-primary)",
                          fontSize: 14,
                          boxSizing: "border-box",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw((prev) => !prev)}
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-secondary)",
                          fontSize: 14,
                          padding: 4,
                        }}
                      >
                        {showCurrentPw ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label
                      htmlFor="new-pw"
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: 6,
                      }}
                    >
                      New Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="new-pw"
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        style={{
                          width: "100%",
                          padding: "10px 42px 10px 14px",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-color)",
                          backgroundColor: "var(--bg-input)",
                          color: "var(--text-primary)",
                          fontSize: 14,
                          boxSizing: "border-box",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw((prev) => !prev)}
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-secondary)",
                          fontSize: 14,
                          padding: 4,
                        }}
                      >
                        {showNewPw ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirm-pw"
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: 6,
                      }}
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="confirm-pw"
                      type={showNewPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-input)",
                        color: "var(--text-primary)",
                        fontSize: 14,
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      style={{
                        padding: "10px 22px",
                        borderRadius: "var(--radius-full)",
                        border: "none",
                        backgroundColor: "var(--primary)",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: passwordLoading ? "not-allowed" : "pointer",
                        boxShadow: "var(--shadow-sm)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {passwordLoading ? (
                        <>
                          <MarshmallowLoader size="sm" inline label={null} />
                          <span>Updating...</span>
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Danger Zone */}
            <div
              className="social-widget-card"
              style={{
                padding: "20px",
                borderColor: "rgba(239, 68, 68, 0.35)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#dc2626",
                }}
              >
                ⚠️ Danger Zone
              </h2>
              <p
                style={{
                  margin: "6px 0 16px",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                Permanently delete your Marshmallow account. All your posts,
                comments, messages, and profile data will be permanently wiped.
                This action is irreversible.
              </p>

              <button
                type="button"
                onClick={() => {
                  setDeletePassword("");
                  setDeleteError(null);
                  setIsDeleteModalOpen(true);
                }}
                style={{
                  padding: "9px 18px",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid #dc2626",
                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                  color: "#dc2626",
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#dc2626";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(239, 68, 68, 0.08)";
                  e.currentTarget.style.color = "#dc2626";
                }}
              >
                Delete Account...
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: APPEARANCE */}
        {activeTab === "appearance" && (
          <div className="social-widget-card" style={{ padding: "20px" }}>
            <h2
              style={{
                margin: "0 0 6px",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Theme &amp; Visual Style
            </h2>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 13,
                color: "var(--text-secondary)",
              }}
            >
              Choose how Marshmallow looks for your device
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              {/* Light Mode Card */}
              <div
                onClick={() => isDark && toggleTheme()}
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-lg)",
                  border: !isDark
                    ? "2px solid var(--primary)"
                    : "1px solid var(--border-color)",
                  backgroundColor: "#FAF6F0",
                  color: "#241D19",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  position: "relative",
                }}
              >
                {!isDark && (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      fontSize: 11,
                      backgroundColor: "var(--primary)",
                      color: "#fff",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      fontWeight: 700,
                    }}
                  >
                    Active
                  </span>
                )}
                <div style={{ fontSize: 24, marginBottom: 8 }}>☀️</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Toasted Cream</div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                  Warm ivory canvas with roasted caramel accents
                </div>
              </div>

              {/* Dark Mode Card */}
              <div
                onClick={() => !isDark && toggleTheme()}
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-lg)",
                  border: isDark
                    ? "2px solid var(--primary)"
                    : "1px solid var(--border-color)",
                  backgroundColor: "#141110",
                  color: "#FAF6F0",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  position: "relative",
                }}
              >
                {isDark && (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      fontSize: 11,
                      backgroundColor: "var(--primary)",
                      color: "#fff",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      fontWeight: 700,
                    }}
                  >
                    Active
                  </span>
                )}
                <div style={{ fontSize: 24, marginBottom: 8 }}>🌙</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Campfire Cocoa</div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                  Deep cocoa canvas with warm glowing amber embers
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="social-widget-card" style={{ padding: "20px" }}>
            <h2
              style={{
                margin: "0 0 6px",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Notification Preferences
            </h2>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 13,
                color: "var(--text-secondary)",
              }}
            >
              Control what alerts you receive across Marshmallow
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Likes */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-hover)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "var(--text-primary)",
                    }}
                  >
                    Likes on Posts &amp; Comments
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginTop: 2,
                    }}
                  >
                    Get notified when someone hearts your posts
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleTogglePref(
                      "marshmallow_pref_likes",
                      notifyLikes,
                      setNotifyLikes
                    )
                  }
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: "none",
                    backgroundColor: notifyLikes
                      ? "var(--primary)"
                      : "var(--border-color)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background-color 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      backgroundColor: "#fff",
                      position: "absolute",
                      top: 3,
                      left: notifyLikes ? 22 : 4,
                      transition: "left 0.2s ease",
                    }}
                  />
                </button>
              </div>

              {/* Comments */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-hover)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "var(--text-primary)",
                    }}
                  >
                    Comments &amp; Replies
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginTop: 2,
                    }}
                  >
                    Get notified when someone replies to you
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleTogglePref(
                      "marshmallow_pref_comments",
                      notifyComments,
                      setNotifyComments
                    )
                  }
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: "none",
                    backgroundColor: notifyComments
                      ? "var(--primary)"
                      : "var(--border-color)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background-color 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      backgroundColor: "#fff",
                      position: "absolute",
                      top: 3,
                      left: notifyComments ? 22 : 4,
                      transition: "left 0.2s ease",
                    }}
                  />
                </button>
              </div>

              {/* Mentions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-hover)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "var(--text-primary)",
                    }}
                  >
                    @Mentions
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginTop: 2,
                    }}
                  >
                    Get notified when someone mentions your username
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleTogglePref(
                      "marshmallow_pref_mentions",
                      notifyMentions,
                      setNotifyMentions
                    )
                  }
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: "none",
                    backgroundColor: notifyMentions
                      ? "var(--primary)"
                      : "var(--border-color)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background-color 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      backgroundColor: "#fff",
                      position: "absolute",
                      top: 3,
                      left: notifyMentions ? 22 : 4,
                      transition: "left 0.2s ease",
                    }}
                  />
                </button>
              </div>

              {/* Messages */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-hover)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "var(--text-primary)",
                    }}
                  >
                    Direct Messages
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginTop: 2,
                    }}
                  >
                    Show badges and sounds for new incoming chats
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleTogglePref(
                      "marshmallow_pref_messages",
                      notifyMessages,
                      setNotifyMessages
                    )
                  }
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: "none",
                    backgroundColor: notifyMessages
                      ? "var(--primary)"
                      : "var(--border-color)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background-color 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      backgroundColor: "#fff",
                      position: "absolute",
                      top: 3,
                      left: notifyMessages ? 22 : 4,
                      transition: "left 0.2s ease",
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE ACCOUNT CONFIRMATION MODAL */}
        {isDeleteModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 3500,
              backgroundColor: "var(--modal-overlay)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <div
              style={{
                backgroundColor: "var(--bg-card)",
                borderRadius: "var(--radius-lg)",
                maxWidth: 420,
                width: "100%",
                padding: "24px",
                border: "1px solid var(--border-color)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 24 }}>⚠️</span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 800,
                    color: "#dc2626",
                  }}
                >
                  Delete Marshmallow Account?
                </h3>
              </div>

              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                  margin: "0 0 16px",
                }}
              >
                This will <strong>permanently delete</strong> your profile, all
                your posts, comments, photos, and messages. This action cannot be
                undone.
              </p>

              {deleteError && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    color: "#dc2626",
                    fontSize: 13,
                    marginBottom: 14,
                  }}
                >
                  {deleteError}
                </div>
              )}

              <div style={{ marginBottom: 18 }}>
                <label
                  htmlFor="delete-pw-input"
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 6,
                  }}
                >
                  Enter your password to confirm:
                </label>
                <input
                  id="delete-pw-input"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your account password"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleteLoading}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-hover)",
                    color: "var(--text-primary)",
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "var(--radius-full)",
                    border: "none",
                    backgroundColor: "#dc2626",
                    color: "#fff",
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: deleteLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {deleteLoading ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

