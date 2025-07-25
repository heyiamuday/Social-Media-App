import { User as PrismaUser } from '@prisma/client';

// Make password optional in the type
export type UserWithoutPassword = Partial<Pick<PrismaUser, 'password'>> & Omit<PrismaUser, 'password'>;