export const getFileNameFromUrl = (url: URL): string => {
  const pathName = url.pathname.split('/').filter(Boolean).pop();
  if (!pathName) return url.hostname;
  try {
    return decodeURIComponent(pathName);
  } catch {
    return pathName;
  }
};

const SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i;
const AUTHORITY_SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:\/\//i;
const ALLOWED_WEBSITE_PROTOCOLS = new Set(['http:', 'https:', 'ftp:', 'mailto:']);

export const normalizeWebsiteUrl = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const hasScheme = AUTHORITY_SCHEME_PATTERN.test(trimmed) || (SCHEME_PATTERN.test(trimmed) && !/^[^:/]+:\d/.test(trimmed));
  try {
    const url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
    return ALLOWED_WEBSITE_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

export const parseServerAddress = (address: string): URL => {
  const trimmed = address.trim();
  const target = new URL(AUTHORITY_SCHEME_PATTERN.test(trimmed) ? trimmed : `http://${trimmed}`);
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    throw new Error('Server addresses must use HTTP or HTTPS.');
  }
  return target;
};
