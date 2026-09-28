/**
 * PORTFOLIO GÉRAUD BERTRAND - LOGIQUE ACCUEIL
 * Logique spécifique à la page d'accueil : inventaire, succès, animations.
 */

const UNLOCKED_ACHIEVEMENTS = new Set();
const TOTAL_SLOTS = 12;
/** @type {Project[]} */
let projectsData = []; // Stockage global pour les données chargées du JSON


/** @type {Experience[]} */
let experiencesData = []; // Stockage global pour les expériences chargées du JSON


/**
 * Déverrouille un succès et affiche une notification.
 * @param {string} id - Identifiant unique du succès.
 * @param {string} description - Texte à afficher (ou clé de traduction).
 */
function unlockAchievement(id, description) {
    if (UNLOCKED_ACHIEVEMENTS.has(id)) return;
    UNLOCKED_ACHIEVEMENTS.add(id);

    const container = document.getElementById('achievement-container');
    if (!container) return;

    const displayTitle = window.translations ? (window.translations['achievement_unlocked'] || "Succès déverrouillé") : "Succès déverrouillé";

    const toast = document.createElement('div');
    toast.className = 'achievement-toast glass px-6 py-4 rounded-2xl border-2 border-violet-500 flex items-center gap-4 shadow-2xl shadow-violet-500/20 pointer-events-auto w-fit max-w-sm';
    toast.innerHTML = `
        <div class="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-inner">
            <i data-lucide="trophy" size="20"></i>
        </div>
        <div>
            <h4 class="font-bold text-violet-400 text-[10px] uppercase tracking-widest">${displayTitle}</h4>
            <p class="text-white text-xs font-medium">${description}</p>
        </div>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 600);
    }, 3000);
}

// --- 2. CHARGEMENT DE LA BASE DE DONNÉES ---
/**
 * Charge les projets depuis le fichier JSON et les affiche dans l'inventaire. En cas d'erreur, affiche un message dans la grille.
 * @returns {Promise<void>}
 */
async function fetchProjects() {
    try {
        const response = await fetch('/js/projects.json');
        if (!response.ok) throw new Error("Impossible de charger les projets.");
        const rawData = await response.json();
        projectsData = rawData.map(data => new Project(data));
        renderInventory();
    } catch (error) {
        console.error("Erreur JSON:", error);
        const grid = document.getElementById('inventory-grid');
        if (grid) grid.innerHTML = '<p class="text-red-400 text-[10px] col-span-4 text-center italic text-white">Erreur de chargement des artefacts.</p>';
    }
}

// --- 3. GESTION DE L'INVENTAIRE ---
/**
 * Affiche les projets dans l'inventaire et met à jour le compteur. Les slots vides sont indiqués comme inaccessibles.
 * @returns {void}
 */
function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    const countLabel = document.getElementById('inventory-count');
    if (!grid) return;

    grid.innerHTML = '';

    const labelText = window.translations ? (window.translations['inventory_count_label'] || "Sac d'objets") : "Sac d'objets";
    if (countLabel) countLabel.textContent = `${labelText} (${projectsData.length}/${TOTAL_SLOTS})`;

    for (let i = 0; i < TOTAL_SLOTS; i++) {
        const slot = document.createElement('div');
        slot.className = 'inv-slot rounded-lg group';
        // add project id as data attribute to easily retrieve it on click without relying on index, which can change with i18n and re-rendering
        slot.dataset.projectId = projectsData[i] ? projectsData[i].id : '';
        if (projectsData[i]) {
            const project = projectsData[i];
            slot.innerHTML = `<i data-lucide="${project.icon}" class="text-slate-400 group-hover:text-white transition-colors" size="32"></i>`;
            slot.onclick = () => selectProject(project.id, slot);
        } else {
            slot.classList.add('opacity-20', 'cursor-not-allowed');
        }
        grid.appendChild(slot);
    }
    if (window.lucide) window.lucide.createIcons();
}

/**
 * Affiche les détails d'un projet sélectionné dans la section dédiée.
 * @param {string} id 
 * @param {HTMLElement} slotElement 
 * @returns {void}
 */
function selectProject(id, slotElement) {
    const achDesc = window.currentLang === 'en' ? 'Observed one of my projects closely!' : 'Observé un de mes projets de plus près !';
    unlockAchievement('inv_item', achDesc);

    const project = projectsData.find(p => p.id === id);
    const content = document.getElementById('project-details-content');
    const placeholder = document.getElementById('project-details-placeholder');
    if (!project || !content || !placeholder) return;

    // Dictionnaire de traduction pour les raretés
    const rarityKey = `rarity_${project.rarity}`;
    const rarityLabel = window.translations[rarityKey] || project.rarity;

    document.querySelectorAll('.inv-slot').forEach(s => s.classList.remove('active'));
    slotElement.classList.add('active');

    content.classList.add('changing');
    setTimeout(() => {
        placeholder.classList.add('hidden');
        content.classList.remove('hidden');

        const linkButtonHtml = (project.link && project.link.trim() !== "") 
            ? `
            <a href="${project.link}" class="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3 text-sm shadow-lg shadow-violet-600/20 active:scale-95 group">
                <i data-lucide="external-link" size="18" class="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i> 
                ${window.translations.item_btn}
            </a>` 
            : "";

        content.innerHTML = `
            <div class="h-full glass rounded-2xl overflow-hidden border-2 border-${project.rarity} relative flex flex-col md:flex-row shadow-2xl">
                <div class="md:w-1/2 h-72 md:h-auto flex items-center justify-center bg-slate-950/30 p-4">
                    <img src="${project.image}" 
                         class="max-w-full max-h-full object-contain rounded-lg transition-transform duration-500 hover:scale-105"
                         alt="${project.title}">
                </div>
                <div class="md:w-1/2 p-8 flex flex-col justify-between text-white bg-slate-900/40 backdrop-blur-md border-l border-white/5">
                    <div>
                        <div class="flex justify-between items-start mb-4">
                            <span class="text-[10px] font-bold text-${project.rarity} uppercase tracking-widest bg-${project.rarity}/10 px-2 py-0.5 rounded border border-${project.rarity}/20">
                                ${window.translations.item_rarity_label} ${rarityLabel}
                            </span>
                            <span class="text-[10px] text-slate-500 uppercase font-bold tracking-widest italic">#${project.id}</span>
                        </div>
                        <h3 class="text-3xl font-extrabold mb-4 tracking-tighter">${project.title}</h3>
                        <p class="text-slate-300 text-sm leading-relaxed mb-6">
                            ${project.description}
                        </p>
                        <div class="flex flex-wrap gap-2">
                            ${project.stack.map(s => `<span class="px-2 py-1 bg-slate-800 border border-white/5 rounded text-[10px] text-slate-300">${s}</span>`).join('')}
                        </div>
                    </div>
                    <div class="mt-8 flex flex-col gap-3">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-[10px] text-slate-500 uppercase font-bold tracking-widest italic text-center">
                                ${window.translations.item_origin_label} : ${project.origin}
                            </span>
                            <span class="text-[10px] text-slate-500 uppercase font-bold tracking-widest italic text-center">
                                ${window.translations.item_date_label} : ${project.date}
                            </span>
                        </div>
                        ${linkButtonHtml}
                    </div>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        content.classList.remove('changing');
    }, 150);
}

// --- 4. MACHINE À ÉCRIRE ---
let charIndex = 0;
function type() {
    const el = document.getElementById('typewriter-text');
    if (!el) return;
    const typewriterText = el.getAttribute('data-text') || "";
    if (charIndex < typewriterText.length) {
        el.textContent += typewriterText.charAt(charIndex);
        charIndex++;
        setTimeout(type, 45);
    }
}

/**
 * Charge les expériences depuis le fichier JSON et les affiche dans la section dédiée. En cas d'erreur, affiche un message à la place.
 * @returns {Promise<void>}
 */
async function fetchExp(){
    try{
        const response = await fetch('/js/exp.json');
        if (!response.ok) throw new Error("Impossible de charger les expériences.");
        const rawData = await response.json();
        experiencesData = rawData.map(data => new Experience(data));
        renderExperiences();
    } catch (error) {
        console.error("Erreur JSON:", error);
        const expSection = document.getElementById('experience-timeline');
        if (expSection) expSection.innerHTML = '<p class="text-red-400 text-[10px] col-span-4 text-center italic text-white">Erreur de chargement des expériences.</p>';
    }
}

/**
 * Affiche les expériences dans la section dédiée en utilisant les données chargées. Chaque expérience est présentée avec une mise en page spécifique, incluant un point sur le fil d'Ariane, une carte détaillée et des animations de révélation au scroll.
 * @returns 
 */
function renderExperiences() {
    const container = document.getElementById('experience-timeline');
    if (!container) return;

    container.innerHTML = '';

    experiencesData.forEach((exp, index) => {
        const item = document.createElement('div');
        item.className = 'timeline-item reveal';
        
        const schemaTheme =exp.colorTheme // Utilisation du thème de couleur basé sur la rareté
        // Couleur dynamique basée sur la rareté
        const colorClass = schemaTheme.border; // Exemple : 'border-slate-400' ou 'border-blue-500/50'
        const textClass = schemaTheme.text;
        const bgClass = schemaTheme.bg;
        const dotClass = schemaTheme.dot;

        item.innerHTML = `
            <div class="timeline-dot ${dotClass}"></div>
            <div class="glass p-6 rounded-2xl border-l-4 ${colorClass} hover:bg-slate-900/60 transition-all group">
                <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center ${textClass} border border-white/5">
                            <i data-lucide="${exp.icon}" size="24"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-[10px] font-bold ${textClass} uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/10">${exp.origin}</span>
                                <span class="text-[9px] font-black text-white uppercase ${bgClass} px-1.5 py-0.5 rounded shadow-sm">${exp.typeLabel}</span>
                            </div>
                            <h3 class="text-xl font-extrabold text-white tracking-tight">${exp.title}</h3>
                        </div>
                    </div>
                    <div class="md:text-right">
                        <span class="text-xs font-bold text-slate-500 uppercase tracking-tighter italic">${exp.period}</span>
                    </div>
                </div>
                <p class="text-sm text-slate-300 leading-relaxed mb-6 border-l-2 border-white/5 pl-4">
                    ${exp.description}
                </p>
                <div class="flex flex-wrap gap-2">
                    ${exp.stack.map(s => `<span class="px-2 py-1 bg-slate-800/50 border border-white/5 rounded text-[10px] font-medium text-slate-400 uppercase">${s}</span>`).join('')}
                </div>
            </div>
        `;
        container.appendChild(item);
    });

    // Réinitialisation des icônes Lucide pour les éléments injectés
    if (window.lucide) window.lucide.createIcons();
}

window.addEventListener('load', () => {
    fetchProjects();
    fetchExp();
    setTimeout(type, 800);

    const skillBoxes = document.querySelectorAll('.skill-box');
    skillBoxes.forEach(box => {
        box.addEventListener('mouseenter', () => {
            const desc = window.currentLang === 'en' ? "I have skills? Oh yes!" : "J'ai des compétences ? Ah oui !";
            unlockAchievement('skills_explore', desc);
        });
    });

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => { 
            if (e.isIntersecting) {
                e.target.classList.add('active'); 
                revealObserver.unobserve(e.target);
            }
        });
    }, { threshold: 0.1 });

    const observeReveals = () => {
        document.querySelectorAll('.reveal:not(.is-observed)').forEach(el => {
            revealObserver.observe(el);
            el.classList.add('is-observed');
        });
    };

    observeReveals();

    const domObserver = new MutationObserver(() => {
        observeReveals();
        const footer = document.querySelector('footer:not(.is-observed-success)');
        if (footer) {
            footer.classList.add('is-observed-success');
            new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) unlockAchievement('end', 'Faire le tour du portfolio !');
            }, { threshold: 0.5 }).observe(footer);
        }
    });

    domObserver.observe(document.body, { childList: true, subtree: true });

    const aboutEl = document.getElementById('a-propos');
    if (aboutEl) {
        new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) unlockAchievement('about', 'En apprendre un peu plus sur moi !');
        }, { threshold: 0.5 }).observe(aboutEl);
    }

    const ExpEl = document.getElementById('experiences');
    if (ExpEl) {
        new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) unlockAchievement('exp', 'Aventurier de classe S, j\'ai effectué beaucoup de mission !');
        }, { threshold: 0.5 }).observe(ExpEl);
    }

    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (!nav) return;
        if (window.scrollY > 50) {
            nav.classList.add('glass', 'shadow-2xl', 'py-2');
            nav.classList.remove('py-4');
        } else {
            nav.classList.remove('glass', 'shadow-2xl', 'py-2');
            nav.classList.add('py-4');
        }
    });

    // --- I18N ---
    // Update render projet and selected project when language changes
    window.addEventListener('languageChanged', (e) => {
        const activeSlot = document.querySelector('.inv-slot.active');
        if(!activeSlot) return;
        const projectId = activeSlot.dataset.projectId;
        renderInventory();
        const newActiveSlot = document.querySelector(`.inv-slot[data-project-id="${projectId}"]`);
        selectProject(projectId, newActiveSlot);
    });
});