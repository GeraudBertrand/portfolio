/**
 * ANIMATIONS DU GRIMOIRE. Chargé dans <head> pour poser html.anime avant le premier affichage.
 * Les styles vivent dans grimoire.css (section « animations ») et ne s'appliquent que sous html.anime.
 * Rien de tout ça si le système demande moins de mouvement : le site s'affiche alors tel quel.
 */
(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const racine = document.documentElement;
    racine.classList.add('anime');

    // entrée sur le site : une fois par visite, seulement sur l'accueil
    const accueil = /^\/(fr\/)?(index\.html)?$/.test(location.pathname);
    let premiereVisite = false;
    try { premiereVisite = accueil && !sessionStorage.getItem('seuil'); sessionStorage.setItem('seuil', '1'); } catch { /* stockage bloqué : pas d'entrée */ }
    if (premiereVisite) racine.classList.add('seuil', 'porte'); // .seuil cache la page jusqu'à ce que les battants soient posés

    // cartes qui s'encrent quand elles arrivent à l'écran (sceau tamponné et signe tracé inclus)
    const CIBLES = '.ecole, .carte, .chronique';
    const io = new IntersectionObserver(entrees => entrees.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('vu');
        io.unobserve(e.target);
    }), { rootMargin: '0px 0px -10% 0px' });

    // changer de langue recharge la même page dans l'autre langue : on n'en rejoue pas l'entrée et on reste au même endroit
    let calme = null; // position de défilement laissée par la page d'avant, ou null
    try { calme = sessionStorage.getItem('calme'); sessionStorage.removeItem('calme'); } catch { /* stockage bloqué */ }
    if (calme !== null) racine.classList.add('calme');
    const armer = el => calme !== null ? el.classList.add('vu') : io.observe(el);
    document.addEventListener('click', e => {
        if (e.target.closest?.('#lang-indicator')) try { sessionStorage.setItem('calme', scrollY); } catch { /* idem */ }
    }, true);

    // trait qui frémit : trois bruits d'encre indépendants (graines différentes) se fondent l'un dans l'autre en boucle.
    // Chaque point du contour bouge pour son compte, d'où des pointes qui naissent et meurent un peu partout,
    // au lieu d'un étirement d'ensemble. Le premier bruit est celui du filtre fixe : pas de saut au début du survol.
    const POIDS = ['1;0;0;1', '0;1;0;0', '0;0;1;0'];
    const poids = (attr, i, duree) => `<animate attributeName="${attr}" values="${POIDS[i]}" keyTimes="0;.333;.667;1" dur="${duree}" calcMode="spline" keySplines=".4 0 .6 1;.4 0 .6 1;.4 0 .6 1" repeatCount="indefinite"/>`;
    const vif = (id, freq, graines, echelle, duree) =>
        `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%">` +
        graines.map((g, i) => `<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${g}" result="b${i}"/>`).join('') +
        `<feComposite in="b0" in2="b1" operator="arithmetic" k1="0" k2="1" k3="0" k4="0" result="m">${poids('k2', 0, duree)}${poids('k3', 1, duree)}</feComposite>` +
        `<feComposite in="m" in2="b2" operator="arithmetic" k1="0" k2="1" k3="0" k4="0" result="t">${poids('k3', 2, duree)}</feComposite>` +
        `<feDisplacementMap in="SourceGraphic" in2="t" scale="${echelle}" xChannelSelector="R" yChannelSelector="G"/></filter>`;

    // le glyphe de l'entrée : deux cercles, deux triangles, les six signes des écoles, la serrure au centre
    const SIGNES = ['feu', 'terre', 'air', 'mercure', 'eau', 'sel'];
    const glyphe = () => `<svg viewBox="-120 -120 240 240" aria-hidden="true"><g class="traits">
        <circle class="t t1" r="114" stroke-width="3" pathLength="1" transform="rotate(-90)"/>
        <circle class="t t2" r="106" stroke-width="1.2" pathLength="1" transform="rotate(90)"/>
        <circle class="t t3" r="60" stroke-width="2" pathLength="1" transform="rotate(-90)"/>
        <path class="t t4" stroke-width="2" pathLength="1" d="M0-60L52 30H-52Z"/>
        <path class="t t5" stroke-width="2" pathLength="1" d="M0 60L-52-30H52Z"/>
        ${SIGNES.map((s, i) => { const a = (i * 60 - 90) * Math.PI / 180;
            return `<use href="/assets/img/signes.svg#${s}" x="${(84 * Math.cos(a) - 12).toFixed(1)}" y="${(84 * Math.sin(a) - 12).toFixed(1)}" width="24" height="24" style="--i:${i}"/>`; }).join('')}
        </g><g class="serrure"><circle cy="-7" r="10"/><path d="M-5.5 0L-9 24H9L5.5 0Z"/></g></svg>`;

    function ouvrir() {
        const porte = document.createElement('div');
        porte.className = 'porte-glyphe';
        porte.setAttribute('aria-hidden', 'true');
        porte.innerHTML = `<div class="battant g">${glyphe()}</div><div class="battant d">${glyphe()}</div>`;
        document.body.append(porte);
        racine.classList.remove('seuil');
        let fini = false;
        const fin = () => {
            if (fini) return;
            fini = true;
            porte.remove();
            removeEventListener('keydown', fin);
        };
        porte.lastElementChild.addEventListener('animationend', e => { if (e.target === porte.lastElementChild) fin(); });
        porte.addEventListener('click', fin); // un clic ou une touche passe l'entrée
        addEventListener('keydown', fin);
        setTimeout(fin, 3500); // filet si l'animation ne se termine pas (onglet en arrière-plan)
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('encre')?.insertAdjacentHTML('afterend',
            vif('encre-vif', .03, [4, 13, 29], 12, '1.2s') + vif('encre-fin-vif', .05, [9, 18, 33], 5, '2s'));
        if (premiereVisite) ouvrir();
        if (calme !== null) scrollTo({ top: +calme, behavior: 'instant' });

        document.querySelectorAll(CIBLES).forEach(armer);
        const lecteur = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause()));
        document.querySelectorAll('video[data-auto]').forEach(v => { v.muted = true; lecteur.observe(v); });
        // on arme aussi ce qui est ajouté après coup (fenêtre d'accessibilité)
        new MutationObserver(lots => lots.forEach(m => m.addedNodes.forEach(n => {
            if (n.nodeType !== 1) return;
            if (n.matches(CIBLES)) armer(n);
            n.querySelectorAll(CIBLES).forEach(armer);
        }))).observe(document.body, { childList: true, subtree: true });
    });
})();
