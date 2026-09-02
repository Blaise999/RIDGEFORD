import { clearSessionCookie } from "@/lib/auth";
import { ok, handleError } from "@/lib/http";

export async function POST() {
  try {
    await clearSessionCookie();
    return ok();
  } catch (e) {
    return handleError(e);
  }
}
