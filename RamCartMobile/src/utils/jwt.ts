export interface JwtUserPayload {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  isAdmin?: boolean;
}

/**
 * Pure JavaScript Base64Url decoder for React Native
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  base64 = String(base64).replace(/=+$/, '');
  
  let bc = 0;
  let bs = 0;
  let buffer: string;

  for (let idx = 0; (buffer = base64.charAt(idx++)); ) {
    const charIndex = chars.indexOf(buffer);
    if (charIndex === -1) continue;

    bs = bc % 4 ? bs * 64 + charIndex : charIndex;
    if (bc++ % 4) {
      output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return output;
}

/**
 * Parses JWT token string and returns user metadata including isAdmin flag
 */
export function parseJwtUser(token: string | null): JwtUserPayload | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const jsonStr = base64UrlDecode(parts[1]);
    const parsed = JSON.parse(jsonStr);
    
    const userObj = parsed?.user || parsed;
    if (!userObj) return null;

    return {
      id: userObj.id || userObj._id,
      name: userObj.name,
      email: userObj.email,
      isAdmin: Boolean(userObj.isAdmin),
    };
  } catch (error) {
    console.warn('Failed to parse JWT payload', error);
    return null;
  }
}
