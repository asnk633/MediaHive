/**
 * Email Service (Production Ready Hook)
 * This service handles branded HTML email generation and dispatch.
 * Currently configured to log to console for development.
 */
export const EmailService = {
    /**
     * Send a branded invitation email
     */
    sendInvitation: async (email: string, inviteLink: string, institutionName: string = 'MediaHive') => {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #050505; color: #ffffff; margin: 0; padding: 40px 20px; }
        .container { max-width: 500px; margin: auto; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 32px; padding: 40px; text-align: center; }
        .logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; margin-bottom: 32px; color: #3b82f6; }
        h2 { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 12px; }
        p { font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.5); margin-bottom: 32px; }
        .cta { display: inline-block; background: #3b82f6; color: #ffffff; padding: 18px 32px; border-radius: 16px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3); }
        .footer { font-size: 11px; color: rgba(255, 255, 255, 0.2); margin-top: 40px; text-transform: uppercase; letter-spacing: 1px; }
        .divider { height: 1px; background: rgba(255, 255, 255, 0.05); margin: 32px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">MEDIAHIVE</div>
        <h2>You're invited</h2>
        <p>You’ve been invited to join <b>MediaHive</b> team for <b>${institutionName}</b>. Set up your account to get started.</p>
        
        <a href="${inviteLink}" class="cta">Accept Invitation</a>

        <div class="divider"></div>
        <p style="font-size: 12px; margin-bottom: 0;">This link expires in 24 hours.</p>
        <div class="footer">Secure Enterprise Content Management</div>
    </div>
</body>
</html>
        `;

        console.log('--- [SENDING EMAIL] ---');
        console.log(`To: ${email}`);
        console.log(`Subject: You're invited to MediaHive`);
        console.log(`Content Type: text/html`);
        console.log(html);
        console.log('--- [EMAIL SENT] ---');

        // PRODUCTION HOOK:
        // if (process.env.RESEND_API_KEY) {
        //     await resend.emails.send({
        //         from: 'MediaHive <onboarding@mediahive.app>',
        //         to: email,
        //         subject: "You're invited to MediaHive",
        //         html: html
        //     });
        // }

        return true;
    }
};
