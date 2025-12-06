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
	console.log('🔐 SESSION TESTS');
	console.log('='.repeat(60) + '\n');

	const sessionData = client.session.save();

	console.log(`Session data length: ${sessionData.length} chars`);
	console.log(`Contains cookies: ${sessionData.includes('cookie') || sessionData.includes('Cookie')}`);
	console.log();

	client.logout();
	console.log('User after logout:', client.user);
	console.log();

	const restoredUser = await client.session.restore(sessionData, false);

	console.log(`Restored user: ${restoredUser.fullName || restoredUser.username}`);
	console.log(`Client user: ${client.user?.fullName || client.user?.username}`);
	console.log();

	const planning = await client.grades.fetchFullYear(client.user!.defaultRegistration!.code);

	console.log(`Can fetch data: ${planning.subjects.length > 0 ? 'YES' : 'NO'}`);
	console.log();

	console.log('✅ All session tests completed!\n');
});

client.on('error', (error) => {
	console.error('\n❌ Error:', error.message);
});

client.login();