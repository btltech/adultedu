const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tracks = await prisma.track.findMany({
    include: {
      topics: {
        include: {
          questions: true
        }
      }
    }
  });

  const categories = {};
  
  tracks.forEach(track => {
    if (!categories[track.category]) {
      categories[track.category] = { tracks: 0, topics: 0, questions: 0, trackDetails: [] };
    }
    
    const cat = categories[track.category];
    cat.tracks += 1;
    
    const topicCount = track.topics.length;
    const questionCount = track.topics.reduce((acc, topic) => acc + topic.questions.length, 0);
    
    cat.topics += topicCount;
    cat.questions += questionCount;
    
    cat.trackDetails.push({
      title: track.title,
      topics: topicCount,
      questions: questionCount
    });
  });

  console.log('=== SUBJECT COVERAGE AUDIT ===\n');
  for (const [catName, catData] of Object.entries(categories)) {
    console.log(`[CATEGORY: ${catName.toUpperCase()}]`);
    console.log(`Total Tracks: ${catData.tracks} | Total Topics: ${catData.topics} | Total Questions: ${catData.questions}`);
    
    catData.trackDetails.sort((a, b) => a.questions - b.questions).forEach(t => {
      let status = '🟢 OK';
      if (t.questions === 0) status = '🔴 EMPTY';
      else if (t.questions < 50) status = '🟡 LOW';
      else if (t.topics < 3) status = '🟠 FEW TOPICS';
      
      console.log(`  - ${t.title.padEnd(35)}: ${t.topics.toString().padStart(2)} topics, ${t.questions.toString().padStart(4)} questions [${status}]`);
    });
    console.log('');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
