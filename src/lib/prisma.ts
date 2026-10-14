import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClass: typeof PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// `prisma generate`-ის შემდეგ PrismaClient ახალი კლასია. ასეთ დროს ძველ კლიენტს
// აღარ ვიყენებთ, რომ ახალი ველები dev სერვერის გადატვირთვის გარეშე გამოჩნდეს.
const cached =
  globalForPrisma.prismaClass === PrismaClient ? globalForPrisma.prisma : undefined;

if (!cached && globalForPrisma.prisma) {
  void globalForPrisma.prisma.$disconnect();
}

export const prisma = cached ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaClass = PrismaClient;
}
