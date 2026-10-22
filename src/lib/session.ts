import { headers } from "next/headers";
import { auth } from "./auth";

// შესული მომხმარებლის სესია (სერვერზე). null — თუ მომხმარებელი არ არის შესული
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
