import crypto from 'crypto';

/**
 * =====================================================================
 *  توليد كود التفعيل - Activation code generator
 * =====================================================================
 *  ⚠️ الصيغة دي مؤقتة (HMAC-SHA256). لازم تتبدل بنفس الخوارزمية اللي
 *  MEP LAB Player بيتحقق بيها، وده الملف الوحيد اللي محتاج يتغير.
 *
 *  Placeholder format: HMAC-SHA256(LICENSE_SECRET,
 *     "MACHINECODE|COURSEID|EXPIRY") -> first 15 bytes -> Base32 -> XXXX-XXXX-...
 * =====================================================================
 */

const B32 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion

function base32(buf: Buffer) {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function normalizeMachineCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export function generateActivationCode(opts: {
  machineCode: string;
  courseId: string;
  expiresAt: string | null; // YYYY-MM-DD or null = lifetime
}) {
  const secret = process.env.LICENSE_SECRET;
  if (!secret || secret.startsWith('CHANGE-ME')) {
    throw new Error('LICENSE_SECRET is not configured');
  }
  const payload = `${normalizeMachineCode(opts.machineCode)}|${opts.courseId}|${opts.expiresAt ?? 'NEVER'}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest().subarray(0, 15);
  return base32(sig).match(/.{1,4}/g)!.join('-'); // 24 chars -> 6 groups
}
