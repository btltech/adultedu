/**
 * Test Image Labeling Content
 * 
 * content: Seed a biology image labeling question
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🏷️ Seeding image label test content...\n');

    // 1. Get a Biology or Science topic (or stick to Geometry if needed, but Biology is better for labeling)
    // Let's look for "Cell" or "Biology" or "Science"
    // Fallback to "Vectors" found previously if others fail, but let's try a new topic.
    // Actually, let's list topics first? No, let's guess a likely one or use existing "Vectors" and pretend it's a vector diagram.
    // Or "Geometry" -> Label parts of a circle (Radius, Diameter, Chord). Good idea.

    const topic = await prisma.topic.findFirst({
        where: { title: { contains: 'Geometry' } }
    });

    if (!topic) {
        console.log('❌ Could not find Geometry topic');
        return;
    }

    // 2. Create Image Label Question (Label Parts of a Circle)
    // Using a placeholder image of a circle with lines.
    // Targets: 
    // - Radius (Center to edge)
    // - Diameter (Edge to edge through center)
    // - Chord (Edge to edge not through center)

    const assetsConfig = {
        imageUrl: "https://placehold.co/600x400/1a1a1a/ffffff?text=Circle+Diagram+with+Lines",
        targets: [
            { id: "t_radius", x: 60, y: 50, width: 20, height: 10 }, // Right side
            { id: "t_diameter", x: 50, y: 50, width: 20, height: 10 }, // Center
            { id: "t_chord", x: 50, y: 80, width: 20, height: 10 }  // Bottom
        ],
        options: ["Radius", "Diameter", "Chord", "Tangent"], // Tangent is distractor
        answer: {
            "t_radius": "Radius",
            "t_diameter": "Diameter",
            "t_chord": "Chord"
        }
    };

    const labelQ = await prisma.question.upsert({
        where: { id: '139c7b2e-cea3-42fd-9ba3-ed4d286c8de0' },
        update: {
            assets: JSON.stringify(assetsConfig),
            answer: JSON.stringify(assetsConfig.answer),
            options: JSON.stringify(assetsConfig.options),
            createdAt: new Date(), // Force update to top of list
        },
        create: {
            id: '139c7b2e-cea3-42fd-9ba3-ed4d286c8de0',
            topicId: topic.id,
            ukLevelId: topic.ukLevelId,
            type: 'image_label',
            prompt: 'Drag the correct terms to label the parts of the circle.',
            difficulty: 3,
            options: JSON.stringify(assetsConfig.options),
            answer: JSON.stringify(assetsConfig.answer),
            explanation: 'The diameter goes through the center, the radius is from center to edge, and a chord connects two points on the circumference.',
            assets: JSON.stringify(assetsConfig),
            sourceMeta: JSON.stringify({ type: 'label_test' }),
            isPublished: true,
            createdAt: new Date(),
        },
    });

    console.log(`✅ Created Image Label Question: ${labelQ.id}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
