import os
import re

def migrate_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern 1: import { MediaTask as Task } from '@/services/tasks/taskContract';
    # Pattern 2: import { MediaTask as Task } from "@/services/tasks/taskContract";
    # Pattern 3: import type { MediaTask as Task } from '@/services/tasks/taskContract';
    
    new_content = re.sub(
        r'import\s+(type\s+)?\{\s*MediaTask\s+as\s+Task\s*\}\s+from\s+["\']@/services/tasks/taskContract["\'];?',
        r'import \1{ Task } from "@/features/tasks/types/task";',
        content
    )

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

files_to_migrate = [
    "src/app/(shell)/campaigns/view/CampaignViewClient.tsx",
    "src/app/(shell)/events/EventsClient.tsx",
    "src/app/(shell)/tasks/TasksPageClient.tsx",
    "src/components/admin/SystemHealthPanel.tsx",
    "src/components/profile/GuestProfilePage.tsx",
    "src/components/tasks/AdminConfidencePanel.tsx",
    "src/components/tasks/SortableTaskRow.tsx",
    "src/components/tasks/TaskConfidenceView.tsx",
    "src/components/tasks/TaskDetailModalV2.tsx",
    "src/components/tasks/TaskListView.tsx",
    "src/features/campaigns/services/campaignService.ts",
    "src/features/dashboard/components/ActivityFeed.tsx",
    "src/features/dashboard/components/AdminOversightWidget.tsx",
    "src/features/dashboard/components/DueSoonWidget.tsx",
    "src/features/dashboard/components/GuestActivityFeed.tsx",
    "src/features/dashboard/components/MyFocusWidget.tsx",
    "src/features/dashboard/components/MyWorkflowWidget.tsx",
    "src/features/dashboard/components/TasksFromMeWidget.tsx",
    "src/features/dashboard/components/TimelineWidget.tsx",
    "src/features/dashboard/components/TodayFocusPanel.tsx",
    "src/features/dashboard/hooks/useDashboardMetrics.ts",
    "src/features/events/services/eventService.ts",
    "src/features/tasks/components/TaskSummaryWidget.tsx",
    "src/features/tasks/hooks/useOptimisticTasks.ts",
    "src/services/canonicalDataService.ts",
    "src/services/edgeCaseService.ts"
]

migrated_count = 0
for file in files_to_migrate:
    abs_path = os.path.join(os.getcwd(), file)
    if os.path.exists(abs_path):
        if migrate_file(abs_path):
            print(f"Migrated: {file}")
            migrated_count += 1
    else:
        print(f"Skipped (not found): {file}")

print(f"Total migrated: {migrated_count}")
