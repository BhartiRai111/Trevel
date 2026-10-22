export const mailConfigured = () => !!process.env.SMTP_HOST;
export const adminEmailList = () => (process.env.ADMIN_EMAILS ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
export const siteUrl = (req?: Request) => (process.env.SITE_URL || (req ? new URL(req.url).origin : 'http://localhost:3000')).replace(/\/$/, '');
