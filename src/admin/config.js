/* Owner Dashboard — DEMO configuration only.
 * The demo sign-in is a client-side gate so the owner can try the dashboard.
 * It is NOT security: anyone can read this file. Real accounts (hashed passwords,
 * server sessions, password reset) come with the production CMS. */
export const DEMO_OWNER = {
  email: 'owner@sciotohouse.test',
  password: 'brickyard-quarry-maple',
};

/** Failed sign-ins allowed before a short pause, and how long the pause lasts. */
export const LOCKOUT = { attempts: 5, seconds: 30 };

/** Which design option the "View on site" links open by default (changeable in Settings). */
export const DEFAULT_PREVIEW = 'fresh';
