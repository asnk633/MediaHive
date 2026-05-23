export const CanonicalDataService = {
    getTasks: jest.fn().mockResolvedValue([]),
    getUsers: jest.fn().mockResolvedValue([]),
    subscribeToTasks: jest.fn().mockImplementation((filters, onNext, onError) => {
        onNext([]);
        return jest.fn();
    })
};
