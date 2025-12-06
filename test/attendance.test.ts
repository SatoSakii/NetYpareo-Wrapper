import { YpareoClient } from '../src/ypareo';
import dotenv from 'dotenv';
dotenv.config();

const client = new YpareoClient({
	baseUrl: 'https://netypareo.gretacfa-montpellier.fr/netypareo',
	username: process.env.YPAREO_USERNAME || '',
	password: process.env.YPAREO_PASSWORD || '',
	debug: false,
});

client.on('ready', async () => {
	console.log('\n' + '='.repeat(60));
	console.log('📊 ATTENDANCE TESTS');
	console.log('='.repeat(60) + '\n');

	const report = await client.attendance.fetch();

	console.log(`Period: ${report.periodStart} - ${report.periodEnd}`);
	console.log(`Total records: ${report.records.length}`);
	console.log();

	console.log(`Total hours: ${report.summary.totalHours}h (${report.summary.totalMinutes}min)`);
	console.log(`Absences: ${report.summary.absencesHours}h`);
	console.log(`Late arrivals: ${report.summary.latesHours}h`);
	console.log(`Early departures: ${report.summary.earlyDeparturesHours}h`);
	console.log(`Justified: ${report.summary.justifiedHours}h`);
	console.log(`Unjustified: ${report.summary.unjustifiedHours}h`);
	console.log();

	console.log(`Count: ${report.absences.length}`);
	report.absences.slice(0, 3).forEach(a => {
		console.log(`  ${a.startDate.toLocaleDateString()} - ${a.durationHours}h`);
		console.log(`    ${a.reason} (${a.status})`);
	});
	console.log();

	console.log(`Count: ${report.lates.length}`);
	report.lates.slice(0, 3).forEach(l => {
		console.log(`  ${l.startDate.toLocaleDateString()} - ${l.durationMinutes}min`);
		console.log(`    ${l.detail}`);
	});
	console.log();

	console.log(`Count: ${report.earlyDepartures.length}`);
	if (report.earlyDepartures.length > 0) {
		report.earlyDepartures.slice(0, 3).forEach(e => {
			console.log(`  ${e.startDate.toLocaleDateString()} - ${e.durationMinutes}min`);
		});
	} else {
		console.log('  No early departures');
	}
	console.log();

	console.log(`Justified: ${report.justified.length} records`);
	console.log(`Unjustified: ${report.unjustified.length} records`);
	console.log();

	if (report.records.length > 0) {
		const first = report.records[0];

		console.log(`  Type: ${first.type}`);
		console.log(`  Status: ${first.status}`);
		console.log(`  Start: ${first.startDate.toLocaleString()}`);
		console.log(`  End: ${first.endDate.toLocaleString()}`);
		console.log(`  Duration: ${first.durationMinutes}min (${first.durationHours}h)`);
		console.log(`  Reason: ${first.reason}`);
		console.log(`  Detail: ${first.detail}`);
		console.log(`  Is justified: ${first.isJustified}`);
		console.log(`  Is absence: ${first.isAbsence}`);
		console.log(`  Is late: ${first.isLate}`);
	}
	console.log();

	console.log('⚡ Cache Test:');
	(client.attendance as any)['cache'].clear();
	console.time('First fetch');
	await client.attendance.fetch();
	console.timeEnd('First fetch');

	console.time('Cached fetch');
	await client.attendance.fetch();
	console.timeEnd('Cached fetch');
	console.log();

	const refreshed = await client.attendance.refresh();
	console.log(`Refreshed: ${refreshed.records.length} records`);
	console.log();

	const json = report.toJSON();

	console.log(`JSON keys: ${Object.keys(json).join(', ')}`);
	console.log(`Total records in JSON: ${json.totalRecords}`);
	console.log();

	console.log('✅ All attendance tests completed!\n');
});

client.on('error', (error) => {
	console.error('\n❌ Error:', error.message);
});

client.login();