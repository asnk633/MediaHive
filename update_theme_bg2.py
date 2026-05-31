import sys

file_path = 'src/components/tasks/TaskDetailModalV2.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('glass-card', 'bg-popover')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

file_path2 = 'src/components/events/EventDetailsModal.tsx'
with open(file_path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = content2.replace('glass-card', 'bg-popover')

with open(file_path2, 'w', encoding='utf-8') as f:
    f.write(content2)

print("Changed glass-card to bg-popover")
