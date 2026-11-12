/**
 * GÉNÉRATEUR DU SITE : `node build.js` après toute modification d'une source.
 *
 * Sources (à modifier) :
 *   src/accueil.html, src/components/navbar.html, src/components/footer.html,
 *   js/traductions/*.json, js/projects.json, js/projets/<id>.json
 * Sorties (ne pas modifier à la main, elles sont réécrites) :
 *   /index.html, /<id>/index.html, /fr/index.html, /fr/<id>/index.html,
 *   /404.html, /sitemap.xml, /robots.txt, /src/pages/<id>.html (redirections des anciennes adresses)
 *
 * Tout le texte est dans le HTML servi, en anglais à la racine et en français sous /fr/ :
 * un moteur de recherche lit chaque page sans exécuter de script.
 */
const fs = require('fs');
const path = require('path');

const SITE = 'https://portfolio.gerios.fr';
const PERSONNE = `${SITE}/#geraud`;
const LANGUES = ['en', 'fr'];

const chemin = f => path.join(__dirname, f);
const lire = f => fs.readFileSync(chemin(f), 'utf8').replace(/^\uFEFF/, '');
const json = f => JSON.parse(lire(f));
function ecrire(f, contenu) {
    fs.mkdirSync(path.dirname(chemin(f)), { recursive: true });
    fs.writeFileSync(chemin(f), contenu);
}

// --- données ---
const PROJETS = json('js/projects.json');
const PAGES = PROJETS.filter(p => p.page);
const T = {};
for (const lang of LANGUES) T[lang] = Object.assign({}, ...['navbar', 'footer', 'index'].map(ns => json(`js/traductions/${ns}.json`)[lang]));

const FICHE_TEXTE = {
    en: { back: 'The six schools', entry: 'The entry', state: 'State', period: 'Period', stack: 'Stack', team: 'The company', prev: 'Previous entry', next: 'Next entry', chronicler: 'The Chronicler' },
    fr: { back: 'Les six écoles', entry: 'La fiche', state: 'État', period: 'Période', stack: 'Outils', team: 'La compagnie', prev: 'Entrée précédente', next: 'Entrée suivante', chronicler: 'Le Chroniqueur' }
};
const ECOLES = {
    artifice:      { signe: 'terre',   en: ['Artifice', 'applications and tools'],     fr: ['Artifice', 'applications et outils'] },
    galvanisme:    { signe: 'feu',     en: ['Galvanism', 'hardware and signal'],       fr: ['Galvanisme', 'matériel et signal'] },
    conjuration:   { signe: 'air',     en: ['Conjuration', 'AI familiars'],            fr: ['Conjuration', 'familiers IA'] },
    illusion:      { signe: 'eau',     en: ['Illusion', 'games'],                      fr: ['Illusion', 'jeux'] },
    divination:    { signe: 'mercure', en: ['Divination', 'data and game AI'],         fr: ['Divination', 'données et IA de jeu'] },
    transmutation: { signe: 'sel',     en: ['Transmutation', 'the workshop, Créalab'], fr: ['Transmutation', 'l\'atelier, Créalab'] }
};
const ETATS = {
    vivant: { en: 'alive', fr: 'vivant' },
    rituel: { en: 'in ritual', fr: 'en rituel' },
    repos:  { en: 'at rest', fr: 'au repos' }
};
const ETATS_FICHE = {
    vivant: { en: 'alive: in use', fr: 'vivant : en service' },
    rituel: { en: 'in ritual: in progress', fr: 'en rituel : en cours' },
    repos:  { en: 'at rest: finished', fr: 'au repos : terminé' }
};

// --- petit constructeur HTML : les chaînes sont du texte (échappé), les objets { html } du balisage ---
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function h(tag, attrs, ...enfants) {
    const a = Object.entries(attrs || {}).filter(([, v]) => v != null && v !== false).map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
    const dedans = enfants.flat(Infinity).filter(e => e != null && e !== false).map(e => e.html ?? esc(e)).join('');
    return { html: tag === 'img' ? `<img${a}>` : `<${tag}${a}>${dedans}</${tag}>` };
}
const signe = id => ({ html: `<svg aria-hidden="true"><use href="/assets/img/signes.svg#${id}"/></svg>` });
const plaque = (ombre = true) => h('div', { class: 'plaque', 'aria-hidden': 'true' }, ombre ? h('i', { class: 'ombre' }) : null, h('i'));
function lien(l, lang) {
    const externe = /^https?:/.test(l.href);
    return h('a', { class: 'lien', href: l.href, target: externe ? '_blank' : null, rel: externe ? 'noopener' : null }, signe(l.kind), h('span', null, l[lang]));
}
const titre = (p, lang) => (lang === 'fr' && p.title_fr) || p.title;

// --- accueil : les projets d'une école ---
function registre(ecole, lang) {
    return PROJETS.filter(p => p.school === ecole).map(p => {
        const tous = [
            ...(p.page ? [{ kind: 'cle', href: `/${p.id}/`, en: 'See the project', fr: 'Voir le projet' }] : []),
            ...(p.links || [])
        ];
        return h('li', null,
            h('i', { class: `etat ${p.state}`, role: 'img', 'aria-label': ETATS[p.state][lang] }),
            h('div', null,
                p.figure ? h('span', { class: 'chiffre gothique' }, p.figure[lang]) : null,
                h('b', null, titre(p, lang)), p[lang],
                p.stack ? h('small', null, p.stack.join(' | ')) : null,
                tous.length ? h('div', { class: 'liens' }, tous.map(l => lien(l, lang))) : null));
    });
}

function accueil(lang) {
    let rendus = 0;
    const main = lire('src/accueil.html')
        .replace(/(<ul class="registre" data-ecole="(\w+)">)<\/ul>/g, (_, ul, ecole) => {
            const lignes = registre(ecole, lang);
            rendus += lignes.length;
            return ul + lignes.map(l => l.html).join('') + '</ul>';
        })
        .replace('<span id="nb-projets"></span>', `<span id="nb-projets">${PROJETS.length}</span>`);
    if (rendus !== PROJETS.length) throw new Error(`Projets rendus : ${rendus} sur ${PROJETS.length} (école inconnue ?)`);
    return main;
}

// --- page projet ---
function fiche(p, recit, lang) {
    const t = FICHE_TEXTE[lang];
    const r = recit[lang];
    const ecole = ECOLES[p.school];
    if (!r || !ecole) throw new Error(`Fiche incomplète : ${p.id} (${lang})`);

    const liens = (p.links || []).filter(l => l.kind !== 'cle');
    const tete = h('header', { class: 'fiche-tete' },
        h('div', { class: 'masse', 'aria-hidden': 'true' }, h('i')),
        h('a', { class: 'retour', href: '/#ecoles' }, '← ', t.back),
        h('p', { class: 'fiche-ecole' }, signe(ecole.signe), h('span', null, `${ecole[lang][0]} · ${ecole[lang][1]}`)),
        h('h1', { class: 'fiche-titre gothique' }, titre(p, lang)),
        h('p', { class: 'fiche-lede' }, r.lede),
        liens.length ? h('div', { class: 'liens' }, liens.map(l => lien(l, lang))) : null
    );

    // bande-annonce : lancée par anime.js (muette, en boucle) sauf si le système demande moins de mouvement
    const bande = recit.trailer ? h('figure', { class: 'planche large bande-annonce' },
        h('video', { src: recit.trailer.src, poster: recit.trailer.poster, width: recit.trailer.w, height: recit.trailer.h,
            controls: 'controls', muted: 'muted', loop: 'loop', playsinline: 'playsinline', preload: 'metadata', 'data-auto': '', 'aria-label': recit.trailer[lang] }),
        h('figcaption', null, recit.trailer[lang])) : null;

    const texte = h('article', { class: 'fiche-texte' },
        r.sections.map(s => [
            h('h2', { class: 'gothique' }, s.h),
            (s.p || []).map(x => h('p', null, x)),
            s.ul ? h('ul', null, s.ul.map(x => h('li', null, x))) : null
        ])
    );

    const faits = [
        [t.state, h('span', { class: 'fiche-etat' }, h('i', { class: `etat ${p.state}`, 'aria-hidden': 'true' }), ETATS_FICHE[p.state][lang])],
        recit.year ? [t.period, recit.year] : null,
        ...(r.facts || []),
        p.stack ? [t.stack, p.stack.join(' | ')] : null
    ].filter(Boolean);
    const carte = h('section', { class: 'carte parchemin' }, plaque(),
        h('h3', { class: 'gothique' }, t.entry),
        h('dl', null, faits.map(([k, v]) => [h('dt', null, k), h('dd', null, v)]))
    );
    const equipe = recit.team ? h('section', { class: 'carte prune' }, plaque(),
        h('h3', { class: 'gothique' }, t.team),
        h('ul', { class: 'equipe' }, recit.team.map(m => h('li', { class: m.me ? 'moi' : null }, h('b', null, m.name), h('span', null, m[lang]))))
    ) : null;
    const dit = r.say ? h('blockquote', { class: 'chronique' }, plaque(false), h('span', null, r.say), h('cite', null, t.chronicler)) : null;
    const cote = h('aside', { class: 'fiche-cote' }, carte, equipe, dit);

    const planches = recit.figures ? h('div', { class: 'planches' }, recit.figures.map(f =>
        h('figure', { class: `planche ${f.size || ''}` },
            h('img', { src: f.src, alt: f[lang], width: f.w, height: f.h, loading: 'lazy' }),
            h('figcaption', null, f[lang]))
    )) : null;

    // entrées voisines, dans l'ordre du registre
    const i = PAGES.indexOf(p);
    const prec = PAGES[(i - 1 + PAGES.length) % PAGES.length], suiv = PAGES[(i + 1) % PAGES.length];
    const suite = h('nav', { class: 'fiche-suite', 'aria-label': `${t.prev} / ${t.next}` },
        h('a', { href: `/${prec.id}/` }, h('small', null, '← ', t.prev), h('b', null, titre(prec, lang))),
        h('a', { href: `/${suiv.id}/` }, h('small', null, t.next, ' →'), h('b', null, titre(suiv, lang)))
    );

    return h('main', { id: 'fiche', class: 'page' }, tete, bande, h('div', { class: 'fiche-corps' }, texte, cote), planches, suite).html;
}

// --- squelette commun à toutes les pages ---
const NAV = lire('src/components/navbar.html');
const PIED = lire('src/components/footer.html');
// Bords encrés : déformation des formes pleines, jamais du texte
const FILTRES = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
        <filter id="encre" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="4" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter>
        <filter id="encre-fin" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="9" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="4" xChannelSelector="R" yChannelSelector="G"/></filter>
    </svg>`;

function traduire(html, lang) {
    return html.replace(/ data-i18n="([^"]+)"([^>]*)>[^<]*/g, (_, cle, reste) => {
        if (!(cle in T[lang])) throw new Error(`Traduction manquante : ${cle} (${lang})`);
        return `${reste}>${esc(T[lang][cle])}`;
    });
}

/** adresse : chemin sans préfixe de langue ('/', '/myoarm/'). indexable=false pour la 404. */
function page({ lang, adresse, titrePage, description, main, id, ld, indexable = true }) {
    const base = l => (l === 'fr' ? '/fr' : '') + adresse;
    const autre = lang === 'fr' ? 'en' : 'fr';
    let corps = traduire(NAV + '\n\n' + main + '\n\n' + PIED, lang);
    // les liens vers les pages du site restent dans la langue courante (pas les fichiers : /assets/, /css/...)
    if (lang === 'fr') corps = corps.replace(/href="\/(?=#|"|[\w-]+\/")/g, 'href="/fr/');
    corps = corps
        .replace('<!-- langue -->', `<a id="lang-indicator" href="${base(autre)}" lang="${autre}" hreflang="${autre}">${autre === 'fr' ? 'Français' : 'English'}</a>`)
        .replace('<span id="year-placeholder"></span>', new Date().getFullYear());

    const referencement = indexable ? `<link rel="canonical" href="${SITE}${base(lang)}">
    <link rel="alternate" hreflang="en" href="${SITE}${base('en')}">
    <link rel="alternate" hreflang="fr" href="${SITE}${base('fr')}">
    <link rel="alternate" hreflang="x-default" href="${SITE}${base('en')}">
    <meta property="og:type" content="${id ? 'website' : 'profile'}">
    <meta property="og:site_name" content="Géraud Bertrand">
    <meta property="og:title" content="${esc(titrePage)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${SITE}${base(lang)}">
    <meta property="og:locale" content="${lang === 'fr' ? 'fr_FR' : 'en_US'}">
    <meta property="og:locale:alternate" content="${lang === 'fr' ? 'en_US' : 'fr_FR'}">
    <meta property="og:image" content="${SITE}/assets/img/og.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : '<meta name="robots" content="noindex">';

    return `<!DOCTYPE html>
<html lang="${lang}">
<!-- Page générée par build.js : modifier les sources (voir l'en-tête de build.js), pas ce fichier. -->
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(titrePage)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="author" content="Géraud Bertrand">
    ${referencement}
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-icon-180x180.png">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#1b131f">
    <link rel="preload" href="/assets/fonts/pirata-one-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/assets/fonts/vollkorn-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/css/grimoire.css">
    <script src="/js/anime.js"></script>
</head>
<body${id ? ` data-projet="${id}"` : ''}>
    ${FILTRES}

${corps}

    <script src="/js/accessibility.js" defer></script>
</body>
</html>
`;
}

// --- données structurées ---
const ldAccueil = lang => ({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebSite', '@id': `${SITE}/#site`, url: `${SITE}/`, name: 'Géraud Bertrand', inLanguage: LANGUES },
    { '@type': 'ProfilePage', url: SITE + (lang === 'fr' ? '/fr/' : '/'), inLanguage: lang, isPartOf: { '@id': `${SITE}/#site` }, mainEntity: { '@id': PERSONNE } },
    { '@type': 'Person', '@id': PERSONNE, name: 'Géraud Bertrand', givenName: 'Géraud', familyName: 'Bertrand', url: `${SITE}/`,
      jobTitle: T[lang].meta_job, description: T[lang].meta_description,
      alumniOf: { '@type': 'CollegeOrUniversity', name: 'ESILV', url: 'https://www.esilv.fr/' },
      worksFor: { '@type': 'Organization', name: 'XLConcept' },
      knowsLanguage: ['fr', 'en'], knowsAbout: T[lang].meta_topics,
      sameAs: ['https://linkedin.com/in/geraud-bertrand-pro', 'https://github.com/GeraudBertrand'] }
] });
const ldProjet = (p, recit, lang) => ({ '@context': 'https://schema.org', '@type': 'CreativeWork',
    name: titre(p, lang), description: recit[lang].lede, url: `${SITE}${lang === 'fr' ? '/fr' : ''}/${p.id}/`, inLanguage: lang,
    keywords: (p.stack || []).join(', ') || undefined,
    author: { '@type': 'Person', '@id': PERSONNE, name: 'Géraud Bertrand', url: `${SITE}/` } });

// --- écriture ---
const date = (...sources) => new Date(Math.max(...sources.map(f => fs.statSync(chemin(f)).mtimeMs))).toISOString().slice(0, 10);
const plan = []; // [adresse, date de dernière modification]

for (const lang of LANGUES) {
    const racine = lang === 'fr' ? 'fr/' : '';
    ecrire(`${racine}index.html`, page({ lang, adresse: '/', titrePage: T[lang].meta_title, description: T[lang].meta_description, main: accueil(lang), ld: ldAccueil(lang) }));
    for (const p of PAGES) {
        const recit = json(`js/projets/${p.id}.json`);
        ecrire(`${racine}${p.id}/index.html`, page({ lang, adresse: `/${p.id}/`, id: p.id, titrePage: `${titre(p, lang)} | Géraud Bertrand`, description: p[lang], main: fiche(p, recit, lang), ld: ldProjet(p, recit, lang) }));
    }
}
plan.push(['/', date('src/accueil.html', 'js/projects.json', 'js/traductions/index.json')]);
for (const p of PAGES) {
    plan.push([`/${p.id}/`, date(`js/projets/${p.id}.json`)]);
    // les anciennes adresses /src/pages/<id>.html mènent à la nouvelle
    ecrire(`src/pages/${p.id}.html`, `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${esc(p.title)} | Géraud Bertrand</title>
    <link rel="canonical" href="${SITE}/${p.id}/">
    <meta http-equiv="refresh" content="0; url=/${p.id}/">
</head>
<body><a href="/${p.id}/">${esc(p.title)}</a></body>
</html>
`);
}

ecrire('404.html', page({ lang: 'en', adresse: '/', indexable: false, titrePage: 'Lost page | Géraud Bertrand', description: 'This page does not exist.',
    main: `<main class="page">
        <header class="fiche-tete">
            <div class="masse" aria-hidden="true"><i></i></div>
            <h1 class="fiche-titre gothique">Lost page</h1>
            <p class="fiche-lede">This page is not in the grimoire. <span lang="fr">Cette page n'est pas dans le grimoire.</span></p>
            <div class="liens">
                <a class="lien" href="/">${signe('cle').html}<span>Back to the six schools</span></a>
                <a class="lien" href="/fr/" lang="fr">${signe('cle').html}<span>Retour aux six écoles</span></a>
            </div>
        </header>
    </main>` }));

const alternes = adresse => `<xhtml:link rel="alternate" hreflang="en" href="${SITE}${adresse}"/><xhtml:link rel="alternate" hreflang="fr" href="${SITE}/fr${adresse}"/><xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${adresse}"/>`;
ecrire('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${plan.flatMap(([adresse, maj]) => ['', '/fr'].map(b => `  <url><loc>${SITE}${b}${adresse}</loc><lastmod>${maj}</lastmod>${alternes(adresse)}</url>`)).join('\n')}
</urlset>
`);
ecrire('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`${plan.length * 2} pages écrites (${LANGUES.join(', ')}), plus 404.html, sitemap.xml, robots.txt et ${PAGES.length} redirections.`);
