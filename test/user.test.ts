import dotenv from 'dotenv';

import { YpareoClient } from '../src/ypareo';
dotenv.config();

const client = new YpareoClient({
    baseUrl: 'https://netypareo.gretacfa-montpellier.fr/netypareo',
    username: process.env.YPAREO_USERNAME || '',
    password: process.env.YPAREO_PASSWORD || '',
});

client.on('ready', async () => {
    console.log('\n' + '='.repeat(60));
    console.log('👤 USER TESTS');
    console.log('='.repeat(60) + '\n');

    console.log(`Username: ${client.user?.username}`);
    console.log(`Full name: ${client.user?.fullName}`);
    console.log(`First name: ${client.user?.firstName}`);
    console.log(`Last name: ${client.user?.lastName}`);
    console.log(`Avatar URL: ${client.user?.avatarUrl || 'N/A'}`);
    console.log();

    console.log(`Count: ${client.user?.registrations.length || 0}`);
    client.user?.registrations.forEach((r, i) => {
        console.log(`  ${i + 1}.[${r.code}] ${r.name}`);
        console.log(`     Year: ${r.year || 'N/A'}`);
        console.log(`     toString: ${r.toString()}`);
    });
    console.log();

    const defaultReg = client.user?.defaultRegistration;

    if (defaultReg) {
        console.log(`  Code: ${defaultReg.code}`);
        console.log(`  Name: ${defaultReg.name}`);
        console.log(`  Year: ${defaultReg.year}`);
    }
    console.log();

    if (defaultReg) {
        const found = client.user?.getRegistration(defaultReg.code);

        console.log(`  Found: ${found ? 'YES' : 'NO'}`);
        if (found) console.log(`  Name: ${found.name}`);
    }
    console.log();

    console.log(`  ${client.user?.toString()}`);
    console.log();

    const json = client.user?.toJSON();

    if (json) {
        console.log(`  Keys: ${Object.keys(json).join(', ')}`);
        console.log(`  Registrations: ${json.registrations?.length}`);
    }
    console.log();

    console.log('✅ All user tests completed!\n');
});

client.on('error', error => {
    console.error('\n❌ Error:', error.message);
});

client.login();
