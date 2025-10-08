(function() {
    const netlify = '.varify-html-Y9Mo6vDVaz, .trustpilot-placeholder, body.zoom-image--enabled .vault-active, .usp-wrapper, .bundle-description';
    
    function removeElements() {
        document.querySelectorAll(netlify).forEach(el => el.remove());
    }
    
    // Verwijder elementen zodra DOM klaar is
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeElements);
    } else {
        removeElements();
    }
    
    // Monitor voor nieuwe elementen
    const observer = new MutationObserver(() => {
        removeElements();
    });
    
    // Start observer zodra body beschikbaar is
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }
})();
