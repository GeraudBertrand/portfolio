/**
 * SYSTÈME D'ACCESSIBILITÉ - PORTFOLIO GÉRAUD BERTRAND
 * Gère les filtres de vision, la mise à l'échelle du texte et la synthèse vocale.
 */

const ACCESS_KEYS = {
    VISION: 'geraud_portfolio_vision',
    SCALE: 'geraud_portfolio_text_scale',
    SOUND: 'geraud_portfolio_sound_enabled',
    VOICE: 'geraud_portfolio_selected_voice'
};

window.currentLang = document.documentElement.lang; // la langue est celle de la page (/ en anglais, /fr/ en français)

let availableVoices = [];

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', () => {
    injectSVGFilters();
    initAccessibility();
    createAccessModal();
    setupAudioNarrator();
    
    if (window.speechSynthesis) {
        // Chargement initial et écouteur pour les navigateurs lents (Chrome/Edge)
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Fermeture des menus au clic extérieur
    window.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown') && !e.target.closest('.dropdown-trigger')) {
            closeAllDropdowns();
        }
    });

    
});

/**
 * 1. Injection des filtres SVG (Daltonisme)
 */
function injectSVGFilters() {
    if (document.getElementById('accessibility-filters')) return;
    const svgHtml = `
        <svg id="accessibility-filters" style="display:none" version="1.1" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="protanopia-filter"><feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0 0.558, 0.442, 0, 0, 0 0, 0.242, 0.758, 0, 0 0, 0, 0, 1, 0" /></filter>
                <filter id="deuteranopia-filter"><feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0 0.7, 0.3, 0, 0, 0 0, 0.3, 0.7, 0, 0 0, 0, 0, 1, 0" /></filter>
                <filter id="tritanopia-filter"><feColorMatrix type="matrix" values="0.95, 0.05,  0, 0, 0 0,  0.433, 0.567, 0, 0 0,  0.475, 0.525, 0, 0 0,  0, 0, 1, 0" /></filter>
            </defs>
        </svg>`;
    document.body.insertAdjacentHTML('beforeend', svgHtml);
}

/**
 * 2. Gestion des Voix & Custom Dropdown
 */
function loadVoices() {
    availableVoices = window.speechSynthesis.getVoices();
    const menu = document.getElementById('voice-dropdown-menu');
    const triggerText = document.getElementById('selected-voice-name');
    if (!menu) return;

    const currentLang = window.currentLang === 'fr' ? 'fr' : 'en';
    const filteredVoices = availableVoices.filter(v => v.lang.startsWith(currentLang));
    const savedVoiceURI = localStorage.getItem(ACCESS_KEYS.VOICE);

    if (filteredVoices.length === 0) {
        menu.innerHTML = `<div class="dropdown-item">${currentLang === 'fr' ? 'Aucune voix détectée' : 'No voice found'}</div>`;
        return;
    }

    // Génération des items personnalisés
    menu.innerHTML = filteredVoices.map(v => {
        const isSelected = v.voiceURI === savedVoiceURI;
        if (isSelected && triggerText) triggerText.innerText = v.name;

        return `
            <div role="option" 
                 aria-selected="${isSelected}"
                 tabindex="0"
                 class="dropdown-item"
                 onclick="setVoice('${v.voiceURI}', '${v.name}')"
                 onkeydown="handleOptionKey(event, '${v.voiceURI}', '${v.name}')">${v.name}
            </div>
        `;
    }).join('');
}

window.setVoice = function(uri, name) {
    localStorage.setItem(ACCESS_KEYS.VOICE, uri);
    const triggerText = document.getElementById('selected-voice-name');
    if (triggerText) triggerText.innerText = name;
    
    closeAllDropdowns();
    loadVoices(); // Refresh selection visual
    announceText(window.currentLang === 'fr' ? "Voix mise à jour" : "Voice updated");
};


/**
 * 3. Accessibilité Clavier & Focus
 */
window.toggleVoiceDropdown = function() {
    const menu = document.getElementById('voice-dropdown-menu');
    const trigger = document.getElementById('voice-dropdown-trigger');
    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
    
    trigger.setAttribute('aria-expanded', !isExpanded);
    menu.classList.toggle('hidden');
    
    if (!isExpanded) {
        // Focus le premier élément si on ouvre
        const firstOption = menu.querySelector('[role="option"]');
        if (firstOption) setTimeout(() => firstOption.focus(), 10);
    }
};

window.handleOptionKey = function(e, uri, name) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setVoice(uri, name);
        document.getElementById('voice-dropdown-trigger').focus();
    }
    if (e.key === 'Escape') {
        closeAllDropdowns();
        document.getElementById('voice-dropdown-trigger').focus();
    }
};

function closeAllDropdowns() {
    const menu = document.getElementById('voice-dropdown-menu');
    const trigger = document.getElementById('voice-dropdown-trigger');
    if (menu && trigger) {
        menu.classList.add('hidden');
        trigger.setAttribute('aria-expanded', 'false');
    }
}


/**
 * 3. Initialisation des réglages sauvés
 */
function initAccessibility() {
    setVisionMode(localStorage.getItem(ACCESS_KEYS.VISION) || 'none');
    setTextScale(localStorage.getItem(ACCESS_KEYS.SCALE) || 1);
}

window.setVisionMode = function(mode) {
    document.body.classList.remove('protanopia', 'deuteranopia', 'tritanopia', 'grayscale');
    if (mode !== 'none') document.body.classList.add(mode);
    localStorage.setItem(ACCESS_KEYS.VISION, mode);
    updateAccessUI();
};

window.setTextScale = function(scale) {
    document.documentElement.style.setProperty('--text-multiplier', scale);
    localStorage.setItem(ACCESS_KEYS.SCALE, scale);
    updateAccessUI();
};

window.toggleSound = function() {
    const isEnabled = !(localStorage.getItem(ACCESS_KEYS.SOUND) === 'true');
    localStorage.setItem(ACCESS_KEYS.SOUND, isEnabled);
    if (isEnabled) announceText(window.currentLang === 'fr' ? "Narrateur activé" : "Narrator enabled");
    updateAccessUI();
};

/**
 * 4. Synthèse Vocale (Text-to-Speech)
 */
function setupAudioNarrator() {
    const elements = 'button, a, h1, h2, h3, .registre li, img, [role="option"]';
    document.addEventListener('mouseover', (e) => {
        if (localStorage.getItem(ACCESS_KEYS.SOUND) !== 'true') return;
        const target = e.target.closest(elements);
        if (target && target !== window.lastSpokenElement) {
            let text = target.tagName === 'IMG' ? target.alt : target.innerText;
            if (text) announceText(text);
            window.lastSpokenElement = target;
        }
    });
}

function announceText(text) {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    const savedVoiceURI = localStorage.getItem(ACCESS_KEYS.VOICE);
    const voice = availableVoices.find(v => v.voiceURI === savedVoiceURI);
    if (voice) msg.voice = voice;
    msg.lang = window.currentLang === 'fr' ? 'fr-FR' : 'en-US';
    msg.rate = 1.1;
    window.speechSynthesis.speak(msg);
}
/**
 * 5. Fenêtre d'accessibilité (styles .modale* dans grimoire.css, état actif par aria-pressed)
 */
const ACCESS_TEXT = {
    en: { title: 'Accessibility', close: 'Close', scale: 'Text size', audio: 'Narrator', narrator: 'Read aloud what the pointer touches',
          voice: 'Choose a voice', vision: 'Colour filters', none: 'Standard', protanopia: 'Protanopia', deuteranopia: 'Deuteranopia', tritanopia: 'Tritanopia' },
    fr: { title: 'Accessibilité', close: 'Fermer', scale: 'Taille du texte', audio: 'Narrateur', narrator: 'Lire à voix haute ce que touche le pointeur',
          voice: 'Choisir une voix', vision: 'Filtres de couleur', none: 'Standard', protanopia: 'Protanopie', deuteranopia: 'Deutéranopie', tritanopia: 'Tritanopie' }
};

function createAccessModal() {
    if (document.getElementById('access-modal')) return;
    const t = ACCESS_TEXT[window.currentLang === 'fr' ? 'fr' : 'en'];
    const vision = ['none', 'protanopia', 'deuteranopia', 'tritanopia']
        .map(m => `<button type="button" class="access-btn" data-mode="${m}" onclick="setVisionMode('${m}')">${t[m]}</button>`).join('');
    const echelle = [1, 1.2, 1.4]
        .map(s => `<button type="button" class="scale-btn" data-scale="${s}" onclick="setTextScale(${s})">${Math.round(s * 100)} %</button>`).join('');

    document.body.insertAdjacentHTML('beforeend', `
        <div id="access-modal" class="modale hidden" onclick="if (event.target === this) window.toggleAccessModal()">
            <div class="modale-boite" role="dialog" aria-modal="true" aria-labelledby="access-titre">
                <header>
                    <h3 id="access-titre" class="gothique">${t.title}</h3>
                    <button type="button" class="modale-fermer" onclick="window.toggleAccessModal()">${t.close}</button>
                </header>
                <fieldset><legend>${t.scale}</legend><div class="modale-grille" style="--col:3">${echelle}</div></fieldset>
                <fieldset>
                    <legend>${t.audio}</legend>
                    <button type="button" id="sound-toggle" class="modale-ligne" onclick="window.toggleSound()"><span>${t.narrator}</span><i id="sound-status-dot" class="temoin" aria-hidden="true"></i></button>
                    <div class="custom-dropdown">
                        <button type="button" id="voice-dropdown-trigger" class="modale-ligne dropdown-trigger" aria-haspopup="listbox" aria-expanded="false" onclick="toggleVoiceDropdown()"><span id="selected-voice-name">${t.voice}</span><span aria-hidden="true">▾</span></button>
                        <div id="voice-dropdown-menu" role="listbox" class="hidden"></div>
                    </div>
                </fieldset>
                <fieldset><legend>${t.vision}</legend><div class="modale-grille">${vision}</div></fieldset>
            </div>
        </div>`);
    loadVoices();
    updateAccessUI();
}

window.toggleAccessModal = function() {
    const modal = document.getElementById('access-modal');
    if (!modal) return;
    const ouvrir = modal.classList.contains('hidden');
    modal.classList.toggle('hidden', !ouvrir);
    if (ouvrir) {
        window.lastFocusBeforeModal = document.activeElement;
        modal.querySelector('.modale-fermer').focus();
    } else if (window.lastFocusBeforeModal) {
        window.lastFocusBeforeModal.focus();
    }
};

document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('access-modal');
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden') && !e.target.closest?.('[role="option"]')) window.toggleAccessModal();
});

function updateAccessUI() {
    const mode = localStorage.getItem(ACCESS_KEYS.VISION) || 'none';
    const scale = localStorage.getItem(ACCESS_KEYS.SCALE) || 1;
    const sound = localStorage.getItem(ACCESS_KEYS.SOUND) === 'true';

    document.querySelectorAll('.access-btn').forEach(btn => btn.setAttribute('aria-pressed', btn.dataset.mode === mode));
    document.querySelectorAll('.scale-btn').forEach(btn => btn.setAttribute('aria-pressed', btn.dataset.scale == scale));
    const toggle = document.getElementById('sound-toggle');
    if (toggle) toggle.setAttribute('aria-pressed', sound);
    const dot = document.getElementById('sound-status-dot');
    if (dot) dot.classList.toggle('actif', sound);
}
