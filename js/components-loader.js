/**
 * COMPONENTS LOADER
 * Ce fichier doit être inclus sur toutes les pages.
 * Il gère l'injection de la Navbar et du Footer.
 */

/**
 * Injecte le contenu HTML d'un fichier externe dans un élément du DOM.
 * @param {string} elementId - L'ID de l'élément dans lequel le contenu sera injecté.
 * @param {string} filePath - Le chemin vers le fichier HTML à charger.
 * @returns {Promise<void>}
 */
async function includeComponent(elementId, filePath) {
    const container = document.getElementById(elementId);
    if (!container) return;

    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Erreur lors du chargement de ${filePath}`);
        const html = await response.text();
        container.innerHTML = html;
        
        // Rafraîchir les icônes Lucide pour les éléments injectés
        if (window.lucide) window.lucide.createIcons();
        
        // Mise à jour de l'année dans le footer si présent
        if (elementId === 'footer-placeholder') {
            const yearEl = container.querySelector('#year-placeholder'); // Assurez-vous d'avoir cet ID dans footer.html
            if (yearEl) yearEl.textContent = new Date().getFullYear();
        }
    } catch (err) {
        console.error("Erreur Component Loader:", err);
    }
}

// Fonction de menu mobile (nécessaire sur toutes les pages)
/**
 * Affiche ou masque le menu mobile.
 */
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden');
}

// Chargement automatique au chargement du DOM
document.addEventListener('DOMContentLoaded', async () => {
    await includeComponent('navbar-placeholder', '/src/components/navbar.html');
    await includeComponent('footer-placeholder', '/src/components/footer.html');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
});