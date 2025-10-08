// (function() {
   // const netlify = '.varify-html-Y9Mo6vDVaz, .trustpilot-placeholder,  .vault-active, .usp-wrapper, .bundle-description, .bundle-container';
    
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
(function() {
    'use strict';
    
    // Verwijder CSS bestand op basis van href
    // var cssToRemove = '/custom.css';
    
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
        if (links[i].href && links[i].href.indexOf(cssToRemove) !== -1) {
            links[i].parentNode.removeChild(links[i]);
        }
    }
})();
