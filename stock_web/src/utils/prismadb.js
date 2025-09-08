// import { PrismaClient } from '@prisma/client';

// const prisma = globalThis.prisma || new PrismaClient();

// if (process.env.NODE_ENV === 'production') {
//   globalThis.prisma = prisma;
// }

// export default prisma;
import { PrismaClient } from "@/generated/prisma";

const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'production') {
  globalThis.prisma = prisma;
}

export default prisma;