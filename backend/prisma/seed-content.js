/**
 * Content Seed Script
 * Seeds real lessons and questions for MVP tracks
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// EDS: Digital Foundation Skills - First Lesson
const edsFoundationLesson = {
    title: 'Getting Started with Your Device',
    summary: 'Learn the basics of turning on devices, logging in, and navigating the screen.',
    estMinutes: 15,
    contentBlocks: JSON.stringify([
        { type: 'heading', content: 'Welcome to Digital Skills' },
        { type: 'paragraph', content: 'This lesson will help you become confident using digital devices like computers, tablets, and smartphones. Whether you\'re completely new to technology or just need a refresher, we\'ll cover the essential skills step by step.' },

        { type: 'subheading', content: 'Turning On Your Device' },
        { type: 'paragraph', content: 'Every device has a power button. On laptops, it\'s usually at the top right of the keyboard or on the side. On tablets and phones, look for a button on the side edge.' },
        { type: 'callout', variant: 'tip', content: 'If your device doesn\'t respond, it might need charging. Look for a charging port and connect the charger.' },

        { type: 'subheading', content: 'The Login Screen' },
        { type: 'paragraph', content: 'When your device starts, you\'ll see a login screen. This is where you enter your password or PIN to access your personal files and settings. This helps keep your information secure.' },
        {
            type: 'list', items: [
                'Enter your password or PIN using the on-screen or physical keyboard',
                'Press Enter or tap the arrow button to log in',
                'If you forget your password, look for a "Forgot password" option'
            ]
        },

        { type: 'subheading', content: 'Understanding the Desktop or Home Screen' },
        { type: 'paragraph', content: 'After logging in, you\'ll see your main screen. On computers, this is called the Desktop. On phones and tablets, it\'s the Home Screen. You\'ll see icons (small pictures) that represent different apps and programs.' },

        { type: 'callout', variant: 'info', content: 'Single-tap on touch screens or single-click with a mouse to select an icon. Double-tap or double-click to open it.' }
    ]),
}

// EDS: Foundation Skills - Questions
const edsFoundationQuestions = [
    {
        type: 'mcq',
        prompt: 'Where is the power button typically located on a laptop computer?',
        options: JSON.stringify(['At the bottom of the screen', 'On the top right of the keyboard or on the side', 'On the back of the device', 'Inside the battery compartment']),
        answer: JSON.stringify(1),
        explanation: 'Most laptops have their power button at the top right corner of the keyboard, above the number keys, or on the side of the device. This makes it easy to reach but hard to press accidentally.',
        difficulty: 1,
    },
    {
        type: 'true_false',
        prompt: 'You need to enter a password or PIN every time you turn on your device.',
        options: JSON.stringify(['True', 'False']),
        answer: JSON.stringify(0),
        explanation: 'While not strictly required on all devices, using a password or PIN is highly recommended to protect your personal information. Most devices are set up with password protection by default.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'What is the main screen on a computer called after you log in?',
        options: JSON.stringify(['Home Page', 'Start Menu', 'Desktop', 'Browser']),
        answer: JSON.stringify(2),
        explanation: 'The Desktop is the main screen you see after logging into Windows or Mac computers. It shows your wallpaper, icons for files and programs, and typically has a taskbar at the bottom.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'What should you do if your device won\'t turn on when you press the power button?',
        options: JSON.stringify(['Press the power button harder', 'Check if it needs charging', 'Buy a new device', 'Remove the battery']),
        answer: JSON.stringify(1),
        explanation: 'If a device won\'t turn on, the most common reason is that the battery has run out. Connect your device to a charger and wait a few minutes before trying again.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'How do you open an app or program on a touch screen device?',
        options: JSON.stringify(['Swipe left', 'Long press for 5 seconds', 'Single tap on the icon', 'Shake the device']),
        answer: JSON.stringify(2),
        explanation: 'On touch screen devices, a single tap on an app icon will open it. This is equivalent to double-clicking with a mouse on a computer.',
        difficulty: 1,
    },
]

// GCSE Maths: Number - First Lesson
const gcseMathsLesson = {
    title: 'Working with Fractions',
    summary: 'Learn how to add, subtract, multiply and divide fractions, including mixed numbers.',
    estMinutes: 20,
    contentBlocks: JSON.stringify([
        { type: 'heading', content: 'Understanding Fractions' },
        { type: 'paragraph', content: 'A fraction represents a part of a whole. The top number (numerator) tells us how many parts we have, and the bottom number (denominator) tells us how many equal parts the whole is divided into.' },

        { type: 'subheading', content: 'Adding and Subtracting Fractions' },
        { type: 'paragraph', content: 'To add or subtract fractions, they must have the same denominator. If they don\'t, you need to find a common denominator first.' },
        { type: 'code', content: '  1/4 + 2/4 = 3/4\n\n  1/3 + 1/2 → Find common denominator: 6\n  = 2/6 + 3/6 = 5/6' },

        { type: 'subheading', content: 'Multiplying Fractions' },
        { type: 'paragraph', content: 'To multiply fractions, multiply the numerators together and the denominators together. There\'s no need to find a common denominator.' },
        { type: 'code', content: '  2/3 × 4/5 = (2×4)/(3×5) = 8/15' },
        { type: 'callout', variant: 'tip', content: 'Always simplify your answer by finding the highest common factor (HCF) of the numerator and denominator.' },

        { type: 'subheading', content: 'Dividing Fractions' },
        { type: 'paragraph', content: 'To divide by a fraction, flip it (find the reciprocal) and multiply instead.' },
        { type: 'code', content: '  2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6' },

        { type: 'subheading', content: 'Mixed Numbers' },
        { type: 'paragraph', content: 'A mixed number combines a whole number and a fraction (e.g., 2⅓). To calculate with mixed numbers, first convert them to improper fractions.' },
        { type: 'code', content: '  2⅓ = (2×3+1)/3 = 7/3' }
    ]),
}

// GCSE Maths: Number - Questions
const gcseMathsQuestions = [
    {
        type: 'mcq',
        prompt: 'Calculate: 2/5 + 1/5',
        options: JSON.stringify(['3/10', '3/5', '2/5', '1/5']),
        answer: JSON.stringify(1),
        explanation: 'When fractions have the same denominator, simply add the numerators: 2/5 + 1/5 = (2+1)/5 = 3/5. The denominator stays the same.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'Calculate: 1/2 + 1/3',
        options: JSON.stringify(['2/5', '2/6', '5/6', '3/5']),
        answer: JSON.stringify(2),
        explanation: 'The lowest common denominator of 2 and 3 is 6. Convert: 1/2 = 3/6 and 1/3 = 2/6. Then add: 3/6 + 2/6 = 5/6.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'Calculate: 3/4 × 2/3',
        options: JSON.stringify(['5/7', '6/12', '1/2', '6/7']),
        answer: JSON.stringify(2),
        explanation: 'Multiply numerators: 3 × 2 = 6. Multiply denominators: 4 × 3 = 12. Result: 6/12. Simplify by dividing both by 6: 1/2.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'Calculate: 2/3 ÷ 1/4',
        options: JSON.stringify(['2/12', '8/3', '6/4', '1/6']),
        answer: JSON.stringify(1),
        explanation: 'To divide by a fraction, flip it and multiply: 2/3 ÷ 1/4 = 2/3 × 4/1 = 8/3. This can also be written as 2⅔.',
        difficulty: 3,
    },
    {
        type: 'mcq',
        prompt: 'Convert the mixed number 3½ to an improper fraction.',
        options: JSON.stringify(['5/2', '7/2', '3/2', '6/2']),
        answer: JSON.stringify(1),
        explanation: 'Multiply the whole number by the denominator: 3 × 2 = 6. Add the numerator: 6 + 1 = 7. Put over the denominator: 7/2.',
        difficulty: 2,
    },
    {
        type: 'short_answer',
        prompt: 'Simplify the fraction 12/18 to its lowest terms. Write your answer as a fraction (e.g., 1/2).',
        options: null,
        answer: JSON.stringify('2/3'),
        explanation: 'Find the HCF of 12 and 18, which is 6. Divide both numerator and denominator by 6: 12÷6 = 2, 18÷6 = 3. Answer: 2/3.',
        difficulty: 2,
    },
]

// Python: Getting Started - First Lesson  
const pythonLesson = {
    title: 'Your First Python Program',
    summary: 'Write and run your first Python code, and learn about variables and basic output.',
    estMinutes: 20,
    contentBlocks: JSON.stringify([
        { type: 'heading', content: 'Hello, Python!' },
        { type: 'paragraph', content: 'Python is one of the most popular programming languages in the world. It\'s known for being easy to read and write, making it perfect for beginners while still being powerful enough for professional developers.' },

        { type: 'subheading', content: 'Your First Line of Code' },
        { type: 'paragraph', content: 'The classic first program in any language is "Hello, World!" In Python, it\'s just one line:' },
        { type: 'code', content: 'print("Hello, World!")' },
        { type: 'paragraph', content: 'The print() function displays text on the screen. The text inside the quotes is called a string.' },

        { type: 'subheading', content: 'Variables: Storing Information' },
        { type: 'paragraph', content: 'Variables are like labelled boxes that store values. You create a variable by giving it a name and assigning a value using the = sign.' },
        { type: 'code', content: 'name = "Alice"\nage = 25\nprint(name)  # Outputs: Alice\nprint(age)   # Outputs: 25' },
        { type: 'callout', variant: 'tip', content: 'Variable names should be descriptive. Use lowercase letters and underscores for multi-word names: user_name, total_score.' },

        { type: 'subheading', content: 'Data Types' },
        { type: 'paragraph', content: 'Python has several basic data types:' },
        {
            type: 'list', items: [
                'Strings: Text in quotes, e.g., "Hello" or \'Python\'',
                'Integers: Whole numbers, e.g., 42, -7, 1000',
                'Floats: Decimal numbers, e.g., 3.14, -0.5',
                'Booleans: True or False values'
            ]
        },
        { type: 'code', content: 'message = "Learning Python"  # string\ncount = 10                   # integer\nprice = 19.99                # float\nis_student = True            # boolean' },

        { type: 'subheading', content: 'Comments' },
        { type: 'paragraph', content: 'Comments are notes in your code that Python ignores. Use # for single-line comments.' },
        { type: 'code', content: '# This is a comment\nprint("This runs")  # This comment is after code' }
    ]),
}

// Python: Getting Started - Questions
const pythonQuestions = [
    {
        type: 'mcq',
        prompt: 'Which function is used to display output in Python?',
        options: JSON.stringify(['display()', 'output()', 'print()', 'show()']),
        answer: JSON.stringify(2),
        explanation: 'The print() function is used to display text and values on the screen. It\'s one of the most commonly used functions in Python.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'What data type is the value "Hello"?',
        options: JSON.stringify(['Integer', 'Float', 'String', 'Boolean']),
        answer: JSON.stringify(2),
        explanation: 'Text enclosed in quotes (single or double) is a string data type in Python. "Hello", \'World\', and "123" are all strings.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'Which of these is a valid Python variable name?',
        options: JSON.stringify(['2nd_place', 'user-name', 'my_score', 'class']),
        answer: JSON.stringify(2),
        explanation: 'Variable names cannot start with a number (2nd_place), cannot contain hyphens (user-name), and cannot be Python keywords (class). \'my_score\' follows all the rules.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'What will print(type(3.14)) output?',
        options: JSON.stringify(["<class 'int'>", "<class 'str'>", "<class 'float'>", "<class 'number'>"]),
        answer: JSON.stringify(2),
        explanation: '3.14 is a decimal number, which is a float in Python. The type() function shows the data type of a value.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'How do you write a single-line comment in Python?',
        options: JSON.stringify(['// This is a comment', '/* This is a comment */', '# This is a comment', '-- This is a comment']),
        answer: JSON.stringify(2),
        explanation: 'In Python, single-line comments start with the # symbol. Everything after # on that line is ignored by Python.',
        difficulty: 1,
    },
]

async function seedContent() {
    console.log('🌱 Seeding MVP content...\n')

    // Get topics
    const edsTopic = await prisma.topic.findFirst({ where: { id: 'eds-1' } })
    const gcseTopic = await prisma.topic.findFirst({ where: { id: 'gcse-1' } })
    const pythonTopic = await prisma.topic.findFirst({ where: { id: 'python-1' } })

    if (!edsTopic || !gcseTopic || !pythonTopic) {
        console.log('❌ Topics not found. Run the main seed first.')
        return
    }

    // Get UK levels
    const e3 = await prisma.ukLevel.findUnique({ where: { code: 'E3' } })
    const l2 = await prisma.ukLevel.findUnique({ where: { code: 'L2' } })
    const l3 = await prisma.ukLevel.findUnique({ where: { code: 'L3' } })

    // EDS Lesson & Questions
    console.log('📚 Creating EDS content...')
    const edsLesson = await prisma.lesson.upsert({
        where: { id: 'lesson-eds-1-1' },
        update: {},
        create: {
            id: 'lesson-eds-1-1',
            topicId: edsTopic.id,
            ...edsFoundationLesson,
            isPublished: true,
            sortOrder: 1,
        },
    })

    for (let i = 0; i < edsFoundationQuestions.length; i++) {
        const q = edsFoundationQuestions[i]
        await prisma.question.upsert({
            where: { id: `q-eds-1-${i + 1}` },
            update: {},
            create: {
                id: `q-eds-1-${i + 1}`,
                topicId: edsTopic.id,
                lessonId: edsLesson.id,
                ukLevelId: e3.id,
                isPublished: true,
                ...q,
            },
        })
    }
    console.log(`   ✓ 1 lesson, ${edsFoundationQuestions.length} questions`)

    // GCSE Maths Lesson & Questions
    console.log('📐 Creating GCSE Maths content...')
    const gcseLesson = await prisma.lesson.upsert({
        where: { id: 'lesson-gcse-1-1' },
        update: {},
        create: {
            id: 'lesson-gcse-1-1',
            topicId: gcseTopic.id,
            ...gcseMathsLesson,
            isPublished: true,
            sortOrder: 1,
        },
    })

    for (let i = 0; i < gcseMathsQuestions.length; i++) {
        const q = gcseMathsQuestions[i]
        await prisma.question.upsert({
            where: { id: `q-gcse-1-${i + 1}` },
            update: {},
            create: {
                id: `q-gcse-1-${i + 1}`,
                topicId: gcseTopic.id,
                lessonId: gcseLesson.id,
                ukLevelId: l2.id,
                isPublished: true,
                ...q,
            },
        })
    }
    console.log(`   ✓ 1 lesson, ${gcseMathsQuestions.length} questions`)

    // Python Lesson & Questions
    console.log('🐍 Creating Python content...')
    const pyLesson = await prisma.lesson.upsert({
        where: { id: 'lesson-python-1-1' },
        update: {},
        create: {
            id: 'lesson-python-1-1',
            topicId: pythonTopic.id,
            ...pythonLesson,
            isPublished: true,
            sortOrder: 1,
        },
    })

    for (let i = 0; i < pythonQuestions.length; i++) {
        const q = pythonQuestions[i]
        await prisma.question.upsert({
            where: { id: `q-python-1-${i + 1}` },
            update: {},
            create: {
                id: `q-python-1-${i + 1}`,
                topicId: pythonTopic.id,
                lessonId: pyLesson.id,
                ukLevelId: l3.id,
                isPublished: true,
                ...q,
            },
        })
    }
    console.log(`   ✓ 1 lesson, ${pythonQuestions.length} questions`)

    // Summary
    const counts = {
        lessons: await prisma.lesson.count(),
        questions: await prisma.question.count(),
    }

    console.log('\n✅ Content seed complete!')
    console.log(`   • Lessons: ${counts.lessons}`)
    console.log(`   • Questions: ${counts.questions}`)
}

seedContent()
    .catch((e) => {
        console.error('❌ Content seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
