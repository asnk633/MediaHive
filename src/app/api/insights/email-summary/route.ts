// src/app/api/insights/email-summary/route.ts
// Insights Email Summary API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '../../_lib/rbac';

export async function POST(req: NextRequest) {
  try {
    // Authorize user with RBAC
    const user = await authorizeByPermission(req, 'read:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { period, tenant } = body;

    // In a real implementation, you would send an actual email
    // For now, we'll just log the request and return success
    
    console.log(`Sending email summary for period: ${period}, tenant: ${tenant}`);
    
    // Simulate email sending
    // In a real implementation, you would integrate with an email service like SendGrid or Nodemailer
    
    return NextResponse.json(
      { message: 'Email summary sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/insights/email-summary]', error);
    return NextResponse.json(
      { error: 'Failed to send email summary' },
      { status: 500 }
    );
  }
}
