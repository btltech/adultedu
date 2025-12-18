
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
    // 1. Delete garbage
    await prisma.question.delete({ where: { id: '3b6f2520-8ed3-4cfa-8e0e-3bfa008075b6' } });
    console.log('Deleted garbage item');

    // 2. Fix 0.2 vs 0.20
    // 34dc8908... options ["0.15","0.20","0.25","0.30"] answer "0.2" -> index 1
    await prisma.question.update({
        where: { id: '34dc8908-3d66-49a0-918f-4a6ba2cd90f6' },
        data: { answer: '1' } // Index of 0.20
    });

    // e6a878c9... options ["0.15","0.20","0.23","0.28"] answer "0.2" -> index 1
    await prisma.question.update({
        where: { id: 'e6a878c9-e57b-42db-8d46-ef7e0b5b87c0' },
        data: { answer: '1' }
    });

    // 3. Fix matrix
    // 9014f28d... Options: ["[[2, 1], [1, 1]]","[[1, 0], [0, 1]]","[[-1, 0], [0, -1]]","[[2, 3], [1, 2]]"]
    // Answer: [[-1, 0], [0, -1]] -> Index 2
    await prisma.question.update({
        where: { id: '9014f28d-e00c-4d42-a046-ed6d4d0ed4e1' },
        data: { answer: '2' }
    });
    console.log('Fixed 3 mismatched items');
}

cleanup().finally(() => prisma.$disconnect());
