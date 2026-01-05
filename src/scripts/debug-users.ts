
import { getDb } from '@/db'; // Adjust path if needed, might need 'src/db' if running with ts-node from root
import { users } from '@/db/schema'; // Adjust path

async function listUsers() {
    try {
        const db = await getDb();
        const allUsers = await db.select().from(users);
        console.log('--- SQL USERS ---');
        console.table(allUsers.map(u => ({ id: u.id, email: u.email, role: u.role })));
        console.log('-----------------');
    } catch (error) {
        console.error('Error listing users:', error);
    }
    process.exit(0);
}

listUsers();
