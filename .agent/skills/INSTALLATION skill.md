# Safe Code Changes Skill - Installation Guide

## What This Skill Does

The **safe-code-changes** skill enforces strict preservation of working functionality whenever Claude modifies code. It prevents the common problem where agents break working features while trying to fix bugs or add new capabilities.

### Key Features:
- ✅ Surgical, minimal code modifications only
- ✅ Explicit boundaries between "touch zone" and "no-touch zone"
- ✅ Requires permission before breaking changes
- ✅ Verification checklist before presenting changes
- ✅ Anti-patterns guide to avoid common mistakes

## Installation

### For Claude Code:
```bash
# If you have the skill file
claude skills install safe-code-changes.skill

# Or manually:
# 1. Extract the .skill file to your skills directory
tar -xzf safe-code-changes.skill -C ~/.config/claude/skills/safe-code-changes/
```

### For Other Environments:
1. Extract the `safe-code-changes.skill` file
2. Place the contents in your skills directory
3. Ensure the `SKILL.md` file is in the skill folder

## How It Works

Once installed, this skill **automatically triggers** whenever you ask Claude to:
- Fix bugs in existing code
- Add new features to an application
- Update or modify scripts
- Debug issues
- Refactor code
- Make any changes to existing codebases

### Example Triggers:
- "Fix the login error"
- "Add a dark mode toggle"
- "Update the API to include timestamps"
- "Debug why the form isn't submitting"
- "Improve the performance of this function"

## What Changes After Installation

**Before (without skill):**
```
You: "Fix the button alignment"
Claude: *rewrites entire component, updates state management, 
         refactors CSS architecture, breaks existing features*
```

**After (with skill):**
```
You: "Fix the button alignment"  
Claude: *analyzes current code, identifies only the CSS that needs
         to change, preserves all working logic, makes minimal fix*

Changes Made:
- Modified: button.css (line 47: updated margin-left)
- Preserved: all component logic, event handlers, state management
```

## Verification

To check if the skill is working:

1. Ask Claude to make a code change
2. Claude should:
   - Identify what currently works
   - Define minimal scope of change
   - Only modify necessary code
   - Provide a summary of changes vs. preserved code

## Customization

You can edit `/path/to/skills/safe-code-changes/SKILL.md` to:
- Add project-specific rules
- Customize the verification checklist
- Add your own anti-patterns
- Include team coding standards

## Troubleshooting

**Skill not triggering?**
- Check that the skill is in the correct directory
- Verify the SKILL.md frontmatter is valid YAML
- Try explicitly mentioning "preserve working code" in your request

**Too restrictive?**
- You can override by saying "rewrite this completely" or "refactor everything"
- The skill asks permission for breaking changes rather than blocking them

## Support

The skill enforces best practices but you're always in control:
- Override restrictions by being explicit in requests
- Grant permission when Claude asks
- Disable temporarily by asking Claude to "skip the safe-code-changes skill"

---

**Remember:** This skill is insurance against accidental breakage. It won't prevent you from making intentional changes, but it will stop unintentional damage to working code.
