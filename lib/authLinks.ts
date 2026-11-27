import { createAdminClient } from '@/lib/supabase/admin';

/**
 * A one-time "set a new password" link that lands on our own /auth/confirm page.
 * Made with the service role key, so it does not depend on Supabase's built-in mailer
 * (which is rate limited and does not deliver to most addresses). The link can be
 * e-mailed through Resend or handed to the student on WhatsApp by the admin.
 * Returns null when the e-mail has no account or the service key is missing.
 */
export async function recoveryLink(email: string, site: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email });
    const hash = data?.properties?.hashed_token;
    if (error || !hash) return null;
    return `${site.replace(/\/$/, '')}/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=recovery`;
  } catch {
    return null;
  }
}
