const BASE_URL = 'https://directify.app/api';

export function getConfig() {
  const token = process.env.DIRECTIFY_API_TOKEN;
  const directoryId = process.env.DIRECTIFY_DIRECTORY_ID;

  if (!token) {
    throw new Error('DIRECTIFY_API_TOKEN environment variable is required');
  }

  return { token, directoryId };
}

export function resolveDirectory(directoryId) {
  const dir = directoryId || getConfig().directoryId;
  if (!dir) {
    throw new Error(
      'No directory ID provided. Pass directory_id parameter or set DIRECTIFY_DIRECTORY_ID environment variable.'
    );
  }
  return dir;
}

async function request(method, path, body = null) {
  const { token } = getConfig();

  const url = `${BASE_URL}${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const options = { method, headers };
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  if (res.status === 401) {
    throw new Error('Authentication failed. Check your DIRECTIFY_API_TOKEN.');
  }
  if (res.status === 403) {
    throw new Error('Access denied. You do not have permission to access this resource.');
  }
  if (res.status === 404) {
    throw new Error('Resource not found.');
  }
  if (res.status === 422) {
    const data = await res.json();
    const errors = data.errors
      ? Object.entries(data.errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('\n')
      : data.message || 'Validation failed';
    throw new Error(`Validation error:\n${errors}`);
  }
  if (res.status === 429) {
    throw new Error('Rate limit exceeded (120 requests/minute). Please wait and retry.');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error (${res.status}): ${text || res.statusText}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};
