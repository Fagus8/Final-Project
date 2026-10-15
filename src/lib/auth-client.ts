import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth } from './auth';

// ავტორიზაცია ბრაუზერში (შესვლა, რეგისტრაცია, გასვლა).
// inferAdditionalFields-ით TypeScript-მა იცის accountType ველიც
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});