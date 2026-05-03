const fs = require('fs');

const file1 = 'src/app/(shell)/labs/layout.tsx';
let c1 = fs.readFileSync(file1, 'utf8');
c1 = c1.replace(/@\/components\/layout\/PageLayout/g, '@/components/ui/layout/PageLayout');
c1 = c1.replace(/@\/components\/layout\/PageHeader/g, '@/components/ui/layout/PageHeader');
fs.writeFileSync(file1, c1, 'utf8');

const tsFiles = [
    'src/components/flowboard/FlowboardCard.tsx',
    'src/components/flowboard/FlowboardLane.tsx',
    'src/components/flowboard/FlowLane.tsx'
];
tsFiles.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/@\/types\/task/g, '@/features/tasks/types/task');
    fs.writeFileSync(f, c, 'utf8');
});

const file2 = 'src/components/profile/ActivitySummary.tsx';
let c2 = fs.readFileSync(file2, 'utf8');
c2 = c2.replace(/@supabase\/auth-helpers-nextjs/g, '@supabase/ssr');
fs.writeFileSync(file2, c2, 'utf8');

const file3 = 'src/services/conflictDetectionService.ts';
let c3 = fs.readFileSync(file3, 'utf8');
c3 = c3.replace(/\.\/systemEventService/g, '@/features/events/services/systemEventService');
c3 = c3.replace(/\.\/taskService/g, '@/features/tasks/services/taskService');
fs.writeFileSync(file3, c3, 'utf8');

const file4 = 'src/types/index.ts';
let c4 = fs.readFileSync(file4, 'utf8');
c4 = c4.replace(/\.\/task/g, '@/features/tasks/types/task');
c4 = c4.replace(/\.\/event/g, '@/features/events/types/event');
c4 = c4.replace(/\.\/campaign/g, '@/features/campaigns/types/campaign');
fs.writeFileSync(file4, c4, 'utf8');
