export const authService = {
    login: jest.fn().mockResolvedValue({ user: { uid: 'user-1' } }),
    logout: jest.fn().mockResolvedValue(true),
    register: jest.fn().mockResolvedValue({ user: { uid: 'new-user' } }),
    getCurrentUser: jest.fn().mockReturnValue({ uid: 'user-1', email: 'test@example.com' }),
};
