import { useState, useEffect, useRef } from "react";
import type { UserProfile, UserProfileUpdateDto } from "../types/user";
import { usersApi } from "../api/users";
import { useAuth } from "../context/AuthContext";
import { mediaApi } from "../api/media";
import { getMediaUrl } from "../utils/media";
import { ImageAdjustModal } from "./ImageAdjustModal";

interface EditProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onProfileUpdated: (updated: UserProfile) => void;
}

const MAX_NAME_LENGTH = 50;
const MAX_USERNAME_LENGTH = 30;
const MAX_BIO_LENGTH = 250;

export function EditProfileModal({
  isOpen,
  profile,
  onClose,
  onProfileUpdated,
}: EditProfileModalProps) {
  const { updateUser } = useAuth();

  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [birthdate, setBirthdate] = useState(profile.birthdate ?? "");

  // Media attachments
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile.avatarUrl ?? null
  );
  const [coverUrl, setCoverUrl] = useState<string | null>(
    profile.coverUrl ?? null
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Image Adjuster State
  const [adjustModalState, setAdjustModalState] = useState<{
    isOpen: boolean;
    imageSrc: string;
    fileName: string;
    aspectRatio: number;
    cropShape: "round" | "rect";
    title: string;
    target: "avatar" | "cover";
  }>({
    isOpen: false,
    imageSrc: "",
    fileName: "",
    aspectRatio: 1,
    cropShape: "round",
    title: "Adjust Profile Picture",
    target: "avatar",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement | null>(null);

  // Sync state if initial profile changes
  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setUsername(profile.username ?? "");
      setBio(profile.bio ?? "");
      setBirthdate(profile.birthdate ?? "");
      setAvatarUrl(profile.avatarUrl ?? null);
      setCoverUrl(profile.coverUrl ?? null);
      setError(null);
    }
  }, [isOpen, profile]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting && !adjustModalState.isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, adjustModalState.isOpen, onClose]);

  if (!isOpen) return null;

  const trimmedName = name.trim();
  const trimmedUsername = username.trim();
  const trimmedBio = bio.trim();

  // Validate form
  const isNameValid =
    trimmedName.length > 0 && trimmedName.length <= MAX_NAME_LENGTH;
  const isUsernameValid =
    trimmedUsername.length === 0 ||
    (/^[a-zA-Z0-9_]+$/.test(trimmedUsername) &&
      trimmedUsername.length <= MAX_USERNAME_LENGTH);
  const isBioValid = bio.length <= MAX_BIO_LENGTH;
  const isBirthdateValid = Boolean(birthdate);

  const hasChanges =
    trimmedName !== profile.name ||
    trimmedUsername !== (profile.username ?? "") ||
    trimmedBio !== (profile.bio ?? "") ||
    birthdate !== (profile.birthdate ?? "") ||
    (avatarUrl ?? null) !== (profile.avatarUrl ?? null) ||
    (coverUrl ?? null) !== (profile.coverUrl ?? null);

  const canSubmit =
    isNameValid &&
    isUsernameValid &&
    isBioValid &&
    isBirthdateValid &&
    hasChanges &&
    !isSubmitting &&
    !isUploadingAvatar &&
    !isUploadingCover;

  // Open adjuster when user selects an avatar file
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setAdjustModalState({
      isOpen: true,
      imageSrc: objectUrl,
      fileName: file.name,
      aspectRatio: 1,
      cropShape: "round",
      title: "Adjust Profile Picture",
      target: "avatar",
    });
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  // Open adjuster when user selects a cover photo
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setAdjustModalState({
      isOpen: true,
      imageSrc: objectUrl,
      fileName: file.name,
      aspectRatio: 2.6,
      cropShape: "rect",
      title: "Adjust Cover Photo",
      target: "cover",
    });
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // Called when user applies crop/zoom/pan in the adjuster modal
  const handleAdjustConfirm = async (croppedFile: File) => {
    const target = adjustModalState.target;
    setAdjustModalState((prev) => ({ ...prev, isOpen: false }));

    if (target === "avatar") {
      setIsUploadingAvatar(true);
      setError(null);
      try {
        const url = await mediaApi.upload(croppedFile, "avatars");
        setAvatarUrl(url);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            "Failed to upload avatar image. Only JPG, PNG, WebP, GIF under 10MB are supported."
        );
      } finally {
        setIsUploadingAvatar(false);
      }
    } else {
      setIsUploadingCover(true);
      setError(null);
      try {
        const url = await mediaApi.upload(croppedFile, "covers");
        setCoverUrl(url);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            "Failed to upload cover photo. Only JPG, PNG, WebP, GIF under 10MB are supported."
        );
      } finally {
        setIsUploadingCover(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    const payload: UserProfileUpdateDto = {
      name: trimmedName,
      username: trimmedUsername.length > 0 ? trimmedUsername : null,
      bio: trimmedBio.length > 0 ? trimmedBio : null,
      birthdate,
      avatarUrl: avatarUrl || null,
      coverUrl: coverUrl || null,
    };

    try {
      const updatedProfile = await usersApi.updateMyProfile(payload);
      // Synchronize in auth context
      updateUser({
        name: updatedProfile.name,
        username: updatedProfile.username,
        bio: updatedProfile.bio,
        birthdate: updatedProfile.birthdate,
        avatarUrl: updatedProfile.avatarUrl,
        coverUrl: updatedProfile.coverUrl,
      });
      // Synchronize in profile page
      onProfileUpdated(updatedProfile);
      onClose();
    } catch (err: any) {
      const respData = err.response?.data;
      const message =
        typeof respData === "string"
          ? respData
          : respData?.message ||
            respData?.title ||
            "Failed to update profile. Please check your inputs.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(2px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          padding: "16px",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSubmitting) {
            onClose();
          }
        }}
      >
        <div
          ref={modalRef}
          style={{
            width: "100%",
            maxWidth: 480,
            maxHeight: "92vh",
            backgroundColor: "#fff",
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            animation: "scaleIn 0.18s ease-out",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid #e4e6eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "#1c1e21",
              }}
            >
              Edit Profile
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                fontSize: 20,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                color: "#65676b",
                padding: "4px 8px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f0f2f5")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              ✕
            </button>
          </div>

          {/* Form Body */}
          <form
            onSubmit={handleSubmit}
            style={{ padding: "20px", overflowY: "auto", flex: 1 }}
          >
            {error && (
              <div
                style={{
                  backgroundColor: "#ffebe8",
                  color: "#e02424",
                  border: "1px solid #f97583",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            {/* Cover & Avatar Editor Section */}
            <div
              style={{
                position: "relative",
                borderRadius: 10,
                overflow: "hidden",
                marginBottom: 20,
                border: "1px solid #e4e6eb",
                backgroundColor: "#f0f2f5",
              }}
            >
              {/* Cover Photo Preview */}
              <div
                style={{
                  height: 120,
                  width: "100%",
                  background: coverUrl
                    ? `url(${getMediaUrl(coverUrl)}) center/cover no-repeat`
                    : "linear-gradient(135deg, #1877f2 0%, #00c6ff 100%)",
                  position: "relative",
                }}
              >
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleCoverFileChange}
                  style={{ display: "none" }}
                />

                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    display: "flex",
                    gap: 6,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploadingCover}
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.65)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "5px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      backdropFilter: "blur(2px)",
                    }}
                  >
                    📷 {isUploadingCover ? "Uploading..." : "Change Cover"}
                  </button>

                  {coverUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustModalState({
                          isOpen: true,
                          imageSrc: getMediaUrl(coverUrl),
                          fileName: "cover.jpg",
                          aspectRatio: 2.6,
                          cropShape: "rect",
                          title: "Adjust Cover Photo",
                          target: "cover",
                        });
                      }}
                      title="Zoom & position cover"
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.65)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "5px 8px",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        backdropFilter: "blur(2px)",
                      }}
                    >
                      ✂️ Adjust
                    </button>
                  )}
                </div>

                {coverUrl && (
                  <button
                    type="button"
                    onClick={() => setCoverUrl(null)}
                    title="Remove cover photo"
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: 22,
                      height: 22,
                      fontSize: 11,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Avatar Photo Preview */}
              <div
                style={{
                  padding: "0 14px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    top: -24,
                    marginBottom: -20,
                    width: 68,
                    height: 68,
                    borderRadius: "50%",
                    border: "3px solid #fff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    backgroundColor: "#1877f2",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    fontWeight: 700,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={getMediaUrl(avatarUrl)}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    (profile.name || "U")[0].toUpperCase()
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    paddingTop: 4,
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarFileChange}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    style={{
                      backgroundColor: "#fff",
                      border: "1px solid #ccd0d5",
                      borderRadius: 6,
                      padding: "5px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#1c1e21",
                      cursor: "pointer",
                    }}
                  >
                    {isUploadingAvatar ? "Uploading..." : "Change Avatar"}
                  </button>

                  {avatarUrl && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setAdjustModalState({
                            isOpen: true,
                            imageSrc: getMediaUrl(avatarUrl),
                            fileName: "avatar.jpg",
                            aspectRatio: 1,
                            cropShape: "round",
                            title: "Adjust Profile Picture",
                            target: "avatar",
                          });
                        }}
                        style={{
                          backgroundColor: "#f0f2f5",
                          border: "1px solid #ccd0d5",
                          borderRadius: 6,
                          padding: "5px 10px",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#1c1e21",
                          cursor: "pointer",
                        }}
                      >
                        ✂️ Adjust
                      </button>

                      <button
                        type="button"
                        onClick={() => setAvatarUrl(null)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 12,
                          color: "#e02424",
                          cursor: "pointer",
                          padding: "4px 6px",
                          fontWeight: 600,
                        }}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <label
                  htmlFor="edit-name-input"
                  style={{ fontSize: 13, fontWeight: 600, color: "#1c1e21" }}
                >
                  Full Name <span style={{ color: "#e02424" }}>*</span>
                </label>
                <span style={{ fontSize: 11, color: "#65676b" }}>
                  {name.length}/{MAX_NAME_LENGTH}
                </span>
              </div>
              <input
                id="edit-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={MAX_NAME_LENGTH}
                required
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  fontSize: 14,
                  borderRadius: 8,
                  border: isNameValid
                    ? "1px solid #ccd0d5"
                    : "1.5px solid #e02424",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                }}
              />
              {!isNameValid && (
                <small
                  style={{ color: "#e02424", fontSize: 11, marginTop: 4 }}
                >
                  Name cannot be empty.
                </small>
              )}
            </div>

            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <label
                  htmlFor="edit-username-input"
                  style={{ fontSize: 13, fontWeight: 600, color: "#1c1e21" }}
                >
                  Username (optional)
                </label>
                <span style={{ fontSize: 11, color: "#65676b" }}>
                  {username.length}/{MAX_USERNAME_LENGTH}
                </span>
              </div>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#8a8d91",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  @
                </span>
                <input
                  id="edit-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={MAX_USERNAME_LENGTH}
                  placeholder="username"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px 10px 30px",
                    fontSize: 14,
                    borderRadius: 8,
                    border: isUsernameValid
                      ? "1px solid #ccd0d5"
                      : "1.5px solid #e02424",
                    outline: "none",
                    transition: "border-color 0.15s ease",
                  }}
                />
              </div>
              {!isUsernameValid && (
                <small
                  style={{ color: "#e02424", fontSize: 11, marginTop: 4 }}
                >
                  Letters, numbers, and underscores only.
                </small>
              )}
            </div>

            {/* Bio */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <label
                  htmlFor="edit-bio-input"
                  style={{ fontSize: 13, fontWeight: 600, color: "#1c1e21" }}
                >
                  Bio (optional)
                </label>
                <span style={{ fontSize: 11, color: "#65676b" }}>
                  {bio.length}/{MAX_BIO_LENGTH}
                </span>
              </div>
              <textarea
                id="edit-bio-input"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={MAX_BIO_LENGTH}
                rows={3}
                placeholder="Tell others a bit about yourself..."
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  fontSize: 14,
                  lineHeight: 1.4,
                  borderRadius: 8,
                  border: isBioValid
                    ? "1px solid #ccd0d5"
                    : "1.5px solid #e02424",
                  outline: "none",
                  resize: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s ease",
                }}
              />
            </div>

            {/* Birthdate */}
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="edit-birthdate-input"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1c1e21",
                  marginBottom: 6,
                }}
              >
                Birthdate <span style={{ color: "#e02424" }}>*</span>
              </label>
              <input
                id="edit-birthdate-input"
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                required
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 12px",
                  fontSize: 14,
                  borderRadius: 8,
                  border: "1px solid #ccd0d5",
                  outline: "none",
                }}
              />
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                paddingTop: 12,
                borderTop: "1px solid #e4e6eb",
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#e4e6eb",
                  color: "#050505",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  padding: "8px 20px",
                  backgroundColor: canSubmit ? "#1877f2" : "#94b8ea",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        <style>{`
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>

      {/* Image Adjuster Modal */}
      <ImageAdjustModal
        isOpen={adjustModalState.isOpen}
        imageSrc={adjustModalState.imageSrc}
        fileName={adjustModalState.fileName}
        aspectRatio={adjustModalState.aspectRatio}
        cropShape={adjustModalState.cropShape}
        title={adjustModalState.title}
        onConfirm={handleAdjustConfirm}
        onCancel={() =>
          setAdjustModalState((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </>
  );
}
