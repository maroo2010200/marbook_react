# Marbook – Full Project Summary

**Project:** Marbook (a Facebook-like social media REST API + React frontend)
**Backend Repo:** `E:\MarbookApi\MarbookApi`
**Frontend Repo:** `E:\MarbookApi\marbook-react`
**GitHub:** `maroo2010200`
**Category:** Learning/portfolio project (ASP.NET Core backend + React frontend)

---

## 1. Tech Stack

| Category | Backend | Frontend |
|---|---|---|
| Language | C# | TypeScript |
| Framework | ASP.NET Core Web API (.NET 10) | React + Vite |
| Database | PostgreSQL | (localhost API) |
| ORM | Entity Framework Core (Npgsql 10.0.3) | — |
| Password Hashing | BCrypt.Net-Next | — |
| Authentication | JWT Bearer | axios (JWT in Authorization header) |
| Docs | Swashbuckle / Swagger UI | — |
| Email | Brevo SMTP API | — |
| Linting | — | Oxlint (Oxc) |

---

## 2. Backend (Marbook API)

**Repo:** `E:\MarbookApi\MarbookApi`
**GitHub:** `maroo2010200/marbook_api`

### Completed Features

#### Core Setup
- ✅ ASP.NET Core Web API project
- ✅ PostgreSQL database
- ✅ EF Core + Npgsql 10.0.3
- ✅ EF Core migrations
- ✅ Global Exception Handler (`IExceptionHandler`, `ProblemDetails`, `ILogger`)
- ✅ Structured logging

#### Authentication
- ✅ BCrypt password hashing
- ✅ Register endpoint (`POST /api/auth/register`)
- ✅ Login endpoint (`POST /api/auth/login`)
- ✅ JWT generation (`IJwtService`, `JwtService`)
- ✅ JWT Bearer authentication middleware
- ✅ `[Authorize]` attribute
- ✅ Get `userId` from `ClaimTypes.NameIdentifier`
- ✅ Removed `UserId` from create DTOs (ownership checks)
- ✅ Ownership authorization (users can't modify others' posts/comments/likes)

#### Users
- ✅ Users CRUD
- ✅ `/api/users/me` (get current authenticated user)
- ✅ User search with ILIKE (prefix match)
- ✅ PostgreSQL `pg_trgm` extension
- ✅ Trigram GIN index

#### Posts
- ✅ Full CRUD
- ✅ Pagination (`PaginationParams`, `PagedResult<T>`)
- ✅ `GET /api/posts` with `pageNumber`, `pageSize`, `search`, `sort`
- ✅ Post search (ILIKE + FTS)
- ✅ Sorting
- ✅ FTS endpoint (`/api/posts/search`)

#### Comments
- ✅ Full CRUD
- ✅ Pagination
- ✅ Ownership checks
- ✅ Read-only by post with pagination

#### Likes
- ✅ Full CRUD (likes on posts, not comments)
- ✅ Ownership checks
- ✅ Toggle-like behavior

#### Database
- ✅ PostgreSQL schema with all tables
- ✅ Foreign keys with cascade delete
- ✅ `UpdatedAt` trigger for automatic timestamp updates
- ✅ `pg_trgm` extension
- ✅ GIN indexes for trigram and FTS

---

## 3. Email Verification Feature

### Database Tables

**Users**
- `Id`, `Name`, `Email`, `Username`, `PasswordHash`, `Birthdate`
- `IsEmailVerified` (bool), `VerificationToken` (string?), `VerifiedAt` (datetime?)
- `CreatedAt`, `UpdatedAt`

**EmailVerifications**
- `Id`, `UserId`, `Token`, `ExpiresAt`, `IsUsed`

### Architecture

| Component | Role |
|---|---|
| `EmailVerification` entity | Table `EmailVerifications` (Id, UserId, Token, ExpiresAt, IsUsed) |
| `AppDbContext` | `DbSet<EmailVerification> EmailVerifications` |
| `EmailVerificationService` | Token generation, email sending, verification, resend |
| `IBrevoEmailSender` / `BrevoEmailSender` | Brevo SMTP API integration (api-key header, `IConfiguration["Brevo:ApiKey"]`) |
| `AuthController` | `/api/auth/register`, `/api/auth/login`, `/api/auth/verify`, `/api/auth/resend-verification` |

### Email Verification Flow

1. **Register:** Creates user (`IsEmailVerified = false`), generates token, sends email via Brevo, returns `200 OK { Token, ExpiresAt, IsEmailVerified }`
2. **Verify link:** User clicks `http://your-app.com/api/auth/verify?token=***` → checks token, marks user verified, marks token used → returns `200 OK { token, expiresAt, user }`
3. **Login:** Checks `IsEmailVerified` → returns `401 "Please verify your email."` if unverified
4. **Resend:** `POST /api/auth/resend-verification?email=` → new token if unverified

### Completed Steps (8/8)
- ✅ Email delivery — Brevo API configured, email sent (IP authorized)
- ✅ Verification works — `/verify?token=` marks user as verified
- ✅ Login protection — 401 "Please verify your email." for unverified users
- ✅ Token expiration — `ExpiresAt > DateTime.UtcNow` check in `VerifyTokenAsync`
- ✅ Single-use token — `IsUsed = true` set after verification
- ✅ Database migration — All fields added via EF Core migration
- ✅ Secrets & logging — API key in User Secrets, tokens not logged
- ✅ Failure handling — `SendVerificationEmailAsync` catches Brevo failures, doesn't throw

### Key Implementation Details

- **Token flow:** Verification token travels via email (NOT API response). No `VerificationToken` in AuthResponseDto.
- **JWT claims:** `NameIdentifier`, `Email`, `Jti`, `Name` (Username)
- **Ownership checks:** Users cannot modify/delete others' posts/comments/likes
- **Pagination:** Default 10, max 50 (reusable `PaginationParams` + `PagedResult<T>`)
- **Global exception handler:** Returns `ProblemDetails`, logs full exception server-side
- **Search:** ILIKE (simple), pg_trgm+GIN (substring), Full-Text Search + GIN (word-based, ranking)

---

## 4. Frontend (marbook-react)

**Repo:** `E:\MarbookApi\marbook-react`
**GitHub:** `maroo2010200/marbook_react`

### Tech Stack
- React + TypeScript + Vite
- Oxlint (Oxc)
- React Router DOM v7
- axios

### Completed Features

| Feature | Status |
|---|---|
| React + Vite + TypeScript setup | ✅ Done |
| Routing (BrowserRouter, Routes, Route) | ✅ Done |
| LoginPage | ✅ Done |
| RegisterPage | ✅ Done |
| Navbar (auth-aware) | ✅ Done |
| ProtectedRoute | ✅ Done |
| AuthContext (login, logout, register, user state) | ✅ Done |
| axios API layer (interceptors for JWT) | ✅ Done |
| FeedPage (posts, pagination) | ✅ Done |
| Login → /feed redirect | ✅ Done |
| Email verification flow | ✅ Done |

### AuthContext

```ts
interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  verify: (token: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<string>;
}
```

### API Layer (`src/api/auth.ts`)

| Function | Route | Description |
|---|---|---|
| `login(email, password)` | `POST /auth/login` | Returns `AuthResponse { token, expiresAt, user }` |
| `verify(token)` | `POST /auth/verify?token=` | Returns `VerifyResponse { token, expiresAt, user }` |
| `resendVerificationEmail(email)` | `POST /auth/resend-verification?email=` | Returns `ResendResponse { message }` |

---

## 5. Work Done on Email Verification Integration

### Backend Fixes & Decisions
- **Token corruption issue:** Base64 tokens containing `+` were decoded to spaces by form-urlencoded parsing when Brevo delivered the link. Fix: use `Uri.EscapeDataString()` when building verification links in `BrevoEmailSender.cs`, or reverse with `.Replace(" ", "+")` on the backend. Both approaches were verified. The percent-encoding approach is more robust (handles `+`, `/`, `=` correctly).

### Frontend Enhancements
- **Login 401 handling:** `LoginPage` now catches `401` and displays "Please verify your email." without redirecting.
- **Verify page full route:** `/verify?token=` is a full-page route. `VerifyPage.tsx` handles missing tokens, 400 errors, and success navigation.
- **Resend verification button:** "Didn't receive the email? Resend." button on LoginPage calls `resendVerificationEmail(email)` and shows the response message.
- **Registration success confirmation:** After successful registration, `RegisterPage` shows a confirmation screen: "Registration successful! We've sent a verification email to [email]. Please check your inbox and click the verification link to activate your account."
- **Resend on confirmation:** "Resend verification email" button on the success screen actually calls the API, shows "Verification email resent.", and hides the "sent" message when resending.
- **Deliberate no auto-login:** `AuthContext.register()` does NOT auto-login on registration — a new account is unverified, so the user stays on the confirmation screen.

### Bug Fixes
- **`VerifyPage.tsx` catch block:** Original code had `if (error instanceof Error)` that swallowed axios HTTP errors before 400-handling code could run. Fixed to check `axios.isAxiosError(error)` first, then handle 400 responses properly.
- **`RegisterPage.tsx` resend button:** The "Resend verification email" button was only resetting form fields, not calling the API. Fixed to call `resendVerificationEmail()` and show the response message.
- **`AuthContext.tsx` register auto-login:** Removed auto-login on registration to keep unverified users on the confirmation screen.
- **`RegisterPage.tsx` navigate import:** `useNavigate` was imported but not called as a hook. Fixed to `const navigate = useNavigate()` so the "Back to login" button works.
- **`RegisterPage.tsx` duplicate import:** Fixed an accidental duplicate `import axios` line.

---

## 6. Git State

| Item | Value |
|---|---|
| Current branch | `feature/email_verification` |
| Current commit | `32ac341` "feat: complete frontend email verification flow" |
| Remote branch | `origin/feature/email_verification` (pushed) |
| Remote main | `af212d6` (Merge PR #5) |
| Status | Ready to merge |

### Branches
- `main` — clean, at `af212d6` Merge PR #5
- `feature/email_verification` — at `32ac341`, pushed

### Commits on `feature/email_verification`
1. `32ac341` — "feat: complete frontend email verification flow"
   - Add `/api/auth.ts` with login, verify, and resend-verification API functions
   - Update AuthContext to handle 401 'Please verify your email.' on login and resend flows
   - Update LoginPage with 401 handling + resend button
   - Add VerifyPage (full-page /verify?token= route)
   - Add RegisterPage success confirmation + resend button
   - Fix AuthContext register auto-login
   - Fix RegisterPage navigate import
   - Fix RegisterPage duplicate axios import

---

## 7. Key Gotchas & Notes

- **'+ ' in Base64 tokens:** `+` in a token is decoded to space by form-urlencoded parsing when Brevo links arrive. Percent-encode with `Uri.EscapeDataString()` when building the verify link, or reverse with `.Replace(" ", "+")` on the backend.
- **Login endpoint casing:** The backend route is `POST /api/auth/login` (lowercase). Login calls use lowercase.
- **Token NOT in API response:** Verification token travels via email only. No `VerificationToken` in AuthResponseDto.
- **Register auto-login:** Deliberately NOT implemented on the frontend — a newly created account is unverified.
- **Review before committing:** Never commit, push, or open a PR without the user's explicit go-ahead.

---

## 8. Key Commands

```bash
# Backend
cd E:\MarbookApi\MarbookApi
npm run dev  # or dotnet run --project E:\MarbookApi\MarbookApi
dotnet user-secrets set "Brevo:ApiKey" "api-xkeysib-***"
dotnet ef database update

# Frontend
cd E:\MarbookApi\marbook-react
bash npm run dev
bash npm run build
npx tsc -b --noEmit
```

🌐 **GitHub Repos:**
- Backend: https://github.com/maroo2010200/marbook_api
- Frontend: https://github.com/maroo2010200/marbook_react

---
*Generated: October 15, 2026 (Egypt Daylight Time, UTC+03:00)*
