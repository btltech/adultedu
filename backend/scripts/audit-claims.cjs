const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trackCount = await prisma.track.count();
  const topicCount = await prisma.topic.count();
  const questionCount = await prisma.question.count();
  const tracks = await prisma.track.findMany({ select: { title: true, category: true } });
  
  console.log('=== REALITY CHECK ===');
  console.log(`Tracks: ${trackCount}`);
  console.log(`Topics: ${topicCount}`);
  console.log(`Questions: ${questionCount}`);
  console.log('\nTrack Categories/Titles sample:');
  tracks.forEach(t => console.log(`- [${t.category}] ${t.title}`));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
