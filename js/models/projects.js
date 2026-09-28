/**
 * @typedef {Object} ProjectData
 * @property {string} id - Identifiant unique
 * @property {string} title - Nom du projet
 * @property {string} rarity - Rareté (legendary, epic, rare)
 * @property {string} icon - Nom de l'icône Lucide
 * @property {string} image - Chemin de l'image
 * @property {string} description_fr - Texte FR
 * @property {string} description_en - Texte EN
 * @property {string[]} stack - Liste des technologies
 * @property {string} date_fr - Date FR
 * @property {string} date_en - Date EN
 * @property {string} origin_fr - Origine FR
 * @property {string} origin_en - Origine EN
 * @property {string} link - Lien vers la page
 */

/**
 * Classe représentant un Projet pour faciliter l'accès aux données localisées.
 */
class Project {
    /**
     * @param {ProjectData} data - Les données brutes du JSON
     */
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.rarity = data.rarity;
        this.icon = data.icon;
        this.image = data.image;
        this.stack = data.stack;
        this.link = data.link;
        
        // Stockage interne des données localisées
        this._local = {
            fr: {
                description: data.description_fr,
                date: data.date_fr,
                origin: data.origin_fr
            },
            en: {
                description: data.description_en,
                date: data.date_en,
                origin: data.origin_en
            }
        };
    }

    /**
     * Récupère la description selon la langue actuelle.
     * @returns {string}
     */
    get description() {
        return this._local[window.currentLang]?.description || "";
    }

    /**
     * Récupère la date selon la langue actuelle.
     * @returns {string}
     */
    get date() {
        return this._local[window.currentLang]?.date || "";
    }

    /**
     * Récupère l'origine selon la langue actuelle.
     * @returns {string}
     */
    get origin() {
        return this._local[window.currentLang]?.origin || "";
    }
}

// Export global pour usage dans script.js
window.Project = Project;