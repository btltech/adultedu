
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ids = [
    '3b6f2520-8ed3-4cfa-8e0e-3bfa008075b6',
    '9014f28d-e00c-4d42-a046-ed6d4d0ed4e1',
    '34dc8908-3d66-49a0-918f-4a6ba2cd90f6',
    'e6a878c9-e57b-42db-8d46-ef7e0b5b87c0'
];

async function inspect() {
    const questions = await prisma.question.findMany({
        where: { id: { in: ids } }
    });

    questions.forEach(q => {
        console.log(`\nID: ${q.id} (Type: ${q.type})`);
        console.log(`Prompt: ${q.prompt}`);
        console.log(`Options: ${q.options}`);
        console.log(`Answer: ${q.answer}`);
    });
}

inspect().finally(() => prisma.$disconnect());
