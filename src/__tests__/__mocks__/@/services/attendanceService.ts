export const attendanceService = {
    clockIn: jest.fn().mockResolvedValue({ id: 'att-1', type: 'in', timestamp: new Date().toISOString() }),
    clockOut: jest.fn().mockResolvedValue({ id: 'att-2', type: 'out', timestamp: new Date().toISOString() }),
    getAttendance: jest.fn().mockResolvedValue([]),
};
