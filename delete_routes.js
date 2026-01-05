const fs = require('fs');
const path = require('path');

const paths = [
    'src/app/(shell)/tasks/[id]',
    'src/app/(shell)/calendar/events/[id]',
    'src/app/(shell)/updates/[id]'
];

paths.forEach(p => {
    const fullPath = path.resolve(process.cwd(), p);
    console.log(`Deleting: ${fullPath}`);
    try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log('Success');
    } catch (e) {
        console.error('Failed:', e.message);
    }
});
