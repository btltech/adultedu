/**
 * Extended Content Seed Script
 * Adds more lessons and questions for all MVP track topics
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================
// EDS: Communicating Online (Topic 2)
// ============================================
const edsCommunicatingLesson = {
    title: 'Email Basics',
    summary: 'Learn how to send, receive, and manage emails effectively.',
    estMinutes: 20,
    contentBlocks: JSON.stringify([
        { type: 'heading', content: 'Getting Started with Email' },
        { type: 'paragraph', content: 'Email is one of the most important digital communication tools. Whether for work, education, or personal use, knowing how to use email effectively is essential in today\'s world.' },

        { type: 'subheading', content: 'Parts of an Email' },
        {
            type: 'list', items: [
                'To: The email address of the person you\'re sending to',
                'Subject: A brief summary of what the email is about',
                'Body: The main content of your message',
                'CC (Carbon Copy): Send a copy to additional people',
                'BCC (Blind Carbon Copy): Send a copy without others seeing',
                'Attachments: Files you include with your email'
            ]
        },

        { type: 'subheading', content: 'Writing a Good Email' },
        { type: 'paragraph', content: 'A well-written email should be clear, concise, and professional when needed.' },
        { type: 'callout', variant: 'tip', content: 'Always write a clear subject line. This helps the recipient understand what your email is about before opening it.' },

        { type: 'subheading', content: 'Email Etiquette' },
        {
            type: 'list', items: [
                'Use a greeting (Dear..., Hello..., Hi...)',
                'Be polite and professional in work emails',
                'Proofread before sending',
                'Reply promptly to important emails',
                'Use Reply All carefully - only when everyone needs to see your response'
            ]
        },

        { type: 'subheading', content: 'Managing Your Inbox' },
        { type: 'paragraph', content: 'Keep your inbox organised by using folders, starring important emails, and deleting or archiving messages you no longer need.' },
        { type: 'callout', variant: 'warning', content: 'Be careful with emails from unknown senders, especially if they ask for personal information or contain unexpected attachments.' }
    ]),
}

const edsCommunicatingQuestions = [
    {
        type: 'mcq',
        prompt: 'What is the purpose of the "Subject" field in an email?',
        options: JSON.stringify(['To write the main message', 'To give a brief summary of the email content', 'To add the recipient\'s name', 'To attach files']),
        answer: JSON.stringify(1),
        explanation: 'The Subject field provides a brief summary of what your email is about. It helps recipients understand the topic before opening the email and makes it easier to find later.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'What does BCC stand for in an email?',
        options: JSON.stringify(['Basic Carbon Copy', 'Blind Carbon Copy', 'Bulk Copy Control', 'Business Contact Copy']),
        answer: JSON.stringify(1),
        explanation: 'BCC stands for Blind Carbon Copy. When you add someone to BCC, they receive the email but other recipients cannot see their address.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'When should you use "Reply All" in an email?',
        options: JSON.stringify(['Whenever you reply to any email', 'Only when everyone in the conversation needs to see your response', 'Never - it\'s bad practice', 'Only for personal emails']),
        answer: JSON.stringify(1),
        explanation: 'Use Reply All only when your response is relevant to everyone in the email chain. Otherwise, just reply to the sender to avoid cluttering others\' inboxes.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'Which of these is a sign of a potentially dangerous email?',
        options: JSON.stringify(['It comes from a known colleague', 'It has a clear subject line', 'It asks you to click a link to verify your bank details', 'It includes your name in the greeting']),
        answer: JSON.stringify(2),
        explanation: 'Legitimate banks and companies rarely ask for sensitive information via email links. This is a common phishing tactic. Always be suspicious of unexpected requests for personal or financial details.',
        difficulty: 2,
    },
    {
        type: 'true_false',
        prompt: 'You should always proofread your email before sending it.',
        options: JSON.stringify(['True', 'False']),
        answer: JSON.stringify(0),
        explanation: 'Yes! Proofreading helps catch typos, grammatical errors, and ensures your message is clear. It\'s especially important in professional communications.',
        difficulty: 1,
    },
]

// ============================================
// EDS: Being Safe Online (Topic 6)
// ============================================
const edsSafetyLesson = {
    title: 'Creating Strong Passwords',
    summary: 'Learn how to create and manage strong passwords to protect your accounts.',
    estMinutes: 15,
    contentBlocks: JSON.stringify([
        { type: 'heading', content: 'Why Passwords Matter' },
        { type: 'paragraph', content: 'Passwords are the first line of defence for your online accounts. A weak password can leave your personal information, money, and identity at risk.' },

        { type: 'subheading', content: 'What Makes a Strong Password?' },
        { type: 'paragraph', content: 'A strong password is hard for others to guess but easy for you to remember.' },
        {
            type: 'list', items: [
                'At least 12 characters long (longer is better)',
                'Mix of uppercase and lowercase letters',
                'Include numbers and special characters (!@#$%)',
                'Not based on personal info (birthdays, names, pet names)',
                'Different for each account'
            ]
        },

        { type: 'subheading', content: 'Password Creation Techniques' },
        { type: 'paragraph', content: 'One effective technique is to use a passphrase - a memorable sentence or phrase:' },
        { type: 'code', content: 'Phrase: "I love eating 3 pizzas on Fridays!"\nPassword: ILe3p0F!' },
        { type: 'callout', variant: 'tip', content: 'Use the first letter of each word in a memorable sentence, then add numbers and symbols.' },

        { type: 'subheading', content: 'Common Password Mistakes' },
        {
            type: 'list', items: [
                'Using "password" or "123456" (the most hacked passwords)',
                'Using the same password for multiple accounts',
                'Writing passwords on sticky notes near your computer',
                'Sharing passwords with others',
                'Never changing your passwords'
            ]
        },

        { type: 'subheading', content: 'Password Managers' },
        { type: 'paragraph', content: 'A password manager is a secure app that stores all your passwords. You only need to remember one master password to access all the others.' },
        { type: 'callout', variant: 'info', content: 'Popular password managers include LastPass, 1Password, and Bitwarden. Many are free for basic use.' }
    ]),
}

const edsSafetyQuestions = [
    {
        type: 'mcq',
        prompt: 'What is the minimum recommended length for a strong password?',
        options: JSON.stringify(['6 characters', '8 characters', '12 characters', '4 characters']),
        answer: JSON.stringify(2),
        explanation: 'Security experts recommend passwords of at least 12 characters. Longer passwords are exponentially harder to crack.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'Which of these is the STRONGEST password?',
        options: JSON.stringify(['password123', 'MyDogMax2015', 'H7$kL9@mP2!x', '12345678901234']),
        answer: JSON.stringify(2),
        explanation: 'H7$kL9@mP2!x is strongest because it has a mix of uppercase, lowercase, numbers, and special characters with no dictionary words or personal info.',
        difficulty: 2,
    },
    {
        type: 'true_false',
        prompt: 'It\'s okay to use the same password for all your accounts if it\'s a strong password.',
        options: JSON.stringify(['True', 'False']),
        answer: JSON.stringify(1),
        explanation: 'False! Even a strong password should be unique to each account. If one service is breached, hackers will try that password on other sites.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'What is a password manager?',
        options: JSON.stringify(['A person who manages your passwords', 'A secure app that stores all your passwords', 'A government database of passwords', 'A type of internet browser']),
        answer: JSON.stringify(1),
        explanation: 'A password manager is a secure application that encrypts and stores all your passwords. You only need to remember one master password.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'Which piece of information should you NEVER use in a password?',
        options: JSON.stringify(['Random symbols', 'Your birthday', 'Made-up words', 'Numbers that mean nothing to you']),
        answer: JSON.stringify(1),
        explanation: 'Personal information like birthdays, anniversaries, or names can be researched by attackers through social media and public records.',
        difficulty: 1,
    },
]

// ============================================
// GCSE Maths: Algebra (Topic 2)
// ============================================
const gcseAlgebraLesson = {
    title: 'Solving Linear Equations',
    summary: 'Learn techniques for solving equations with one unknown.',
    estMinutes: 25,
    contentBlocks: JSON.stringify([
        { type: 'heading', content: 'Introduction to Equations' },
        { type: 'paragraph', content: 'An equation is a mathematical statement that two expressions are equal. Solving an equation means finding the value of the unknown variable that makes the equation true.' },

        { type: 'subheading', content: 'The Balance Method' },
        { type: 'paragraph', content: 'Think of an equation like a balance scale. Whatever you do to one side, you must do to the other to keep it balanced.' },
        { type: 'code', content: 'x + 5 = 12\nSubtract 5 from both sides:\nx + 5 - 5 = 12 - 5\nx = 7' },

        { type: 'subheading', content: 'Solving Steps' },
        {
            type: 'list', items: [
                'Simplify each side if needed (expand brackets)',
                'Move variable terms to one side',
                'Move number terms to the other side',
                'Combine like terms',
                'Divide to find the variable'
            ]
        },

        { type: 'subheading', content: 'Example: Two-Step Equation' },
        { type: 'code', content: '3x + 7 = 22\n\nStep 1: Subtract 7 from both sides\n3x = 22 - 7\n3x = 15\n\nStep 2: Divide both sides by 3\nx = 15 ÷ 3\nx = 5' },
        { type: 'callout', variant: 'tip', content: 'Always check your answer by substituting it back into the original equation.' },

        { type: 'subheading', content: 'Equations with Variables on Both Sides' },
        { type: 'code', content: '5x - 3 = 2x + 9\n\nStep 1: Subtract 2x from both sides\n3x - 3 = 9\n\nStep 2: Add 3 to both sides\n3x = 12\n\nStep 3: Divide by 3\nx = 4' },

        { type: 'subheading', content: 'Equations with Brackets' },
        { type: 'code', content: '2(x + 4) = 14\n\nStep 1: Expand the bracket\n2x + 8 = 14\n\nStep 2: Subtract 8\n2x = 6\n\nStep 3: Divide by 2\nx = 3' }
    ]),
}

const gcseAlgebraQuestions = [
    {
        type: 'mcq',
        prompt: 'Solve: x + 8 = 15',
        options: JSON.stringify(['x = 23', 'x = 7', 'x = 8', 'x = -7']),
        answer: JSON.stringify(1),
        explanation: 'Subtract 8 from both sides: x = 15 - 8 = 7. Check: 7 + 8 = 15 ✓',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'Solve: 3x = 21',
        options: JSON.stringify(['x = 18', 'x = 24', 'x = 7', 'x = 63']),
        answer: JSON.stringify(2),
        explanation: 'Divide both sides by 3: x = 21 ÷ 3 = 7. Check: 3 × 7 = 21 ✓',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'Solve: 2x + 5 = 17',
        options: JSON.stringify(['x = 11', 'x = 6', 'x = 22', 'x = 12']),
        answer: JSON.stringify(1),
        explanation: 'Subtract 5: 2x = 12. Divide by 2: x = 6. Check: 2(6) + 5 = 12 + 5 = 17 ✓',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'Solve: 4x - 3 = 2x + 7',
        options: JSON.stringify(['x = 2', 'x = 5', 'x = 10', 'x = 4']),
        answer: JSON.stringify(1),
        explanation: 'Subtract 2x: 2x - 3 = 7. Add 3: 2x = 10. Divide by 2: x = 5. Check: 4(5) - 3 = 17, 2(5) + 7 = 17 ✓',
        difficulty: 3,
    },
    {
        type: 'mcq',
        prompt: 'Solve: 3(x - 2) = 15',
        options: JSON.stringify(['x = 7', 'x = 5', 'x = 11', 'x = 17']),
        answer: JSON.stringify(0),
        explanation: 'Expand: 3x - 6 = 15. Add 6: 3x = 21. Divide by 3: x = 7. Check: 3(7-2) = 3(5) = 15 ✓',
        difficulty: 3,
    },
    {
        type: 'short_answer',
        prompt: 'Solve for x: 5x + 10 = 35',
        options: null,
        answer: JSON.stringify('5'),
        explanation: 'Subtract 10 from both sides: 5x = 25. Divide both sides by 5: x = 5.',
        difficulty: 2,
    },
]

// ============================================
// GCSE Maths: Geometry (Topic 4)
// ============================================
const gcseGeometryLesson = {
    title: 'Angles in Triangles and Polygons',
    summary: 'Learn the rules for calculating angles in different shapes.',
    estMinutes: 20,
    contentBlocks: JSON.stringify([
        { type: 'heading', content: 'Angle Facts' },
        { type: 'paragraph', content: 'Understanding angle properties is essential for solving geometry problems. Let\'s start with the key facts you need to know.' },

        { type: 'subheading', content: 'Basic Angle Facts' },
        {
            type: 'list', items: [
                'Angles on a straight line add up to 180°',
                'Angles around a point add up to 360°',
                'Vertically opposite angles are equal'
            ]
        },

        { type: 'subheading', content: 'Angles in Triangles' },
        { type: 'paragraph', content: 'The three angles inside any triangle always add up to 180°.' },
        { type: 'code', content: 'Triangle with angles a, b, c:\na + b + c = 180°\n\nExample: If a = 50° and b = 70°\nc = 180° - 50° - 70° = 60°' },

        { type: 'subheading', content: 'Special Triangles' },
        {
            type: 'list', items: [
                'Equilateral triangle: All angles are 60°',
                'Isosceles triangle: Two angles are equal (base angles)',
                'Right-angled triangle: One angle is 90°'
            ]
        },

        { type: 'subheading', content: 'Angles in Quadrilaterals' },
        { type: 'paragraph', content: 'The four angles inside any quadrilateral add up to 360°.' },
        { type: 'callout', variant: 'info', content: 'A quadrilateral is any 4-sided shape: square, rectangle, parallelogram, trapezium, rhombus, or irregular.' },

        { type: 'subheading', content: 'Interior Angles of Polygons' },
        { type: 'paragraph', content: 'For any polygon with n sides, the sum of interior angles is:' },
        { type: 'code', content: 'Sum = (n - 2) × 180°\n\nPentagon (5 sides): (5-2) × 180° = 540°\nHexagon (6 sides): (6-2) × 180° = 720°' },

        { type: 'subheading', content: 'Regular Polygon Angles' },
        { type: 'paragraph', content: 'In a regular polygon (all sides and angles equal):' },
        { type: 'code', content: 'Each interior angle = (n-2) × 180° ÷ n\n\nRegular pentagon: 540° ÷ 5 = 108°\nRegular hexagon: 720° ÷ 6 = 120°' }
    ]),
}

const gcseGeometryQuestions = [
    {
        type: 'mcq',
        prompt: 'What do the angles in a triangle add up to?',
        options: JSON.stringify(['90°', '180°', '270°', '360°']),
        answer: JSON.stringify(1),
        explanation: 'The interior angles of any triangle always sum to 180°. This is a fundamental property of triangles.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'Two angles of a triangle are 45° and 85°. What is the third angle?',
        options: JSON.stringify(['40°', '50°', '60°', '130°']),
        answer: JSON.stringify(1),
        explanation: 'Third angle = 180° - 45° - 85° = 50°. The three angles must sum to 180°.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'What is each angle in an equilateral triangle?',
        options: JSON.stringify(['30°', '45°', '60°', '90°']),
        answer: JSON.stringify(2),
        explanation: 'An equilateral triangle has three equal angles. Since they sum to 180°, each angle is 180° ÷ 3 = 60°.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'What do the angles in a quadrilateral add up to?',
        options: JSON.stringify(['180°', '270°', '360°', '540°']),
        answer: JSON.stringify(2),
        explanation: 'The interior angles of any quadrilateral sum to 360°. You can think of it as two triangles: 2 × 180° = 360°.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'What is the sum of interior angles in a pentagon (5 sides)?',
        options: JSON.stringify(['360°', '450°', '540°', '720°']),
        answer: JSON.stringify(2),
        explanation: 'Using (n-2) × 180°: (5-2) × 180° = 3 × 180° = 540°.',
        difficulty: 3,
    },
]

// ============================================
// Python: Variables and Data Types (Topic 2)
// ============================================
const pythonVariablesLesson = {
    title: 'Working with Strings',
    summary: 'Learn how to manipulate and format text in Python.',
    estMinutes: 25,
    contentBlocks: JSON.stringify([
        { type: 'heading', content: 'String Basics' },
        { type: 'paragraph', content: 'Strings are sequences of characters used to represent text. They\'re one of the most commonly used data types in programming.' },

        { type: 'subheading', content: 'Creating Strings' },
        { type: 'code', content: '# Using single or double quotes\nname = "Alice"\ngreeting = \'Hello\'\n\n# Multi-line strings with triple quotes\nmessage = """This is a\nmulti-line\nstring."""' },

        { type: 'subheading', content: 'String Concatenation' },
        { type: 'paragraph', content: 'You can combine strings using the + operator:' },
        { type: 'code', content: 'first_name = "John"\nlast_name = "Smith"\nfull_name = first_name + " " + last_name\nprint(full_name)  # Output: John Smith' },

        { type: 'subheading', content: 'String Methods' },
        { type: 'paragraph', content: 'Python provides many built-in methods for working with strings:' },
        { type: 'code', content: 'text = "Hello World"\n\ntext.lower()      # "hello world"\ntext.upper()      # "HELLO WORLD"\ntext.replace("World", "Python")  # "Hello Python"\nlen(text)         # 11 (length)\ntext.split()      # ["Hello", "World"]' },

        { type: 'subheading', content: 'String Indexing' },
        { type: 'paragraph', content: 'Access individual characters using their position (index). Remember: Python starts counting from 0!' },
        { type: 'code', content: 'word = "Python"\nword[0]   # "P" (first character)\nword[2]   # "t" (third character)\nword[-1]  # "n" (last character)\nword[-2]  # "o" (second to last)' },
        { type: 'callout', variant: 'tip', content: 'Negative indices count from the end of the string. -1 is the last character.' },

        { type: 'subheading', content: 'F-Strings (Formatted Strings)' },
        { type: 'paragraph', content: 'F-strings are the modern way to include variables in strings:' },
        { type: 'code', content: 'name = "Alice"\nage = 30\n\n# Old way\nmessage = "My name is " + name + " and I am " + str(age)\n\n# F-string way (better!)\nmessage = f"My name is {name} and I am {age}"' }
    ]),
}

const pythonVariablesQuestions = [
    {
        type: 'mcq',
        prompt: 'How do you create a multi-line string in Python?',
        options: JSON.stringify(['Using \\n', 'Using triple quotes """', 'Using brackets []', 'Using semicolons']),
        answer: JSON.stringify(1),
        explanation: 'Triple quotes (""" or \'\'\') allow you to create strings that span multiple lines. \\n can also represent newlines within regular strings.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'What will "Hello".upper() return?',
        options: JSON.stringify(['"hello"', '"HELLO"', '"Hello"', 'Error']),
        answer: JSON.stringify(1),
        explanation: 'The .upper() method converts all characters in a string to uppercase. "Hello".upper() returns "HELLO".',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'In Python, what is the index of the first character in a string?',
        options: JSON.stringify(['1', '0', '-1', 'None']),
        answer: JSON.stringify(1),
        explanation: 'Python uses zero-based indexing, meaning the first character is at index 0, the second at index 1, and so on.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'What does word[-1] return if word = "Python"?',
        options: JSON.stringify(['"P"', '"n"', '"o"', 'Error']),
        answer: JSON.stringify(1),
        explanation: 'Negative indices count from the end of the string. -1 refers to the last character, which is "n" in "Python".',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'What is an f-string in Python?',
        options: JSON.stringify(['A string that starts with f', 'A formatted string for embedding variables', 'A file string', 'A function string']),
        answer: JSON.stringify(1),
        explanation: 'F-strings (formatted string literals) start with f before the quotes and allow you to embed expressions inside {curly braces}.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'What does len("Hello World") return?',
        options: JSON.stringify(['10', '11', '12', '2']),
        answer: JSON.stringify(1),
        explanation: 'len() returns the number of characters in a string, including spaces. "Hello World" has 11 characters (5 + 1 space + 5).',
        difficulty: 1,
    },
]

// ============================================
// Python: Control Flow (Topic 3)
// ============================================
const pythonControlLesson = {
    title: 'If Statements and Conditions',
    summary: 'Learn how to make decisions in your code using conditional logic.',
    estMinutes: 20,
    contentBlocks: JSON.stringify([
        { type: 'heading', content: 'Making Decisions in Code' },
        { type: 'paragraph', content: 'Programs often need to make decisions based on certain conditions. Python uses if statements to control the flow of your program.' },

        { type: 'subheading', content: 'The if Statement' },
        { type: 'code', content: 'age = 18\n\nif age >= 18:\n    print("You can vote!")\n\n# Output: You can vote!' },
        { type: 'callout', variant: 'important', content: 'Remember: Python uses indentation (4 spaces) to define code blocks. The code inside the if statement must be indented.' },

        { type: 'subheading', content: 'Comparison Operators' },
        {
            type: 'list', items: [
                '== (equal to)',
                '!= (not equal to)',
                '> (greater than)',
                '< (less than)',
                '>= (greater than or equal)',
                '<= (less than or equal)'
            ]
        },

        { type: 'subheading', content: 'if-else Statements' },
        { type: 'code', content: 'score = 65\n\nif score >= 70:\n    print("Pass")\nelse:\n    print("Fail")\n\n# Output: Fail' },

        { type: 'subheading', content: 'if-elif-else Chains' },
        { type: 'paragraph', content: 'Use elif (else if) when you have multiple conditions to check:' },
        { type: 'code', content: 'grade = 75\n\nif grade >= 90:\n    print("A")\nelif grade >= 80:\n    print("B")\nelif grade >= 70:\n    print("C")\nelif grade >= 60:\n    print("D")\nelse:\n    print("F")\n\n# Output: C' },

        { type: 'subheading', content: 'Logical Operators' },
        { type: 'paragraph', content: 'Combine conditions using and, or, and not:' },
        { type: 'code', content: 'age = 25\nhas_ticket = True\n\nif age >= 18 and has_ticket:\n    print("Welcome to the concert!")\n\nif age < 13 or age > 65:\n    print("Discount available!")' }
    ]),
}

const pythonControlQuestions = [
    {
        type: 'mcq',
        prompt: 'What symbol is used to check if two values are equal in Python?',
        options: JSON.stringify(['=', '==', '===', ':=']),
        answer: JSON.stringify(1),
        explanation: '== is the equality operator. A single = is used for assignment (storing a value), while == compares two values.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'What is the output of: if 5 > 3: print("Yes")',
        options: JSON.stringify(['Yes', 'No', 'Error', 'Nothing']),
        answer: JSON.stringify(0),
        explanation: '5 is greater than 3, so the condition is True, and "Yes" is printed.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'What does "elif" stand for in Python?',
        options: JSON.stringify(['else if', 'extra line', 'element index', 'else ignore']),
        answer: JSON.stringify(0),
        explanation: 'elif is short for "else if". It allows you to check additional conditions after the initial if statement.',
        difficulty: 1,
    },
    {
        type: 'mcq',
        prompt: 'What will be printed?\nx = 10\nif x > 5 and x < 15:\n    print("In range")',
        options: JSON.stringify(['In range', 'Nothing', 'Error', 'True']),
        answer: JSON.stringify(0),
        explanation: 'x is 10, which is greater than 5 AND less than 15. Both conditions are True, so "In range" is printed.',
        difficulty: 2,
    },
    {
        type: 'mcq',
        prompt: 'Which operator means "not equal to"?',
        options: JSON.stringify(['<>', '!=', '/=', '~=']),
        answer: JSON.stringify(1),
        explanation: 'In Python, != means "not equal to". For example, 5 != 3 is True.',
        difficulty: 1,
    },
]

// ============================================
// Main Seed Function
// ============================================
async function seedMoreContent() {
    console.log('🌱 Seeding additional MVP content...\n')

    // Get topics by ID
    const topics = {
        edsCommunicating: await prisma.topic.findFirst({ where: { id: 'eds-2' } }),
        edsSafety: await prisma.topic.findFirst({ where: { id: 'eds-6' } }),
        gcseAlgebra: await prisma.topic.findFirst({ where: { id: 'gcse-2' } }),
        gcseGeometry: await prisma.topic.findFirst({ where: { id: 'gcse-4' } }),
        pythonVariables: await prisma.topic.findFirst({ where: { id: 'python-2' } }),
        pythonControl: await prisma.topic.findFirst({ where: { id: 'python-3' } }),
    }

    // Get UK levels
    const levels = {
        e3: await prisma.ukLevel.findUnique({ where: { code: 'E3' } }),
        l1: await prisma.ukLevel.findUnique({ where: { code: 'L1' } }),
        l2: await prisma.ukLevel.findUnique({ where: { code: 'L2' } }),
        l3: await prisma.ukLevel.findUnique({ where: { code: 'L3' } }),
    }

    const contentToSeed = [
        { topic: topics.edsCommunicating, lesson: edsCommunicatingLesson, questions: edsCommunicatingQuestions, level: levels.e3, prefix: 'eds-2' },
        { topic: topics.edsSafety, lesson: edsSafetyLesson, questions: edsSafetyQuestions, level: levels.l1, prefix: 'eds-6' },
        { topic: topics.gcseAlgebra, lesson: gcseAlgebraLesson, questions: gcseAlgebraQuestions, level: levels.l2, prefix: 'gcse-2' },
        { topic: topics.gcseGeometry, lesson: gcseGeometryLesson, questions: gcseGeometryQuestions, level: levels.l2, prefix: 'gcse-4' },
        { topic: topics.pythonVariables, lesson: pythonVariablesLesson, questions: pythonVariablesQuestions, level: levels.l3, prefix: 'python-2' },
        { topic: topics.pythonControl, lesson: pythonControlLesson, questions: pythonControlQuestions, level: levels.l3, prefix: 'python-3' },
    ]

    let totalLessons = 0
    let totalQuestions = 0

    for (const { topic, lesson, questions, level, prefix } of contentToSeed) {
        if (!topic) {
            console.log(`⚠️  Topic ${prefix} not found, skipping`)
            continue
        }

        console.log(`📖 Creating content for: ${topic.title}`)

        // Create lesson
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

        // Create questions
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

    // Summary
    const counts = {
        lessons: await prisma.lesson.count(),
        questions: await prisma.question.count(),
    }

    console.log('\n✅ Additional content seed complete!')
    console.log(`   New: ${totalLessons} lessons, ${totalQuestions} questions`)
    console.log(`   Total: ${counts.lessons} lessons, ${counts.questions} questions`)
}

seedMoreContent()
    .catch((e) => {
        console.error('❌ Content seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
