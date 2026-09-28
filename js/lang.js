/**
 * MOTEUR DE LOCALISATION - Géraud BERTRAND
 * Gère le chargement asynchrone des ressources par fichiers JSON.
 */

window.currentLang = localStorage.getItem('lang') || 'fr';
window.translations = {};
window.activeNamespaces = [];

/**
 * Charge les fichiers JSON de traduction demandés
 * @param {string[]} namespaces - Ex: ['index', 'footer']
 */
window.loadTranslations = async function(namespaces) {
    window.activeNamespaces = namespaces;
    try {
        const loadPromises = namespaces.map(async (ns) => {
            const response = await fetch(`/js/traductions/${ns}.json`);
            if (!response.ok) throw new Error(`Erreur namespace: ${ns}`);
            const data = await response.json();

            if (data[window.currentLang]) {
                Object.assign(window.translations, data[window.currentLang]);
            }
        });

        await Promise.all(loadPromises);
        translateDOM();
        updateLanguageUI();
    } catch (error) {
        console.error("I18N Error:", error);
    }
};

/**
 * Parcourt le DOM pour traduire les éléments ayant l'attribut data-i18n
 */
function translateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (window.translations[key]) {
            // Si c'est un bouton avec une icône Lucide, on préserve l'icône
            const icon = el.querySelector('i[data-lucide]');
            if (icon) {
                el.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) node.textContent = window.translations[key];
                });
            } else {
                el.textContent = window.translations[key];
            }
        }
    });
}

/**
 * Alterne entre FR et EN
 */
window.toggleLanguage = async function() {
    const newLang = window.currentLang === 'fr' ? 'en' : 'fr';
    window.currentLang = newLang;
    localStorage.setItem('lang', newLang);
    window.translations = {};

    await window.loadTranslations(window.activeNamespaces);

    window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLang }));
};

/**
 * Met à jour l'interface utilisateur liée à la langue
 */
function updateLanguageUI() {
    const indicator = document.getElementById('lang-indicator');
    const mobileIndicator = document.getElementById('lang-indicator-mobile');
    if (indicator) indicator.textContent = window.currentLang.toUpperCase();
    if (mobileIndicator) mobileIndicator.textContent = window.currentLang.toUpperCase();
    document.documentElement.lang = window.currentLang;
}

window.addEventListener('DOMContentLoaded', () => {
    const initialNamespaces = ['navbar', 'footer'];
    var path = window.location.pathname;
    path = path.split('/').pop();
    path = path.substring(0, path.lastIndexOf('.'));

    if (path) initialNamespaces.push(path);
    if( path == "") initialNamespaces.push('index');
    window.loadTranslations(initialNamespaces);

    window.addEventListener('languageChanged', (e) => {
        console.log("Langue changée en:", e.detail);
    });
});