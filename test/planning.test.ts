import dotenv from 'dotenv'

import type { DayNumber } from '../src/ypareo'
import { getCurrentWeekCode, getWeekCode, YpareoClient } from '../src/ypareo'
import { DAYS } from '../src/ypareo/constants/planning'
dotenv.config()

const client = new YpareoClient({
    baseUrl: 'https://netypareo.gretacfa-montpellier.fr/netypareo',
    username: process.env.YPAREO_USERNAME || '',
    password: process.env.YPAREO_PASSWORD || '',
})

client.on('ready', async () => {
    console.log('\n' + '='.repeat(60))
    console.log('📅 PLANNING TESTS')
    console.log('='.repeat(60) + '\n')

    const currentWeek = getCurrentWeekCode()
    const planning = await client.planning.fetch(currentWeek)

    console.log(`Week: ${planning.week.weekNumber}`)
    console.log(`Period: ${planning.week.startDate}`)
    console.log(`Total hours: ${planning.totalHours}h`)
    console.log(`Sessions count: ${planning.sessions.length}`)
    console.log()

    console.log(`Count: ${planning.today.length}`)
    planning.today.forEach((s) => {
        console.log(`  ${s.startTime}-${s.endTime} ${s.label}`)
        console.log(
            `    Teacher: ${s.teacher} | Room: ${s.room}${s.hasHomework ? ' ✏️' : ''}`
        )
    })
    console.log()

    console.log(`Count: ${planning.homework.length}`)
    planning.homework.forEach((h) => {
        console.log(`  [${h.dayName}] ${h.label}`)
        console.log(`    ${h.startTime} | ${h.teacher}`)
    })
    console.log()

    const monday = planning.getDay(DAYS.MONDAY as DayNumber)

    console.log(`Monday has ${monday.length} sessions:`)
    monday
        .sort((a, b) => a.startMinute - b.startMinute)
        .forEach((s) => {
            console.log(`  ${s.startTime}-${s.endTime} ${s.label}`)
        })
    console.log()

    console.log('Test 6: First session details')
    if (planning.sessions.length > 0) {
        const firstSession = planning.sessions[0]

        console.log(`  Code: ${firstSession.code}`)
        console.log(`  Label: ${firstSession.label}`)
        console.log(`  Teacher: ${firstSession.teacher}`)
        console.log(`  Room: ${firstSession.room}`)
        console.log(`  Start: ${firstSession.startTime}`)
        console.log(`  End: ${firstSession.endTime}`)
        console.log(
            `  Duration: ${firstSession.duration}min (${firstSession.durationHours}h)`
        )
        console.log(`  Has homework: ${firstSession.hasHomework}`)
    }
    console.log()

    const specificWeek = getWeekCode(new Date('2025-12-08'))
    const planning2 = await client.planning.fetch(specificWeek)

    console.log(
        `Week ${planning2.week.weekNumber}: ${planning2.sessions.length} sessions`
    )
    console.log()

    try {
        const pdf = await client.planning.exportPDF(planning.week.code)

        console.log(`PDF size: ${pdf.length} bytes`)
        console.log(
            `PDF type: ${pdf instanceof Buffer ? 'Buffer' : typeof pdf}`
        )
    } catch (err: any) {
        console.log(`PDF export error: ${err.message}`)
    }
    console.log()

    console.log('⚡ Cache Test:')
    ;(client.planning as any)['cache'].clear()
    console.time('First fetch')
    await client.planning.fetch(currentWeek)
    console.timeEnd('First fetch')

    console.time('Cached fetch')
    await client.planning.fetch(currentWeek)
    console.timeEnd('Cached fetch')
    console.log()

    const refreshed = await client.planning.refresh(currentWeek)

    console.log('Test 10: Refresh cache')
    console.log(`Refreshed: ${refreshed.sessions.length} sessions`)
    console.log()

    const json = planning.toJSON()

    console.log('Test 11: JSON export')
    console.log(`JSON keys: ${Object.keys(json).join(', ')}`)
    console.log(`First session: ${json.sessions[0]?.label || 'N/A'}`)
    console.log()

    console.log('✅ All planning tests completed!\n')
})

client.on('error', (error) => {
    console.error('\n❌ Error:', error.message)
})

client.login()
