
// Native fetch used

const BASE_URL = 'http://localhost:3001/api'
const ADMIN_CREDENTIALS = {
    email: 'admin@adultedu.com',
    password: 'admin123'
}

async function runTest() {
    console.log('🧪 Testing Admin API...')

    // 1. Login
    console.log('\nPlease logging in...')
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ADMIN_CREDENTIALS)
    })

    if (!loginRes.ok) {
        console.error('Login failed:', await loginRes.text())
        process.exit(1)
    }

    // Get cookie
    const cookies = loginRes.headers.get('set-cookie')
    console.log('✓ Logged in. Cookie received.')

    // 2. Test Stats
    console.log('\nFetching Admin Stats...')
    const statsRes = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { Cookie: cookies }
    })

    if (!statsRes.ok) {
        console.error('Stats failed:', await statsRes.text())
    } else {
        const stats = await statsRes.json()
        console.log('✓ Stats received:', stats)
    }

    // 3. Test Users
    console.log('\nFetching User List...')
    const usersRes = await fetch(`${BASE_URL}/admin/users`, {
        headers: { Cookie: cookies }
    })

    if (!usersRes.ok) {
        console.error('Users failed:', await usersRes.text())
    } else {
        const users = await usersRes.json()
        console.log('✓ Users received:', users.users.length, 'users found')
        console.log('  First user:', users.users[0])
    }
    // 4. Test Create Draft Question
    console.log('\nCreating DRAFT Question...')
    const draftQuestion = {
        topicId: 'eds-1',
        ukLevelId: 'l1-id-placeholder',
        type: 'mcq',
        prompt: 'Draft API Test',
        options: ['A', 'B', 'C', 'D'],
        answer: 0,
        explanation: 'Draft expl',
        difficulty: 1,
        isPublished: false
    }

    // Get valid IDs again if needed
    const usersRes2 = await fetch(`${BASE_URL}/admin/questions?limit=1`, { headers: { Cookie: cookies } })
    const qList = await usersRes2.json()
    if (qList.questions.length > 0) {
        draftQuestion.topicId = qList.questions[0].topicId
        draftQuestion.ukLevelId = qList.questions[0].ukLevelId
    }

    const createDraftRes = await fetch(`${BASE_URL}/admin/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify(draftQuestion)
    })

    let draftId = null
    if (!createDraftRes.ok) {
        console.error('Create Draft failed:', await createDraftRes.text())
    } else {
        const created = await createDraftRes.json()
        draftId = created.id
        console.log('✓ Created Draft Question:', created.id, 'Published:', created.isPublished)
        if (created.isPublished !== false) console.error('❌ Error: Question should be DRAFT')
    }

    // 5. Test Filter Drafts
    console.log('\nFiltering Drafts...')
    const draftsRes = await fetch(`${BASE_URL}/admin/questions?status=draft`, { headers: { Cookie: cookies } })
    const drafts = await draftsRes.json()
    const foundDraft = drafts.questions.find(q => q.id === draftId)
    if (foundDraft) {
        console.log('✓ Found created draft in draft list')
    } else {
        console.error('❌ Error: Created draft not found in draft list')
    }

    // 6. Test Publish (Update)
    console.log('\nPublishing Question...')
    const pubRes = await fetch(`${BASE_URL}/admin/questions/${draftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ isPublished: true })
    })
    const pubQ = await pubRes.json()
    if (pubQ.isPublished === true) {
        console.log('✓ Question Published')
    } else {
        console.error('❌ Error: Failed to publish question')
    }

    // 7. Cleanup
    if (draftId) {
        await fetch(`${BASE_URL}/admin/questions/${draftId}`, {
            method: 'DELETE',
            headers: { Cookie: cookies }
        })
        console.log('✓ Cleanup: Deleted test question')
    }
}

runTest().catch(console.error)
