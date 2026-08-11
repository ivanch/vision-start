export const getFileNameFromUrl = (url: URL): string => {
  const pathName = url.pathname.split('/').filter(Boolean).pop();
  if (!pathName) return url.hostname;
  try {
    return decodeURIComponent(pathName);
  } catch {
    return pathName;
  }
};