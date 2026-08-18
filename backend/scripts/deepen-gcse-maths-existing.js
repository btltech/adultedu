#!/usr/bin/env node

/** Replace the three older GCSE Maths lessons with deeper, accessible versions. */

import prisma from '../src/lib/db.js'

const lessons = {
  'lesson-gcse-1-1': {
    title: 'Working with Fractions',
    summary: 'Build reliable fraction fluency by representing, simplifying, adding, subtracting, multiplying, dividing, and checking fractions in context.',
    blocks: [
      { type: 'heading', content: 'Understand the whole and the parts' },
      { type: 'paragraph', content: 'A fraction represents a number of equal parts of a whole. The denominator names the size of each part and the numerator counts those parts. Equivalent fractions have the same value: 1/2 = 2/4 = 4/8. Multiplying or dividing the numerator and denominator by the same non-zero number keeps the value unchanged. Simplify 18/24 by dividing both parts by their highest common factor, 6, to get 3/4. Before calculating, estimate the size: 3/5 is a little more than one half, so an answer such as 3/50 would be suspicious.' },
      { type: 'subheading', content: 'Add and subtract with a common denominator' },
      { type: 'paragraph', content: 'To add or subtract, partition both fractions into the same-sized parts. For 1/3 + 1/4, the least common denominator is 12: 1/3 = 4/12 and 1/4 = 3/12, so the answer is 7/12. With mixed numbers, convert first or work with whole and fractional parts carefully. For 2 1/3 - 1 5/6, convert to 7/3 - 11/6 = 14/6 - 11/6 = 3/6 = 1/2. Never add denominators; the denominator describes the part size, not a quantity being counted.' },
      { type: 'code', content: '1/3 + 1/4\ncommon denominator 12\n4/12 + 3/12 = 7/12\n\n2 1/3 - 1 5/6\n7/3 - 11/6 = 14/6 - 11/6 = 1/2' },
      { type: 'subheading', content: 'Multiply, divide, and check' },
      { type: 'paragraph', content: 'For multiplication, multiply numerators and denominators, cancelling common factors before multiplying when that makes the arithmetic easier: 2/3 × 9/10 = 3/5. To divide by a fraction, multiply by its reciprocal: 2/3 ÷ 4/5 = 2/3 × 5/4 = 5/6. A reciprocal is the number that gives 1 when multiplied by the original. Check a result by converting it to a decimal or by using the inverse operation. In a recipe, a fraction of a quantity must keep the same unit, and an answer greater than the starting quantity should have a clear reason.' },
      { type: 'code', content: '2/3 × 9/10 = (2×9)/(3×10) = 18/30 = 3/5\n\n2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6' },
      { type: 'callout', variant: 'tip', content: 'Cancellation is safe across factors in a multiplication, not across terms joined by + or −.' },
      { type: 'writing_activity', title: 'Explain a fraction choice', prompt: 'Solve one addition and one division of fractions. Explain why you chose a common denominator for the first and a reciprocal for the second, then check both answers.', wordGuide: 'Write 100–140 words or a clearly labelled chain of calculations.', checklist: ['I simplified equivalent fractions correctly.', 'I kept units and denominators meaningful.', 'I checked both results using an inverse or estimate.'] },
    ],
  },
  'lesson-gcse-2-1': {
    title: 'Solving Linear Equations',
    summary: 'Use a balance model and inverse operations to solve, check, and explain linear equations, including brackets and variables on both sides.',
    blocks: [
      { type: 'heading', content: 'Equations are balanced statements' },
      { type: 'paragraph', content: 'An equation says that two expressions have the same value. Solving it means finding every value of the unknown that keeps the statement true. Think of a balance: whatever operation you perform on one side must also be performed on the other. For x + 5 = 12, subtract 5 from both sides to get x = 7. Check by substituting 7 into the original equation: 7 + 5 = 12. This check is quick and catches sign or arithmetic errors.' },
      { type: 'code', content: 'x + 5 = 12\nsubtract 5 from both sides\nx = 7\ncheck: 7 + 5 = 12' },
      { type: 'subheading', content: 'Undo operations in reverse order' },
      { type: 'paragraph', content: 'For 3x + 7 = 22, remove the addition first and the multiplication second: 3x = 15, then x = 5. If there are brackets, expand them before collecting terms: 2(x + 4) = 14 becomes 2x + 8 = 14, then 2x = 6 and x = 3. Keep one transformation per line. If a fraction coefficient appears, multiply every term by the denominator before solving. Do not divide only one term; that changes the equation.' },
      { type: 'code', content: '3x + 7 = 22\n3x = 15\nx = 5\n\n2(x + 4) = 14\n2x + 8 = 14\n2x = 6\nx = 3' },
      { type: 'subheading', content: 'Variables on both sides and a deliberate check' },
      { type: 'paragraph', content: 'Move variable terms to one side and constants to the other. For 5x - 3 = 2x + 9, subtract 2x to get 3x - 3 = 9, add 3 to get 3x = 12, and divide to get x = 4. Substitute into both original sides: 5(4) - 3 = 17 and 2(4) + 9 = 17. Some equations have no solution or infinitely many solutions when the variable terms cancel; describe what the final statement means instead of forcing a number. Show the check in the original equation, not a simplified line.' },
      { type: 'callout', variant: 'tip', content: 'A solution is a value that makes the original equation true. Always substitute it back before moving on.' },
      { type: 'writing_activity', title: 'Annotate a balanced solution', prompt: 'Solve one two-step equation and one equation with a bracket. Annotate each line with the operation used and finish by substituting the answer into the original equation.', wordGuide: 'Write 100–140 words or a clearly labelled solution.', checklist: ['I performed the same operation on both sides.', 'I expanded brackets accurately.', 'I checked in the original equation.'] },
    ],
  },
  'lesson-gcse-4-1': {
    title: 'Angles in Triangles and Polygons',
    summary: 'Build a dependable angle toolkit for triangles, quadrilaterals, regular polygons, and parallel lines, with reasons shown at every step.',
    blocks: [
      { type: 'heading', content: 'Angle facts are reusable tools' },
      { type: 'paragraph', content: 'Angles on a straight line add to 180°, angles around a point add to 360°, and vertically opposite angles are equal. These facts let you calculate an unknown angle without measuring a drawing. Write the reason beside each step. In a triangle, the interior angles total 180°. If two angles are 50° and 70°, the third is 180° − 50° − 70° = 60°. An isosceles triangle has equal base angles, while an equilateral triangle has three angles of 60°.' },
      { type: 'code', content: 'triangle: a + b + c = 180°\na = 50°, b = 70°\nc = 180° − 50° − 70° = 60°' },
      { type: 'subheading', content: 'Quadrilaterals and polygons' },
      { type: 'paragraph', content: 'A quadrilateral can be split into two triangles, so its interior angles total 360°. More generally, an n-sided polygon can be split into n − 2 triangles, giving an interior-angle sum of (n − 2) × 180°. A regular polygon has equal interior angles, so divide the sum by n. A regular pentagon has (5 − 2) × 180° = 540° in total and each angle is 108°. Exterior angles of any regular polygon sum to 360°, so each exterior angle is 360° ÷ n.' },
      { type: 'code', content: 'regular pentagon\ninterior sum = (5 − 2) × 180° = 540°\neach interior angle = 540° ÷ 5 = 108°\neach exterior angle = 360° ÷ 5 = 72°' },
      { type: 'subheading', content: 'Parallel lines and clear reasons' },
      { type: 'paragraph', content: 'When a transversal crosses parallel lines, corresponding angles are equal, alternate angles are equal, and co-interior angles add to 180°. Start by marking the angle relationship, then use triangle or polygon facts. Do not rely on the picture appearing to be to scale. If a diagram is not available, describe the positions in words: a line crosses two parallel lines, and one acute angle is 64°. The matching corresponding angle is 64° and the adjacent straight-line angle is 116°. Include the word ‘because’ in a proof so the route from a known angle to the result is visible.' },
      { type: 'callout', variant: 'tip', content: 'A diagram suggests relationships; the stated angle facts prove them.' },
      { type: 'writing_activity', title: 'Write an angle proof', prompt: 'Solve a polygon or parallel-line angle problem. List each known fact, calculate the unknown angle, and write a reason for every line.', wordGuide: 'Write 100–140 words with a labelled calculation.', checklist: ['I used the correct total for the shape.', 'I named the angle relationship.', 'I did not measure or assume the diagram was to scale.'] },
    ],
  },
  'lesson-gcse-3-1': {
    title: 'Working with Ratios',
    summary: 'Use equivalent ratios, sharing, scale, and unit rates to solve practical problems and explain whether a relationship is proportional.',
    blocks: [
      { type: 'heading', content: 'Represent and simplify ratios' },
      { type: 'paragraph', content: 'A ratio compares quantities in the same units and order. A recipe using 2 cups of flour and 3 cups of water has flour:water ratio 2:3. Multiplying or dividing both parts by the same non-zero number gives an equivalent ratio, so 10:15 simplifies to 2:3. Always identify what each part refers to; reversing the order changes the meaning. If a total is known, add the ratio parts first. In a 2:3 mixture with 25 units altogether, one part is 25 ÷ 5 = 5, so the amounts are 10 and 15.' },
      { type: 'code', content: 'ratio 2:3\ntotal parts = 2 + 3 = 5\none part = 25 ÷ 5 = 5\namounts = 2×5 and 3×5 = 10 and 15' },
      { type: 'subheading', content: 'Share in a given ratio' },
      { type: 'paragraph', content: 'To share £84 in the ratio 3:4, divide by 7 parts to get £12 per part, then give £36 and £48. Check that the two shares add to £84 and that their ratio simplifies to 3:4. If a question gives one share, use the corresponding multiplier rather than adding the parts again. Keep units consistent before setting up the parts model.' },
      { type: 'subheading', content: 'Scale drawings and rates' },
      { type: 'paragraph', content: 'A scale factor multiplies every length by the same amount. A map scale of 1:50,000 means 1 cm represents 50,000 cm, which is 0.5 km. Convert before comparing. A unit rate gives the amount for one unit: 450 g for 6 servings is 75 g per serving, so 10 servings need 750 g. A fixed delivery fee means total cost is not directly proportional to quantity because the graph would not start at zero.' },
      { type: 'subheading', content: 'Direct and inverse proportion' },
      { type: 'paragraph', content: 'In direct proportion, y = kx and the ratio y/x is constant. If 4 tickets cost £30, 10 tickets cost £75 at the same rate. In inverse proportion, xy is constant: doubling the speed halves the time for a fixed distance. Ask what happens when one quantity doubles before choosing the model. Estimate first and include units in the final answer.' },
      { type: 'callout', variant: 'tip', content: 'Write what each ratio part represents before calculating; this prevents reversing the comparison.' },
      { type: 'writing_activity', title: 'Explain a ratio model', prompt: 'Solve one sharing problem and one unit-rate problem. Explain how you checked the ratio, total, and units, and state whether either relationship is directly proportional.', wordGuide: 'Write 100–140 words with calculations shown.', checklist: ['I kept the ratio order clear.', 'I divided into parts before sharing.', 'I checked the total and units.'] },
    ],
  },
  'lesson-gcse-5-1': {
    title: 'Averages: Mean, Median, Mode',
    summary: 'Calculate and compare mean, median, mode, and range, and choose a sensible summary when data contains outliers or is skewed.',
    blocks: [
      { type: 'heading', content: 'Calculate the main summaries' },
      { type: 'paragraph', content: 'Order the data before finding the median. For 4, 5, 7, 8, 16, the mean is 40 ÷ 5 = 8, the median is 7, the mode does not exist, and the range is 16 − 4 = 12. The mean uses every value but is pulled towards an extreme value. With an even number of values, average the two middle values. The mode is useful when the most common category matters, but a set can have two modes or none.' },
      { type: 'code', content: '4, 5, 7, 8, 16\nmean = 40 ÷ 5 = 8\nmedian = 7\nrange = 16 − 4 = 12' },
      { type: 'subheading', content: 'Choose a representative average' },
      { type: 'paragraph', content: 'Use the mean for fairly balanced numerical data when every value should contribute. Use the median for skewed data such as house prices or waiting times because it is less affected by outliers. Use the mode for a most-common choice such as shoe size. State your choice rather than presenting an average as automatically meaningful. Compare spread as well as centre: two groups can share a mean but have very different ranges.' },
      { type: 'subheading', content: 'How changes affect summaries' },
      { type: 'paragraph', content: 'Adding 3 to every data value adds 3 to the mean, median, and mode but leaves the range unchanged. Multiplying every value by 2 doubles all four measures. If one value is corrected, update the total before recomputing the mean. A mean of 12 for 5 values means the total is 60; if four values total 46, the missing value is 14. This reverse check is often quicker than starting again.' },
      { type: 'subheading', content: 'Grouped or incomplete data' },
      { type: 'paragraph', content: 'For a frequency table, multiply each value by its frequency, add the products, and divide by the total frequency. For grouped data, a midpoint gives an estimate rather than an exact mean. Say that it is estimated and consider the class widths. Never infer a median from an unordered list, and do not use a numerical average for categories such as colours.' },
      { type: 'callout', variant: 'tip', content: 'A centre without a measure of spread can hide important differences between datasets.' },
      { type: 'writing_activity', title: 'Compare two datasets', prompt: 'Create or use two small datasets. Calculate mean, median, mode where possible, and range, then explain which summary is most representative and why.', wordGuide: 'Write 100–140 words with calculations shown.', checklist: ['I ordered data before finding the median.', 'I calculated the total and frequency correctly.', 'I mentioned spread or an outlier in my conclusion.'] },
    ],
  },
  '57caa246-f759-4eb1-98bc-28e8880babc3': {
    title: 'Understanding Probability: Events and Diagrams',
    summary: 'Represent single and combined events with sample spaces, complements, and tree diagrams, while checking independence and dependence.',
    blocks: [
      { type: 'heading', content: 'Probability describes uncertainty' },
      { type: 'paragraph', content: 'Probability ranges from 0, impossible, to 1, certain. For equally likely outcomes, probability is favourable outcomes divided by total outcomes. A fair die gives P(even) = 3/6 = 1/2. The complement of an event is that it does not happen, so P(not A) = 1 − P(A). List a sample space when there are only a few outcomes and check that all outcomes are included once.' },
      { type: 'subheading', content: 'Add or multiply for combined events' },
      { type: 'paragraph', content: 'Add probabilities for mutually exclusive alternatives: P(1 or 6) = 1/6 + 1/6 = 1/3. Multiply probabilities for independent stages: two fair heads have probability 1/2 × 1/2 = 1/4. Events are independent when the first result does not change the second probability. Ask whether the outcomes can happen together before adding; overlapping events need the intersection removed once.' },
      { type: 'subheading', content: 'Tree diagrams show changing information' },
      { type: 'paragraph', content: 'Draw one branch for each outcome at every stage, label every branch, multiply along a path, and add paths that answer the question. A bag with 3 red and 2 blue counters gives P(red then blue) = 3/5 × 2/4 = 3/10 without replacement. The second denominator changes because one counter has gone. Branches from each point must add to 1.' },
      { type: 'code', content: 'without replacement\nred then blue = 3/5 × 2/4 = 6/20 = 3/10\nblue then red = 2/5 × 3/4 = 6/20 = 3/10\neither path is the same event; add only when asked for either order' },
      { type: 'subheading', content: 'Check the model' },
      { type: 'paragraph', content: 'Use a complement when it is shorter, such as P(at least one six in two rolls) = 1 − P(no six) = 1 − (5/6 × 5/6) = 11/36. Keep fractions exact until the final rounding, and state whether replacement, fairness, or independence is assumed. A probability larger than 1 or a negative probability signals an error.' },
      { type: 'writing_activity', title: 'Build a probability tree', prompt: 'Describe a two-stage experiment, draw or label its tree, calculate one path and one combined event, and explain whether the stages are independent.', wordGuide: 'Write 100–140 words with probabilities shown.', checklist: ['I labelled every branch.', 'I multiplied along paths and added only suitable paths.', 'I checked that branches from each point total 1.'] },
    ],
  },
  '7543930a-87dd-4297-872a-5462035e674f': {
    title: 'Understanding Statistics: Averages, Charts and Data Handling',
    summary: 'Read and question statistical summaries, charts, samples, and correlations so conclusions are calculated, cautious, and properly supported.',
    blocks: [
      { type: 'heading', content: 'Describe data before interpreting it' },
      { type: 'paragraph', content: 'Statistics turns observations into summaries that can be compared. Start by identifying the population, variable, units, and time period. The mean, median, mode, and range describe different features; a chart adds a visual comparison. A bar chart suits separate categories, a line graph suits change over time, and a pie chart shows parts of a whole. Check labels and scales before making a claim.' },
      { type: 'subheading', content: 'Averages and spread' },
      { type: 'paragraph', content: 'For 4, 5, 7, 8, 16, the mean is 8, median 7, and range 12. The outlier 16 pulls the mean upward, so the median may better describe a typical value. If every value increases by 3, the centre increases by 3 but the range does not. State whether a mean from grouped data is estimated from class midpoints.' },
      { type: 'subheading', content: 'Read charts critically' },
      { type: 'paragraph', content: 'A graph can mislead through a truncated vertical axis, unequal intervals, missing units, or a decorative area that exaggerates a difference. Read exact values from the scale, not from the visual height alone. In a pie chart, convert a sector angle to a fraction of 360°; a 90° sector represents one quarter. Compare like with like and mention uncertainty when values are estimates.' },
      { type: 'subheading', content: 'Samples and scatter graphs' },
      { type: 'paragraph', content: 'A sample should represent the population. Random and systematic methods can reduce selection bias, while a convenience sample may miss important groups. A scatter graph shows direction, strength, and outliers in a relationship. Positive correlation does not prove causation: two variables can rise together because a third factor affects both. Use ‘associated with’ unless a suitable experiment supports a causal claim.' },
      { type: 'callout', variant: 'warning', content: 'A precise-looking percentage is not automatically reliable; ask how the sample and measurement were produced.' },
      { type: 'writing_activity', title: 'Write a cautious data conclusion', prompt: 'Describe a small chart or sample, calculate one summary, and write a conclusion that names a limitation, scale issue, or possible bias.', wordGuide: 'Write 100–140 words with one calculation.', checklist: ['I identified the data and units.', 'I checked the scale or sample method.', 'I separated association from causation.'] },
    ],
  },
  '1855c642-35f9-4c29-a2b4-f6d4602db6fc': {
    title: 'Understanding Graphs in GCSE Maths',
    summary: 'Interpret linear, quadratic, and real-life graphs using gradients, intercepts, turning points, and sensible domain restrictions.',
    blocks: [
      { type: 'heading', content: 'Read coordinates and scales' },
      { type: 'paragraph', content: 'A coordinate is written (x, y), with x first and y second. Check the scale on both axes before reading a point. A table of values can be plotted by pairing each x with its y. Join points only when the relationship is continuous; separate categories should not be joined as a line. Always state the units and the interval shown before interpreting a graph.' },
      { type: 'subheading', content: 'Linear graphs and gradient' },
      { type: 'paragraph', content: 'A straight-line equation is y = mx + c. The gradient m is change in y divided by change in x, and c is the y-intercept. Points (2, 5) and (6, 13) give gradient (13 − 5)/(6 − 2) = 2; substituting gives c = 1, so y = 2x + 1. In a distance-time graph, gradient represents speed, while a flat section represents no change in distance.' },
      { type: 'code', content: 'points (2,5), (6,13)\ngradient = 8/4 = 2\n5 = 2×2 + c, so c = 1\nequation: y = 2x + 1' },
      { type: 'subheading', content: 'Quadratics and turning points' },
      { type: 'paragraph', content: 'A quadratic y = ax² + bx + c forms a parabola. If a is positive it has a minimum; if a is negative it has a maximum. Roots are where y = 0. For y = x² − 4x + 3, factorising gives (x − 1)(x − 3), so the roots are 1 and 3. The line of symmetry is halfway between them at x = 2, and substituting gives the vertex (2, −1). Reject values outside a realistic domain such as negative time.' },
      { type: 'subheading', content: 'Transform and interpret real-life graphs' },
      { type: 'paragraph', content: 'Adding outside a function moves a graph vertically: f(x) + 3 moves up 3. Changing inside reverses the direction: f(x − 4) moves right 4. Use a coordinate table to verify a transformation. In real-life graphs, explain what intercepts, slopes, plateaus, and turning points mean in context rather than merely naming them. A model is useful only over the interval where its assumptions make sense.' },
      { type: 'writing_activity', title: 'Tell the story of a graph', prompt: 'Choose a linear, quadratic, or real-life graph. Calculate one feature and explain what it means, including any domain restriction or limitation.', wordGuide: 'Write 100–140 words with a coordinate or gradient calculation.', checklist: ['I read both axis scales correctly.', 'I calculated a feature rather than guessing.', 'I explained the result in context.'] },
    ],
  },
}

const apply = process.argv.includes('--apply')

for (const [id, lesson] of Object.entries(lessons)) {
  const current = await prisma.lesson.findUnique({ where: { id }, select: { id: true, version: true, isPublished: true } })
  if (!current) throw new Error(`Lesson not found: ${id}`)
  const data = { title: lesson.title, summary: lesson.summary, contentBlocks: JSON.stringify(lesson.blocks), version: current.version + 1 }
  if (apply) {
    await prisma.lesson.update({ where: { id }, data })
  }
  console.log(JSON.stringify({ id, fromVersion: current.version, toVersion: data.version, blocks: lesson.blocks.length, applied: apply }))
}

await prisma.$disconnect()
