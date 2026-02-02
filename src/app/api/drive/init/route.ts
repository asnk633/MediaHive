import { NextRequest, NextResponse } from 'next/server';
import { initializeDriveStructure } from '@/lib/drive-init';

export async function POST(req: NextRequest) {
    try {
        // Optional: Add Admin Role Check logic here using session/token if required.
        // For now, we allow the call but in production, this should be protected.
        // Since we are moving fast, we'll assume the client triggering this is authorized (e.g. Admin Dashboard).

        // We can check a simple header or rely on middleware if present.

        const config = await initializeDriveStructure();

        return NextResponse.json({ success: true, config });
    } catch (error: any) {
        console.error("Drive Initialization Failed:", error);
        return NextResponse.json(
            { error: error.message || 'Failed to initialize Drive structure' },
            { status: 500 }
        );
    }
}
