/**
 * Waits until the page has been loaded under the control of the service worker. sw-loader.js registers the service
 * worker and reloads the page once it takes control, so the first page load is not controlled.
 *
 * @param {import('playwright').Page} page - The page
 * @param {number} timeoutMs - Maximum time to wait
 */
export async function waitForServiceWorker(page, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const controlled = await page.evaluate(
        () =>
          document.readyState === 'complete' &&
          navigator.serviceWorker?.controller !== null &&
          performance.getEntriesByType('navigation')[0]?.workerStart > 0
      );
      if (controlled) {
        return;
      }
    } catch {
      // The page is reloading
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Timed out waiting for the service worker to control the page');
}
