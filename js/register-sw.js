// Enregistrement Service Worker Miralocks
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Les Service Workers ne fonctionnent pas en local avec le protocole file://
    if (window.location.protocol === 'file:') {
      console.log('[SW] Service Worker désactivé en accès local (file://). Utilisez un serveur local (Live Server, etc.) pour tester la PWA.');
      return;
    }
    
    // Correction du chemin pour qu'il fonctionne depuis n'importe où
    const swPath = window.location.pathname.includes('/htdocs/') 
      ? './sw.js' 
      : '/sw.js';
      
    navigator.serviceWorker.register(swPath)
      .then(r => console.log('[SW] Enregistré:', r.scope))
      .catch(e => console.warn('[SW] Erreur:', e));
  });
}
