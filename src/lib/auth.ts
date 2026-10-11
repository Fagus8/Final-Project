import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { prisma } from './prisma';

export const auth = betterAuth({
  advanced: {
  database: {
    generateId: 'uuid',
  },
},
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
  },

  plugins: [admin()],

  user: {
    additionalFields: {
      accountType: {
        type: ['PATIENT', 'DOCTOR', 'CLINIC'],
        required: true,
        input: true,
      },
    },
  },
});
