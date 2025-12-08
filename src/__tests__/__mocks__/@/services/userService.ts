export const userService = {
    getUserProfile: jest.fn().mockResolvedValue({ uid: 'user-1', name: 'Mock User', role: 'guest' }),
    updateUserProfile: jest.fn().mockResolvedValue(true),
    getUsers: jest.fn().mockResolvedValue([]),
};
