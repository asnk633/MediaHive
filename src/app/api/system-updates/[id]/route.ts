import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return NextResponse.json({
        id,
        title: "System Update",
        body: "This is a placeholder for the system update details.",
        severity: "info",
        created_at: new Date().toISOString()
    });
}
