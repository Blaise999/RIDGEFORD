/**
 * Pure type module — safe to import from client components.
 *
 * Do NOT put runtime code here. `lib/auth.ts` imports `next/headers`,
 * `bcryptjs`, and `jsonwebtoken`, which are server-only. Any client
 * component that imports a type from it risks dragging the server
 * runtime into the client bundle through edge-case bundler behavior.
 */

export type SessionUser = {
  id: string;
  email: string;
  role: "user" | "admin" | "root_admin";
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  blocked: boolean;
};
