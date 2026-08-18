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
