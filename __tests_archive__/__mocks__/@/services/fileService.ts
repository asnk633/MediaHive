export const fileService = {
    uploadFile: jest.fn().mockResolvedValue('https://example.com/file.jpg'),
    deleteFile: jest.fn().mockResolvedValue(true),
};
