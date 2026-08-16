const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const withExpl = await prisma.question.count({
    where: {
      explanation: {
        not: ''
      }
    }
  });
  const total = await prisma.question.count();
  console.log(`Questions with explanations: ${withExpl} / ${total}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
