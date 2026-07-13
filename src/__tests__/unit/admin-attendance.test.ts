// src/__tests__/unit/admin-attendance.test.ts
import { GET } from '../../app/api/admin/attendance/route';
import { GET as GETExport } from '../../app/api/admin/exports/attendance/route';
import { verifyUser } from '../../lib/verifyUser';
import { getDb } from '../../db';
import { logExportAction } from '../../utils/exportHelpers';

jest.mock('next/server', () => {
  class MockNextResponse {
    static json(body: any, init?: any) {
      return new MockNextResponse(JSON.stringify(body), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(init?.headers || {})
        }
      });
    }

    status: number;
    bodyText: string;
    headers: {
      get: (name: string) => string | null;
    };

    constructor(bodyText: any, init?: any) {
      this.bodyText = typeof bodyText === 'string' ? bodyText : JSON.stringify(bodyText);
      this.status = init?.status ?? 200;
      const headerRecord: Record<string, string> = {};
      if (init?.headers) {
        for (const [k, v] of Object.entries(init.headers)) {
          headerRecord[k.toLowerCase()] = String(v);
        }
      }
      this.headers = {
        get: (name: string) => headerRecord[name.toLowerCase()] || null
      };
    }

    async json() {
      return JSON.parse(this.bodyText);
    }

    async text() {
      return this.bodyText;
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: jest.fn().mockImplementation((url, init) => {
      return {
        url,
        json: async () => init?.body ? JSON.parse(init.body) : {},
        headers: {
          get: (name: string) => init?.headers?.[name] || null
        }
      };
    })
  };
});

// Setup mock records for Drizzle and Supabase
const mockAttendanceRecords = [
  {
    id: 1,
    userId: 10,
    checkIn: '2026-07-07T09:00:00Z',
    checkOut: '2026-07-07T17:00:00Z',
    institution_id: 2,
    department_id: 3,
    tenantId: 100,
    notes: 'Test Attendance',
    status: 'present',
    workedMinutes: 480,
    lateArrival: false,
    earlyExit: false,
    fullName: 'John Doe',
    email: 'john@example.com'
  }
];

// Supabase returns camelCase columns which get normalized
const mockSupabaseRecords = [
  {
    id: 1,
    userId: 10,
    checkInTime: '2026-07-07T09:00:00Z',
    checkOutTime: '2026-07-07T17:00:00Z',
    checkInSource: 'nfc',
    checkOutSource: 'nfc',
    attendanceState: 'completed',
    workMode: 'office',
    closeReason: null,
    campusName: 'Main Campus',
    campusId: 'campus-1',
    isHoliday: false,
    isWeekend: false,
    presenceStatus: 'present',
    geofenceViolations: null,
    deviceName: 'iPhone',
    userName: 'John Doe',
    createdAt: '2026-07-07T09:00:00Z',
  }
];

const mockNormalizedRecords = [
  {
    id: 1,
    userId: 10,
    fullName: 'John Doe',
    email: null,
    checkIn: '2026-07-07T09:00:00Z',
    checkOut: '2026-07-07T17:00:00Z',
    checkInSource: 'nfc',
    checkOutSource: 'nfc',
    attendanceState: 'completed',
    workMode: 'office',
    closeReason: null,
    campusName: 'Main Campus',
    campusId: 'campus-1',
    isHoliday: false,
    isWeekend: false,
    presenceStatus: 'present',
    geofenceViolations: null,
    deviceName: 'iPhone',
    status: 'present',
    notes: null,
    workedMinutes: 480,
    lateArrival: false,
    earlyExit: false,
    created_at: '2026-07-07T09:00:00Z',
  }
];

// Setup chainable Supabase mock
const mockRange = jest.fn();
const mockGte = jest.fn().mockReturnThis();
const mockLte = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();

const mockSelect = jest.fn().mockImplementation(() => ({
  order: jest.fn().mockImplementation(() => ({
    range: mockRange,
  })),
}));

const mockSupabase = {
  from: jest.fn().mockImplementation(() => ({
    select: mockSelect,
  })),
};

// Mock dependencies
jest.mock('../../lib/verifyUser', () => ({
  verifyUser: jest.fn(),
  getSupabaseAdmin: jest.fn(() => mockSupabase),
}));

jest.mock('../../db', () => ({
  getDb: jest.fn(),
}));

jest.mock('../../utils/exportHelpers', () => {
  const originalModule = jest.requireActual('../../utils/exportHelpers');
  return {
    ...originalModule,
    logExportAction: jest.fn().mockResolvedValue(undefined),
  };
});

const mockReq = (url: string) => {
  return {
    url,
    json: jest.fn(),
    headers: {
      get: jest.fn().mockReturnValue(null),
    },
  } as any;
};

describe('Admin Attendance API', () => {
  const mockDb = {
    select: jest.fn(),
    insert: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDb as jest.Mock).mockResolvedValue(mockDb);

    // Default mock setup for db.select() query chains (used in export route)
    mockDb.select.mockImplementation((fields) => {
      if (fields) {
        // Main query
        const chain: any = {
          from: () => chain,
          innerJoin: () => chain,
          where: () => chain,
          limit: () => chain,
          offset: () => chain,
          orderBy: () => chain,
          then: (resolve: any) => resolve(mockAttendanceRecords),
        };
        return chain;
      } else {
        // Admin user profile check query
        const chain: any = {
          from: () => chain,
          where: () => chain,
          limit: () => chain,
          then: (resolve: any) => resolve([{ id: 123, tenantId: 100, email: 'admin@test.com' }]),
        };
        return chain;
      }
    });

    // Default mock setup for Supabase query (used in GET route)
    mockRange.mockImplementation(() => ({
      gte: mockGte,
      lte: mockLte,
      eq: mockEq,
      then: jest.fn().mockImplementation((resolve) => resolve({ data: mockSupabaseRecords, error: null })),
    }));
  });

  describe('GET /api/admin/attendance', () => {
    it('returns 401 if user is unauthorized', async () => {
      (verifyUser as jest.Mock).mockResolvedValue(null);

      const res = await GET(mockReq('http://localhost/api/admin/attendance'));
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 403 if user is not admin/manager', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'member' });

      const res = await GET(mockReq('http://localhost/api/admin/attendance'));
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain('Forbidden');
    });

    it('returns 403 if tenant context is missing', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'admin', tenant_id: null });

      const res = await GET(mockReq('http://localhost/api/admin/attendance'));
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Missing tenant context');
    });

    it('returns 200 and queries list of attendance records with tenant scoping', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'admin', tenant_id: '100' });

      const res = await GET(mockReq('http://localhost/api/admin/attendance'));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockNormalizedRecords);
      expect(mockSupabase.from).toHaveBeenCalledWith('attendance');
    });

    it('applies search filters (startDate, endDate, userId)', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'admin', tenant_id: '100' });

      const url = 'http://localhost/api/admin/attendance?startDate=2026-07-01&endDate=2026-07-08&userId=10';
      const res = await GET(mockReq(url));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalledWith('attendance');
      expect(mockGte).toHaveBeenCalledWith('checkInTime', '2026-07-01');
      expect(mockLte).toHaveBeenCalledWith('checkInTime', '2026-07-08T23:59:59Z');
      expect(mockEq).toHaveBeenCalledWith('userId', '10');
    });

    it('returns 400 on invalid limit/offset parameters', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'admin', tenant_id: '100' });

      const resLimit = await GET(mockReq('http://localhost/api/admin/attendance?limit=-5'));
      expect(resLimit.status).toBe(400);

      const resOffset = await GET(mockReq('http://localhost/api/admin/attendance?offset=abc'));
      expect(resOffset.status).toBe(400);
    });
  });

  describe('GET /api/admin/exports/attendance', () => {
    it('returns 401 if user is unauthorized', async () => {
      (verifyUser as jest.Mock).mockResolvedValue(null);

      const res = await GETExport(mockReq('http://localhost/api/admin/exports/attendance'));
      expect(res.status).toBe(401);
    });

    it('returns 403 if user is not admin/manager', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'member' });

      const res = await GETExport(mockReq('http://localhost/api/admin/exports/attendance'));
      expect(res.status).toBe(403);
    });

    it('returns 403 if tenant context is missing', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'admin', tenant_id: null });

      const res = await GETExport(mockReq('http://localhost/api/admin/exports/attendance'));
      expect(res.status).toBe(403);
    });

    it('exports attendance data in JSON format by default', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'admin', tenant_id: '100', email: 'admin@test.com' });

      const res = await GETExport(mockReq('http://localhost/api/admin/exports/attendance?format=json'));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockAttendanceRecords);
      expect(logExportAction).toHaveBeenCalled();
    });

    it('exports attendance data in CSV format', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'admin', tenant_id: '100', email: 'admin@test.com' });

      const res = await GETExport(mockReq('http://localhost/api/admin/exports/attendance?format=csv'));
      const text = await res.text();

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('text/csv');
      expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="attendance_export_');
      expect(text).toContain('"Record ID","Employee Name","Email","Check In","Check Out"');
      expect(text).toContain('"John Doe"');
      expect(text).toContain('"john@example.com"');
      expect(logExportAction).toHaveBeenCalled();
    });
  });
});
