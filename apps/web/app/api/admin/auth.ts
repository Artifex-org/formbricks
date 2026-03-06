import { NextRequest } from "next/server";

export function authenticateAdmin(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return false;

  const providedKey = request.headers.get("x-admin-api-key");
  if (!providedKey) return false;

  // Constant-time comparison to prevent timing attacks
  if (adminKey.length !== providedKey.length) return false;
  let result = 0;
  for (let i = 0; i < adminKey.length; i++) {
    result |= adminKey.charCodeAt(i) ^ providedKey.charCodeAt(i);
  }
  return result === 0;
}
