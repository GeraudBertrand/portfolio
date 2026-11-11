/**
 * PAGE PROJET : une seule mise en page pour tous les projets.
 * La coquille HTML (src/pages/<id>.html) porte data-projet="<id>" ;
 * la fiche courte vient de /js/projects.json (école, état, stack, liens),
 * le récit de /js/projets/<id>.json ({ year, team, figures, en:{...}, fr:{...} }).
 */

const FICHE_TEXTE = {
    en: { back: 'The six schools', entry: 'The entry', state: 'State', period: 'Period', stack: 'Stack', team: 'The company', prev: 'Previous entry', next: 'Next entry',
          chronicler: 'The Chronicler', missing: 'This entry could not be read.' },
    fr: { back: 'Les six écoles', entry: 'La fiche', state: 'État', period: 'Période', stack: 'Outils', team: 'La compagnie', prev: 'Entrée précédente', next: 'Entrée suivante',
          chronicler: 'Le Chroniqueur', missing: 'Cette entrée n\'a pas pu être lue.' }
};
const ECOLES = {
    artifice:      { signe: 'terre',   en: ['Artifice', 'applications and tools'],   fr: ['Artifice', 'applications et outils'] },
    galvanisme:    { signe: 'feu',     en: ['Galvanism', 'hardware and signal'],     fr: ['Galvanisme', 'matériel et signal'] },
    conjuration:   { signe: 'air',     en: ['Conjuration', 'AI familiars'],          fr: ['Conjuration', 'familiers IA'] },
    illusion:      { signe: 'eau',     en: ['Illusion', 'games'],                    fr: ['Illusion', 'jeux'] },
    divination:    { signe: 'mercure', en: ['Divination', 'data and game AI'],       fr: ['Divination', 'données et IA de jeu'] },
    transmutation: { signe: 'sel',     en: ['Transmutation', 'the workshop, Créalab'], fr: ['Transmutation', 'l\'atelier, Créalab'] }
};
const ETATS_FICHE = {
    vivant: { en: 'alive: in use', fr: 'vivant : en service' },
    rituel: { en: 'in ritual: in progress', fr: 'en rituel : en cours' },
    repos:  { en: 'at rest: finished', fr: 'au repos : terminé' }
};

let fiche = null; // { liste, p, recit }

function h(tag, attrs, ...enfants) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
        if (v == null || v === false) continue;
        if (k === 'class') n.className = v; else n.setAttribute(k, v);
    }
    for (const e of enfants.flat(Infinity)) if (e != null && e !== false) n.append(e);
    return n;
}
function signe(id) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('aria-hidden', 'true');
    const u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    u.setAttribute('href', `/assets/img/signes.svg#${id}`);
    s.append(u);
    return s;
}
function plaque(ombre = true) {
    return h('div', { class: 'plaque', 'aria-hidden': 'true' }, ombre ? h('i', { class: 'ombre' }) : null, h('i'));
}
function lien(l, lang) {
    const externe = /^https?:/.test(l.href);
    return h('a', { class: 'lien', href: l.href, target: externe ? '_blank' : null, rel: externe ? 'noopener' : null }, signe(l.kind), h('span', null, l[lang]));
}
const titre = (p, lang) => (lang === 'fr' && p.title_fr) || p.title;

function renderFiche() {
    const main = document.getElementById('fiche');
    const lang = window.currentLang === 'fr' ? 'fr' : 'en';
    const t = FICHE_TEXTE[lang];
    const { liste, p, recit } = fiche;
    const r = recit[lang];
    const ecole = ECOLES[p.school];
    document.title = `${titre(p, lang)} | Géraud Bertrand`;

    // tête : école, nom, phrase, liens
    const liens = (p.links || []).filter(l => l.kind !== 'cle');
    const tete = h('header', { class: 'fiche-tete' },
        h('div', { class: 'masse', 'aria-hidden': 'true' }, h('i')),
        h('a', { class: 'retour', href: `/#ecoles` }, '← ', t.back),
        h('p', { class: 'fiche-ecole' }, signe(ecole.signe), h('span', null, `${ecole[lang][0]} · ${ecole[lang][1]}`)),
        h('h1', { class: 'fiche-titre gothique' }, titre(p, lang)),
        h('p', { class: 'fiche-lede' }, r.lede),
        liens.length ? h('div', { class: 'liens' }, liens.map(l => lien(l, lang))) : null
    );

    // récit
    const texte = h('article', { class: 'fiche-texte' },
        r.sections.map(s => [
            h('h2', { class: 'gothique' }, s.h),
            (s.p || []).map(x => h('p', null, x)),
            s.ul ? h('ul', null, s.ul.map(x => h('li', null, x))) : null
        ])
    );

    // côté : la fiche, la compagnie, le chroniqueur
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

    // planches
    const planches = recit.figures ? h('div', { class: 'planches' }, recit.figures.map(f =>
        h('figure', { class: `planche ${f.size || ''}` },
            h('img', { src: f.src, alt: f[lang], width: f.w, height: f.h, loading: 'lazy' }),
            h('figcaption', null, f[lang]))
    )) : null;

    // entrées voisines, dans l'ordre du registre
    const avec = liste.filter(x => x.page);
    const i = avec.findIndex(x => x.id === p.id);
    const prec = avec[(i - 1 + avec.length) % avec.length], suiv = avec[(i + 1) % avec.length];
    const suite = h('nav', { class: 'fiche-suite', 'aria-label': `${t.prev} / ${t.next}` },
        h('a', { href: `/src/pages/${prec.id}.html` }, h('small', null, '← ', t.prev), h('b', null, titre(prec, lang))),
        h('a', { href: `/src/pages/${suiv.id}.html` }, h('small', null, t.next, ' →'), h('b', null, titre(suiv, lang)))
    );

    main.replaceChildren(tete, h('div', { class: 'fiche-corps' }, texte, cote), planches, suite);
}

document.addEventListener('DOMContentLoaded', async () => {
    const id = document.body.dataset.projet;
    try {
        const [liste, recit] = await Promise.all([
            fetch('/js/projects.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
            fetch(`/js/projets/${id}.json`).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        ]);
        const p = liste.find(x => x.id === id);
        console.assert(p && recit.en && recit.fr, `Fiche incomplète : ${id}`);
        fiche = { liste, p, recit };
        renderFiche();
    } catch (err) {
        console.error('Fiche non chargée :', id, err);
        document.getElementById('fiche').textContent = FICHE_TEXTE[window.currentLang === 'fr' ? 'fr' : 'en'].missing;
    }
});

window.addEventListener('languageChanged', () => { if (fiche) renderFiche(); });
