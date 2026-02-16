import { SignupDto } from '../dtos/auth.dto';

interface OtpEntry {
  otp: string;
  data: SignupDto;
  expiresAt: number;
}

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

const store = new Map<string, OtpEntry>();

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

export function setOtp(email: string, otp: string, data: SignupDto): void {
  store.set(email.toLowerCase(), {
    otp,
    data,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  });
}

export function verifyOtp(email: string, otp: string): SignupDto | null {
  const entry = store.get(email.toLowerCase());
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(email.toLowerCase());
    return null;
  }
  if (entry.otp !== otp) return null;

  store.delete(email.toLowerCase());
  return entry.data;
}
