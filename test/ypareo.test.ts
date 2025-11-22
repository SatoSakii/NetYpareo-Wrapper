import { User, YpareoClient } from '../src/ypareo';

const client = new YpareoClient({
	baseUrl: 'https://netypareo.gretacfa-montpellier.fr/netypareo',
	username: process.env.YPAREO_USERNAME || '',
	password: process.env.YPAREO_PASSWORD || '',
	debug: false,
});

client.on('ready', (user: User) => {
	client.saveSession()
	console.log('\n🎉 [EVENT] ready');
	console.log('   User:', user.toString());
	console.log('   Username:', user.username);
	console.log('   Full name:', user.fullName || '(not found)');
});

client.on('error', (error) => {
	console.error('\n❌ [EVENT] error');
	console.error('   Message:', error.message);
});

client.on('debug', (message) => {
	console.log('[DEBUG]', message);
});

client.login();