/**
 * Database Seed Script
 * Populates UK Levels, Frameworks, MVP Tracks, and starter Topics
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
import crypto from 'crypto'

async function main() {
    console.log('🌱 Starting database seed...\n')

    // ============================================
    // Admin User
    // ============================================
    console.log('👤 Seeding Users...')

    // Hash password for 'admin123'
    // $2a$10$w1.q7D.p0z.v.f.x.y.z. -> actually let's use the library or a known hash
    // Using a known hash for 'admin123' to avoid importing bcrypt if not needed, 
    // BUT package.json has bcryptjs, so let's import it.

    const passwordHash = '$2a$10$X7.G1.k1.v1.f1.x1.y1.z1.Q2.w2.e2.r2.t2.y2.u2.i2.o2.p2' // Placeholder if import fails? No, let's use proper import.


    // ============================================
    // Admin User
    // ============================================
    console.log('👤 Seeding Users...')

    const adminEmail = 'admin@adultedu.com'

    // Secure password generation
    let adminPassword = process.env.ADMIN_SEED_PASSWORD
    if (!adminPassword) {
        adminPassword = crypto.randomBytes(16).toString('base64url')
        console.log('\n⚠️  SECURITY ALERT: No ADMIN_SEED_PASSWORD found in environment.')
        console.log('   Generated secure one-time admin password:')
        console.log(`   👉 ${adminPassword}`)
        console.log('   (Save this password immediately or set ADMIN_SEED_PASSWORD in .env for next time)\n')
    } else {
        console.log('   Using provided ADMIN_SEED_PASSWORD')
    }
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(adminPassword, salt)

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: { role: 'admin' }, // Ensure they remain admin
        create: {
            email: adminEmail,
            passwordHash: hash,
            role: 'admin',
        },
    })
    console.log(`   ✓ Admin user ready: ${adminEmail}\n`)

    // ============================================
    // UK Qualification Levels
    // ============================================
    console.log('📊 Seeding UK Levels...')

    const ukLevels = [
        { code: 'E1', title: 'Entry Level 1', sortOrder: 1 },
        { code: 'E2', title: 'Entry Level 2', sortOrder: 2 },
        { code: 'E3', title: 'Entry Level 3', sortOrder: 3 },
        { code: 'L1', title: 'Level 1', sortOrder: 4 },
        { code: 'L2', title: 'Level 2', sortOrder: 5 },
        { code: 'L3', title: 'Level 3', sortOrder: 6 },
        { code: 'L4', title: 'Level 4', sortOrder: 7 },
        { code: 'L5', title: 'Level 5', sortOrder: 8 },
        { code: 'L6', title: 'Level 6', sortOrder: 9 },
        { code: 'L7', title: 'Level 7', sortOrder: 10 },
        { code: 'L8', title: 'Level 8', sortOrder: 11 },
    ]

    for (const level of ukLevels) {
        await prisma.ukLevel.upsert({
            where: { code: level.code },
            update: {},
            create: level,
        })
    }
    console.log(`   ✓ Created ${ukLevels.length} UK levels\n`)

    // ============================================
    // Frameworks
    // ============================================
    console.log('📋 Seeding Frameworks...')

    const frameworks = [
        {
            slug: 'EDS',
            title: 'Essential Digital Skills',
            description: 'The UK Essential Digital Skills framework covers the digital skills adults need for life, work, and further learning.',
        },
        {
            slug: 'FS',
            title: 'Functional Skills',
            description: 'Functional Skills qualifications in English and Maths for practical, everyday skills.',
        },
        {
            slug: 'GCSE',
            title: 'GCSE',
            description: 'General Certificate of Secondary Education preparation aligned to national curriculum.',
        },
        {
            slug: 'ALEVEL',
            title: 'A-Level',
            description: 'Advanced Level preparation for university entry and career progression.',
        },
        {
            slug: 'HE',
            title: 'Higher Education',
            description: 'University-level preparation and foundation courses.',
        },
        {
            slug: 'TECH',
            title: 'Tech Pathways',
            description: 'Industry-aligned technology skills including programming, cloud, and AI.',
        },
    ]

    for (const framework of frameworks) {
        await prisma.framework.upsert({
            where: { slug: framework.slug },
            update: {},
            create: framework,
        })
    }
    console.log(`   ✓ Created ${frameworks.length} frameworks\n`)

    // ============================================
    // EDS Outcomes (Skill Statements by Area)
    // ============================================
    console.log('🎯 Seeding EDS Outcomes...')

    const edsFramework = await prisma.framework.findUnique({ where: { slug: 'EDS' } })

    const edsOutcomes = [
        // Foundation Skills
        { code: 'EDS-F1', title: 'Turn on a device and log in', area: 'foundation' },
        { code: 'EDS-F2', title: 'Use a mouse, keyboard, or touchscreen', area: 'foundation' },
        { code: 'EDS-F3', title: 'Connect a device to WiFi', area: 'foundation' },
        { code: 'EDS-F4', title: 'Update and change a password', area: 'foundation' },

        // Communicating
        { code: 'EDS-C1', title: 'Send and receive emails', area: 'communicating' },
        { code: 'EDS-C2', title: 'Communicate using video calling', area: 'communicating' },
        { code: 'EDS-C3', title: 'Use messaging apps and SMS', area: 'communicating' },
        { code: 'EDS-C4', title: 'Post on social media', area: 'communicating' },

        // Handling Information
        { code: 'EDS-H1', title: 'Use search engines to find information', area: 'handling_info' },
        { code: 'EDS-H2', title: 'Store and access files in the cloud', area: 'handling_info' },
        { code: 'EDS-H3', title: 'Manage files and folders', area: 'handling_info' },
        { code: 'EDS-H4', title: 'Create documents and spreadsheets', area: 'handling_info' },

        // Transacting
        { code: 'EDS-T1', title: 'Set up accounts for online services', area: 'transacting' },
        { code: 'EDS-T2', title: 'Complete online forms', area: 'transacting' },
        { code: 'EDS-T3', title: 'Make online purchases safely', area: 'transacting' },
        { code: 'EDS-T4', title: 'Use online banking', area: 'transacting' },

        // Problem Solving
        { code: 'EDS-P1', title: 'Solve common device problems', area: 'problem_solving' },
        { code: 'EDS-P2', title: 'Find tutorials and help online', area: 'problem_solving' },
        { code: 'EDS-P3', title: 'Use accessibility features', area: 'problem_solving' },

        // Being Safe
        { code: 'EDS-S1', title: 'Recognise suspicious emails and messages', area: 'being_safe' },
        { code: 'EDS-S2', title: 'Create strong passwords', area: 'being_safe' },
        { code: 'EDS-S3', title: 'Understand privacy settings', area: 'being_safe' },
        { code: 'EDS-S4', title: 'Keep devices and apps updated', area: 'being_safe' },
    ]

    for (const outcome of edsOutcomes) {
        await prisma.outcome.upsert({
            where: {
                frameworkId_code: {
                    frameworkId: edsFramework.id,
                    code: outcome.code
                }
            },
            update: {},
            create: {
                frameworkId: edsFramework.id,
                ...outcome,
            },
        })
    }
    console.log(`   ✓ Created ${edsOutcomes.length} EDS outcomes\n`)

    // ============================================
    // Tracks
    // ============================================
    console.log('📚 Seeding Tracks...')

    // Get level IDs for reference
    const l1 = await prisma.ukLevel.findUnique({ where: { code: 'L1' } })
    const l2 = await prisma.ukLevel.findUnique({ where: { code: 'L2' } })
    const e3 = await prisma.ukLevel.findUnique({ where: { code: 'E3' } })

    const tracks = [
        // Live MVP tracks
        {
            slug: 'essential-digital-skills',
            title: 'Essential Digital Skills',
            description: 'Master the digital skills you need for everyday life and work. Aligned to the UK Essential Digital Skills framework.',
            category: 'workplace',
            isLive: true,
            frameworks: ['EDS'],
        },
        {
            slug: 'gcse-maths',
            title: 'GCSE Maths Preparation',
            description: 'Build strong maths foundations with practice questions and timed mock exams. Aligned to GCSE curriculum.',
            category: 'qual_prep',
            isLive: true,
            frameworks: ['GCSE'],
        },
        {
            slug: 'python-mastery',
            title: 'Python Mastery',
            description: 'Learn programming from scratch to expert level. Covers basics, OOP, concurrency, and real-world projects with FastAPI.',
            category: 'tech',
            isLive: true,
            frameworks: ['TECH'],
        },
        // Coming soon tracks
        {
            slug: 'functional-skills-english',
            title: 'Functional Skills English',
            description: 'Improve your reading, writing, and communication skills for work and life.',
            category: 'workplace',
            isLive: false,
            frameworks: ['FS'],
        },
        {
            slug: 'functional-skills-maths',
            title: 'Functional Skills Maths',
            description: 'Essential maths skills for everyday situations and the workplace.',
            category: 'workplace',
            isLive: false,
            frameworks: ['FS'],
        },
        {
            slug: 'gcse-english',
            title: 'GCSE English Language',
            description: 'Prepare for GCSE English with reading comprehension and writing practice.',
            category: 'qual_prep',
            isLive: false,
            frameworks: ['GCSE'],
        },
        {
            slug: 'a-level-maths',
            title: 'A-Level Maths',
            description: 'Advanced mathematics preparation for higher education entry.',
            category: 'qual_prep',
            isLive: false,
            frameworks: ['ALEVEL'],
        },
        {
            slug: 'cpp-introduction',
            title: 'Introduction to C++',
            description: 'Learn the fundamentals of C++ programming for systems and game development.',
            category: 'tech',
            isLive: false,
            frameworks: ['TECH'],
        },
        {
            slug: 'aws-cloud-practitioner',
            title: 'AWS Cloud Practitioner',
            description: 'Prepare for the AWS Cloud Practitioner certification with hands-on labs.',
            category: 'tech',
            isLive: false,
            frameworks: ['TECH'],
        },
        {
            slug: 'intro-to-ai',
            title: 'Introduction to AI',
            description: 'Understand artificial intelligence concepts, applications, and ethical considerations.',
            category: 'tech',
            isLive: false,
            frameworks: ['TECH'],
        },
    ]

    for (const trackData of tracks) {
        const { frameworks: frameworkSlugs, ...trackFields } = trackData

        const track = await prisma.track.upsert({
            where: { slug: trackFields.slug },
            update: {},
            create: trackFields,
        })

        // Link frameworks
        for (const slug of frameworkSlugs) {
            const framework = await prisma.framework.findUnique({ where: { slug } })
            if (framework) {
                await prisma.trackFramework.upsert({
                    where: {
                        trackId_frameworkId: { trackId: track.id, frameworkId: framework.id },
                    },
                    update: {},
                    create: { trackId: track.id, frameworkId: framework.id },
                })
            }
        }
    }
    console.log(`   ✓ Created ${tracks.length} tracks\n`)

    // ============================================
    // Topics for MVP Tracks
    // ============================================
    console.log('📖 Seeding Topics...')

    // EDS Topics (by area)
    const edsTrack = await prisma.track.findUnique({ where: { slug: 'essential-digital-skills' } })
    const edsTopics = [
        { title: 'Digital Foundation Skills', description: 'Learn to use devices, connect to WiFi, and manage passwords.', sortOrder: 1, ukLevelCode: 'E3' },
        { title: 'Communicating Online', description: 'Email, video calls, messaging, and social media basics.', sortOrder: 2, ukLevelCode: 'E3' },
        { title: 'Handling Information', description: 'Search, store, and manage digital files and documents.', sortOrder: 3, ukLevelCode: 'L1' },
        { title: 'Online Transactions', description: 'Set up accounts, fill forms, shop online, and use banking.', sortOrder: 4, ukLevelCode: 'L1' },
        { title: 'Problem Solving', description: 'Troubleshoot issues and find help online.', sortOrder: 5, ukLevelCode: 'L1' },
        { title: 'Being Safe Online', description: 'Recognise threats, protect privacy, and stay secure.', sortOrder: 6, ukLevelCode: 'L1' },
    ]

    for (const topicData of edsTopics) {
        const ukLevel = await prisma.ukLevel.findUnique({ where: { code: topicData.ukLevelCode } })
        await prisma.topic.upsert({
            where: {
                id: `eds-${topicData.sortOrder}` // Use predictable ID for upsert
            },
            update: {},
            create: {
                id: `eds-${topicData.sortOrder}`,
                trackId: edsTrack.id,
                ukLevelId: ukLevel.id,
                title: topicData.title,
                description: topicData.description,
                sortOrder: topicData.sortOrder,
            },
        })
    }
    console.log(`   ✓ Created ${edsTopics.length} EDS topics`)

    // GCSE Maths Topics
    const gcseTrack = await prisma.track.findUnique({ where: { slug: 'gcse-maths' } })
    const gcseTopics = [
        { title: 'Number', description: 'Integers, fractions, decimals, percentages, and ratio.', sortOrder: 1, ukLevelCode: 'L2' },
        { title: 'Algebra', description: 'Expressions, equations, inequalities, and sequences.', sortOrder: 2, ukLevelCode: 'L2' },
        { title: 'Ratio and Proportion', description: 'Direct proportion, inverse proportion, and rates of change.', sortOrder: 3, ukLevelCode: 'L2' },
        { title: 'Geometry: Properties', description: 'Angles, shapes, congruence, and similarity.', sortOrder: 4, ukLevelCode: 'L2' },
        { title: 'Geometry: Measures', description: 'Units, area, volume, and trigonometry.', sortOrder: 5, ukLevelCode: 'L2' },
        { title: 'Probability', description: 'Single and combined events, tree diagrams, and Venn diagrams.', sortOrder: 6, ukLevelCode: 'L2' },
        { title: 'Statistics', description: 'Averages, charts, scatter graphs, and data handling.', sortOrder: 7, ukLevelCode: 'L2' },
        { title: 'Graphs', description: 'Linear graphs, quadratics, and real-life graphs.', sortOrder: 8, ukLevelCode: 'L2' },
    ]

    for (const topicData of gcseTopics) {
        const ukLevel = await prisma.ukLevel.findUnique({ where: { code: topicData.ukLevelCode } })
        await prisma.topic.upsert({
            where: { id: `gcse-${topicData.sortOrder}` },
            update: {},
            create: {
                id: `gcse-${topicData.sortOrder}`,
                trackId: gcseTrack.id,
                ukLevelId: ukLevel.id,
                title: topicData.title,
                description: topicData.description,
                sortOrder: topicData.sortOrder,
            },
        })
    }
    console.log(`   ✓ Created ${gcseTopics.length} GCSE Maths topics`)

    // Python Mastery Topics
    const pythonTrack = await prisma.track.findUnique({ where: { slug: 'python-mastery' } })
    const pythonTopics = [
        // Level 1-2: Spark
        { title: 'Python Spark: The Basics', description: 'Syntax, variables, and simple math operations.', sortOrder: 1, ukLevelCode: 'L1' },
        { title: 'Data Types and Structures', description: 'Numbers, strings, and introductory lists.', sortOrder: 2, ukLevelCode: 'L2' },

        // Level 3: Core Foundations
        { title: 'Core Data Structures', description: 'Deep dive into lists, dictionaries, tuples, and sets.', sortOrder: 3, ukLevelCode: 'L3' },
        { title: 'Functions and Scope', description: 'Defining functions, parameters, and variable scope.', sortOrder: 4, ukLevelCode: 'L3' },

        // Level 4: Program Design
        { title: 'Control Flow and Logic', description: 'Advanced loops, conditionals, and logical operators.', sortOrder: 5, ukLevelCode: 'L4' },
        { title: 'Error Handling and Debugging', description: 'Try-except blocks and standard debugging techniques.', sortOrder: 6, ukLevelCode: 'L4' },

        // Level 5: OOP
        { title: 'Object-Oriented Python', description: 'Classes, objects, and the principles of OOP.', sortOrder: 7, ukLevelCode: 'L5' },
        { title: 'Advanced OOP', description: 'Inheritance, polymorphism, and dunder methods.', sortOrder: 8, ukLevelCode: 'L5' },

        // Level 6: Modern Patterns
        { title: 'Pythonic Patterns', description: 'Decorators, generators, and list comprehensions.', sortOrder: 9, ukLevelCode: 'L6' },
        { title: 'Functional Programming in Python', description: 'Lambda functions, map, filter, and reduce.', sortOrder: 10, ukLevelCode: 'L6' },

        // Level 7: Systems
        { title: 'Concurrency and Parallelism', description: 'Threading, multiprocessing, and asyncio.', sortOrder: 11, ukLevelCode: 'L7' },
        { title: 'Testing and Performance', description: 'Pytest, unit testing, and code profiling.', sortOrder: 12, ukLevelCode: 'L7' },

        // Level 8: Mastery
        { title: 'Web Development with FastAPI', description: 'Building modern APIs and integration with databases.', sortOrder: 13, ukLevelCode: 'L8' },
        { title: 'Mastery Capstone', description: 'Applying all skills to a comprehensive real-world project.', sortOrder: 14, ukLevelCode: 'L8' },
    ]

    for (const topicData of pythonTopics) {
        const ukLevel = await prisma.ukLevel.findUnique({ where: { code: topicData.ukLevelCode } })
        await prisma.topic.upsert({
            where: { id: `python-${topicData.sortOrder}` },
            update: {},
            create: {
                id: `python-${topicData.sortOrder}`,
                trackId: pythonTrack.id,
                ukLevelId: ukLevel.id,
                title: topicData.title,
                description: topicData.description,
                sortOrder: topicData.sortOrder,
            },
        })
    }
    console.log(`   ✓ Created ${pythonTopics.length} Python topics\n`)

    // ============================================
    // Summary
    // ============================================
    const counts = {
        ukLevels: await prisma.ukLevel.count(),
        frameworks: await prisma.framework.count(),
        outcomes: await prisma.outcome.count(),
        tracks: await prisma.track.count(),
        topics: await prisma.topic.count(),
    }

    console.log('✅ Seed complete!\n')
    console.log('📊 Database contents:')
    console.log(`   • UK Levels: ${counts.ukLevels}`)
    console.log(`   • Frameworks: ${counts.frameworks}`)
    console.log(`   • Outcomes: ${counts.outcomes}`)
    console.log(`   • Tracks: ${counts.tracks}`)
    console.log(`   • Topics: ${counts.topics}`)
    console.log('')
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
