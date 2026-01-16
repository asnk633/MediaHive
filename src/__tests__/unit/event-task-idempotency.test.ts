/**
 * @jest-environment node
 */
import { EventTaskService } from '../../lib/event-task.server';
import { adminDb } from '../../lib/firebase/server';

jest.mock('firebase-admin/firestore', () => ({
    FieldValue: {
        serverTimestamp: jest.fn().mockReturnValue('MOCK_TIMESTAMP'),
    },
}));

// Mock Firebase Admin (Relative)
jest.mock('../../lib/firebase/server', () => ({
    adminDb: {
        collection: jest.fn(),
    },
}));
// Mock Firebase Admin (Alias)
jest.mock('@/lib/firebase/server', () => ({
    adminDb: {
        collection: jest.fn(),
    },
}));

describe('EventTaskService Logic', () => {
    let mockCollection: jest.Mock;
    let mockWhere: jest.Mock;
    let mockLimit: jest.Mock;
    let mockGet: jest.Mock;
    let mockAdd: jest.Mock;
    let mockDoc: jest.Mock;
    let mockUpdate: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup Firestore Chain Mocks
        mockAdd = jest.fn().mockResolvedValue({ id: 'new-task-id' });
        mockUpdate = jest.fn().mockResolvedValue({});

        mockDoc = jest.fn().mockReturnValue({
            id: 'existing-task-id',
            ref: { update: mockUpdate }, // For task update via ref
            get: jest.fn(),
            update: mockUpdate,
            data: jest.fn().mockReturnValue({ status: 'todo', tags: ['Old Tag'] })
        });

        // Query Chain
        mockGet = jest.fn();
        mockLimit = jest.fn().mockReturnValue({ get: mockGet });
        mockWhere = jest.fn().mockReturnValue({ limit: mockLimit, get: mockGet });
        mockCollection = jest.fn().mockReturnValue({
            where: mockWhere,
            add: mockAdd,
            doc: mockDoc
        });

        (adminDb.collection as jest.Mock).mockImplementation(mockCollection);
    });

    test('should replace tags authoritatively on update', async () => {
        // Mock existing task
        mockGet.mockResolvedValue({
            empty: false,
            docs: [mockDoc()]
        });

        const fullEventState = {
            title: 'Updated Event',
            mediaCoverage: ['Video'], // Changed from ['Old Tag']
            date: '2023-12-31'
        };
        const updates = { mediaCoverage: ['Video'] };

        await EventTaskService.syncTaskForEvent('evt-1', fullEventState, updates);

        // Expect Update with authoritative tags
        expect(mockUpdate).toHaveBeenCalled();
        const updatePayload = mockUpdate.mock.calls[0][0];
        expect(updatePayload.tags).toEqual(['Video', 'Event Coverage']); // Strict check
    });

    test('should cancel task if media coverage is removed', async () => {
        // Mock existing task
        mockGet.mockResolvedValue({
            empty: false,
            docs: [mockDoc()]
        });

        // Empty media coverage
        const fullEventState = {
            title: 'Event',
            mediaCoverage: [],
            date: '2023-12-31'
        };
        const updates = { mediaCoverage: [] };

        await EventTaskService.syncTaskForEvent('evt-1', fullEventState, updates);

        // Expect Cancellation
        expect(mockUpdate).toHaveBeenCalled();
        const updatePayload = mockUpdate.mock.calls[0][0];
        expect(updatePayload.status).toBe('cancelled');
    });
});
