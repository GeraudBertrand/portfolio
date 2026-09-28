/**
 * Classe représentant une expérience professionnelle.
 * Gère la localisation des contenus et le formatage des types de contrat.
 */
class Experience {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.rarity = data.rarity || 'rare';
        this.icon = data.icon || 'briefcase';
        this.origin = data.origin;
        this.type = data.type; // stage, alternance, cdd, cdi
        this.stack = data.stack || [];

        this._local = {
            fr: {
                description: data.description_fr,
                period: data.period_fr
            },
            en: {
                description: data.description_en,
                period: data.period_en
            }
        };
    }

    get description() {
        return this._local[window.currentLang]?.description || "";
    }

    get period() {
        return this._local[window.currentLang]?.period || "";
    }

    /**
     * Retourne le libellé traduit du type de contrat
     */
    get typeLabel() {
        const types = {
            'alternance': { fr: 'Alternance', en: 'Apprenticeship' },
            'stage': { fr: 'Stage', en: 'Internship' },
            'cdd': { fr: 'CDD', en: 'Fixed-term' },
            'cdi': { fr: 'CDI', en: 'Permanent' }
        };
        return types[this.type]?.[window.currentLang] || this.type;
    }

    /**
     * Définit le thème de couleur "calme" pour l'expérience.
     * Utilise des nuances de gris (slate) et de bleu pour un rendu professionnel.
     * @returns {Object} Classes Tailwind pour la bordure, le texte et le fond.
     */
    get colorTheme() {
        const themes = {
            'legendary': {
                border: 'border-slate-400',
                text: 'text-slate-200',
                bg: 'bg-slate-500/10',
                dot: 'bg-slate-400'
            },
            'epic': {
                border: 'border-blue-500/50',
                text: 'text-blue-400',
                bg: 'bg-blue-500/5',
                dot: 'bg-blue-500'
            },
            'rare': {
                border: 'border-slate-700',
                text: 'text-slate-400',
                bg: 'bg-slate-800/20',
                dot: 'bg-slate-600'
            }
        };
        return themes[this.rarity] || themes['rare'];
    }
}

window.Experience = Experience;