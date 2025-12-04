import { DayNumber, getWeekCode, YpareoClient } from '../src/ypareo';
import dotenv from 'dotenv';
import { DAYS } from '../src/ypareo/constants/planning';
dotenv.config();

const client = new YpareoClient({
	baseUrl: 'https://netypareo.gretacfa-montpellier.fr/netypareo',
	username: process.env.YPAREO_USERNAME || '',
	password: process.env.YPAREO_PASSWORD || '',
	debug: false,
});

client.on('ready', async () => {
	console.log(`✅ ${client.user?.fullName}\n`);

	const planning = await client.planning.fetch(getWeekCode(new Date('2025-12-08')));
	const report = await client.attendance.fetch();

	console.log(`📊 Attendance Report:`);
	console.log(report.summary.earlyDeparturesHours > 0 ? `- Early Departures: ${report.summary.earlyDeparturesHours}h` : `- Early Departures: None`);
	console.log(`- Late Arrivals: ${report.summary.latesHours}h`);
	console.log(`- Justified Absences: ${report.summary.justifiedHours}h`);
	console.log(`- Unjustified Absences: ${report.summary.unjustifiedHours}h`);
	console.log(`- Total Absences: ${report.summary.totalHours}h`);
	console.log(`- Absences Hours: ${report.summary.absencesHours}\n`);

	console.log(`📅 Unjustified Details (${report.unjustified.length}):`);
	report.unjustified.forEach(a => {
		console.log(`- [${a.startDate.toLocaleDateString()}] ${a.durationHours}h: ${a.reason}`);
	});

	console.log(`📊 Week ${planning.week.weekNumber}: ${planning.totalHours}h\n`);
	console.log(`📅 Today (${planning.today.length}):`);

	planning.today.forEach(s => {
		console.log(`${s.startTime}-${s.endTime} ${s.label}`);
		console.log(`${s.teacher} | ${s.room}${s.hasHomework ? ' ✏️' : ''}\n`);
	});

	console.log(`✏️ Homework (${planning.homework.length}):`);

	planning.homework.forEach(s => {
		console.log(`[${s.dayName}] ${s.label}`);
	});

	const monday = planning.getDay(DAYS.MONDAY as DayNumber);

	console.log(`\n📚 Monday (${monday.length}):`);

	monday
		.sort((a, b) => a.startMinute - b.startMinute)
		.forEach(s => console.log(`${s.startTime}-${s.endTime} ${s.label}`));
});


client.on('error', (error) => {
	console.error('\n❌ [EVENT] error');
	console.error('   Message:', error.message);
});

client.on('debug', (message) => {
	console.log('[DEBUG]', message);
});

client.login();