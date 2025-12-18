/**
 * Seed script for 3 new courses:
 * 1. Microsoft Office Essentials
 * 2. Financial Literacy
 * 3. GCSE Computer Science
 */

import prisma from '../src/lib/db.js'

// ============================================
// COURSE 1: Microsoft Office Essentials
// ============================================
const OFFICE_COURSE = {
    slug: 'microsoft-office-essentials',
    title: 'Microsoft Office Essentials',
    description: 'Master Word, Excel, and PowerPoint - the essential tools for any workplace. Perfect for beginners and those refreshing their skills.',
    category: 'workplace',
    isLive: true,
    topics: [
        {
            title: 'Microsoft Word Basics',
            description: 'Creating, formatting, and editing documents.',
            order: 1,
            questions: [
                { prompt: 'What is Microsoft Word primarily used for?', options: ['Creating spreadsheets', 'Creating documents and letters', 'Making presentations', 'Editing photos'], answer: 'Creating documents and letters', explanation: 'Microsoft Word is a word processor used for creating, editing, and formatting text documents.' },
                { prompt: 'Which keyboard shortcut saves a document?', options: ['Ctrl + C', 'Ctrl + S', 'Ctrl + P', 'Ctrl + V'], answer: 'Ctrl + S', explanation: 'Ctrl + S is the universal shortcut for saving files in most applications.' },
                { prompt: 'What does "Bold" formatting do to text?', options: ['Makes it italic', 'Makes it thicker and darker', 'Underlines it', 'Changes the colour'], answer: 'Makes it thicker and darker', explanation: 'Bold makes text appear heavier and more prominent for emphasis.' },
                { prompt: 'Which menu contains the Print option?', options: ['Home', 'Insert', 'File', 'View'], answer: 'File', explanation: 'The File menu (or tab) contains options like Print, Save, and Open.' },
                { prompt: 'What is the keyboard shortcut to undo an action?', options: ['Ctrl + Z', 'Ctrl + Y', 'Ctrl + X', 'Ctrl + A'], answer: 'Ctrl + Z', explanation: 'Ctrl + Z undoes your last action, which is helpful for correcting mistakes.' },
                { prompt: 'True or False: You can add images to a Word document.', options: ['True', 'False'], answer: 'True', explanation: 'Word allows you to insert images, shapes, tables, and other media into documents.' },
                { prompt: 'What does Ctrl + C do?', options: ['Cut', 'Copy', 'Close', 'Create'], answer: 'Copy', explanation: 'Ctrl + C copies selected content to the clipboard so you can paste it elsewhere.' },
                { prompt: 'Which feature checks your spelling automatically?', options: ['AutoCorrect', 'AutoSave', 'AutoFormat', 'AutoPlay'], answer: 'AutoCorrect', explanation: 'AutoCorrect automatically fixes common spelling and typing errors as you type.' },
                { prompt: 'What file extension do Word documents typically have?', options: ['.xlsx', '.docx', '.pptx', '.pdf'], answer: '.docx', explanation: 'Modern Word documents use the .docx extension (older versions used .doc).' },
                { prompt: 'How do you select all text in a document?', options: ['Ctrl + A', 'Ctrl + S', 'Ctrl + E', 'Ctrl + F'], answer: 'Ctrl + A', explanation: 'Ctrl + A selects all content in the current document.' },
            ]
        },
        {
            title: 'Excel Fundamentals',
            description: 'Working with spreadsheets, formulas, and data.',
            order: 2,
            questions: [
                { prompt: 'What is a cell in Excel?', options: ['A type of chart', 'A box where you enter data', 'A formula', 'A worksheet'], answer: 'A box where you enter data', explanation: 'A cell is the intersection of a row and column where you can enter text, numbers, or formulas.' },
                { prompt: 'Which formula adds up numbers in cells A1 to A10?', options: ['=ADD(A1:A10)', '=SUM(A1:A10)', '=TOTAL(A1:A10)', '=PLUS(A1:A10)'], answer: '=SUM(A1:A10)', explanation: 'The SUM function adds up all values in the specified range.' },
                { prompt: 'What does a spreadsheet row run?', options: ['Vertically (up and down)', 'Horizontally (left to right)', 'Diagonally', 'In circles'], answer: 'Horizontally (left to right)', explanation: 'Rows run horizontally and are numbered (1, 2, 3...). Columns run vertically and use letters.' },
                { prompt: 'True or False: Excel can create charts and graphs.', options: ['True', 'False'], answer: 'True', explanation: 'Excel has powerful charting tools to visualize data as bar charts, pie charts, line graphs, and more.' },
                { prompt: 'What symbol starts a formula in Excel?', options: ['#', '@', '=', '&'], answer: '=', explanation: 'All Excel formulas must begin with an equals sign (=).' },
                { prompt: 'What does the AVERAGE function calculate?', options: ['The total', 'The highest number', 'The middle value', 'The mean of numbers'], answer: 'The mean of numbers', explanation: 'AVERAGE calculates the arithmetic mean by adding values and dividing by the count.' },
                { prompt: 'What is a worksheet in Excel?', options: ['A single spreadsheet page', 'A printed document', 'A formula type', 'A chart'], answer: 'A single spreadsheet page', explanation: 'A worksheet is one sheet within a workbook. Workbooks can contain multiple worksheets.' },
                { prompt: 'How do you move to the next cell to the right?', options: ['Press Enter', 'Press Tab', 'Press Space', 'Press Escape'], answer: 'Press Tab', explanation: 'Tab moves to the next cell to the right, while Enter moves down to the next row.' },
                { prompt: 'Which function counts how many cells contain numbers?', options: ['COUNT', 'SUM', 'AVERAGE', 'TOTAL'], answer: 'COUNT', explanation: 'COUNT counts cells that contain numbers in a specified range.' },
                { prompt: 'True or False: You can sort data alphabetically in Excel.', options: ['True', 'False'], answer: 'True', explanation: 'Excel can sort data alphabetically (A-Z or Z-A) or numerically.' },
            ]
        },
        {
            title: 'PowerPoint Presentations',
            description: 'Creating effective visual presentations.',
            order: 3,
            questions: [
                { prompt: 'What is PowerPoint used for?', options: ['Writing essays', 'Creating presentations', 'Managing databases', 'Editing videos'], answer: 'Creating presentations', explanation: 'PowerPoint is presentation software for creating slideshows with text, images, and multimedia.' },
                { prompt: 'What is a single page in PowerPoint called?', options: ['A sheet', 'A slide', 'A page', 'A frame'], answer: 'A slide', explanation: 'PowerPoint presentations are made up of individual slides.' },
                { prompt: 'Which view shows all slides as small thumbnails?', options: ['Normal View', 'Slide Sorter', 'Reading View', 'Outline View'], answer: 'Slide Sorter', explanation: 'Slide Sorter view shows all slides as thumbnails for easy reordering.' },
                { prompt: 'What is a transition in PowerPoint?', options: ['A type of font', 'Animation between slides', 'A text box', 'A chart type'], answer: 'Animation between slides', explanation: 'Transitions are visual effects that play when moving from one slide to the next.' },
                { prompt: 'True or False: You can add videos to PowerPoint slides.', options: ['True', 'False'], answer: 'True', explanation: 'PowerPoint supports embedding videos, audio, and other multimedia content.' },
                { prompt: 'What key starts a presentation from the first slide?', options: ['F1', 'F5', 'F10', 'F12'], answer: 'F5', explanation: 'Pressing F5 starts the slideshow from the beginning.' },
                { prompt: 'What is the best number of bullet points per slide?', options: ['As many as possible', '3-6 points', 'Only 1', 'At least 10'], answer: '3-6 points', explanation: 'Keeping 3-6 points per slide maintains readability and audience engagement.' },
                { prompt: 'What file extension do PowerPoint files use?', options: ['.docx', '.xlsx', '.pptx', '.pdf'], answer: '.pptx', explanation: 'PowerPoint files use the .pptx extension (older versions used .ppt).' },
                { prompt: 'What is a theme in PowerPoint?', options: ['A song', 'A preset design with colors and fonts', 'A type of chart', 'A video clip'], answer: 'A preset design with colors and fonts', explanation: 'Themes are pre-designed templates that give your presentation a consistent, professional look.' },
                { prompt: 'True or False: PowerPoint has a Presenter View for speakers.', options: ['True', 'False'], answer: 'True', explanation: 'Presenter View shows your notes and upcoming slides while the audience sees only the current slide.' },
            ]
        },
        {
            title: 'Email and Outlook',
            description: 'Professional email communication and calendar management.',
            order: 4,
            questions: [
                { prompt: 'What does CC stand for in email?', options: ['Copy Complete', 'Carbon Copy', 'Computer Copy', 'Clear Copy'], answer: 'Carbon Copy', explanation: 'CC (Carbon Copy) sends a copy to additional recipients who can see each other.' },
                { prompt: 'What is BCC used for?', options: ['Backing up emails', 'Sending hidden copies', 'Blocking contacts', 'Bold text'], answer: 'Sending hidden copies', explanation: 'BCC (Blind Carbon Copy) sends copies without other recipients seeing those addresses.' },
                { prompt: 'What should a professional email subject line be?', options: ['Empty', 'Clear and specific', 'Just "Hi"', 'Very long'], answer: 'Clear and specific', explanation: 'A good subject line tells the recipient what the email is about at a glance.' },
                { prompt: 'True or False: You can schedule emails to send later in Outlook.', options: ['True', 'False'], answer: 'True', explanation: 'Outlook allows you to delay delivery and schedule emails to send at a specific time.' },
                { prompt: 'What does the @ symbol do in email addresses?', options: ['Separates username from domain', 'Indicates urgency', 'Adds formatting', 'Creates a link'], answer: 'Separates username from domain', explanation: 'The @ separates your username from your email provider (e.g., name@company.com).' },
                { prompt: 'What is an email signature?', options: ['A handwritten name', 'Auto-added text at email end', 'A password', 'An attachment'], answer: 'Auto-added text at email end', explanation: 'An email signature is customizable text (name, title, contact info) added automatically to emails.' },
                { prompt: 'How should you start a professional email?', options: ['Hey!', 'Dear [Name] or Hello [Name]', 'Yo', 'No greeting needed'], answer: 'Dear [Name] or Hello [Name]', explanation: 'Professional emails typically start with "Dear" or "Hello" followed by the recipient\'s name.' },
                { prompt: 'What is an attachment?', options: ['A link', 'A file sent with an email', 'A signature', 'A folder'], answer: 'A file sent with an email', explanation: 'Attachments are files (documents, images, etc.) included with your email.' },
                { prompt: 'True or False: Outlook can manage your calendar.', options: ['True', 'False'], answer: 'True', explanation: 'Outlook includes a calendar for scheduling meetings, appointments, and reminders.' },
                { prompt: 'What is "Reply All" used for?', options: ['Reply to sender only', 'Reply to everyone in the email', 'Forward the email', 'Delete the email'], answer: 'Reply to everyone in the email', explanation: 'Reply All sends your response to the sender AND all other recipients.' },
            ]
        },
    ]
}

// ============================================
// COURSE 2: Financial Literacy
// ============================================
const FINANCE_COURSE = {
    slug: 'financial-literacy',
    title: 'Financial Literacy',
    description: 'Essential money management skills for everyday life. Learn budgeting, saving, banking, and making smart financial decisions.',
    category: 'workplace',
    isLive: true,
    topics: [
        {
            title: 'Budgeting Basics',
            description: 'Creating and managing a personal budget.',
            order: 1,
            questions: [
                { prompt: 'What is a budget?', options: ['A type of bank account', 'A plan for spending and saving money', 'A loan', 'A credit card'], answer: 'A plan for spending and saving money', explanation: 'A budget is a plan that helps you track income, expenses, and savings goals.' },
                { prompt: 'What are "fixed expenses"?', options: ['Expenses that change monthly', 'Regular costs that stay the same', 'One-time purchases', 'Credit card fees'], answer: 'Regular costs that stay the same', explanation: 'Fixed expenses like rent or mortgage payments remain constant each month.' },
                { prompt: 'Which is an example of a variable expense?', options: ['Rent', 'Groceries', 'Car payment', 'Netflix subscription'], answer: 'Groceries', explanation: 'Variable expenses like groceries, fuel, and entertainment change from month to month.' },
                { prompt: 'True or False: You should track every expense when budgeting.', options: ['True', 'False'], answer: 'True', explanation: 'Tracking all expenses helps you understand where your money goes and find savings.' },
                { prompt: 'What is the 50/30/20 budgeting rule?', options: ['Save 50%, spend 50%', '50% needs, 30% wants, 20% savings', 'Spend 50% on food', 'Save 20% for retirement only'], answer: '50% needs, 30% wants, 20% savings', explanation: 'This popular rule suggests allocating 50% to needs, 30% to wants, and 20% to savings.' },
                { prompt: 'What should you do first when creating a budget?', options: ['Plan a holiday', 'Calculate your income', 'Apply for credit', 'Open a savings account'], answer: 'Calculate your income', explanation: 'Knowing your total income is the first step to planning how to spend and save it.' },
                { prompt: 'True or False: Budgets should never be changed.', options: ['True', 'False'], answer: 'False', explanation: 'Budgets should be reviewed and adjusted as your income, expenses, or goals change.' },
                { prompt: 'What is "disposable income"?', options: ['Wasted money', 'Money left after paying taxes and bills', 'Credit card limit', 'Savings only'], answer: 'Money left after paying taxes and bills', explanation: 'Disposable income is what remains after essential costs, available for saving or spending.' },
                { prompt: 'Which app feature helps with budgeting?', options: ['Camera', 'Expense tracking', 'Music player', 'GPS'], answer: 'Expense tracking', explanation: 'Many banking and budgeting apps offer expense tracking to categorize your spending.' },
                { prompt: 'What is an "emergency fund"?', options: ['Holiday savings', 'Money saved for unexpected costs', 'Retirement fund', 'Investment account'], answer: 'Money saved for unexpected costs', explanation: 'An emergency fund covers unexpected expenses like car repairs or medical bills.' },
            ]
        },
        {
            title: 'Saving and Banking',
            description: 'Understanding bank accounts, interest, and saving strategies.',
            order: 2,
            questions: [
                { prompt: 'What is a current account mainly used for?', options: ['Long-term savings', 'Everyday spending and bills', 'Investments only', 'Storing gold'], answer: 'Everyday spending and bills', explanation: 'Current accounts are for daily transactions like paying bills and receiving salary.' },
                { prompt: 'What is interest on a savings account?', options: ['A fee you pay', 'Money the bank pays you for saving', 'A type of tax', 'A loan payment'], answer: 'Money the bank pays you for saving', explanation: 'Banks pay you interest as a reward for keeping your money with them.' },
                { prompt: 'What does APR stand for?', options: ['Annual Payment Rate', 'Annual Percentage Rate', 'Account Payment Record', 'Average Price Rate'], answer: 'Annual Percentage Rate', explanation: 'APR is the yearly interest rate charged on loans or paid on savings.' },
                { prompt: 'True or False: ISAs offer tax-free savings in the UK.', options: ['True', 'False'], answer: 'True', explanation: 'Individual Savings Accounts (ISAs) let you save without paying tax on the interest.' },
                { prompt: 'What is a standing order?', options: ['A one-time payment', 'A regular automatic payment you set up', 'A bank charge', 'An overdraft'], answer: 'A regular automatic payment you set up', explanation: 'Standing orders are fixed regular payments you instruct your bank to make.' },
                { prompt: 'What is a Direct Debit?', options: ['You control the amount', 'The company takes what you owe', 'Cash withdrawal', 'Savings transfer'], answer: 'The company takes what you owe', explanation: 'Direct Debit allows companies to take varying amounts from your account for bills.' },
                { prompt: 'What is an overdraft?', options: ['Extra savings', 'Borrowing from your bank when account is empty', 'A type of ISA', 'A savings bonus'], answer: 'Borrowing from your bank when account is empty', explanation: 'An overdraft allows you to spend more than your balance, but you pay interest.' },
                { prompt: 'True or False: You should compare interest rates when choosing a savings account.', options: ['True', 'False'], answer: 'True', explanation: 'Higher interest rates mean your savings grow faster, so comparing is worthwhile.' },
                { prompt: 'What is compound interest?', options: ['Interest on original amount only', 'Interest on interest plus original', 'A bank fee', 'A loan type'], answer: 'Interest on interest plus original', explanation: 'Compound interest is earned on both your original savings and previously earned interest.' },
                { prompt: 'What is FSCS protection?', options: ['Foreign currency exchange', 'Protection for savings up to £85,000', 'A savings account type', 'A credit score'], answer: 'Protection for savings up to £85,000', explanation: 'The Financial Services Compensation Scheme protects up to £85,000 if a bank fails.' },
            ]
        },
        {
            title: 'Understanding Credit',
            description: 'Credit cards, loans, and managing debt responsibly.',
            order: 3,
            questions: [
                { prompt: 'What is a credit score?', options: ['Your bank balance', 'A number showing how reliable you are to lenders', 'Your salary', 'A type of account'], answer: 'A number showing how reliable you are to lenders', explanation: 'Credit scores help lenders decide whether to offer you credit and at what rate.' },
                { prompt: 'What happens if you only pay the minimum on a credit card?', options: ['The debt is cleared', 'You pay more interest over time', 'Nothing changes', 'Your score improves'], answer: 'You pay more interest over time', explanation: 'Paying only the minimum means the remaining balance accrues interest, costing more.' },
                { prompt: 'True or False: Missing payments hurts your credit score.', options: ['True', 'False'], answer: 'True', explanation: 'Late or missed payments are recorded and negatively impact your credit score.' },
                { prompt: 'What is APR on a credit card?', options: ['The credit limit', 'The yearly interest rate charged', 'The minimum payment', 'A reward points rate'], answer: 'The yearly interest rate charged', explanation: 'APR shows the annual cost of borrowing on the card, including interest and fees.' },
                { prompt: 'What is a good way to build credit?', options: ['Never use credit', 'Use credit responsibly and pay on time', 'Max out credit cards', 'Apply for many cards at once'], answer: 'Use credit responsibly and pay on time', explanation: 'Using credit sensibly and making timely payments builds a positive credit history.' },
                { prompt: 'What is a secured loan?', options: ['A loan backed by an asset', 'A loan without interest', 'A free loan', 'A government grant'], answer: 'A loan backed by an asset', explanation: 'Secured loans use assets (like your home) as collateral, which the lender can claim if you default.' },
                { prompt: 'True or False: You can check your credit report for free.', options: ['True', 'False'], answer: 'True', explanation: 'UK credit agencies must provide a free statutory credit report upon request.' },
                { prompt: 'What should you avoid to maintain good credit?', options: ['Paying bills on time', 'Using more than 30% of your credit limit', 'Having a credit card', 'Checking your credit report'], answer: 'Using more than 30% of your credit limit', explanation: 'High credit utilization (using too much of your limit) can lower your score.' },
                { prompt: 'What is a balance transfer?', options: ['Adding money to savings', 'Moving debt to a lower-interest card', 'Paying off a loan', 'Opening a new account'], answer: 'Moving debt to a lower-interest card', explanation: 'Balance transfers move existing debt to a card with lower interest to save money.' },
                { prompt: 'What is the best way to avoid credit card debt?', options: ['Never use the card', 'Pay the full balance each month', 'Pay minimum only', 'Ignore the statements'], answer: 'Pay the full balance each month', explanation: 'Paying in full each month avoids interest charges entirely.' },
            ]
        },
        {
            title: 'Taxes and Payslips',
            description: 'Understanding your payslip, tax codes, and National Insurance.',
            order: 4,
            questions: [
                { prompt: 'What is gross pay?', options: ['Pay after deductions', 'Pay before any deductions', 'Overtime pay only', 'Bonus payment'], answer: 'Pay before any deductions', explanation: 'Gross pay is your total earnings before tax and other deductions.' },
                { prompt: 'What is net pay?', options: ['Pay before tax', 'Take-home pay after deductions', 'Pension contribution', 'Student loan'], answer: 'Take-home pay after deductions', explanation: 'Net pay is what you actually receive after all deductions.' },
                { prompt: 'True or False: Everyone pays the same percentage of income tax.', options: ['True', 'False'], answer: 'False', explanation: 'UK income tax has different bands (20%, 40%, 45%) depending on earnings.' },
                { prompt: 'What is National Insurance?', options: ['Car insurance', 'Contributions for state benefits and NHS', 'Life insurance', 'Home insurance'], answer: 'Contributions for state benefits and NHS', explanation: 'NI contributions fund the NHS, state pension, and other benefits.' },
                { prompt: 'What is a tax code?', options: ['A password for HMRC', 'Code showing your tax-free allowance', 'Your national insurance number', 'A bank sort code'], answer: 'Code showing your tax-free allowance', explanation: 'Your tax code tells your employer how much you can earn tax-free.' },
                { prompt: 'What is the Personal Allowance?', options: ['How much you can borrow', 'Tax-free income amount', 'Pension contribution', 'Credit limit'], answer: 'Tax-free income amount', explanation: 'The Personal Allowance is the amount you can earn before paying income tax.' },
                { prompt: 'True or False: Payslips show your pension contributions.', options: ['True', 'False'], answer: 'True', explanation: 'Payslips detail all deductions including pension, tax, NI, and student loans.' },
                { prompt: 'What does HMRC stand for?', options: ['Her Majesty\'s Revenue and Customs', 'Home Money Revenue Collection', 'High Monthly Revenue Charge', 'House Mortgage Rate Calculator'], answer: 'Her Majesty\'s Revenue and Customs', explanation: 'HMRC is the UK government department responsible for collecting taxes.' },
                { prompt: 'What is a P60?', options: ['A tax form showing yearly earnings and tax paid', 'A pension document', 'A bank statement', 'A loan agreement'], answer: 'A tax form showing yearly earnings and tax paid', explanation: 'Your employer gives you a P60 at the end of each tax year summarizing your pay and tax.' },
                { prompt: 'When does the UK tax year end?', options: ['31 December', '5 April', '31 March', '1 January'], answer: '5 April', explanation: 'The UK tax year runs from 6 April to 5 April the following year.' },
            ]
        },
    ]
}

// ============================================
// COURSE 3: GCSE Computer Science
// ============================================
const CS_COURSE = {
    slug: 'gcse-computer-science',
    title: 'GCSE Computer Science',
    description: 'Prepare for GCSE Computer Science with topics covering computational thinking, programming concepts, and computer systems.',
    category: 'qual_prep',
    isLive: true,
    topics: [
        {
            title: 'Computational Thinking',
            description: 'Problem-solving techniques including decomposition and abstraction.',
            order: 1,
            questions: [
                { prompt: 'What is decomposition in computing?', options: ['Breaking a problem into smaller parts', 'Deleting files', 'Creating backups', 'Writing code'], answer: 'Breaking a problem into smaller parts', explanation: 'Decomposition means breaking complex problems into smaller, manageable pieces.' },
                { prompt: 'What is abstraction?', options: ['Adding more detail', 'Removing unnecessary detail to focus on essentials', 'Writing longer code', 'Creating graphics'], answer: 'Removing unnecessary detail to focus on essentials', explanation: 'Abstraction simplifies problems by hiding unnecessary complexity.' },
                { prompt: 'What is an algorithm?', options: ['A type of computer', 'A step-by-step set of instructions', 'A programming language', 'A hardware component'], answer: 'A step-by-step set of instructions', explanation: 'An algorithm is a precise sequence of steps to solve a problem.' },
                { prompt: 'True or False: Algorithms must be written in code.', options: ['True', 'False'], answer: 'False', explanation: 'Algorithms can be written as flowcharts, pseudocode, or plain language - not just code.' },
                { prompt: 'What is pattern recognition?', options: ['Finding similarities between problems', 'Recognizing faces', 'Pattern printing', 'Drawing shapes'], answer: 'Finding similarities between problems', explanation: 'Pattern recognition identifies common elements that can help solve similar problems.' },
                { prompt: 'What does pseudocode do?', options: ['Runs programs', 'Describes algorithms in plain language', 'Creates graphics', 'Tests software'], answer: 'Describes algorithms in plain language', explanation: 'Pseudocode is a simplified way to outline algorithms without strict syntax.' },
                { prompt: 'What shape represents a decision in a flowchart?', options: ['Rectangle', 'Diamond', 'Circle', 'Arrow'], answer: 'Diamond', explanation: 'Diamond shapes in flowcharts represent decisions or conditions (Yes/No questions).' },
                { prompt: 'What shape represents a process in a flowchart?', options: ['Rectangle', 'Diamond', 'Oval', 'Triangle'], answer: 'Rectangle', explanation: 'Rectangles represent processes or actions in a flowchart.' },
                { prompt: 'True or False: Computational thinking is only for programmers.', options: ['True', 'False'], answer: 'False', explanation: 'Computational thinking is a problem-solving approach useful in many fields, not just computing.' },
                { prompt: 'What is the first step in solving a computational problem?', options: ['Write code immediately', 'Understand the problem', 'Test the solution', 'Submit the answer'], answer: 'Understand the problem', explanation: 'Understanding what the problem requires is essential before attempting to solve it.' },
            ]
        },
        {
            title: 'Programming Fundamentals',
            description: 'Variables, data types, and basic programming concepts.',
            order: 2,
            questions: [
                { prompt: 'What is a variable?', options: ['A type of loop', 'A named storage location for data', 'A function', 'An error'], answer: 'A named storage location for data', explanation: 'Variables store data that can be used and changed during program execution.' },
                { prompt: 'Which is NOT a common data type?', options: ['Integer', 'String', 'Boolean', 'Paragraph'], answer: 'Paragraph', explanation: 'Common data types include Integer (whole numbers), String (text), and Boolean (true/false).' },
                { prompt: 'What does a Boolean variable store?', options: ['Numbers only', 'Text only', 'True or False values', 'Decimal numbers'], answer: 'True or False values', explanation: 'Booleans can only store one of two values: True or False.' },
                { prompt: 'What is an integer?', options: ['A decimal number', 'A whole number', 'A word', 'A True/False value'], answer: 'A whole number', explanation: 'Integers are whole numbers without decimal points (e.g., 1, 42, -7).' },
                { prompt: 'What is a string?', options: ['A number', 'A sequence of characters/text', 'A True/False value', 'A calculation'], answer: 'A sequence of characters/text', explanation: 'Strings store text, like names, sentences, or any characters in quotes.' },
                { prompt: 'True or False: Variables can change their value during a program.', options: ['True', 'False'], answer: 'True', explanation: 'Variables can be updated with new values as the program runs.' },
                { prompt: 'What is concatenation?', options: ['Subtracting numbers', 'Joining strings together', 'Dividing values', 'Deleting data'], answer: 'Joining strings together', explanation: 'Concatenation combines two or more strings into one (e.g., "Hello" + "World").' },
                { prompt: 'What operator is used for multiplication in most languages?', options: ['x', '*', 'X', 'times'], answer: '*', explanation: 'The asterisk (*) is the standard multiplication operator in programming.' },
                { prompt: 'What is the assignment operator in most languages?', options: ['==', '=', '!=', '+'], answer: '=', explanation: 'The single equals sign (=) assigns a value to a variable.' },
                { prompt: 'What does == usually mean?', options: ['Assignment', 'Equal to (comparison)', 'Not equal', 'Greater than'], answer: 'Equal to (comparison)', explanation: 'Double equals (==) compares two values to check if they are equal.' },
            ]
        },
        {
            title: 'Selection and Iteration',
            description: 'If statements, loops, and controlling program flow.',
            order: 3,
            questions: [
                { prompt: 'What is selection in programming?', options: ['Choosing random code', 'Making decisions with IF statements', 'Selecting files', 'Copying code'], answer: 'Making decisions with IF statements', explanation: 'Selection allows programs to take different paths based on conditions.' },
                { prompt: 'What is iteration?', options: ['Repeating code in a loop', 'Stopping a program', 'Writing comments', 'Declaring variables'], answer: 'Repeating code in a loop', explanation: 'Iteration means repeating a section of code multiple times using loops.' },
                { prompt: 'Which loop runs a set number of times?', options: ['WHILE loop', 'FOR loop', 'IF statement', 'REPEAT loop'], answer: 'FOR loop', explanation: 'FOR loops run for a specific number of iterations defined in advance.' },
                { prompt: 'Which loop continues until a condition is false?', options: ['FOR loop', 'WHILE loop', 'SELECT loop', 'REPEAT loop'], answer: 'WHILE loop', explanation: 'WHILE loops keep running as long as a condition remains true.' },
                { prompt: 'True or False: IF statements can have an ELSE clause.', options: ['True', 'False'], answer: 'True', explanation: 'ELSE provides an alternative path when the IF condition is false.' },
                { prompt: 'What does ELIF (or ELSE IF) do?', options: ['Ends the program', 'Checks another condition', 'Creates a loop', 'Prints output'], answer: 'Checks another condition', explanation: 'ELIF allows checking multiple conditions in sequence.' },
                { prompt: 'What is an infinite loop?', options: ['A fast loop', 'A loop that never ends', 'A loop that runs once', 'A debugging tool'], answer: 'A loop that never ends', explanation: 'Infinite loops occur when the exit condition is never met, causing the program to run forever.' },
                { prompt: 'What is a nested loop?', options: ['A loop inside another loop', 'A broken loop', 'A fast loop', 'A debugging technique'], answer: 'A loop inside another loop', explanation: 'Nested loops are loops placed inside other loops for complex iterations.' },
                { prompt: 'What AND operator returns true?', options: ['Both conditions are true', 'One condition is true', 'Both conditions are false', 'No conditions needed'], answer: 'Both conditions are true', explanation: 'AND requires both conditions to be true for the overall result to be true.' },
                { prompt: 'What OR operator returns true?', options: ['Both conditions must be true', 'At least one condition is true', 'Neither condition is true', 'No conditions needed'], answer: 'At least one condition is true', explanation: 'OR returns true if at least one of the conditions is true.' },
            ]
        },
        {
            title: 'Computer Systems',
            description: 'Hardware, software, and how computers work.',
            order: 4,
            questions: [
                { prompt: 'What is hardware?', options: ['Programs and apps', 'Physical computer components', 'The internet', 'Data files'], answer: 'Physical computer components', explanation: 'Hardware refers to the physical parts of a computer you can touch.' },
                { prompt: 'What is software?', options: ['The monitor screen', 'Programs and applications', 'The keyboard', 'The mouse'], answer: 'Programs and applications', explanation: 'Software is the programs and operating systems that run on hardware.' },
                { prompt: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Power Unit', 'Central Program Utility', 'Core Processing Unit'], answer: 'Central Processing Unit', explanation: 'The CPU is the "brain" of the computer that processes instructions.' },
                { prompt: 'What is RAM?', options: ['Permanent storage', 'Temporary memory for running programs', 'A type of hard drive', 'A monitor'], answer: 'Temporary memory for running programs', explanation: 'RAM (Random Access Memory) temporarily stores data the CPU needs quickly.' },
                { prompt: 'True or False: RAM loses its data when the computer is turned off.', options: ['True', 'False'], answer: 'True', explanation: 'RAM is volatile memory - it requires power to retain data.' },
                { prompt: 'What is secondary storage?', options: ['RAM', 'Permanent storage like HDD or SSD', 'The CPU', 'The monitor'], answer: 'Permanent storage like HDD or SSD', explanation: 'Secondary storage permanently saves files even when the computer is off.' },
                { prompt: 'What is an operating system?', options: ['A spreadsheet program', 'Software that manages computer resources', 'A type of keyboard', 'An internet browser'], answer: 'Software that manages computer resources', explanation: 'Operating systems (like Windows or macOS) manage hardware and run applications.' },
                { prompt: 'What is binary?', options: ['A number system using only 0 and 1', 'A type of software', 'A programming language', 'A computer brand'], answer: 'A number system using only 0 and 1', explanation: 'Binary is the base-2 number system computers use to represent all data.' },
                { prompt: 'How many bits are in a byte?', options: ['4', '8', '16', '32'], answer: '8', explanation: 'A byte consists of 8 bits.' },
                { prompt: 'What is an input device?', options: ['Sends data to the computer', 'Receives data from the computer', 'Stores data', 'Processes data'], answer: 'Sends data to the computer', explanation: 'Input devices like keyboards and mice send data to the computer.' },
            ]
        },
        {
            title: 'Networks and Security',
            description: 'How networks work and keeping systems secure.',
            order: 5,
            questions: [
                { prompt: 'What is a network?', options: ['A single computer', 'Two or more connected computers', 'A type of software', 'A storage device'], answer: 'Two or more connected computers', explanation: 'Networks allow computers to share data and resources.' },
                { prompt: 'What does LAN stand for?', options: ['Large Area Network', 'Local Area Network', 'Long Access Network', 'Limited Area Network'], answer: 'Local Area Network', explanation: 'A LAN connects devices in a small area like a home or office.' },
                { prompt: 'What does WAN stand for?', options: ['Wide Area Network', 'Wireless Area Network', 'World Area Network', 'Web Access Network'], answer: 'Wide Area Network', explanation: 'A WAN connects devices over large geographic distances.' },
                { prompt: 'What is the Internet?', options: ['A LAN', 'A global WAN connecting millions of networks', 'A software program', 'A computer brand'], answer: 'A global WAN connecting millions of networks', explanation: 'The Internet is the largest WAN, connecting networks worldwide.' },
                { prompt: 'True or False: A router connects networks together.', options: ['True', 'False'], answer: 'True', explanation: 'Routers direct network traffic between different networks.' },
                { prompt: 'What is malware?', options: ['Helpful software', 'Malicious software designed to harm', 'A type of hardware', 'An operating system'], answer: 'Malicious software designed to harm', explanation: 'Malware includes viruses, trojans, and ransomware that damage systems.' },
                { prompt: 'What is phishing?', options: ['A type of fishing game', 'Tricking people into revealing personal info', 'A virus type', 'A network cable'], answer: 'Tricking people into revealing personal info', explanation: 'Phishing uses fake emails or websites to steal passwords and data.' },
                { prompt: 'What does a firewall do?', options: ['Heats the computer', 'Blocks unauthorized network access', 'Stores data', 'Speeds up the internet'], answer: 'Blocks unauthorized network access', explanation: 'Firewalls filter network traffic to protect against unauthorized access.' },
                { prompt: 'What is encryption?', options: ['Deleting files', 'Converting data into a secret code', 'Compressing files', 'Printing documents'], answer: 'Converting data into a secret code', explanation: 'Encryption scrambles data so only authorized parties can read it.' },
                { prompt: 'True or False: Strong passwords should mix letters, numbers, and symbols.', options: ['True', 'False'], answer: 'True', explanation: 'Mixing character types creates stronger passwords that are harder to crack.' },
            ]
        },
    ]
}

// ============================================
// MAIN FUNCTION
// ============================================
async function main() {
    console.log('🚀 Creating 3 new courses...\n')

    // Get UK Levels
    const entryLevel = await prisma.ukLevel.findFirst({
        where: { OR: [{ code: 'EL3' }, { code: 'E3' }] }
    })
    const level2 = await prisma.ukLevel.findFirst({
        where: { OR: [{ code: 'L2' }, { code: '2' }] }
    })
    if (!entryLevel) throw new Error('Entry Level 3 not found')

    // Get framework
    const framework = await prisma.framework.findFirst()
    if (!framework) throw new Error('No framework found')

    console.log(`📚 Using levels: ${entryLevel.title}, ${level2?.title || 'default'}`)
    console.log(`🎯 Using framework: ${framework.title}\n`)

    const courses = [
        { data: OFFICE_COURSE, level: entryLevel },
        { data: FINANCE_COURSE, level: entryLevel },
        { data: CS_COURSE, level: level2 || entryLevel },
    ]

    for (const { data: courseData, level } of courses) {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        console.log(`📘 Creating: ${courseData.title}`)

        // Delete if exists
        const existing = await prisma.track.findUnique({ where: { slug: courseData.slug } })
        if (existing) {
            console.log(`   ⚠️  Deleting existing course...`)
            await prisma.track.delete({ where: { slug: courseData.slug } })
        }

        // Create track
        const { topics, ...trackData } = courseData
        const track = await prisma.track.create({
            data: {
                ...trackData,
                trackFrameworks: {
                    create: { frameworkId: framework.id }
                }
            }
        })
        console.log(`   ✅ Created track`)

        // Create topics and questions
        let totalQuestions = 0
        for (const topicData of topics) {
            const topic = await prisma.topic.create({
                data: {
                    trackId: track.id,
                    title: topicData.title,
                    description: topicData.description,
                    sortOrder: topicData.order,
                    ukLevelId: level.id,
                }
            })

            for (const q of topicData.questions) {
                await prisma.question.create({
                    data: {
                        topicId: topic.id,
                        ukLevelId: level.id,
                        type: q.options.length === 2 ? 'true_false' : 'mcq',
                        prompt: q.prompt,
                        options: JSON.stringify(q.options),
                        answer: JSON.stringify(q.answer),
                        explanation: q.explanation,
                        difficulty: 2,
                        isPublished: true,
                    }
                })
                totalQuestions++
            }
            console.log(`   📖 ${topicData.title}: ${topicData.questions.length} questions`)
        }
        console.log(`   📊 Total: ${topics.length} topics, ${totalQuestions} questions\n`)
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`🎉 Successfully created all 3 courses!`)
    console.log(`\n👉 View them at:`)
    console.log(`   http://localhost:5173/track/microsoft-office-essentials`)
    console.log(`   http://localhost:5173/track/financial-literacy`)
    console.log(`   http://localhost:5173/track/gcse-computer-science`)
}

main()
    .catch(e => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
