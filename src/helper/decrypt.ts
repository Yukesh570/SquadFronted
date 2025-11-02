export function decodeJwtPayload() {
  const token = localStorage.getItem("token");
  if (!token) return { token: null, payload: null };

  const parts = token.split('.');
  if (parts.length !== 3) {
    console.warn('Not a JWT (expected 3 parts).');
    return { token, payload: null };
  }

  const payloadB64 = parts[1];
  try {
    const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
      + '=='.slice((2 - payloadB64.length * 3) & 3);

    const json = atob(base64); // browser built-in
    const payload = JSON.parse(json);
    return { token, payload };
  } catch (err) {
    console.error('Failed to decode JWT payload:', err);
    return { token, payload: null };
  }
}
