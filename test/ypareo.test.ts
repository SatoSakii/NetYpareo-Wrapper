import { DayNumber, YpareoClient } from '../src/ypareo';
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

	const planning = await client.planning.fetch(202550);

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