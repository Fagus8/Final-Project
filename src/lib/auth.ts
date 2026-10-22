import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { admin } from 'better-auth/plugins';
import { prisma } from './prisma';

// ავტორიზაციის სერვერული ნაწილი (better-auth): ელფოსტა + პაროლი, სესიები ბაზაში
export const auth = betterAuth({
  // id-ები UUID ფორმატით, როგორც ბაზის სხვა ცხრილებში
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
      // რეგისტრაციისას მომხმარებელი თვითონ ირჩევს (input: true),
      // შეცვლას კი ქვემოთ hooks.before კრძალავს
      accountType: {
        type: ['PATIENT', 'CLINIC', 'DOCTOR'],
        required: true,
        input: true,
      },
    },
  },

  hooks: {
    // ანგარიშის ტიპი რეგისტრაციის შემდეგ აღარ იცვლება — თორემ პაციენტი
    // /update-user-ით თავს ექიმად ან კლინიკად გადააქცევდა
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/update-user' && ctx.body && 'accountType' in ctx.body) {
        throw new APIError('BAD_REQUEST', { message: 'ანგარიშის ტიპის შეცვლა არ შეიძლება' });
      }
    }),
  },
});
