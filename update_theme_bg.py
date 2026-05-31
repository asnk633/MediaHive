import sys

# TaskDetailModalV2.tsx
file_path = 'src/components/tasks/TaskDetailModalV2.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('bg-[#0B0E14]/98', 'bg-background/80')
content = content.replace('bg-[#0B0E14]', 'glass-card')
content = content.replace('className="flex-1 overflow-y-auto px-8 py-8 bg-background"', 'className="flex-1 overflow-y-auto px-8 py-8 bg-transparent"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

# EventDetailsModal.tsx
file_path2 = 'src/components/events/EventDetailsModal.tsx'
with open(file_path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = content2.replace('max-w-6xl md:max-w-6xl bg-background border-none', 'max-w-6xl md:max-w-6xl glass-card border-none')
content2 = content2.replace('className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-6 custom-scrollbar min-h-0 bg-background"', 'className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-6 custom-scrollbar min-h-0 bg-transparent"')
# wait, what was the exact string in EventDetailsModal? Let's be less greedy
content2 = content2.replace('bg-background flex flex-col sm:flex-row', 'bg-transparent flex flex-col sm:flex-row')
content2 = content2.replace('bg-background border-none p-0', 'glass-card border-none p-0')

with open(file_path2, 'w', encoding='utf-8') as f:
    f.write(content2)

print("Backgrounds updated to theme.")
