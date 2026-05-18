/**
 * Generates or retrieves a unique hash for the current user/device based on localStorage.
 * Used for anonymous tracking and rate limiting on the client side.
 */
export function getIpHash(): string {
  if (typeof window === 'undefined') return '';
  let hash = localStorage.getItem('ir_ip_hash');
  if (!hash) {
    hash = 'u_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('ir_ip_hash', hash);
  }
  return hash;
}
