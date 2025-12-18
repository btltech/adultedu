/**
 * Content Seed Script - Batch 3
 * More content for remaining topics
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================
// EDS: Handling Information (Topic 3)
// ============================================
const edsInfoLesson = {
    title: 'Finding Information Online',
    summary: 'Learn how to search effectively and evaluate online information.',
    estMinutes: 18,
    contentBlocks: JSON.stringify([
        { type: 'heading', content: 'Searching the Web' },
        { type: 'paragraph', content: 'The internet contains billions of web pages. Knowing how to search effectively saves time and helps you find what you need.' },

        { type: 'subheading', content: 'Using Search Engines' },
        { type: 'paragraph', content: 'Popular search engines include Google, Bing, and DuckDuckGo. Type keywords related to what you\'re looking for in the search box.' },
        { type: 'callout', variant: 'tip', content: 'Be specific with your search terms. "Weather London tomorrow" works better than just "weather".' },

        { type: 'subheading', content: 'Search Tips' },
        {
            type: 'list', items: [
                'Use specific keywords rather than full questions',
                'Put phrases in "quotation marks" to search for exact matches',
                'Use site:example.com to search within a specific website',
                'Add a minus sign to exclude words: apple -fruit',
                'Check multiple sources to verify information'
            ]
        },

        { type: 'subheading', content: 'Evaluating Information' },
        { type: 'paragraph', content: 'Not everything online is accurate. Use the CRAAP test:' },
        {
            type: 'list', items: [
                'Currency: Is the information up to date?',
                'Relevance: Does it relate to what you need?',
                'Authority: Who wrote it? Are they an expert?',
                'Accuracy: Is it supported by evidence?',
                'Purpose: Why was it created? To inform, sell, or persuade?'
            ]
        },

        { type: 'callout', variant: 'warning', content: 'Be especially careful with health, financial, and news information. Look for trusted sources like NHS, gov.uk, or established news organisations.' }
    ]),
}

const edsInfoQuestions = [
    {
        type: 'mcq',
        prompt: 'Which technique helps you search for an exact phrase?',
        options: JSON.stringify(['Using capital letters', 'Putting words in quotation marks', 'Adding a star * at the end', 'Using more keywords']),
        answer: JSON.stringify(1),
        explanation: 'Putting a phrase in "quotation marks" tells the search engine to find those exact words in that exact order.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'In the CRAAP test for evaluating information, what does the first "A" stand for?',
        options: JSON.stringify(['Accuracy', 'Author', 'Article', 'Advantage']),
        answer: JSON.stringify(0),
        explanation: 'CRAAP stands for Currency, Relevance, Authority, Accuracy, and Purpose. Accuracy checks if the information is supported by evidence.',
        difficulty: 2,
    },
    {
        type: 'true_false',
        prompt: 'If information appears on a website, it must be true.',
        options: JSON.stringify(['True', 'False']),
        answer: JSON.stringify(1),
        explanation: 'False! Anyone can publish content online. Always verify information from multiple reliable sources before trusting it.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'What does adding a minus sign before a word do in a search?',
        options: JSON.stringify(['Makes the word more important', 'Excludes pages containing that word', 'Searches for synonyms', 'Nothing, it\'s ignored']),
        answer: JSON.stringify(1),
        explanation: 'A minus sign excludes results containing that word. For example, "python -snake" would find programming results, not the reptile.',
        difficulty: 2,
    },
]

// ============================================
// EDS: Transacting Online (Topic 4)
// ============================================
const edsTransactingLesson = {
    title: 'Shopping and Banking Safely Online',
    summary: 'Learn how to make secure transactions and protect your financial information.',
    estMinutes: 20,
    contentBlocks: JSON.stringify([
        { type: 'heading', content: 'Online Transactions' },
        { type: 'paragraph', content: 'From shopping to banking, many financial activities now happen online. Understanding how to do this safely is essential.' },

        { type: 'subheading', content: 'Signs of a Secure Website' },
        {
            type: 'list', items: [
                'URL starts with https:// (the "s" means secure)',
                'Padlock icon in the address bar',
                'Company\'s contact information and address are visible',
                'Privacy policy and terms of service available',
                'Recognised payment options (Visa, PayPal, etc.)'
            ]
        },

        { type: 'subheading', content: 'Safe Online Shopping' },
        { type: 'paragraph', content: 'Before buying from a new website:' },
        {
            type: 'list', items: [
                'Research the company - check reviews on Trustpilot or Google',
                'Use a credit card rather than debit card (better fraud protection)',
                'Never save your card details on unfamiliar sites',
                'Be wary of deals that seem too good to be true',
                'Keep receipts and confirmation emails'
            ]
        },
        { type: 'callout', variant: 'warning', content: 'If a website asks you to pay by bank transfer or gift cards, it\'s almost certainly a scam. Legitimate businesses offer secure payment methods.' },

        { type: 'subheading', content: 'Online Banking Safety' },
        {
            type: 'list', items: [
                'Only access your bank through their official app or website',
                'Never log in via links in emails - type the address yourself',
                'Log out completely when finished',
                'Set up account alerts for transactions',
                'Regularly check your statements for unusual activity'
            ]
        },

        { type: 'callout', variant: 'info', content: 'Your bank will never ask for your full PIN, password, or to transfer money to a "safe account". Report any such requests as fraud.' }
    ]),
}

const edsTransactingQuestions = [
    {
        type: 'mcq',
        prompt: 'What does the "s" in https:// indicate?',
        options: JSON.stringify(['Standard', 'Secure', 'Simple', 'Speedy']),
        answer: JSON.stringify(1),
        explanation: 'The "s" stands for Secure. HTTPS means the connection between your browser and the website is encrypted.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'Which payment method offers the best fraud protection for online shopping?',
        options: JSON.stringify(['Bank transfer', 'Gift cards', 'Credit card', 'Cash on delivery']),
        answer: JSON.stringify(2),
        explanation: 'Credit cards typically offer the strongest fraud protection. Under Section 75, you\'re protected on purchases over £100. Debit cards also offer some protection.',
        difficulty: 2,
    },
    {
        type: 'true_false',
        prompt: 'Your bank might call and ask you to transfer money to a "safe account" if fraud is detected.',
        options: JSON.stringify(['True', 'False']),
        answer: JSON.stringify(1),
        explanation: 'False! Banks never ask you to transfer money to "safe accounts" - this is a common scam. If you get such a call, hang up and contact your bank directly.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'What should you check before shopping on an unfamiliar website?',
        options: JSON.stringify(['Only the prices', 'Customer reviews on independent sites', 'Whether it has pictures', 'If it accepts any payment']),
        answer: JSON.stringify(1),
        explanation: 'Check reviews on independent sites like Trustpilot. Scam websites can fake their own reviews, so independent sources are more reliable.',
        difficulty: 2,
    },
]

// ============================================
// GCSE Maths: Statistics (Topic 5)
// ============================================
const gcseStatsLesson = {
    title: 'Averages: Mean, Median, Mode',
    summary: 'Learn how to calculate and compare different types of averages.',
    estMinutes: 20,
    contentBlocks: JSON.stringify([
        { type: 'heading', content: 'Measures of Central Tendency' },
        { type: 'paragraph', content: 'Averages help us summarise a set of data with a single representative value. There are three main types: mean, median, and mode.' },

        { type: 'subheading', content: 'The Mean' },
        { type: 'paragraph', content: 'The mean is what most people think of as "the average". Add up all values and divide by how many there are.' },
        { type: 'code', content: 'Data: 4, 8, 6, 5, 9\n\nMean = (4 + 8 + 6 + 5 + 9) ÷ 5\n     = 32 ÷ 5\n     = 6.4' },

        { type: 'subheading', content: 'The Median' },
        { type: 'paragraph', content: 'The median is the middle value when data is arranged in order.' },
        { type: 'code', content: 'Data: 4, 8, 6, 5, 9\nOrdered: 4, 5, 6, 8, 9\n\nMedian = 6 (the middle value)\n\nFor even number of values:\nData: 3, 5, 7, 9\nMedian = (5 + 7) ÷ 2 = 6' },
        { type: 'callout', variant: 'tip', content: 'The median is less affected by extreme values (outliers) than the mean.' },

        { type: 'subheading', content: 'The Mode' },
        { type: 'paragraph', content: 'The mode is the most frequently occurring value.' },
        { type: 'code', content: 'Data: 3, 5, 5, 7, 5, 9, 7\nMode = 5 (appears 3 times)\n\nData can have:\n- One mode (unimodal)\n- Two modes (bimodal)\n- No mode (all different)' },

        { type: 'subheading', content: 'The Range' },
        { type: 'paragraph', content: 'While not an average, the range measures spread:' },
        { type: 'code', content: 'Range = Largest value - Smallest value\n\nData: 4, 8, 6, 5, 9\nRange = 9 - 4 = 5' },

        { type: 'subheading', content: 'When to Use Each' },
        {
            type: 'list', items: [
                'Mean: General use, but avoid with extreme outliers',
                'Median: Best for skewed data (e.g., salaries, house prices)',
                'Mode: Categorical data or finding the most common value'
            ]
        }
    ]),
}

const gcseStatsQuestions = [
    {
        type: 'mcq',
        prompt: 'Find the mean of: 3, 7, 8, 5, 12',
        options: JSON.stringify(['5', '7', '8', '35']),
        answer: JSON.stringify(1),
        explanation: 'Mean = (3 + 7 + 8 + 5 + 12) ÷ 5 = 35 ÷ 5 = 7',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'Find the median of: 9, 3, 7, 5, 1',
        options: JSON.stringify(['3', '5', '7', '9']),
        answer: JSON.stringify(1),
        explanation: 'First, order the data: 1, 3, 5, 7, 9. The middle value is 5.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'What is the mode of: 4, 2, 7, 4, 3, 4, 8',
        options: JSON.stringify(['2', '4', '7', '8']),
        answer: JSON.stringify(1),
        explanation: 'The mode is the most frequent value. 4 appears three times, more than any other value.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'Which average is least affected by outliers?',
        options: JSON.stringify(['Mean', 'Median', 'Mode', 'Range']),
        answer: JSON.stringify(1),
        explanation: 'The median is least affected by extreme values (outliers) because it only considers the middle value(s), not the actual numbers.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'Find the range of: 5, 12, 8, 3, 15',
        options: JSON.stringify(['10', '12', '15', '8.6']),
        answer: JSON.stringify(1),
        explanation: 'Range = Largest - Smallest = 15 - 3 = 12',
        difficulty: 1,
    },
]

// ============================================
// GCSE Maths: Ratio and Proportion (Topic 3)
// ============================================
const gcseRatioLesson = {
    title: 'Working with Ratios',
    summary: 'Learn how to simplify, use, and share quantities using ratios.',
    estMinutes: 22,
    contentBlocks: JSON.stringify([
        { type: 'heading', content: 'Understanding Ratios' },
        { type: 'paragraph', content: 'A ratio compares two or more quantities of the same kind. Ratios are written with a colon, like 2:3.' },

        { type: 'subheading', content: 'Simplifying Ratios' },
        { type: 'paragraph', content: 'Simplify a ratio by dividing all parts by their highest common factor (HCF):' },
        { type: 'code', content: '12:18\nHCF of 12 and 18 is 6\n12 ÷ 6 : 18 ÷ 6 = 2:3\n\n45:30:15\nHCF is 15\n45÷15 : 30÷15 : 15÷15 = 3:2:1' },

        { type: 'subheading', content: 'Using Ratios' },
        { type: 'paragraph', content: 'Many real-world problems involve ratios. For example, mixing paint or sharing money.' },
        { type: 'callout', variant: 'tip', content: 'The key to ratio problems is finding the value of "one part".' },

        { type: 'subheading', content: 'Sharing in a Ratio' },
        { type: 'paragraph', content: 'To share an amount in a given ratio:' },
        { type: 'code', content: 'Share £60 in the ratio 2:3\n\nStep 1: Total parts = 2 + 3 = 5\nStep 2: Value of one part = £60 ÷ 5 = £12\nStep 3: \n  First share = 2 × £12 = £24\n  Second share = 3 × £12 = £36\n\nCheck: £24 + £36 = £60 ✓' },

        { type: 'subheading', content: 'Ratio in Context' },
        { type: 'code', content: 'A recipe for 12 cookies needs:\n- 200g flour\n- 100g sugar\n\nHow much flour for 30 cookies?\n\n30 ÷ 12 = 2.5 (multiplier)\n200g × 2.5 = 500g flour' },

        { type: 'subheading', content: 'Equivalent Ratios' },
        { type: 'paragraph', content: 'Like fractions, ratios can be scaled up or down:' },
        { type: 'code', content: '1:4 = 2:8 = 3:12 = 5:20\n(multiply both parts by the same number)' }
    ]),
}

const gcseRatioQuestions = [
    {
        type: 'mcq',
        prompt: 'Simplify the ratio 15:25',
        options: JSON.stringify(['1:2', '3:5', '5:10', '15:25']),
        answer: JSON.stringify(1),
        explanation: 'The HCF of 15 and 25 is 5. Dividing both by 5: 15÷5 : 25÷5 = 3:5',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'Share £40 in the ratio 3:5. How much does the larger share receive?',
        options: JSON.stringify(['£15', '£20', '£25', '£35']),
        answer: JSON.stringify(2),
        explanation: 'Total parts = 3 + 5 = 8. One part = £40 ÷ 8 = £5. Larger share = 5 × £5 = £25',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'The ratio of boys to girls in a class is 3:4. If there are 12 boys, how many girls are there?',
        options: JSON.stringify(['9', '12', '16', '21']),
        answer: JSON.stringify(2),
        explanation: '3 parts = 12, so 1 part = 4. Girls = 4 parts = 4 × 4 = 16',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'Which ratio is equivalent to 2:3?',
        options: JSON.stringify(['4:5', '6:9', '3:4', '2:6']),
        answer: JSON.stringify(1),
        explanation: 'Multiply both parts of 2:3 by 3 to get 6:9. Check: 6÷3 : 9÷3 = 2:3 ✓',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'A recipe uses flour and sugar in the ratio 3:1. If 150g of flour is used, how much sugar is needed?',
        options: JSON.stringify(['30g', '50g', '100g', '450g']),
        answer: JSON.stringify(1),
        explanation: '3 parts = 150g, so 1 part = 150 ÷ 3 = 50g. Sugar = 1 part = 50g',
        difficulty: 2,
    },
]

// ============================================
// Python: Loops (Topic 4)
// ============================================
const pythonLoopsLesson = {
    title: 'For and While Loops',
    summary: 'Learn how to repeat code using loops.',
    estMinutes: 22,
    contentBlocks: JSON.stringify([
        { type: 'heading', content: 'Repeating Code with Loops' },
        { type: 'paragraph', content: 'Loops allow you to execute a block of code multiple times. Python has two main types: for loops and while loops.' },

        { type: 'subheading', content: 'The for Loop' },
        { type: 'paragraph', content: 'Use for loops when you know how many times you want to repeat:' },
        { type: 'code', content: '# Print numbers 0 to 4\nfor i in range(5):\n    print(i)\n\n# Output: 0, 1, 2, 3, 4' },

        { type: 'subheading', content: 'range() Function' },
        { type: 'code', content: 'range(5)       # 0, 1, 2, 3, 4\nrange(2, 6)    # 2, 3, 4, 5\nrange(0, 10, 2) # 0, 2, 4, 6, 8 (step of 2)' },

        { type: 'subheading', content: 'Looping Through Lists' },
        { type: 'code', content: 'fruits = ["apple", "banana", "cherry"]\n\nfor fruit in fruits:\n    print(fruit)\n\n# Output:\n# apple\n# banana\n# cherry' },
        { type: 'callout', variant: 'tip', content: 'Choose a descriptive variable name for your loop. "fruit" is better than "i" when looping through fruits.' },

        { type: 'subheading', content: 'The while Loop' },
        { type: 'paragraph', content: 'Use while loops when you want to repeat until a condition becomes false:' },
        { type: 'code', content: 'count = 0\n\nwhile count < 5:\n    print(count)\n    count += 1\n\n# Output: 0, 1, 2, 3, 4' },
        { type: 'callout', variant: 'warning', content: 'Be careful with while loops! If the condition never becomes false, you\'ll create an infinite loop.' },

        { type: 'subheading', content: 'break and continue' },
        { type: 'code', content: '# break exits the loop early\nfor i in range(10):\n    if i == 5:\n        break\n    print(i)  # Prints 0-4\n\n# continue skips to next iteration\nfor i in range(5):\n    if i == 2:\n        continue\n    print(i)  # Prints 0, 1, 3, 4' }
    ]),
}

const pythonLoopsQuestions = [
    {
        type: 'mcq',
        prompt: 'How many times will this loop run: for i in range(4)?',
        options: JSON.stringify(['3', '4', '5', '1']),
        answer: JSON.stringify(1),
        explanation: 'range(4) generates 0, 1, 2, 3 - that\'s 4 numbers, so the loop runs 4 times.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'What will range(2, 5) produce?',
        options: JSON.stringify(['2, 3, 4, 5', '2, 3, 4', '0, 1, 2, 3, 4', '2, 5']),
        answer: JSON.stringify(1),
        explanation: 'range(2, 5) starts at 2 and stops before 5, producing 2, 3, 4.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'Which keyword exits a loop immediately?',
        options: JSON.stringify(['exit', 'break', 'stop', 'end']),
        answer: JSON.stringify(1),
        explanation: 'The break statement immediately exits the current loop, skipping any remaining iterations.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'What does "continue" do in a loop?',
        options: JSON.stringify(['Exits the loop', 'Restarts the loop from the beginning', 'Skips to the next iteration', 'Pauses the loop']),
        answer: JSON.stringify(2),
        explanation: 'continue skips the rest of the current iteration and moves to the next one.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'When should you use a while loop instead of a for loop?',
        options: JSON.stringify(['When looping through a list', 'When you know exactly how many times to loop', 'When you want to loop until a condition is false', 'When using numbers']),
        answer: JSON.stringify(2),
        explanation: 'Use while loops when you don\'t know in advance how many iterations you need - you\'re waiting for a condition to become false.',
        difficulty: 2,
    },
]

// ============================================
// Python: Functions (Topic 5)
// ============================================
const pythonFunctionsLesson = {
    title: 'Defining and Using Functions',
    summary: 'Learn how to create reusable blocks of code with functions.',
    estMinutes: 20,
    contentBlocks: JSON.stringify([
        { type: 'heading', content: 'What Are Functions?' },
        { type: 'paragraph', content: 'Functions are reusable blocks of code that perform a specific task. They help organise your code, avoid repetition, and make programs easier to understand.' },

        { type: 'subheading', content: 'Defining a Function' },
        { type: 'code', content: 'def greet():\n    print("Hello, World!")\n\n# Call the function\ngreet()  # Output: Hello, World!' },
        { type: 'callout', variant: 'info', content: 'def stands for "define". Function names follow the same rules as variables: lowercase, underscores for spaces.' },

        { type: 'subheading', content: 'Parameters and Arguments' },
        { type: 'paragraph', content: 'Functions can accept input values:' },
        { type: 'code', content: 'def greet(name):\n    print(f"Hello, {name}!")\n\ngreet("Alice")  # Hello, Alice!\ngreet("Bob")    # Hello, Bob!' },

        { type: 'subheading', content: 'Multiple Parameters' },
        { type: 'code', content: 'def add(a, b):\n    result = a + b\n    print(result)\n\nadd(5, 3)  # 8' },

        { type: 'subheading', content: 'Return Values' },
        { type: 'paragraph', content: 'Functions can send back results using return:' },
        { type: 'code', content: 'def add(a, b):\n    return a + b\n\nresult = add(5, 3)\nprint(result)  # 8\n\n# Can use directly\nprint(add(10, 20))  # 30' },
        { type: 'callout', variant: 'tip', content: 'A function stops executing when it hits a return statement.' },

        { type: 'subheading', content: 'Default Parameters' },
        { type: 'code', content: 'def greet(name="Guest"):\n    print(f"Hello, {name}!")\n\ngreet()          # Hello, Guest!\ngreet("Alice")   # Hello, Alice!' }
    ]),
}

const pythonFunctionsQuestions = [
    {
        type: 'mcq',
        prompt: 'Which keyword is used to define a function in Python?',
        options: JSON.stringify(['function', 'def', 'func', 'define']),
        answer: JSON.stringify(1),
        explanation: 'Python uses the def keyword to define functions. It\'s short for "define".',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'What does the return statement do?',
        options: JSON.stringify(['Prints a value', 'Restarts the function', 'Sends a value back to the caller', 'Defines a variable']),
        answer: JSON.stringify(2),
        explanation: 'return sends a value back to wherever the function was called, allowing you to use the result.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'What will be printed?\ndef double(x):\n    return x * 2\nprint(double(5))',
        options: JSON.stringify(['5', '10', 'x * 2', 'None']),
        answer: JSON.stringify(1),
        explanation: 'The function doubles the input: 5 * 2 = 10. This value is returned and printed.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'What is a default parameter?',
        options: JSON.stringify(['A parameter that must be provided', 'A parameter with a pre-set value if none is given', 'The first parameter', 'A global variable']),
        answer: JSON.stringify(1),
        explanation: 'Default parameters have a preset value used when the caller doesn\'t provide one. Defined with = in the function signature.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'How many values can a function return?',
        options: JSON.stringify(['Only one', 'Only two', 'Multiple (as a tuple)', 'None ever']),
        answer: JSON.stringify(2),
        explanation: 'Functions can return multiple values by separating them with commas. Python packs them into a tuple: return x, y',
        difficulty: 2,
    },
]

// ============================================
// Main Seed Function
// ============================================
async function seedBatch3() {
    console.log('🌱 Seeding content batch 3...\n')

    const topicIds = {
        edsInfo: 'eds-3',
        edsTransacting: 'eds-4',
        gcseStats: 'gcse-5',
        gcseRatio: 'gcse-3',
        pythonLoops: 'python-4',
        pythonFunctions: 'python-5',
    }

    // Get topics
    const topics = {}
    for (const [key, id] of Object.entries(topicIds)) {
        topics[key] = await prisma.topic.findFirst({ where: { id } })
    }

    // Get UK levels
    const levels = {
        e3: await prisma.ukLevel.findUnique({ where: { code: 'E3' } }),
        l1: await prisma.ukLevel.findUnique({ where: { code: 'L1' } }),
        l2: await prisma.ukLevel.findUnique({ where: { code: 'L2' } }),
        l3: await prisma.ukLevel.findUnique({ where: { code: 'L3' } }),
    }

    const contentToSeed = [
        { topic: topics.edsInfo, lesson: edsInfoLesson, questions: edsInfoQuestions, level: levels.l1, prefix: 'eds-3' },
        { topic: topics.edsTransacting, lesson: edsTransactingLesson, questions: edsTransactingQuestions, level: levels.l1, prefix: 'eds-4' },
        { topic: topics.gcseStats, lesson: gcseStatsLesson, questions: gcseStatsQuestions, level: levels.l2, prefix: 'gcse-5' },
        { topic: topics.gcseRatio, lesson: gcseRatioLesson, questions: gcseRatioQuestions, level: levels.l2, prefix: 'gcse-3' },
        { topic: topics.pythonLoops, lesson: pythonLoopsLesson, questions: pythonLoopsQuestions, level: levels.l3, prefix: 'python-4' },
        { topic: topics.pythonFunctions, lesson: pythonFunctionsLesson, questions: pythonFunctionsQuestions, level: levels.l3, prefix: 'python-5' },
    ]

    let totalLessons = 0
    let totalQuestions = 0

    for (const { topic, lesson, questions, level, prefix } of contentToSeed) {
        if (!topic) {
            console.log(`⚠️  Topic ${prefix} not found, skipping`)
            continue
        }

        console.log(`📖 Creating content for: ${topic.title}`)

        const createdLesson = await prisma.lesson.upsert({
            where: { id: `lesson-${prefix}-1` },
            update: {},
            create: {
                id: `lesson-${prefix}-1`,
                topicId: topic.id,
                ...lesson,
                isPublished: true,
                sortOrder: 1,
            },
        })
        totalLessons++

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i]
            await prisma.question.upsert({
                where: { id: `q-${prefix}-${i + 1}` },
                update: {},
                create: {
                    id: `q-${prefix}-${i + 1}`,
                    topicId: topic.id,
                    lessonId: createdLesson.id,
                    ukLevelId: level.id,
                    isPublished: true,
                    ...q,
                },
            })
            totalQuestions++
        }
        console.log(`   ✓ 1 lesson, ${questions.length} questions`)
    }

    const counts = {
        lessons: await prisma.lesson.count(),
        questions: await prisma.question.count(),
    }

    console.log('\n✅ Batch 3 content seed complete!')
    console.log(`   New: ${totalLessons} lessons, ${totalQuestions} questions`)
    console.log(`   Total: ${counts.lessons} lessons, ${counts.questions} questions`)
}

seedBatch3()
    .catch((e) => {
        console.error('❌ Content seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
