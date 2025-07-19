
async function getWebsiteIcon(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const appleTouchIcon = doc.querySelector('link[rel="apple-touch-icon"]');
    if (appleTouchIcon) {
      const href = appleTouchIcon.getAttribute('href');
      if (href) {
        return new URL(href, url).href;
      }
    }

    const iconLink = doc.querySelector('link[rel="icon"][type="image/png"]') || doc.querySelector('link[rel="icon"]');
    if (iconLink) {
      const href = iconLink.getAttribute('href');
      if (href) {
        return new URL(href, url).href;
      }
    }

  } catch (error) {
    console.error('Error fetching and parsing HTML for icon:', error);
  }

  return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;
}

export { getWebsiteIcon };
