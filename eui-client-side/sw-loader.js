// Registers the HRA API service worker (sw.js next to the page) and reloads the page once it takes control, so that
// the page's API requests are answered by the service worker
if ('serviceWorker' in navigator) {
  // Resolve against the page, not the document base (e.g., the EUI sets <base href> to its CDN)
  const scope = new URL('./', location.href);
  if (navigator.serviceWorker.controller === null) {
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
  }
  navigator.serviceWorker
    .register(new URL('sw.js', scope), { scope, type: 'module' })
    .then((reg) => console.log('HRA API service worker registered, scope is ' + reg.scope))
    .catch((error) => console.error('HRA API service worker registration failed:', error));
}
