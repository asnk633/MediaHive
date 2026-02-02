export const getInspirationLine = (role: string): string => {
    const lines: Record<string, string[]> = {
        admin: [
            "The health of the institution depends on your oversight today.",
            "Clear vision builds strong media foundations.",
            "Guidance today leads to excellence tomorrow.",
            "Efficiency in management is the heartbeat of production."
        ],
        team: [
            "Your creativity is the lens through which the world sees us.",
            "Focus on the next frame; the big picture will follow.",
            "Precision in execution defines our media team's success.",
            "Today's output is tomorrow's legacy."
        ],
        media_team: [
            "Your creativity is the lens through which the world sees us.",
            "Focus on the next frame; the big picture will follow.",
            "Precision in execution defines our media team's success.",
            "Today's output is tomorrow's legacy."
        ],
        guest: [
            "Welcome to the MediaHive production floor.",
            "Every contribution counts towards our shared vision.",
            "Your presence here strengthens our creative ecosystem."
        ]
    };

    const roleLines = lines[role] || lines.guest;
    const randomIndex = Math.floor(Math.random() * roleLines.length);
    return roleLines[randomIndex];
};
