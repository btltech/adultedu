
const BASE_URL = 'http://localhost:3001/api'
const USER_CREDENTIALS = {
    email: 'admin@adultedu.com',
    password: 'admin123'
}

// Helper to create a user if not exists (or just login)
async function getAuthHeaders() {
    // 1. Signup/Login
    let res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(USER_CREDENTIALS)
    })

    if (res.status === 401) {
        // Signup
        res = await fetch(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(USER_CREDENTIALS)
        })
    }

    if (!res.ok) throw new Error('Auth failed')
    const cookies = res.headers.get('set-cookie')
    return { 'Content-Type': 'application/json', Cookie: cookies }
}

async function runTest() {
    console.log('🧪 Testing Progress API...')
    const headers = await getAuthHeaders()

    // 1. Get available tracks
    const tracksRes = await fetch(`${BASE_URL}/tracks`, { headers })
    const tracks = await tracksRes.json()
    const targetTrack = tracks[0] // e.g., EDS
    console.log(`\nTarget Track: ${targetTrack.title} (${targetTrack.slug})`)

    // 2. Enroll
    await fetch(`${BASE_URL}/enrollments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ trackId: targetTrack.id })
    })
    console.log('✓ Enrolled')

    // 3. Get Topics for this track
    const trackDetailRes = await fetch(`${BASE_URL}/tracks/${targetTrack.slug}`, { headers })
    const trackDetail = await trackDetailRes.json()
    const firstTopic = trackDetail.topics[0]
    console.log(`Target Topic: ${firstTopic.title} (Questions: ${firstTopic.questionCount})`)

    if (firstTopic.questionCount === 0) {
        console.error('❌ Topic has no questions. Cannot test mastery.')
        return
    }

    // 4. Simulate taking a quiz (Answering 1 question correctly)
    // We need a question ID first.
    // Assuming we can get questions via /api/tracks/:slug route or similar?
    // The previous tracks route update included question count but maybe not IDs of questions?
    // We might need an endpoint to "start quiz" or "get questions for topic"
    // For now, let's assume we can fetch questions for a topic.
    // Since we don't have a public "get questions" API for learners strictly defined yet, 
    // I will use the admin API or assume one exists/needs to exist.
    // WAIT, learners need to get questions to practice! 
    // Let's check if there is a learner route for questions. 
    // If not, I need to build that too!

    console.log('\nChecking for Learner Question API...')
    // Proposed: GET /api/topics/:id/questions
    // Or GET /api/learn/topics/:id/practice

    // For this test, I'll assume we implement specific progress endpoint 
    // and I'll verify it returns 0% first.

    const initialProgressRes = await fetch(`${BASE_URL}/progress/${targetTrack.slug}`, { headers })
    if (initialProgressRes.status === 404) {
        console.log('⚠️ Progress endpoint not found yet (Expected)')
    } else {
        const p = await initialProgressRes.json()
        console.log('Initial Progress:', p)
    }

}

runTest().catch(console.error)
