/**
 * Calculate total days between two dates (inclusive)
 */
export const calculateTotalDays = (startDate: Date, endDate: Date): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Reset time to start of day for accurate calculation
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays + 1; // +1 to include both start and end dates
};
