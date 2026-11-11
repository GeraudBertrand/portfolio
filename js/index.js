/**
 * ACCUEIL : range les projets de /js/projects.json dans les écoles (ul.registre[data-ecole]).
 * Les textes fixes de la page sont traduits par lang.js ; ici seulement les projets.
 */

const ETATS = {
    vivant: { en: 'alive', fr: 'vivant' },
    rituel: { en: 'in ritual', fr: 'en rituel' },
    repos:  { en: 'at rest', fr: 'au repos' }
};

let projets = [];

function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
}

function renderProjets() {
    const lang = window.currentLang === 'fr' ? 'fr' : 'en';
    document.querySelectorAll('ul.registre[data-ecole]').forEach(ul => ul.replaceChildren());

    for (const p of projets) {
        const ul = document.querySelector(`ul.registre[data-ecole="${p.school}"]`);
        if (!ul) { console.warn('École inconnue pour', p.id); continue; }

        const li = el('li');
        const etat = el('i', `etat ${p.state}`);
        etat.setAttribute('role', 'img');
        etat.setAttribute('aria-label', ETATS[p.state][lang]);

        const corps = el('div');
        if (p.figure) corps.append(el('span', 'chiffre gothique', p.figure[lang]));
        corps.append(el('b', null, (lang === 'fr' && p.title_fr) || p.title), p[lang]);
        if (p.stack) corps.append(el('small', null, p.stack.join(' | ')));

        const tous = [
            ...(p.page ? [{ kind: 'cle', href: `/src/pages/${p.id}.html`, en: 'See the project', fr: 'Voir le projet' }] : []),
            ...(p.links || [])
        ];
        if (tous.length) {
            const liens = el('div', 'liens');
            for (const l of tous) {
                const a = el('a', 'lien');
                a.href = l.href;
                if (/^https?:/.test(l.href)) { a.target = '_blank'; a.rel = 'noopener'; }
                a.innerHTML = `<svg aria-hidden="true"><use href="/assets/img/signes.svg#${l.kind}"/></svg>`;
                a.append(el('span', null, l[lang]));
                liens.append(a);
            }
            corps.append(liens);
        }

        li.append(etat, corps);
        ul.append(li);
    }

    const rendus = document.querySelectorAll('ul.registre[data-ecole] > li').length;
    console.assert(rendus === projets.length, `Projets rendus : ${rendus} sur ${projets.length}`);
    const nb = document.getElementById('nb-projets');
    if (nb) nb.textContent = projets.length;
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const r = await fetch('/js/projects.json');
        if (!r.ok) throw new Error(r.status);
        projets = await r.json();
        renderProjets();
    } catch (err) {
        console.error('Projets non chargés :', err);
    }
});

window.addEventListener('languageChanged', renderProjets);
