import { YpareoClient, getWeekCode } from '../src/ypareo';
import dotenv from 'dotenv';
dotenv.config();

const client = new YpareoClient({
	baseUrl: 'https://netypareo.gretacfa-montpellier.fr/netypareo',
	username: process.env.YPAREO_USERNAME || '',
	password: process.env.YPAREO_PASSWORD || '',
	debug: false,
});

client.on('ready', async () => {
	console.log(`✅ Logged in as: ${client.user?.fullName}\n`);

	console.log('📋 User Registrations:');
	client.user!.registrations.forEach(r => {
		console.log(`- [${r.code}] ${r.toString()}`);
	});
	console.log();

	const regCode = client.user!.defaultRegistration!.code;
	const periods = await client.grades.fetchPeriods(regCode);

	console.log('📆 Available Grade Periods:');
	periods.forEach(period => {
		console.log(`- ${period.name} (Session: ${period.sessionCode || 'N/A'})`);
		console.log(`  Code: ${period.code}, Year: ${period.year || 'N/A'}, Full Year: ${period.isFullYear}`);
	});
	console.log();

	const fullYear = await client.grades.fetchFullYear(regCode);

	console.log('📚 Full Year Grades:');
	console.log(`Period: ${fullYear.periodName}`);
	console.log(`Registration: ${fullYear.registrationName}`);
	console.log(`Total subjects: ${fullYear.subjects.length}`);
	console.log(`Overall average: ${fullYear.overallAverage !== null ? fullYear.overallAverage.toFixed(2) : 'N/A'}/20\n`);

	console.log('📖 Subjects Details:');
	fullYear.subjects.forEach(subject => {
		console.log(`\n${subject.name} (Code: ${subject.code})`);
		console.log(`  Student average: ${subject.stats.studentAverage !== null ? subject.stats.studentAverage.toFixed(2) : 'N/A'}/20`);
		console.log(`  Group average: ${subject.stats.groupAverage !== null ? subject.stats.groupAverage.toFixed(2) : 'N/A'}/20`);
		console.log(`  Min: ${subject.stats.minAverage !== null ? subject.stats.minAverage.toFixed(2) : 'N/A'} | Max: ${subject.stats.maxAverage !== null ? subject.stats.maxAverage.toFixed(2) : 'N/A'}`);

		if (subject.hasComment)
			console.log(`  Comment: ${subject.comment}`);

		console.log(`  Grades (${subject.grades.length}):`);
		subject.grades.forEach(grade => {
			const statusEmoji = grade.isGraded ? '✅' : grade.isAbsent ? '❌' : '⏳';
			const valueStr = grade.isGraded ?  `${grade.value}/20` : grade.isAbsent ? grade.absenceReason : 'Not graded';

			console.log(`    ${statusEmoji} ${grade.theme} - ${valueStr}`);
			console.log(`       ${grade.teacher} (${grade.teacherInitials}) | ${grade.date.toLocaleDateString()} | Coeff: ${grade.coefficient} | Type: ${grade.type}`);
		});
	});
	console.log();

	const sem1 = periods.find(p => p.name.includes('Semestre 1'));

	if (sem1) {
		const sem1Report = await client.grades.fetch(regCode, sem1);

		console.log('\n📅 Semester 1 Only:');
		console.log(`Period: ${sem1Report.periodName}`);
		console.log(`Subjects: ${sem1Report.subjects.length}`);
		console.log(`Overall average: ${sem1Report.overallAverage !== null ? sem1Report.overallAverage.toFixed(2) : 'N/A'}/20`);

		sem1Report.subjects.forEach(subject => {
			if (subject.hasGrades)
				console.log(`  - ${subject.name}: ${subject.stats.studentAverage !== null ? subject.stats.studentAverage.toFixed(2) : 'N/A'}/20 (${subject.grades.length} grades)`);
		});
	}
	console.log();

	const englishSubject = fullYear.subjects.find(s => s.name.includes('ANGLAIS'));

	if (englishSubject) {
		const englishReport = await client.grades.fetchFullYear(regCode, englishSubject.code);

		console.log('\n🇬🇧 English Only (Full Year):');
		englishReport.subjects.forEach(subject => {
			console.log(`${subject.name}: ${subject.stats.studentAverage !== null ? subject.stats.studentAverage.toFixed(2) : 'N/A'}/20`);
			subject.grades.forEach(grade => {
				if (grade.isGraded)
					console.log(`  - ${grade.theme}: ${grade.value}/20 (${grade.date.toLocaleDateString()})`);
			});
		});
	}
	console.log();

	const specificSubject = fullYear.getSubject(englishSubject!.code);

	console.log('🔍 Find Subject by Code:');
	if (specificSubject)
		console.log(`Found: ${specificSubject.name} with ${specificSubject.grades.length} grades`);
	console.log();

	const json = fullYear.toJSON();

	console.log('📄 JSON Export Sample:');
	console.log(JSON.stringify({
		totalSubjects: json.totalSubjects,
		overallAverage: json.overallAverage,
		firstSubject: json.subjects[0]?.name
	}, null, 2));
	console.log();

	console.log('⚡ Cache Test:');
	(client.grades as any)['cache'].clear();
	console.time('First fetch');
	await client.grades.fetchFullYear(regCode);
	console.timeEnd('First fetch');

	console.time('Cached fetch');
	await client.grades.fetchFullYear(regCode);
	console.timeEnd('Cached fetch');
	console.log();

	const refreshedReport = await client.grades.refresh(regCode, periods.find(p => p.isFullYear)!);

	console.log('🔄 Refresh Test:');
	console.log(`Refreshed report has ${refreshedReport.subjects.length} subjects`);
	console.log();

	console.log('✅ All grades tests completed!');
});

client.on('error', (error) => {
	console.error('\n❌ Error:', error.message);
});

client.login();