export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

// One message for every failure (unknown email, wrong password, locked) so nobody can probe which emails exist.
export const LOGIN_FAILED = `Wrong email or password. After ${MAX_FAILED_LOGINS} wrong tries, login pauses for ${LOCK_MINUTES} minutes.`;

export const isLocked = (lockedUntil: Date | null, now = new Date()) => !!lockedUntil && lockedUntil > now;

// After a wrong password: the new failure count, and a lock when it reaches the limit (count then starts over).
export function afterFailure(failedLogins: number, now = new Date()) {
  return failedLogins >= MAX_FAILED_LOGINS
    ? { failedLogins: 0, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60 * 1000) }
    : { failedLogins, lockedUntil: null };
}
