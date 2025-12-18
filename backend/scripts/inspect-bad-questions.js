
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ids = [
    'fde60dbd-a675-43dc-9a46-6d86026eb7e5', // Out of range mcq
    '3b6f2520-8ed3-4cfa-8e0e-3bfa008075b6', // Mismatched mcq
    '3afddfa9-2df7-4cba-8f3d-025b7729c8d7', // Invalid TF
    '9864b84c-8361-44fb-8a4b-4515e47725e6'  // Missing explanation
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
        console.log(`Explanation: ${q.explanation}`);
    });
}

inspect().finally(() => prisma.$disconnect());
