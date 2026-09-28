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

        window.addEventListener('languageChanged', (e) => {
            loadVoices(); // Recharger les voix pour correspondre à la nouvelle langue
        });
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
        menu.innerHTML = `<div class="p-4 text-[10px] text-slate-500 italic">Aucune voix détectée</div>`;
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
                 class="dropdown-item flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-violet-500/20 text-[10px] font-bold ${isSelected ? 'text-violet-400 bg-violet-500/10' : 'text-slate-300'}"
                 onclick="setVoice('${v.voiceURI}', '${v.name}')"
                 onkeydown="handleOptionKey(event, '${v.voiceURI}', '${v.name}')">
                <div class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-violet-400' : 'bg-slate-700'}"></div>
                ${v.name}
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
    const elements = 'button, a, h1, h2, h3, .inv-slot, img, [role="option"]';
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
 * 5. Interface Modal
 */
function createAccessModal() {
    if (document.getElementById('access-modal')) return;
    const modalHtml = `
        <div id="access-modal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm hidden opacity-0 transition-opacity duration-300">
            <div class="glass p-8 rounded-3xl border-2 border-violet-500/30 max-w-md w-full m-6 shadow-2xl scale-95 transition-transform duration-300" id="access-modal-content">
                <div class="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <h3 class="text-xl font-bold text-white flex items-center gap-3">
                        <i data-lucide="accessibility" class="text-violet-400"></i>
                        <span>Paramètres Inclusifs</span>
                    </h3>
                    <button onclick="window.toggleAccessModal()" class="text-slate-400 hover:text-white transition-colors p-2">
                        <i data-lucide="x" size="20"></i>
                    </button>
                </div>

                <div class="space-y-6 min-h-[60vh] max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                    <!-- Échelle -->
                    <div>
                        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Échelle du site</label>
                        <div class="grid grid-cols-3 gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-white/5">
                            <button onclick="setTextScale(1)" class="py-2 rounded-lg text-[10px] font-black scale-btn" data-scale="1">100%</button>
                            <button onclick="setTextScale(1.2)" class="py-2 rounded-lg text-[10px] font-black scale-btn" data-scale="1.2">120%</button>
                            <button onclick="setTextScale(1.4)" class="py-2 rounded-lg text-[10px] font-black scale-btn" data-scale="1.4">140%</button>
                        </div>
                    </div>

                    <!-- Audio & Custom Dropdown -->
                    <div>
                        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Audio & Synthèse</label>
                        <div class="space-y-3">
                            <button onclick="window.toggleSound()" class="w-full flex items-center justify-between p-3.5 bg-slate-900/40 rounded-xl border border-white/5 hover:bg-violet-500/10 transition-all group">
                                <div class="flex items-center gap-3">
                                    <i data-lucide="volume-2" class="text-slate-400 group-hover:text-violet-400" size="18"></i>
                                    <span class="text-xs font-bold text-slate-200">Mode Narrateur</span>
                                </div>
                                <div id="sound-status-dot" class="w-2.5 h-2.5 rounded-full bg-slate-600 shadow-sm"></div>
                            </button>
                            
                            <!-- Custom Select (Dropdown personnalisé) -->
                            <div class="custom-dropdown relative">
                                <button id="voice-dropdown-trigger" 
                                        aria-haspopup="listbox" 
                                        aria-expanded="false"
                                        onclick="toggleVoiceDropdown()"
                                        class="w-full flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-white/5 hover:border-violet-500/50 transition-all group">
                                    <div class="flex items-center gap-3">
                                        <i data-lucide="mic" class="text-slate-500 group-hover:text-violet-400" size="16"></i>
                                        <span id="selected-voice-name" class="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Choisir une voix</span>
                                    </div>
                                    <i data-lucide="chevron-down" class="text-slate-600" size="16"></i>
                                </button>
                                
                                <div id="voice-dropdown-menu" 
                                     role="listbox"
                                     class="hidden absolute top-full left-0 w-full mt-2 glass rounded-2xl border border-violet-500/30 p-2 z-50 max-h-48 overflow-y-auto shadow-2xl">
                                    <!-- Populated by loadVoices() -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Vision -->
                    <div>
                        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Filtres de Vision</label>
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="setVisionMode('none')" class="access-btn text-left p-3 rounded-xl border border-white/5 text-[10px] font-bold uppercase" data-mode="none">Standard</button>
                            <button onclick="setVisionMode('protanopia')" class="access-btn text-left p-3 rounded-xl border border-white/5 text-[10px] font-bold uppercase" data-mode="protanopia">Protanopie</button>
                            <button onclick="setVisionMode('deuteranopia')" class="access-btn text-left p-3 rounded-xl border border-white/5 text-[10px] font-bold uppercase" data-mode="deuteranopia">Deutéranopie</button>
                            <button onclick="setVisionMode('tritanopia')" class="access-btn text-left p-3 rounded-xl border border-white/5 text-[10px] font-bold uppercase" data-mode="tritanopia">Tritanopie</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (window.lucide) window.lucide.createIcons();
    loadVoices();
    updateAccessUI();
}

window.toggleAccessModal = function() {
    const modal = document.getElementById('access-modal');
    if (!modal) return;
    const isHidden = modal.classList.contains('hidden');
    if (isHidden) {
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('opacity-100'), 10);
    } else {
        modal.classList.remove('opacity-100');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
};

function updateAccessUI() {
    const mode = localStorage.getItem(ACCESS_KEYS.VISION) || 'none';
    const scale = localStorage.getItem(ACCESS_KEYS.SCALE) || 1;
    const sound = localStorage.getItem(ACCESS_KEYS.SOUND) === 'true';

    // Update vision buttons
    document.querySelectorAll('.access-btn').forEach(btn => {
        btn.classList.toggle('border-violet-500', btn.dataset.mode === mode);
        btn.classList.toggle('bg-violet-500/10', btn.dataset.mode === mode);
    });

    // Update scale buttons
    document.querySelectorAll('.scale-btn').forEach(btn => {
        btn.classList.toggle('bg-violet-600', btn.dataset.scale == scale);
        btn.classList.toggle('text-white', btn.dataset.scale == scale);
    });

    // Update sound toggle
    const dot = document.getElementById('sound-status-dot');
    if (dot) {
        dot.classList.toggle('bg-green-500', sound);
        dot.classList.toggle('shadow-green-500/50', sound);
        dot.classList.toggle('bg-slate-600', !sound);
    }
}