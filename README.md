# Srinibas Vastra — Authentication System Documentation

A complete guide to how **Sign Up**, **Login**, and **Route Protection** work in this Next.js 16 + Supabase project.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Folder Structure (Auth-related)](#folder-structure-auth-related)
3. [Environment Variables](#environment-variables)
4. [Supabase Client Setup](#supabase-client-setup)
5. [Sign Up Flow](#sign-up-flow)
6. [Login Flow](#login-flow)
7. [Email Confirmation Callback](#email-confirmation-callback)
8. [Route Protection (Middleware / Proxy)](#route-protection-middleware--proxy)
9. [Complete Auth Flow Diagrams](#complete-auth-flow-diagrams)
10. [Key Supabase Functions Reference](#key-supabase-functions-reference)
11. [Common Gotchas & Tips](#common-gotchas--tips)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER                            │
│                                                         │
│   signup-form.tsx ──► supabase.auth.signUp()             │
│   login-form.tsx  ──► supabase.auth.signInWithPassword() │
│        │                                                │
│        │  (uses Browser Client: createBrowserClient)     │
└────────┼────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                   NEXT.JS SERVER                        │
│                                                         │
│   proxy.ts (middleware)                                  │
│     ├── Runs on EVERY request (except static assets)    │
│     ├── Refreshes auth session (supabase.auth.getUser)  │
│     ├── Checks if route is public or protected          │
│     └── Redirects unauthenticated users to /login       │
│                                                         │
│   auth/callback/route.ts                                │
│     └── Exchanges email confirmation code for session   │
│         (uses Server Client: createServerClient)        │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                     SUPABASE                            │
│                                                         │
│   - Stores users in auth.users table                    │
│   - Issues JWT tokens (access_token + refresh_token)    │
│   - Sends confirmation emails (if enabled)              │
│   - Validates tokens on every getUser() call            │
└─────────────────────────────────────────────────────────┘
```

---

## Folder Structure (Auth-related)

```
y-commerce/
├── proxy.ts                          # ⭐ Middleware — runs before every request
│
├── lib/supabase/
│   ├── client.ts                     # ⭐ Browser-side Supabase client
│   └── server.ts                     # ⭐ Server-side Supabase client
│
├── app/
│   ├── (auth)/                       # Route group (no /auth in URL)
│   │   ├── login/page.tsx            # /login page
│   │   └── signup/page.tsx           # /signup page
│   │
│   ├── auth/
│   │   └── callback/route.ts         # ⭐ /auth/callback — email confirmation handler
│   │
│   └── home/page.tsx                 # /home — protected page
│
├── components/auth/
│   ├── login-form.tsx                # ⭐ Login form component (client-side)
│   └── signup-form.tsx               # ⭐ Signup form component (client-side)
│
└── .env.local                        # Supabase credentials
```

> **Note on `(auth)` folder**: The parentheses make it a **Route Group** in Next.js. It does NOT add `/auth/` to the URL. So `app/(auth)/login/page.tsx` serves the route `/login`, NOT `/auth/login`.

---

## Environment Variables

File: `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (from Supabase Dashboard → Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key — safe to expose to the browser. Has Row Level Security (RLS) applied. |

> Both are prefixed with `NEXT_PUBLIC_` so they are available in both server and browser environments.

---

## Supabase Client Setup

You need **two different clients** because the browser and server handle cookies differently.

### 1. Browser Client — `lib/supabase/client.ts`

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**What it does:**
- Creates a Supabase client that runs **in the browser**.
- `createBrowserClient` automatically reads/writes auth tokens to **browser cookies**.
- Used in Client Components (files with `"use client"`).

**When to use:**
- In `login-form.tsx`, `signup-form.tsx`, or any client-side component that needs to call Supabase.

**How it handles cookies:**
- `createBrowserClient` uses `document.cookie` behind the scenes — you don't need to configure cookies manually.

---

### 2. Server Client — `lib/supabase/server.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

**What it does:**
- Creates a Supabase client that runs **on the server** (Server Components, Route Handlers, Server Actions).
- You must manually wire up cookie reading/writing because the server doesn't have `document.cookie`.

**When to use:**
- In Server Components, Route Handlers (`route.ts`), Server Actions.
- Example: `auth/callback/route.ts` uses this.

**Why the `try/catch` in `setAll`?**
- In Server Components (not Route Handlers), cookies are **read-only**. Calling `cookieStore.set()` would throw an error. The `try/catch` silently ignores this — the middleware will handle setting cookies instead.

**Why is this function `async`?**
- Because `cookies()` from `next/headers` returns a Promise in Next.js 16 (it was synchronous in earlier versions).

---

## Sign Up Flow

### File: `components/auth/signup-form.tsx`

This is a **Client Component** (`"use client"`) that handles user registration.

### Step-by-step breakdown:

```
User fills email + password → clicks "Sign up"
         │
         ▼
┌─ handleSubmit(e) ──────────────────────────────────────┐
│                                                         │
│  1. e.preventDefault()     ← Stop form from reloading   │
│  2. setLoading(true)       ← Show loading state         │
│  3. Extract email/password from FormData                │
│                                                         │
│  4. supabase.auth.signUp({ email, password, options })  │
│     │                                                   │
│     ├── options.emailRedirectTo =                       │
│     │   "http://localhost:3000/auth/callback"            │
│     │   ↑ Where Supabase redirects after email click    │
│     │                                                   │
│     ├── SUCCESS + identities.length === 0               │
│     │   → "Email already registered" (duplicate)        │
│     │                                                   │
│     ├── SUCCESS + session exists                        │
│     │   → Email confirmation DISABLED in Supabase       │
│     │   → User is logged in immediately                 │
│     │   → router.push("/") to redirect home             │
│     │                                                   │
│     ├── SUCCESS + no session                            │
│     │   → Email confirmation ENABLED in Supabase        │
│     │   → Show "Check your email" message               │
│     │                                                   │
│     └── ERROR                                           │
│         → Show error.message to user                    │
└─────────────────────────────────────────────────────────┘
```

### Key function: `supabase.auth.signUp()`

```ts
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: "http://localhost:3000/auth/callback",
  },
});
```

| Parameter | Purpose |
|-----------|---------|
| `email` | User's email address |
| `password` | Must be at least 6 characters (Supabase default) |
| `options.emailRedirectTo` | The URL Supabase puts in the confirmation email link. After clicking, the user lands here with a `code` query parameter. |

| Return Value | Meaning |
|--------------|---------|
| `data.user` | The newly created user object |
| `data.user.identities` | Array of identity providers. **Empty array = email already exists** |
| `data.session` | If not null, user is logged in immediately (email confirmation is OFF) |
| `error` | Error object if signup failed (e.g., weak password, rate limit) |

---

## Login Flow

### File: `components/auth/login-form.tsx`

Also a **Client Component** that handles user login.

### Step-by-step breakdown:

```
User fills email + password → clicks "Login"
         │
         ▼
┌─ handleSubmit(e) ──────────────────────────────────────┐
│                                                         │
│  1. e.preventDefault()                                  │
│  2. setLoading(true)                                    │
│  3. Extract email/password from FormData                │
│                                                         │
│  4. supabase.auth.signInWithPassword({ email, password })│
│     │                                                   │
│     ├── SUCCESS                                         │
│     │   → Supabase sets auth cookies automatically      │
│     │   → router.refresh() to refresh server components │
│     │   → router.push("/") to redirect home             │
│     │                                                   │
│     └── ERROR                                           │
│         → Show error.message (e.g., "Invalid login      │
│           credentials")                                 │
└─────────────────────────────────────────────────────────┘
```

### Key function: `supabase.auth.signInWithPassword()`

```ts
const { error } = await supabase.auth.signInWithPassword({
  email: form.get("email") as string,
  password: form.get("password") as string,
});
```

| Return Value | Meaning |
|--------------|---------|
| `data.user` | The authenticated user object |
| `data.session` | Contains `access_token` and `refresh_token` |
| `error` | Error if credentials are wrong or email not confirmed |

**What happens on success:**
- Supabase stores the session (access_token + refresh_token) in **browser cookies**.
- `router.refresh()` tells Next.js to re-run Server Components — so the middleware picks up the new session.
- `router.push("/")` navigates the user to the home page.

---

## Email Confirmation Callback

### File: `app/auth/callback/route.ts`

This is a **Route Handler** (server-side API endpoint) at the URL `/auth/callback`.

### When is it called?

When the user clicks the confirmation link in their email. Supabase redirects them to:
```
http://localhost:3000/auth/callback?code=SOME_CODE
```

### Step-by-step breakdown:

```
User clicks email link
         │
         ▼
  GET /auth/callback?code=abc123
         │
         ▼
┌─ GET handler ──────────────────────────────────────────┐
│                                                         │
│  1. Extract `code` from URL query params                │
│  2. Extract `next` param (defaults to "/")              │
│                                                         │
│  3. supabase.auth.exchangeCodeForSession(code)          │
│     │                                                   │
│     ├── SUCCESS                                         │
│     │   → Session is created, cookies are set           │
│     │   → Redirect to `next` URL (default: "/")        │
│     │                                                   │
│     └── ERROR or no code                                │
│         → Redirect to /login                            │
└─────────────────────────────────────────────────────────┘
```

### Key function: `supabase.auth.exchangeCodeForSession()`

```ts
const { error } = await supabase.auth.exchangeCodeForSession(code);
```

| Parameter | Purpose |
|-----------|---------|
| `code` | The one-time authorization code from the email link |

**What it does:**
- Sends the `code` to Supabase, which validates it and returns a session.
- The Supabase client **automatically sets cookies** with the session tokens via the `setAll` callback in the server client.
- After this, the user is fully authenticated.

---

## Route Protection (Middleware / Proxy)

### File: `proxy.ts` (Next.js 16 convention)

> **Important**: Next.js 16 renamed `middleware.ts` to `proxy.ts`. The exported function must be named `proxy`. If you're on Next.js 14/15, use `middleware.ts` with an exported `middleware` function instead.

### What is middleware/proxy?

It's a function that runs **before every request** on the server (edge runtime). It intercepts requests and can:
- Redirect unauthenticated users
- Refresh expired sessions
- Modify request/response headers and cookies

### Step-by-step breakdown:

```
Browser requests ANY page (e.g., /home)
         │
         ▼
  config.matcher filters the request
  (skips _next/static, images, favicon)
         │
         ▼
┌─ proxy(req) ───────────────────────────────────────────┐
│                                                         │
│  1. Create a "pass-through" response:                   │
│     res = NextResponse.next()                           │
│                                                         │
│  2. Create a Supabase client with cookie access:        │
│     - getAll(): reads cookies from the incoming request │
│     - setAll(): writes updated cookies to the response  │
│                                                         │
│  3. supabase.auth.getUser()                             │
│     │  ↑ This does TWO things:                          │
│     │  a) Validates the current access_token            │
│     │  b) If expired, refreshes it using refresh_token  │
│     │     and updates the cookies via setAll()          │
│     │                                                   │
│  4. Check if the route is public:                       │
│     publicRoutes = ["/login", "/signup",                │
│                     "/auth/callback", "/"]              │
│     │                                                   │
│     ├── Route IS public → return res (allow through)    │
│     │                                                   │
│     └── Route is NOT public AND no user                 │
│         → Redirect to /login                            │
└─────────────────────────────────────────────────────────┘
```

### Key function: `supabase.auth.getUser()`

```ts
const { data } = await supabase.auth.getUser();
// data.user is null if not authenticated
// data.user is the User object if authenticated
```

**Why `getUser()` instead of `getSession()`?**
- `getUser()` makes a **server-side call to Supabase** to validate the JWT token. It's secure and tamper-proof.
- `getSession()` only reads the JWT from cookies and decodes it locally — it can be spoofed. **Never trust `getSession()` for authorization.**

### The `config.matcher` — Which requests go through the proxy?

```ts
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

This regex means: **match all routes EXCEPT:**

| Pattern | What it skips |
|---------|---------------|
| `_next/static` | JavaScript, CSS bundles |
| `_next/image` | Optimized images |
| `favicon.ico` | Browser favicon |
| `.*\\.(?:svg\|png\|...)$` | Any image file in `/public` |

**Why skip these?** Static assets don't need authentication. Running the proxy on them causes "Unexpected token '<'" errors (the proxy returns an HTML redirect instead of the JS file the browser expected).

### Cookie flow in the proxy (the tricky part):

```ts
cookies: {
  getAll() {
    return req.cookies.getAll();  // Read cookies from incoming request
  },
  setAll(cookiesToSet) {
    // Step 1: Update the request's cookies (for downstream code)
    cookiesToSet.forEach(({ name, value }) =>
      req.cookies.set(name, value)
    );

    // Step 2: Create a NEW response with the updated request
    res = NextResponse.next({ request: req });

    // Step 3: Set cookies on the response (sent back to browser)
    cookiesToSet.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options)
    );
  },
},
```

**Why reassign `res`?** When Supabase refreshes a token, it calls `setAll()` with new cookies. We must:
1. Update the **request** cookies (so server-side code downstream sees the new session)
2. Create a **new response** carrying the updated request
3. Set cookies on the **response** (so the browser stores the refreshed tokens)

---

## Complete Auth Flow Diagrams

### Sign Up (with email confirmation enabled)

```
Browser                  Next.js Server              Supabase
  │                          │                          │
  │── POST signUp() ────────►│                          │
  │                          │── Create user ──────────►│
  │                          │◄── User created ─────────│
  │                          │                          │── Sends confirmation email
  │◄── "Check your email" ──│                          │
  │                          │                          │
  │  ... user clicks email link ...                     │
  │                          │                          │
  │── GET /auth/callback?code=abc ─────────────────────►│
  │                          │                          │
  │                          │── exchangeCodeForSession ►│
  │                          │◄── Session tokens ───────│
  │                          │                          │
  │◄── Redirect to "/" ──────│  (cookies set on response)│
  │                          │                          │
  │── GET / ────────────────►│                          │
  │     (proxy runs)         │── getUser() ────────────►│
  │                          │◄── User is valid ────────│
  │◄── Page HTML ────────────│                          │
```

### Login

```
Browser                  Next.js Server              Supabase
  │                          │                          │
  │── signInWithPassword() ─►│                          │
  │   (browser client)       │── Validate credentials ─►│
  │                          │◄── Session tokens ───────│
  │   (cookies auto-set)     │                          │
  │                          │                          │
  │── router.push("/") ─────►│                          │
  │     (proxy runs)         │── getUser() ────────────►│
  │                          │◄── User is valid ────────│
  │◄── Page HTML ────────────│                          │
```

### Accessing a Protected Route (not logged in)

```
Browser                  Next.js Server              Supabase
  │                          │                          │
  │── GET /home ────────────►│                          │
  │     (proxy runs)         │── getUser() ────────────►│
  │                          │◄── user = null ──────────│
  │                          │                          │
  │                          │  Is /home public? NO     │
  │                          │  Is user logged in? NO   │
  │                          │                          │
  │◄── 302 Redirect /login ──│                          │
```

---

## Key Supabase Functions Reference

| Function | Where Used | Side | Purpose |
|----------|-----------|------|---------|
| `createBrowserClient(url, key)` | `lib/supabase/client.ts` | Browser | Creates a Supabase client for Client Components. Auto-manages cookies via `document.cookie`. |
| `createServerClient(url, key, { cookies })` | `lib/supabase/server.ts`, `proxy.ts` | Server | Creates a Supabase client for Server Components / Middleware. Requires manual cookie wiring. |
| `supabase.auth.signUp({ email, password, options })` | `signup-form.tsx` | Browser | Registers a new user. Optionally sends a confirmation email. |
| `supabase.auth.signInWithPassword({ email, password })` | `login-form.tsx` | Browser | Logs in a user with email + password. Returns a session. |
| `supabase.auth.getUser()` | `proxy.ts` | Server | Validates the current session by calling Supabase's API. Also refreshes expired tokens. **Use this for auth checks.** |
| `supabase.auth.exchangeCodeForSession(code)` | `auth/callback/route.ts` | Server | Converts a one-time email confirmation code into a full session. |
| `supabase.auth.getSession()` | Not used (intentionally) | Either | Reads session from cookies WITHOUT server validation. **⚠️ Not secure for authorization — can be tampered with.** |
| `supabase.auth.signOut()` | Not yet implemented | Browser | Clears the session and cookies. Call this for logout. |

---

## Common Gotchas & Tips

### 1. `middleware.ts` vs `proxy.ts`
- **Next.js 14/15**: Use `middleware.ts` with `export function middleware(req)`
- **Next.js 16+**: Use `proxy.ts` with `export function proxy(req)`
- **Don't have both files** — it causes conflicts.

### 2. Always use `getUser()`, never `getSession()` for auth checks
```ts
// ✅ Secure — validates with Supabase server
const { data: { user } } = await supabase.auth.getUser();

// ❌ Insecure — only reads local JWT, can be tampered with
const { data: { session } } = await supabase.auth.getSession();
```

### 3. The `config.matcher` is critical
Without it, the proxy runs on `_next/static/*` requests (JS/CSS bundles). If those get redirected to `/login`, the browser receives HTML where it expected JavaScript, causing:
```
Uncaught SyntaxError: Unexpected token '<'
```

### 4. `emailRedirectTo` must match your callback route
```ts
// In signup-form.tsx
options: { emailRedirectTo: "http://localhost:3000/auth/callback" }
```
This must point to the route handler at `app/auth/callback/route.ts`. In production, change `localhost:3000` to your actual domain.

### 5. Why `router.refresh()` before `router.push()`?
```ts
router.refresh();  // Re-runs server components → proxy sees new cookies
router.push("/");  // Navigate to home
```
Without `refresh()`, Next.js might serve a cached version of the page that doesn't know about the new session.

### 6. Two different Supabase clients — use the right one

| Context | Which Client |
|---------|-------------|
| Client Component (`"use client"`) | `lib/supabase/client.ts` → `createBrowserClient` |
| Server Component, Route Handler, Server Action | `lib/supabase/server.ts` → `createServerClient` |
| Middleware / Proxy | Inline `createServerClient` (with `req.cookies`) |

### 7. Adding a new protected route
Just create the page normally. The proxy automatically protects it because it's not in the `publicRoutes` array:
```ts
const publicRoutes = ["/login", "/signup", "/auth/callback", "/"];
```
Any route NOT in this list requires authentication.

### 8. Adding a new public route
Add the path to the `publicRoutes` array in `proxy.ts`:
```ts
const publicRoutes = ["/login", "/signup", "/auth/callback", "/", "/about", "/pricing"];
```

### 9. Implementing Logout
Add a logout button in any client component:
```tsx
"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  return <button onClick={handleLogout}>Logout</button>;
}
```

### 10. Getting the current user in a Server Component
```tsx
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <p>Hello, {user?.email}</p>;
}
```

---

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
