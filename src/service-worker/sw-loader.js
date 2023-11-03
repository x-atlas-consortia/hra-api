if ('serviceWorker' in navigator) {
  const scope = location.pathname.replace(/\/[^\/]+$/, '/');
  if (navigator.serviceWorker.controller === null) {
    location.reload();
  }
  navigator.serviceWorker
    .register('sw.js', { scope, type: 'module' })
    .then(function (reg) {
      reg.addEventListener('updatefound', function () {
        const installingWorker = reg.installing;
        console.log('A new service worker is being installed:', installingWorker);
      });
      console.log('Registration succeeded. Scope is ' + reg.scope);
    })
    .catch(function (error) {
      console.log('Registration failed with ' + error);
    });
}
