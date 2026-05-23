import { NextResponse } from 'next/server';

// Mock in-memory storage for system updates
let mockUpdates: any[] = [];

export async function GET() {
    return NextResponse.json({ updates: mockUpdates });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newUpdate = {
            id: Date.now().toString(),
            ...body,
            created_at: new Date().toISOString(),
            created_by: { name: 'Admin' }
        };
        mockUpdates.unshift(newUpdate);
        return NextResponse.json({ success: true, update: newUpdate });
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
