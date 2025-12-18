/**
 * GCSE Expansion Seed Script
 * Adds tracks and topics for all major GCSE subjects
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedGCSEExpansion() {
    console.log('🎓 Expanding GCSE subjects...\n')

    // Create or get UK Level 2 (GCSE level)
    const l2 = await prisma.ukLevel.upsert({
        where: { code: 'L2' },
        update: {},
        create: {
            code: 'L2',
            title: 'Level 2',
            sortOrder: 2,
        },
    })

    // Create or get the GCSE framework
    const gcseFramework = await prisma.framework.upsert({
        where: { slug: 'gcse' },
        update: {},
        create: {
            slug: 'gcse',
            title: 'GCSE',
            description: 'General Certificate of Secondary Education',
        },
    })

    // ============================================
    // GCSE ENGLISH LANGUAGE
    // ============================================
    const gcseEnglishLang = await prisma.track.upsert({
        where: { slug: 'gcse-english-language' },
        update: {},
        create: {
            slug: 'gcse-english-language',
            title: 'GCSE English Language',
            description: 'Develop reading comprehension, writing skills, and language analysis for GCSE English Language.',
            category: 'qualifications',
            isLive: true,
            
        },
    })

    await prisma.trackFramework.upsert({
        where: { trackId_frameworkId: { trackId: gcseEnglishLang.id, frameworkId: gcseFramework.id } },
        update: {},
        create: { trackId: gcseEnglishLang.id, frameworkId: gcseFramework.id },
    })

    const englishLangTopics = [
        { id: 'gcse-eng-1', title: 'Reading: Fiction Texts', description: 'Analyse fiction extracts including character, setting, and narrative techniques.' },
        { id: 'gcse-eng-2', title: 'Reading: Non-Fiction Texts', description: 'Understand arguments, viewpoints, and persuasive techniques in non-fiction.' },
        { id: 'gcse-eng-3', title: 'Language Analysis', description: 'Identify and analyse language devices: metaphors, similes, imagery.' },
        { id: 'gcse-eng-4', title: 'Structure and Form', description: 'Analyse how writers structure texts for effect.' },
        { id: 'gcse-eng-5', title: 'Writing: Creative', description: 'Narrative and descriptive writing techniques.' },
        { id: 'gcse-eng-6', title: 'Writing: Transactional', description: 'Articles, letters, speeches, and reviews.' },
        { id: 'gcse-eng-7', title: 'Spelling, Punctuation & Grammar', description: 'Master SPaG for clear, accurate writing.' },
    ]

    for (let i = 0; i < englishLangTopics.length; i++) {
        const t = englishLangTopics[i]
        await prisma.topic.upsert({
            where: { id: t.id },
            update: {},
            create: { ...t, trackId: gcseEnglishLang.id, ukLevelId: l2.id, sortOrder: i + 1 },
        })
    }
    console.log(`✓ GCSE English Language: ${englishLangTopics.length} topics`)

    // ============================================
    // GCSE ENGLISH LITERATURE
    // ============================================
    const gcseEnglishLit = await prisma.track.upsert({
        where: { slug: 'gcse-english-literature' },
        update: {},
        create: {
            slug: 'gcse-english-literature',
            title: 'GCSE English Literature',
            description: 'Study poetry, prose, and drama texts for GCSE English Literature.',
            category: 'qualifications',
            isLive: true,
            
        },
    })

    await prisma.trackFramework.upsert({
        where: { trackId_frameworkId: { trackId: gcseEnglishLit.id, frameworkId: gcseFramework.id } },
        update: {},
        create: { trackId: gcseEnglishLit.id, frameworkId: gcseFramework.id },
    })

    const englishLitTopics = [
        { id: 'gcse-lit-1', title: 'Shakespeare', description: 'Analyse Shakespeare plays including themes, characters, and language.' },
        { id: 'gcse-lit-2', title: '19th Century Novel', description: 'Study classic novels: themes, context, and character analysis.' },
        { id: 'gcse-lit-3', title: 'Modern Prose or Drama', description: 'Analyse modern texts including An Inspector Calls, Lord of the Flies.' },
        { id: 'gcse-lit-4', title: 'Poetry Anthology', description: 'Compare and analyse poems across themes (power, conflict, relationships).' },
        { id: 'gcse-lit-5', title: 'Unseen Poetry', description: 'Techniques for analysing unfamiliar poems.' },
    ]

    for (let i = 0; i < englishLitTopics.length; i++) {
        const t = englishLitTopics[i]
        await prisma.topic.upsert({
            where: { id: t.id },
            update: {},
            create: { ...t, trackId: gcseEnglishLit.id, ukLevelId: l2.id, sortOrder: i + 1 },
        })
    }
    console.log(`✓ GCSE English Literature: ${englishLitTopics.length} topics`)

    // ============================================
    // GCSE BIOLOGY
    // ============================================
    const gcseBiology = await prisma.track.upsert({
        where: { slug: 'gcse-biology' },
        update: {},
        create: {
            slug: 'gcse-biology',
            title: 'GCSE Biology',
            description: 'Study cells, organisms, genetics, and ecology for GCSE Biology.',
            category: 'qualifications',
            isLive: true,
            
        },
    })

    await prisma.trackFramework.upsert({
        where: { trackId_frameworkId: { trackId: gcseBiology.id, frameworkId: gcseFramework.id } },
        update: {},
        create: { trackId: gcseBiology.id, frameworkId: gcseFramework.id },
    })

    const biologyTopics = [
        { id: 'gcse-bio-1', title: 'Cell Biology', description: 'Cell structure, organelles, microscopy, and cell division.' },
        { id: 'gcse-bio-2', title: 'Organisation', description: 'Tissues, organs, organ systems, and the digestive system.' },
        { id: 'gcse-bio-3', title: 'Infection and Response', description: 'Pathogens, immune system, vaccinations, and antibiotics.' },
        { id: 'gcse-bio-4', title: 'Bioenergetics', description: 'Photosynthesis and respiration.' },
        { id: 'gcse-bio-5', title: 'Homeostasis', description: 'Nervous system, hormones, and maintaining body conditions.' },
        { id: 'gcse-bio-6', title: 'Inheritance and Evolution', description: 'DNA, genetics, natural selection, and classification.' },
        { id: 'gcse-bio-7', title: 'Ecology', description: 'Ecosystems, biodiversity, and human impact on environment.' },
    ]

    for (let i = 0; i < biologyTopics.length; i++) {
        const t = biologyTopics[i]
        await prisma.topic.upsert({
            where: { id: t.id },
            update: {},
            create: { ...t, trackId: gcseBiology.id, ukLevelId: l2.id, sortOrder: i + 1 },
        })
    }
    console.log(`✓ GCSE Biology: ${biologyTopics.length} topics`)

    // ============================================
    // GCSE CHEMISTRY
    // ============================================
    const gcseChemistry = await prisma.track.upsert({
        where: { slug: 'gcse-chemistry' },
        update: {},
        create: {
            slug: 'gcse-chemistry',
            title: 'GCSE Chemistry',
            description: 'Study atomic structure, reactions, and materials for GCSE Chemistry.',
            category: 'qualifications',
            isLive: true,
            
        },
    })

    await prisma.trackFramework.upsert({
        where: { trackId_frameworkId: { trackId: gcseChemistry.id, frameworkId: gcseFramework.id } },
        update: {},
        create: { trackId: gcseChemistry.id, frameworkId: gcseFramework.id },
    })

    const chemistryTopics = [
        { id: 'gcse-chem-1', title: 'Atomic Structure', description: 'Atoms, elements, compounds, and the periodic table.' },
        { id: 'gcse-chem-2', title: 'Bonding and Structure', description: 'Ionic, covalent, and metallic bonding.' },
        { id: 'gcse-chem-3', title: 'Quantitative Chemistry', description: 'Moles, equations, and calculations.' },
        { id: 'gcse-chem-4', title: 'Chemical Changes', description: 'Reactivity series, acids, and electrolysis.' },
        { id: 'gcse-chem-5', title: 'Energy Changes', description: 'Exothermic and endothermic reactions.' },
        { id: 'gcse-chem-6', title: 'Rate of Reaction', description: 'Factors affecting reaction rates and collision theory.' },
        { id: 'gcse-chem-7', title: 'Organic Chemistry', description: 'Hydrocarbons, polymers, and crude oil.' },
        { id: 'gcse-chem-8', title: 'Chemical Analysis', description: 'Testing for ions and chromatography.' },
    ]

    for (let i = 0; i < chemistryTopics.length; i++) {
        const t = chemistryTopics[i]
        await prisma.topic.upsert({
            where: { id: t.id },
            update: {},
            create: { ...t, trackId: gcseChemistry.id, ukLevelId: l2.id, sortOrder: i + 1 },
        })
    }
    console.log(`✓ GCSE Chemistry: ${chemistryTopics.length} topics`)

    // ============================================
    // GCSE PHYSICS
    // ============================================
    const gcsePhysics = await prisma.track.upsert({
        where: { slug: 'gcse-physics' },
        update: {},
        create: {
            slug: 'gcse-physics',
            title: 'GCSE Physics',
            description: 'Study energy, forces, waves, and electricity for GCSE Physics.',
            category: 'qualifications',
            isLive: true,
            
        },
    })

    await prisma.trackFramework.upsert({
        where: { trackId_frameworkId: { trackId: gcsePhysics.id, frameworkId: gcseFramework.id } },
        update: {},
        create: { trackId: gcsePhysics.id, frameworkId: gcseFramework.id },
    })

    const physicsTopics = [
        { id: 'gcse-phys-1', title: 'Energy', description: 'Energy stores, transfers, and conservation.' },
        { id: 'gcse-phys-2', title: 'Electricity', description: 'Circuits, resistance, and power.' },
        { id: 'gcse-phys-3', title: 'Particle Model', description: 'States of matter, density, and pressure.' },
        { id: 'gcse-phys-4', title: 'Atomic Structure', description: 'Radioactivity, half-life, and nuclear equations.' },
        { id: 'gcse-phys-5', title: 'Forces', description: 'Newton\'s laws, momentum, and pressure.' },
        { id: 'gcse-phys-6', title: 'Waves', description: 'Properties of waves, sound, and light.' },
        { id: 'gcse-phys-7', title: 'Magnetism', description: 'Magnetic fields, electromagnets, and motors.' },
        { id: 'gcse-phys-8', title: 'Space', description: 'Solar system, life cycle of stars, and cosmology.' },
    ]

    for (let i = 0; i < physicsTopics.length; i++) {
        const t = physicsTopics[i]
        await prisma.topic.upsert({
            where: { id: t.id },
            update: {},
            create: { ...t, trackId: gcsePhysics.id, ukLevelId: l2.id, sortOrder: i + 1 },
        })
    }
    console.log(`✓ GCSE Physics: ${physicsTopics.length} topics`)

    // ============================================
    // GCSE HISTORY
    // ============================================
    const gcseHistory = await prisma.track.upsert({
        where: { slug: 'gcse-history' },
        update: {},
        create: {
            slug: 'gcse-history',
            title: 'GCSE History',
            description: 'Study key periods and events in British and world history.',
            category: 'qualifications',
            isLive: true,
            
        },
    })

    await prisma.trackFramework.upsert({
        where: { trackId_frameworkId: { trackId: gcseHistory.id, frameworkId: gcseFramework.id } },
        update: {},
        create: { trackId: gcseHistory.id, frameworkId: gcseFramework.id },
    })

    const historyTopics = [
        { id: 'gcse-hist-1', title: 'Medicine Through Time', description: 'Medical developments from medieval to modern times.' },
        { id: 'gcse-hist-2', title: 'Crime and Punishment', description: 'How crime and punishment changed through history.' },
        { id: 'gcse-hist-3', title: 'Elizabethan England', description: 'Life, government, and challenges in Elizabethan era.' },
        { id: 'gcse-hist-4', title: 'World War 1', description: 'Causes, events, and aftermath of WWI.' },
        { id: 'gcse-hist-5', title: 'Weimar and Nazi Germany', description: 'Rise of Hitler, Nazi policies, and WWII.' },
        { id: 'gcse-hist-6', title: 'Cold War', description: 'Superpower tensions, events, and resolution.' },
    ]

    for (let i = 0; i < historyTopics.length; i++) {
        const t = historyTopics[i]
        await prisma.topic.upsert({
            where: { id: t.id },
            update: {},
            create: { ...t, trackId: gcseHistory.id, ukLevelId: l2.id, sortOrder: i + 1 },
        })
    }
    console.log(`✓ GCSE History: ${historyTopics.length} topics`)

    // ============================================
    // GCSE GEOGRAPHY
    // ============================================
    const gcseGeography = await prisma.track.upsert({
        where: { slug: 'gcse-geography' },
        update: {},
        create: {
            slug: 'gcse-geography',
            title: 'GCSE Geography',
            description: 'Study physical and human geography including climate, cities, and development.',
            category: 'qualifications',
            isLive: true,
            
        },
    })

    await prisma.trackFramework.upsert({
        where: { trackId_frameworkId: { trackId: gcseGeography.id, frameworkId: gcseFramework.id } },
        update: {},
        create: { trackId: gcseGeography.id, frameworkId: gcseFramework.id },
    })

    const geographyTopics = [
        { id: 'gcse-geo-1', title: 'Tectonic Hazards', description: 'Earthquakes, volcanoes, and plate tectonics.' },
        { id: 'gcse-geo-2', title: 'Weather Hazards', description: 'Tropical storms, UK weather extremes, and climate.' },
        { id: 'gcse-geo-3', title: 'Climate Change', description: 'Causes, effects, and responses to climate change.' },
        { id: 'gcse-geo-4', title: 'Ecosystems', description: 'Tropical rainforests and cold environments.' },
        { id: 'gcse-geo-5', title: 'River Landscapes', description: 'Erosion, transport, deposition, and flooding.' },
        { id: 'gcse-geo-6', title: 'Urban Issues', description: 'Urbanisation, sustainability, and city challenges.' },
        { id: 'gcse-geo-7', title: 'Global Development', description: 'Measuring development and reducing the gap.' },
        { id: 'gcse-geo-8', title: 'Resource Management', description: 'Food, water, and energy security.' },
    ]

    for (let i = 0; i < geographyTopics.length; i++) {
        const t = geographyTopics[i]
        await prisma.topic.upsert({
            where: { id: t.id },
            update: {},
            create: { ...t, trackId: gcseGeography.id, ukLevelId: l2.id, sortOrder: i + 1 },
        })
    }
    console.log(`✓ GCSE Geography: ${geographyTopics.length} topics`)

    // Summary
    const trackCount = await prisma.track.count({ where: { category: 'qualifications' } })
    const topicCount = await prisma.topic.count()

    console.log('\n✅ GCSE expansion complete!')
    console.log(`   Qualification tracks: ${trackCount}`)
    console.log(`   Total topics: ${topicCount}`)
}

seedGCSEExpansion()
    .catch(e => { console.error('Error:', e); process.exit(1) })
    .finally(() => prisma.$disconnect())
