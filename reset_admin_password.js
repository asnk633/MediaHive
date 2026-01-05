const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

try {
    const db = new Database('dev.db');
    const hash = bcrypt.hashSync('ChangeMe123!', 10);
    console.log('Generated Hash:', hash);

    // Using 'password_hash' as confirmed by schema inspection
    const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE email = ?');
    const info = stmt.run(hash, 'admin@thaiba.com');

    console.log('Update result:', info);
    console.log('Rows changed:', info.changes);
} catch (e) {
    console.error('Error updating password:', e);
    process.exit(1);
}
