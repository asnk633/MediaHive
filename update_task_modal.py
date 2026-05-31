import sys

file_path = 'src/components/tasks/TaskDetailModalV2.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Instead of moving everything around and breaking the JSX structure,
# let's just make Section 2 and Section 3 sit side by side using a grid.
# Right now Section 2 and Section 3 are vertical.
# If we wrap Section 2 and 3 in a grid, that will instantly give breathing space!
# Then the rest (Attachments, Subtasks, Comments) can stay full width or also go into the grid.

# Let's replace the space around Section 2 to start a grid:
target1 = '''                            {/* Section 2: Request Info */}'''
replacement1 = '''                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    {/* Section 2: Request Info */}'''

target2 = '''                            {/* Section 3: Task Assignment */}'''
replacement2 = '''                                </div>
                                <div>
                                    {/* Section 3: Task Assignment */}'''

target3 = '''                            {/* Attachments Section - Consolidated */}'''
replacement3 = '''                                </div>
                            </div>

                            {/* Attachments Section - Consolidated */}'''

new_content = content.replace(target1, replacement1).replace(target2, replacement2).replace(target3, replacement3)

# We should also remove the hardcoded mb-8 from Section 2 and 3 since they are inside the grid
new_content = new_content.replace('                            <div className="mb-8">\n                                <div className="flex items-center gap-2 mb-4">\n                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />', '                            <div>\n                                <div className="flex items-center gap-2 mb-4">\n                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />')
new_content = new_content.replace('                            <div className="mb-8">\n                                <div className="flex items-center gap-2 mb-4">\n                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50" />', '                            <div>\n                                <div className="flex items-center gap-2 mb-4">\n                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50" />')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("File updated!")
