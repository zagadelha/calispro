// Script para forçar limpeza total de cache
// Execute este arquivo no console do navegador ou adicione temporariamente ao App.jsx

(async () => {
    console.log('🧹 Iniciando limpeza completa de cache...');

    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(`📝 Encontrados ${registrations.length} service worker(s)`);

        for (const registration of registrations) {
            await registration.unregister();
            console.log('✅ Service worker removido');
        }
    }

    // 2. Clear all caches
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`📝 Encontrados ${cacheNames.length} cache(s)`);

        for (const cacheName of cacheNames) {
            await caches.delete(cacheName);
            console.log(`✅ Cache removido: ${cacheName}`);
        }
    }

    // 3. Clear localStorage
    console.log('📝 Limpando localStorage...');
    localStorage.clear();
    console.log('✅ localStorage limpo');

    // 4. Clear sessionStorage
    console.log('📝 Limpando sessionStorage...');
    sessionStorage.clear();
    console.log('✅ sessionStorage limpo');

    console.log('✨ Limpeza completa! Recarregando página...');

    // 5. Force hard reload
    window.location.reload(true);
})();
