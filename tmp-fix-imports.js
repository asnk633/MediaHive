const fs = require('fs');
const path = require('path');

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) walk(fullPath);
        else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let dirty = false;

            // Check getSupabaseServerServices
            if (content.includes('getSupabaseServerServices') && !content.includes('getSupabaseServerServices\'') && !content.includes('getSupabaseServerServices\"')) {
                if (content.match(/import\s+{([^}]*)}\s+from\s+'@\/lib\/server-utils'/)) {
                    content = content.replace(/import\s+{([^}]*)}\s+from\s+'@\/lib\/server-utils'/, (match, group1) => {
                        if (!group1.includes('getSupabaseServerServices')) {
                            return 'import { ' + group1.trim() + ', getSupabaseServerServices } from \'@/lib/server-utils\'';
                        }
                        return match;
                    });
                    dirty = true;
                } else if (!content.includes('import { getSupabaseServerServices }')) {
                    content = 'import { getSupabaseServerServices } from \'@/lib/server-utils\';\n' + content;
                    dirty = true;
                }
            }

            // Check verifyUser
            if (content.includes('verifyUser') && !content.includes('verifyUser\'') && !content.includes('verifyUser\"') && !content.includes('export async function verifyUser')) {
                if (content.match(/import\s+{([^}]*)}\s+from\s+'@\/lib\/server-utils'/)) {
                    content = content.replace(/import\s+{([^}]*)}\s+from\s+'@\/lib\/server-utils'/, (match, group1) => {
                        if (!group1.includes('verifyUser')) {
                            return 'import { ' + group1.trim() + ', verifyUser } from \'@/lib/server-utils\'';
                        }
                        return match;
                    });
                    dirty = true;
                } else if (!content.includes('import { verifyUser }')) {
                    content = 'import { verifyUser } from \'@/lib/server-utils\';\n' + content;
                    dirty = true;
                }
            }

            if (dirty) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed imports in', fullPath);
            }
        }
    }
}
walk('d:/MediaHive App/src/app/api');
