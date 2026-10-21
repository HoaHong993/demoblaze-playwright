import { randomBytes } from 'crypto';

/** Unique username so parallel runs / CI re-runs never collide. */
export const uniqueUsername = (prefix = 'qa'): string =>
  `${prefix}_${Date.now()}_${randomBytes(3).toString('hex')}`;

export const randomPassword = (): string => `Pw_${randomBytes(6).toString('hex')}`;
