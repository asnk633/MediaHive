
export interface WelcomeMessage {
    greeting: string; // "Good Morning", "Good Afternoon", etc.
    message: string; // The random role-based message
}

const adminWelcomeMessages = [
    "Welcome back, Admin. Everything is under control — and growing.",
    "Good to see you. Let’s steer the workflow smoothly today.",
    "Dashboard ready. Your team is waiting for direction.",
    "Another day to organize, optimize, and lead.",
    "Welcome back. Clarity starts with you.",
    "All systems standing by. Let’s make things move.",
    "Hello Admin. Big picture, sharp details — you’ve got this.",
    "Your command center is live.",
    "Welcome back. Time to turn plans into progress.",
    "Leadership mode on. Let’s build momentum."
];

const teamWelcomeMessages = [
    "Welcome back. Let’s create something meaningful today.",
    "Ready when you are — your tasks are lined up.",
    "New day, new shots, new stories.",
    "Good to see you. Let’s get things done, one task at a time.",
    "Your workspace is ready. Time to shine.",
    "Welcome back. Creativity starts now.",
    "Tasks are waiting — and so is progress.",
    "Another chance to do great work.",
    "Let’s turn ideas into visuals.",
    "You bring the skill. We’ve got the system."
];

const guestWelcomeMessages = [
    "Welcome. You’re in the right place.",
    "Hello! Submit your request and we’ll take it from here.",
    "Welcome to the Media Hub — let’s get started.",
    "Need something done? Just add a task.",
    "Thanks for being here. Your request matters.",
    "Welcome! Creating requests is quick and easy.",
    "You’re all set. Tell us what you need.",
    "Welcome aboard. We’ll handle the rest.",
    "Simple, clear, and connected — start here.",
    "Welcome. Let’s make your work smoother."
];

/**
 * Gets the time-based greeting based on current system time.
 */
function getTimeBasedGreeting(): string {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
}

/**
 * Gets a random welcome message based on the user's role.
 */
function getRandomMessage(role: string): string {
    let messages: string[] = [];

    const normalizedRole = role.toLowerCase();

    if (normalizedRole === 'admin') messages = adminWelcomeMessages;
    else if (normalizedRole === 'team') messages = teamWelcomeMessages;
    else messages = guestWelcomeMessages; // default to guest for any other role

    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
}

/**
 * Generates the full welcome object.
 * Logic:
 * 1. Calculate time greeting (Good Morning etc.)
 * 2. Select random message based on role.
 */
export function getWelcomeData(role: string): WelcomeMessage {
    return {
        greeting: getTimeBasedGreeting(),
        message: getRandomMessage(role)
    };
}
