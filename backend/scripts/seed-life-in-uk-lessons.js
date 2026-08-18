#!/usr/bin/env node

/**
 * Create the five Life in the UK lesson pages with original, stable-fact prose.
 * The handbook remains the definitive test source; this script does not quote it.
 */

import prisma from '../src/lib/db.js'

const handbookNote = {
  type: 'callout',
  variant: 'info',
  content: 'Source note: The official Life in the UK handbook is the definitive study source for the test. Public guidance is at https://www.gov.uk/life-in-the-uk-test and Parliament information is at https://www.parliament.uk/about/how/publications1/how-the-uk-parliament-works/. This lesson uses original explanatory prose and is not an official test resource.',
}

const lessons = [
  {
    id: 'life-uk-lesson-values',
    topicId: 'life-uk-values',
    title: 'The Values and Principles of the UK',
    summary: 'Understand democracy, the rule of law, individual liberty, and mutual respect and tolerance through everyday examples and decisions.',
    blocks: [
      { type: 'heading', content: 'What shared values do' },
      { type: 'paragraph', content: 'Values are principles that help people decide how a society should work. They do not make everyone identical. They provide a common basis for disagreement, participation, and peaceful change. In the UK, the ideas of democracy, the rule of law, individual liberty, and mutual respect and tolerance are commonly used to describe important civic principles. A value becomes meaningful when it changes how an institution behaves: a public body should give people a fair way to challenge a decision, and a person should be able to express a view without threatening another person’s safety.' },
      { type: 'subheading', content: 'Democracy and participation' },
      { type: 'paragraph', content: 'Democracy means that people have a way to influence public decisions, usually through elections and representatives. It also includes scrutiny, open debate, and the ability to organise peacefully. Voting is important, but it is not the only form of participation. People can contact representatives, respond to consultations, join community groups, attend meetings, or stand for election. A democratic decision can still disappoint some people; the principle is that decisions should be made through fair processes and remain open to lawful challenge.' },
      { type: 'subheading', content: 'The rule of law' },
      { type: 'paragraph', content: 'The rule of law means that people and public authorities are subject to publicly made law. Laws should be understandable and applied fairly, and disputes should be settled through proper legal processes rather than personal power. It also means that officials should act within the powers given to them. In an everyday example, a council cannot simply impose a penalty with no legal basis or appeal route. A court applies the law; it does not replace the role of Parliament by inventing a new law for a single case.' },
      { type: 'subheading', content: 'Liberty, respect, and responsibility' },
      { type: 'paragraph', content: 'Individual liberty protects people’s ability to make lawful choices about their lives, beliefs, and expression. Liberty is not permission to harm or intimidate others. Mutual respect means recognising that other people have equal dignity, while tolerance means living peacefully with people whose beliefs or customs differ from your own. Rights work alongside responsibilities: a person can criticise a policy, but should not threaten a neighbour; a group can practise its faith, but must obey the law that protects everyone.' },
      { type: 'writing_activity', title: 'Apply a civic principle', prompt: 'Choose one scenario: a peaceful protest, a disputed council decision, or a disagreement between neighbours. Explain which value is involved, what a fair process would look like, and what responsibility each person has.', wordGuide: 'Write 120–160 words.', checklist: ['I named the relevant value.', 'I separated a lawful choice from harm or intimidation.', 'I described a fair process rather than assuming my preferred result.'] },
      handbookNote,
    ],
  },
  {
    id: 'life-uk-lesson-geography',
    topicId: 'life-uk-geography',
    title: 'What Is the UK?',
    summary: 'Distinguish the United Kingdom, Great Britain, and Ireland, and locate the four countries and their capitals without relying on confusing shorthand.',
    blocks: [
      { type: 'heading', content: 'The names describe different places' },
      { type: 'paragraph', content: 'The United Kingdom, usually shortened to the UK, is made up of England, Scotland, Wales, and Northern Ireland. Great Britain is the large island containing England, Scotland, and Wales; it does not include Northern Ireland. The island of Ireland contains Northern Ireland and the independent Republic of Ireland. These terms are not interchangeable. Saying “Great Britain” when you mean the UK leaves out Northern Ireland, while saying “Ireland” can mean the island or the Republic depending on the context.' },
      { type: 'subheading', content: 'Countries and capitals' },
      { type: 'paragraph', content: 'The capital cities are London for England and the UK, Edinburgh for Scotland, Cardiff for Wales, and Belfast for Northern Ireland. A capital is a centre of government, but it is not the same thing as a country or a constituent nation. Scotland, Wales, and Northern Ireland have their own national identities and devolved institutions, while the UK Parliament and UK Government also have responsibilities. Always read a question carefully to see whether it asks about the UK as a whole or one of its countries.' },
      { type: 'subheading', content: 'Islands, regions, and weather' },
      { type: 'paragraph', content: 'The UK includes many islands as well as the main island of Great Britain and part of the island of Ireland. Geography affects transport, work, farming, and local culture, but it does not determine a person’s identity. The climate is generally temperate and changeable, with regional differences caused by latitude, altitude, and proximity to the sea. Avoid memorising a single “typical” weather story as if it applied equally everywhere.' },
      { type: 'subheading', content: 'A reliable naming check' },
      { type: 'paragraph', content: 'When you see a place name, ask three questions: is it a country, an island, or a city? Is it part of the UK, Great Britain, or the Republic of Ireland? Is the question asking for a capital, a nation, or a region? For example, Belfast is a city and the capital of Northern Ireland; Northern Ireland is part of the UK but not part of Great Britain. This three-question check prevents the most common geography mix-ups.' },
      { type: 'writing_activity', title: 'Correct the map language', prompt: 'Write a short explanation correcting someone who says “Great Britain has four countries” or “Northern Ireland is part of Great Britain”. Include the relevant countries, island, and capital.', wordGuide: 'Write 100–140 words.', checklist: ['I distinguished the UK from Great Britain.', 'I identified Northern Ireland accurately.', 'I used a capital city as a city, not a country.'] },
      handbookNote,
    ],
  },
  {
    id: 'life-uk-lesson-history',
    topicId: 'life-uk-history',
    title: 'A Long and Illustrious History',
    summary: 'Build a timeline of major developments that shaped Britain, while separating evidence, interpretation, and later consequences.',
    blocks: [
      { type: 'heading', content: 'Use a timeline, not isolated names' },
      { type: 'paragraph', content: 'History is easier to understand when events are placed in sequence and connected to change. The Roman occupation left roads, towns, and administrative influences, but it did not create modern Britain by itself. After the Roman period, different kingdoms and peoples shaped the islands. The Norman Conquest of 1066 changed landholding and government, while later medieval institutions developed through conflict, negotiation, and law. A date is useful only when you can explain what changed around it.' },
      { type: 'subheading', content: 'Law, Parliament, and the Crown' },
      { type: 'paragraph', content: 'Magna Carta in 1215 is remembered as a statement that the ruler was not above the law, although its original purpose and audience were narrower than the modern idea of universal rights. Over time, Parliament developed from councils that advised the Crown into an institution involved in taxation, scrutiny, and law-making. The relationship between monarch, ministers, and Parliament changed through conflict such as the seventeenth-century Civil Wars and the later settlement commonly associated with the Bill of Rights 1689.' },
      { type: 'subheading', content: 'Union, industry, and society' },
      { type: 'paragraph', content: 'The political union of England and Scotland in 1707 created the Kingdom of Great Britain; the later union with Ireland in 1801 created the United Kingdom of Great Britain and Ireland. The nineteenth-century Industrial Revolution changed production, transport, towns, and working life. It created wealth and innovation as well as poverty, pollution, and pressure for reform. Social change was not automatic: campaigners, workers, reformers, and lawmakers contested who could vote, work safely, and access education.' },
      { type: 'interactive', widget: 'history-timeline', title: 'Build the history timeline', prompt: 'Put these five events in order, then read what changed around each one.' },
      { type: 'subheading', content: 'The twentieth century and historical judgement' },
      { type: 'paragraph', content: 'The two World Wars, the expansion and later end of empire, the creation of the welfare state, and changing relationships among the UK’s nations all shaped modern life. When revising, distinguish a fact from an interpretation: a fact can be dated or evidenced, while an interpretation explains significance and may be debated. Ask whose experience is visible in a familiar story and whose is missing. Historical understanding grows by comparing evidence rather than memorising a single heroic narrative.' },
      { type: 'writing_activity', title: 'Build a cause-and-change timeline', prompt: 'Choose four events from this lesson. Put them in order and write one sentence for what each changed and one sentence for a consequence that followed later.', wordGuide: 'Write 140–180 words.', checklist: ['I placed events in chronological order.', 'I explained change rather than listing names.', 'I distinguished evidence from interpretation.'] },
      handbookNote,
    ],
  },
  {
    id: 'life-uk-lesson-society',
    topicId: 'life-uk-society',
    title: 'A Modern, Thriving Society',
    summary: 'Understand everyday public services, work, education, community life, and equality without relying on outdated statistics or policy claims.',
    blocks: [
      { type: 'heading', content: 'Public services and daily life' },
      { type: 'paragraph', content: 'Modern life in the UK includes public services, private organisations, charities, families, workplaces, and community groups. The NHS provides healthcare through a national system, while local services and independent providers also have roles. Schools and colleges support education, and training can continue through adulthood. The exact rules, eligibility, waiting times, and charges for a service can change, so a revision lesson should explain the purpose of a service rather than promise a current entitlement without checking an official page.' },
      { type: 'subheading', content: 'Work, learning, and participation' },
      { type: 'paragraph', content: 'People contribute to society in many ways: paid work, caring, study, volunteering, creative activity, and participation in local organisations. Employment rights and duties are set by law and can depend on the situation, so current advice should come from GOV.UK or a qualified adviser. Education is not limited to childhood; adults may use colleges, apprenticeships, libraries, digital resources, or community learning. Learning English and understanding local services can make participation easier, but communities also benefit from the knowledge and languages people bring.' },
      { type: 'subheading', content: 'Equality and diversity' },
      { type: 'paragraph', content: 'A diverse society includes people with different backgrounds, beliefs, ages, abilities, languages, and family histories. Equality means people should not face unlawful discrimination, while treating people fairly does not always mean giving everyone identical support. Reasonable adjustments can remove barriers for disabled people. Respectful disagreement is possible when people listen, use evidence, and avoid harassment. A stereotype reduces a varied group to one story; good citizenship leaves room for individual difference.' },
      { type: 'subheading', content: 'Community responsibility' },
      { type: 'paragraph', content: 'Community life depends on small actions as well as public institutions: following shared rules, looking after shared spaces, helping someone who is isolated, reporting serious concerns through the right channel, and checking information before sharing it. Emergency services, councils, schools, health providers, and charities have different responsibilities. If a problem is urgent or dangerous, use the appropriate emergency route; if it is a disagreement or service complaint, use the organisation’s published process.' },
      { type: 'writing_activity', title: 'Choose the right kind of help', prompt: 'Create three fictional situations—one for a public service, one for a community organisation, and one for an employer. Explain who could help, what evidence or information to gather, and why a current official source matters.', wordGuide: 'Write 140–180 words.', checklist: ['I matched each problem to a suitable organisation.', 'I avoided making an outdated promise about eligibility.', 'I included respectful and practical next steps.'] },
      handbookNote,
    ],
  },
  {
    id: 'life-uk-lesson-government',
    topicId: 'life-uk-government',
    title: 'The UK Government, the Law and Your Role',
    summary: 'Follow how Parliament, Government, courts, elections, and devolved institutions fit together, and identify practical ways to participate lawfully.',
    blocks: [
      { type: 'heading', content: 'Parliament and Government are different' },
      { type: 'paragraph', content: 'The UK Parliament is made up of the House of Commons, the House of Lords, and the Crown as constitutional elements. Parliament debates and makes laws, scrutinises Government, and approves taxation and spending. The Government is the executive: ministers lead departments, propose policy, and administer public services. A Prime Minister and ministers are accountable to Parliament. Keeping these roles separate helps explain why Parliament can question a minister even when the Government has introduced a Bill.' },
      { type: 'subheading', content: 'From a Bill to an Act' },
      { type: 'paragraph', content: 'A Bill is a proposal for a new law or a change to an existing law. It is debated and examined in both Houses, where members can suggest amendments. The final stages include agreement between the Houses and Royal Assent, after which the Bill becomes an Act of Parliament. The exact route varies by Bill type. The useful revision idea is the sequence: proposal, scrutiny, debate, agreement, and enactment—not that one person simply announces a law.' },
      { type: 'subheading', content: 'Courts, law, and devolved government' },
      { type: 'paragraph', content: 'Courts apply the law and resolve disputes; they are not the same as Parliament. The rule of law requires public authorities and individuals to act within the law and use fair procedures. Some responsibilities are devolved to institutions in Scotland, Wales, and Northern Ireland, while other matters remain reserved to the UK Parliament. The exact division can be complex and may change, so learners should check current official guidance rather than rely on a simplified slogan.' },
      { type: 'subheading', content: 'Elections and your role' },
      { type: 'paragraph', content: 'People can participate by voting when eligible, contacting representatives, joining a political party or community group, responding to consultations, serving on a jury when summoned, and obeying the law. Voting rules depend on the election and the person’s eligibility; current registration and identification guidance should be checked on GOV.UK. Citizenship also includes responsibilities to respect other people’s rights, pay required taxes, and seek lawful ways to challenge decisions.' },
      { type: 'writing_activity', title: 'Trace a public decision', prompt: 'Choose a fictional proposal for a new local rule. Explain which body might propose it, how representatives or the public could scrutinise it, where a legal challenge might fit, and one lawful way a resident could participate.', wordGuide: 'Write 140–180 words.', checklist: ['I separated Parliament, Government, and courts.', 'I used the words Bill and Act accurately.', 'I included a practical lawful action for a resident.'] },
      handbookNote,
    ],
  },
]

const apply = process.argv.includes('--apply')
const track = await prisma.track.findUnique({ where: { slug: 'life-in-the-uk-test' }, select: { id: true } })
if (!track) throw new Error('Life in the UK track not found')

for (const lesson of lessons) {
  const topic = await prisma.topic.findUnique({ where: { id: lesson.topicId }, select: { id: true, trackId: true } })
  if (!topic || topic.trackId !== track.id) throw new Error(`Life in the UK topic not found: ${lesson.topicId}`)
  const current = await prisma.lesson.findUnique({ where: { id: lesson.id }, select: { version: true } })
  const data = {
    topicId: topic.id,
    title: lesson.title,
    summary: lesson.summary,
    contentBlocks: JSON.stringify(lesson.blocks),
    estMinutes: 12,
    isPublished: true,
    sortOrder: lessons.indexOf(lesson),
    version: (current?.version || 0) + 1,
  }
  if (apply) {
    await prisma.lesson.upsert({ where: { id: lesson.id }, create: { id: lesson.id, ...data }, update: data })
  }
  console.log(JSON.stringify({ id: lesson.id, title: lesson.title, blocks: lesson.blocks.length, version: data.version, applied: apply }))
}

await prisma.$disconnect()
