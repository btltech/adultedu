/**
 * Seed script for "AI for Everyone" course
 * Target: Beginners & Professionals
 * Level: Entry Level 3
 * Questions: 10 per topic (60 total)
 */

import prisma from '../src/lib/db.js'

const COURSE_DATA = {
    slug: 'ai-for-everyone',
    title: 'AI for Everyone',
    description: 'Understand how AI works and impacts your daily life. No coding required - perfect for beginners and professionals wanting to stay informed about AI technology.',
    category: 'tech',
    isLive: true,
}

const TOPICS = [
    {
        title: 'What is AI?',
        description: 'Understanding the basics of artificial intelligence and its history.',
        order: 1,
        questions: [
            { prompt: 'What does AI stand for?', options: ['Artificial Intelligence', 'Automated Information', 'Advanced Internet', 'Algorithmic Innovation'], answer: 'Artificial Intelligence', explanation: 'AI stands for Artificial Intelligence - the simulation of human intelligence by machines.' },
            { prompt: 'Which of these is an example of AI in everyday life?', options: ['A calculator', 'Netflix recommendations', 'A light switch', 'A paper map'], answer: 'Netflix recommendations', explanation: 'Netflix uses AI to analyze your viewing habits and suggest shows you might like.' },
            { prompt: 'When did the term "Artificial Intelligence" first appear?', options: ['1920s', '1956', '1990s', '2010'], answer: '1956', explanation: 'The term was coined at the Dartmouth Conference in 1956 by John McCarthy.' },
            { prompt: 'True or False: AI can only do one specific task at a time.', options: ['True', 'False'], answer: 'True', explanation: 'Current AI systems are "narrow AI" - they excel at specific tasks but cannot do everything like humans.' },
            { prompt: 'What is the main goal of AI?', options: ['To replace all humans', 'To simulate human-like intelligence', 'To make computers faster', 'To save electricity'], answer: 'To simulate human-like intelligence', explanation: 'AI aims to create machines that can think, learn, and make decisions like humans.' },
            { prompt: 'Which company created ChatGPT?', options: ['Google', 'Microsoft', 'OpenAI', 'Apple'], answer: 'OpenAI', explanation: 'ChatGPT was created by OpenAI and released in November 2022.' },
            { prompt: 'What type of AI are voice assistants like Siri and Alexa?', options: ['General AI', 'Narrow AI', 'Super AI', 'Robot AI'], answer: 'Narrow AI', explanation: 'Voice assistants are narrow AI - specialized for specific tasks like answering questions and playing music.' },
            { prompt: 'True or False: AI can learn from experience.', options: ['True', 'False'], answer: 'True', explanation: 'Machine learning allows AI to improve its performance by learning from data and experience.' },
            { prompt: 'What does AI need to learn and make predictions?', options: ['Data', 'Electricity only', 'Human supervision always', 'Physical sensors'], answer: 'Data', explanation: 'AI systems learn patterns from large amounts of data to make predictions and decisions.' },
            { prompt: 'Which of these is NOT a type of AI?', options: ['Machine Learning', 'Deep Learning', 'Natural Intelligence', 'Neural Networks'], answer: 'Natural Intelligence', explanation: 'Natural intelligence refers to human/animal intelligence, not artificial intelligence.' },
        ]
    },
    {
        title: 'How AI Works',
        description: 'Simple explanations of machine learning and neural networks without the technical jargon.',
        order: 2,
        questions: [
            { prompt: 'What is Machine Learning?', options: ['Robots building machines', 'AI that learns from data', 'Computers getting faster', 'Programming manually'], answer: 'AI that learns from data', explanation: 'Machine Learning is a type of AI where computers learn patterns from data instead of being explicitly programmed.' },
            { prompt: 'What is a neural network inspired by?', options: ['Computer chips', 'The human brain', 'Spider webs', 'Road networks'], answer: 'The human brain', explanation: 'Neural networks are computing systems inspired by how neurons in the human brain connect and communicate.' },
            { prompt: 'What does "training" an AI model mean?', options: ['Teaching it to exercise', 'Showing it examples to learn from', 'Installing software', 'Connecting cables'], answer: 'Showing it examples to learn from', explanation: 'Training means feeding the AI lots of examples so it can learn patterns and make predictions.' },
            { prompt: 'True or False: AI always gives correct answers.', options: ['True', 'False'], answer: 'False', explanation: 'AI can make mistakes or give wrong answers, especially when dealing with unfamiliar data or biased training.' },
            { prompt: 'What is "input" in AI terms?', options: ['The power cable', 'Data given to the AI', 'The final answer', 'A type of keyboard'], answer: 'Data given to the AI', explanation: 'Input is the data (like text, images, or numbers) that you provide to an AI system for processing.' },
            { prompt: 'What is "output" in AI?', options: ['The result or answer', 'The power consumption', 'The training data', 'The programmer'], answer: 'The result or answer', explanation: 'Output is what the AI produces after processing the input - like a prediction, translation, or recommendation.' },
            { prompt: 'What makes AI "smart"?', options: ['Expensive hardware', 'Patterns learned from data', 'Bright LED lights', 'Fast internet'], answer: 'Patterns learned from data', explanation: 'AI systems become effective by recognizing patterns in large amounts of data during training.' },
            { prompt: 'Which type of learning uses labeled examples?', options: ['Supervised learning', 'Unsupervised learning', 'Reinforcement learning', 'No learning'], answer: 'Supervised learning', explanation: 'Supervised learning trains AI using labeled data - examples with the correct answers already provided.' },
            { prompt: 'What is a "model" in AI?', options: ['A physical robot', 'A trained AI system', 'A fashion model', 'A diagram'], answer: 'A trained AI system', explanation: 'A model is the result of training - it\'s the AI system that has learned to make predictions.' },
            { prompt: 'True or False: AI can recognize faces in photos.', options: ['True', 'False'], answer: 'True', explanation: 'Facial recognition is a common AI application, used in phones, security systems, and social media.' },
        ]
    },
    {
        title: 'AI in Daily Life',
        description: 'Discover how AI is already part of your everyday experience.',
        order: 3,
        questions: [
            { prompt: 'Which app uses AI to suggest routes?', options: ['Calculator', 'Google Maps', 'Calendar', 'Clock'], answer: 'Google Maps', explanation: 'Google Maps uses AI to analyze traffic patterns and suggest the fastest routes.' },
            { prompt: 'How does Spotify know what music you might like?', options: ['Random guessing', 'AI analyzing listening patterns', 'Staff manually selecting', 'Only playing popular songs'], answer: 'AI analyzing listening patterns', explanation: 'Spotify uses AI to analyze your listening history and recommend similar music.' },
            { prompt: 'What does AI do in email spam filters?', options: ['Deletes all emails', 'Identifies suspicious emails', 'Writes emails', 'Speeds up internet'], answer: 'Identifies suspicious emails', explanation: 'AI learns patterns of spam emails to automatically filter them out of your inbox.' },
            { prompt: 'True or False: Online shopping sites use AI to suggest products.', options: ['True', 'False'], answer: 'True', explanation: 'E-commerce sites like Amazon use AI to recommend products based on your browsing and purchase history.' },
            { prompt: 'How do phones unlock with your face?', options: ['Magic', 'Facial recognition AI', 'Photo matching only', 'Fingerprint sensors'], answer: 'Facial recognition AI', explanation: 'Face ID uses AI-powered facial recognition to identify your unique facial features.' },
            { prompt: 'What AI feature helps correct your typing?', options: ['Spellcheck only', 'Autocomplete and predictive text', 'Voice calls', 'Camera zoom'], answer: 'Autocomplete and predictive text', explanation: 'AI predicts what you want to type next based on patterns in your writing.' },
            { prompt: 'Which social media feature uses AI?', options: ['Your profile picture', 'Content recommendations', 'Time of posting', 'Your username'], answer: 'Content recommendations', explanation: 'Social media platforms use AI to decide what posts, videos, and ads to show you.' },
            { prompt: 'How do smart thermostats save energy?', options: ['They turn off', 'AI learns your temperature preferences', 'They use less power always', 'Random adjustments'], answer: 'AI learns your temperature preferences', explanation: 'Smart thermostats use AI to learn when you\'re home and your preferred temperatures.' },
            { prompt: 'True or False: Virtual assistants use AI to understand your voice.', options: ['True', 'False'], answer: 'True', explanation: 'Siri, Alexa, and Google Assistant use speech recognition AI to understand and respond to voice commands.' },
            { prompt: 'What AI technology powers real-time translation apps?', options: ['Dictionaries only', 'Natural Language Processing', 'Human translators', 'Simple word swapping'], answer: 'Natural Language Processing', explanation: 'Translation apps use Natural Language Processing AI to understand context and meaning, not just swap words.' },
        ]
    },
    {
        title: 'Using AI Tools',
        description: 'Learn to use ChatGPT, image generators, and other AI productivity tools.',
        order: 4,
        questions: [
            { prompt: 'What is ChatGPT best used for?', options: ['Playing games', 'Generating text and answering questions', 'Editing videos', 'Making phone calls'], answer: 'Generating text and answering questions', explanation: 'ChatGPT is a language model designed to have conversations and generate written content.' },
            { prompt: 'What is a "prompt" when using AI?', options: ['A reminder notification', 'The instruction you give AI', 'The AI\'s answer', 'A loading screen'], answer: 'The instruction you give AI', explanation: 'A prompt is the text input you provide to tell the AI what you want it to do.' },
            { prompt: 'Which tool generates images from text descriptions?', options: ['Microsoft Word', 'DALL-E', 'Excel', 'Notepad'], answer: 'DALL-E', explanation: 'DALL-E is an AI tool by OpenAI that creates images based on text descriptions you provide.' },
            { prompt: 'True or False: You should verify important information from ChatGPT.', options: ['True', 'False'], answer: 'True', explanation: 'AI can make mistakes or "hallucinate" facts, so always verify important information from reliable sources.' },
            { prompt: 'What makes a good AI prompt?', options: ['Being vague', 'Being clear and specific', 'Using one word', 'Using technical code'], answer: 'Being clear and specific', explanation: 'The more specific and clear your prompt, the better the AI can understand what you want.' },
            { prompt: 'Can AI tools help with writing emails?', options: ['No, never', 'Yes, they can draft and improve text', 'Only in English', 'Only for spam'], answer: 'Yes, they can draft and improve text', explanation: 'AI tools can help draft emails, improve grammar, change tone, and make writing more professional.' },
            { prompt: 'What does "AI hallucination" mean?', options: ['AI dreaming', 'AI making up false information', 'AI crashing', 'AI being creative'], answer: 'AI making up false information', explanation: 'AI hallucination is when the AI generates plausible-sounding but incorrect or made-up information.' },
            { prompt: 'Which is a free AI chatbot?', options: ['ChatGPT (free tier)', 'Adobe Photoshop', 'Microsoft Office', 'Netflix'], answer: 'ChatGPT (free tier)', explanation: 'ChatGPT offers a free tier that anyone can use to interact with the AI.' },
            { prompt: 'True or False: AI can help summarize long documents.', options: ['True', 'False'], answer: 'True', explanation: 'AI tools can quickly read and summarize long articles, reports, and documents for you.' },
            { prompt: 'What should you NOT share with AI chatbots?', options: ['Recipe ideas', 'Personal passwords and private data', 'Book recommendations', 'General questions'], answer: 'Personal passwords and private data', explanation: 'Never share sensitive personal information, passwords, or private data with AI chatbots.' },
        ]
    },
    {
        title: 'AI Ethics and Safety',
        description: 'Understanding the responsible use of AI and potential concerns.',
        order: 5,
        questions: [
            { prompt: 'What is "AI bias"?', options: ['AI being too slow', 'AI reflecting unfair human prejudices', 'AI being too accurate', 'AI using too much power'], answer: 'AI reflecting unfair human prejudices', explanation: 'AI bias occurs when AI systems reflect or amplify unfair biases present in their training data.' },
            { prompt: 'Why is AI ethics important?', options: ['To make AI faster', 'To ensure AI is used fairly and safely', 'To reduce costs', 'To make AI look better'], answer: 'To ensure AI is used fairly and safely', explanation: 'AI ethics ensures that AI systems don\'t harm people and are used responsibly and fairly.' },
            { prompt: 'True or False: AI can be used to create fake videos of people.', options: ['True', 'False'], answer: 'True', explanation: 'Deepfakes are AI-generated fake videos that can make it appear someone said or did something they didn\'t.' },
            { prompt: 'What is a "deepfake"?', options: ['A deep ocean image', 'AI-generated fake media', 'A type of ocean creature', 'A real video'], answer: 'AI-generated fake media', explanation: 'Deepfakes are realistic fake images, audio, or videos created using AI technology.' },
            { prompt: 'Who is responsible if AI makes a harmful decision?', options: ['No one', 'The AI itself', 'The creators and users', 'The computer'], answer: 'The creators and users', explanation: 'Humans who create, deploy, and use AI systems are responsible for their impact.' },
            { prompt: 'What is a concern about AI in hiring?', options: ['It\'s too slow', 'It might discriminate unfairly', 'It\'s too expensive', 'It writes bad job ads'], answer: 'It might discriminate unfairly', explanation: 'AI hiring tools might unfairly reject candidates based on biased patterns in historical data.' },
            { prompt: 'True or False: Your data can be used to train AI.', options: ['True', 'False'], answer: 'True', explanation: 'Many AI systems are trained on user-generated data, which raises privacy concerns.' },
            { prompt: 'What is data privacy in AI?', options: ['Keeping passwords long', 'Protecting personal information used by AI', 'Making AI free', 'Using strong WiFi'], answer: 'Protecting personal information used by AI', explanation: 'Data privacy ensures that personal information collected by AI systems is protected and used responsibly.' },
            { prompt: 'How can you identify AI-generated content?', options: ['It\'s always obvious', 'Look for inconsistencies and fact-check', 'It\'s impossible', 'AI content is always wrong'], answer: 'Look for inconsistencies and fact-check', explanation: 'Check for unusual details, verify facts, and use detection tools to identify AI-generated content.' },
            { prompt: 'What should companies do to ensure ethical AI?', options: ['Nothing special', 'Test for bias and be transparent', 'Keep AI secret', 'Only hire programmers'], answer: 'Test for bias and be transparent', explanation: 'Companies should regularly audit AI for bias, be transparent about AI use, and have accountability measures.' },
        ]
    },
    {
        title: 'Future of AI',
        description: 'What\'s next for AI and how to stay informed about developments.',
        order: 6,
        questions: [
            { prompt: 'What is "General AI" (AGI)?', options: ['AI for generals', 'AI that can do any task like humans', 'AI for general use only', 'Old AI technology'], answer: 'AI that can do any task like humans', explanation: 'AGI would be AI with human-like general intelligence, able to learn and perform any intellectual task.' },
            { prompt: 'True or False: AGI already exists.', options: ['True', 'False'], answer: 'False', explanation: 'AGI doesn\'t exist yet. Current AI is "narrow AI" - good at specific tasks but not general intelligence.' },
            { prompt: 'What jobs might AI change the most?', options: ['Only factory jobs', 'Jobs involving routine tasks', 'No jobs will change', 'Only tech jobs'], answer: 'Jobs involving routine tasks', explanation: 'AI is likely to automate routine, repetitive tasks across many industries, changing how work is done.' },
            { prompt: 'How can you prepare for an AI-influenced future?', options: ['Avoid all technology', 'Learn to work alongside AI', 'Only study coding', 'Nothing - AI won\'t affect you'], answer: 'Learn to work alongside AI', explanation: 'Understanding AI tools and developing uniquely human skills will help you thrive in an AI-augmented world.' },
            { prompt: 'What new jobs might AI create?', options: ['None', 'AI trainers, ethicists, and prompt engineers', 'Only robot repair', 'Only coding jobs'], answer: 'AI trainers, ethicists, and prompt engineers', explanation: 'New roles like AI prompt engineers, AI ethicists, and AI trainers are emerging.' },
            { prompt: 'True or False: AI could help solve climate change.', options: ['True', 'False'], answer: 'True', explanation: 'AI can help optimize energy use, predict weather patterns, and develop new sustainable technologies.' },
            { prompt: 'What is the best way to stay updated on AI?', options: ['Ignore it completely', 'Follow reliable tech news and learn continuously', 'Only read social media', 'Wait for others to tell you'], answer: 'Follow reliable tech news and learn continuously', explanation: 'Stay informed through reputable sources and keep learning as AI technology evolves rapidly.' },
            { prompt: 'What skill will remain valuable alongside AI?', options: ['Memorizing facts', 'Critical thinking and creativity', 'Typing speed', 'Following instructions only'], answer: 'Critical thinking and creativity', explanation: 'Human creativity, emotional intelligence, and critical thinking remain valuable as AI handles routine tasks.' },
            { prompt: 'True or False: AI will completely replace human workers.', options: ['True', 'False'], answer: 'False', explanation: 'AI will change jobs but not eliminate humans. It will augment human capabilities and create new opportunities.' },
            { prompt: 'What mindset helps with AI adoption?', options: ['Fear of technology', 'Curiosity and willingness to learn', 'Avoiding change', 'Ignoring AI completely'], answer: 'Curiosity and willingness to learn', explanation: 'A growth mindset with curiosity about AI helps you adapt and benefit from new technologies.' },
        ]
    },
]

async function main() {
    console.log('🚀 Creating "AI for Everyone" course...\n')

    // Get or create UK Level (Entry Level 3)
    let ukLevel = await prisma.ukLevel.findFirst({ where: { code: 'EL3' } })
    if (!ukLevel) {
        ukLevel = await prisma.ukLevel.findFirst({ where: { code: 'E3' } })
    }
    if (!ukLevel) {
        ukLevel = await prisma.ukLevel.findFirst() // Fallback to any level
    }
    console.log(`📚 Using UK Level: ${ukLevel.title} (${ukLevel.code})`)

    // Get or create framework
    let framework = await prisma.framework.findFirst({ where: { slug: 'tech' } })
    if (!framework) {
        framework = await prisma.framework.findFirst() // Use any framework
    }
    if (!framework) {
        throw new Error('No framework found in database. Please seed frameworks first.')
    }
    console.log(`🎯 Using Framework: ${framework.title}`)

    // Check if course already exists
    const existing = await prisma.track.findUnique({ where: { slug: COURSE_DATA.slug } })
    if (existing) {
        console.log('⚠️  Course already exists! Deleting and recreating...')
        await prisma.track.delete({ where: { slug: COURSE_DATA.slug } })
    }

    // Create the course (track)
    const track = await prisma.track.create({
        data: {
            ...COURSE_DATA,
            trackFrameworks: {
                create: { frameworkId: framework.id }
            }
        }
    })
    console.log(`✅ Created track: ${track.title}`)

    // Create topics and questions
    let totalQuestions = 0
    for (const topicData of TOPICS) {
        const topic = await prisma.topic.create({
            data: {
                trackId: track.id,
                title: topicData.title,
                description: topicData.description,
                sortOrder: topicData.order,
                ukLevelId: ukLevel.id,
            }
        })
        console.log(`  📖 Created topic: ${topic.title}`)

        // Create questions for this topic
        for (let i = 0; i < topicData.questions.length; i++) {
            const q = topicData.questions[i]
            await prisma.question.create({
                data: {
                    topicId: topic.id,
                    ukLevelId: ukLevel.id,
                    type: q.options.length === 2 ? 'true_false' : 'mcq',
                    prompt: q.prompt,
                    options: JSON.stringify(q.options),
                    answer: JSON.stringify(q.answer),
                    explanation: q.explanation,
                    difficulty: 2, // Entry level = easier difficulty
                    isPublished: true,
                }
            })
            totalQuestions++
        }
        console.log(`     ✅ Created ${topicData.questions.length} questions`)
    }

    console.log(`\n🎉 Successfully created "AI for Everyone" course!`)
    console.log(`   📚 Topics: ${TOPICS.length}`)
    console.log(`   ❓ Questions: ${totalQuestions}`)
    console.log(`   🎯 Level: ${ukLevel.title}`)
    console.log(`\n👉 Visit http://localhost:5173/track/ai-for-everyone to view the course!`)
}

main()
    .catch(e => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
