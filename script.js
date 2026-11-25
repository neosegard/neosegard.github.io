// Applique le thème (et met à jour le badge carbone)
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    updateCarbonBadge(theme);
}

// Bouton de changement de thème
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    try {
        localStorage.setItem('theme', newTheme);
    } catch (e) {}
}

// Badge carbone : blanc en thème clair, noir (classe wcb-d) en thème sombre
function updateCarbonBadge(theme) {
    const badge = document.getElementById('wcb');
    if (badge) {
        badge.classList.toggle('wcb-d', theme === 'dark');
    }
}

// Charge le thème sauvegardé
window.addEventListener('DOMContentLoaded', () => {
    let savedTheme = 'light';
    try {
        savedTheme = localStorage.getItem('theme') || 'light';
    } catch (e) {}
    applyTheme(savedTheme);
});

// Défilement fluide pour les ancres de la page
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Ferme le menu burger s'il est ouvert
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                bootstrap.Collapse.getOrCreateInstance(navbarCollapse, { toggle: false }).hide();
            }
        }
    });
});

// ===================== Veille technologique =====================
// Les articles viennent de veille.json, mis à jour chaque jour par Make.
// Tout le texte est inséré avec textContent (jamais innerHTML) : le contenu
// vient d'une IA et d'un flux RSS, il ne doit pas pouvoir injecter de HTML.

const VEILLE_PAR_PAGE = 5;
let veilleArticles = [];
let veilleAffiches = VEILLE_PAR_PAGE;

function formaterDate(iso) {
    const d = new Date(iso + 'T12:00:00');
    if (isNaN(d)) return iso || '';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function lienSur(url) {
    return /^https:\/\//.test(url || '') ? url : '#';
}

function creer(tag, classe, texte) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texte !== undefined && texte !== null) el.textContent = texte;
    return el;
}

function badgeNote(note) {
    if (note === null || note === undefined || note === '') return null;
    const n = Number(note);
    const niveau = n >= 8 ? 'haute' : n >= 5 ? 'moyenne' : 'basse';
    return creer('span', 'veille-note veille-note-' + niveau, n + '/10');
}

// Carte « Veille du jour » : résumé court + bouton vers le résumé complet
function afficherVeilleDuJour(article) {
    const zone = document.getElementById('veille-du-jour');
    zone.textContent = '';

    const carte = creer('article', 'card-custom veille-carte');
    const entete = creer('div', 'veille-entete');
    entete.append(creer('span', 'veille-etiquette', 'Veille du ' + formaterDate(article.date)));
    if (article.source) entete.append(creer('span', 'veille-domaine veille-source', article.source));
    if (article.domaine) entete.append(creer('span', 'veille-domaine', article.domaine));
    const note = badgeNote(article.note);
    if (note) entete.append(note);

    const titre = creer('h3', 'veille-titre', article.titre);
    const resume = creer('p', null, article.resume);

    const bouton = creer('button', 'btn-primary-custom', 'Lire le résumé complet');
    bouton.type = 'button';
    bouton.addEventListener('click', () => ouvrirVeille(article));

    carte.append(entete, titre, resume, bouton);
    zone.append(carte);
}

// Liste de l'historique (sans l'article du jour), filtrable par domaine
function afficherHistorique() {
    const liste = document.getElementById('veille-historique');
    const filtre = document.getElementById('veille-filtre').value;
    const plus = document.getElementById('veille-plus');
    liste.textContent = '';

    const anciens = veilleArticles.slice(1).filter(a => !filtre || a.domaine === filtre);

    if (anciens.length === 0) {
        liste.append(creer('li', 'veille-vide', 'Aucune veille précédente pour le moment.'));
        plus.hidden = true;
        return;
    }

    anciens.slice(0, veilleAffiches).forEach(article => {
        const li = creer('li');
        const bouton = creer('button', 'veille-ligne');
        bouton.type = 'button';
        bouton.append(
            creer('span', 'veille-ligne-date', formaterDate(article.date)),
            creer('span', 'veille-ligne-titre', article.titre),
            creer('span', 'veille-ligne-domaine', article.domaine || '')
        );
        bouton.addEventListener('click', () => ouvrirVeille(article));
        li.append(bouton);
        liste.append(li);
    });

    plus.hidden = anciens.length <= veilleAffiches;
}

// Fenêtre avec le résumé complet
function ouvrirVeille(article) {
    const meta = [formaterDate(article.date), article.domaine, article.source].filter(Boolean).join(' · ');
    document.getElementById('veille-modal-meta').textContent = meta;
    document.getElementById('veille-modal-titre').textContent = article.titre;

    const corps = document.getElementById('veille-modal-corps');
    corps.textContent = '';
    String(article.resume_complet || article.resume || '')
        .split(/\s*\[\[P\]\]\s*|\n\s*\n/)
        .filter(p => p.trim())
        .forEach(p => corps.append(creer('p', null, p.trim())));

    const mots = document.getElementById('veille-modal-mots');
    mots.textContent = '';
    const motsCles = Array.isArray(article.mots_cles)
        ? article.mots_cles
        : String(article.mots_cles || '').split(/\s*[,;|]\s*/);
    motsCles.filter(Boolean).forEach(m => mots.append(creer('span', 'veille-mot', m)));

    const noteBloc = document.getElementById('veille-modal-note');
    noteBloc.textContent = '';
    const note = badgeNote(article.note);
    if (note) {
        const ligne = creer('p', 'veille-note-ligne');
        ligne.append(creer('strong', null, 'Pertinence BTS SIO SISR : '), note);
        noteBloc.append(ligne);
        if (article.justification) noteBloc.append(creer('p', 'veille-justif', article.justification));
    }

    const lienModal = document.getElementById('veille-modal-lien');
    lienModal.href = lienSur(article.lien);
    lienModal.textContent = 'Lire l\u2019article sur ' + (article.source || 'le site source');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('veille-modal')).show();
}

async function chargerVeille() {
    const zone = document.getElementById('veille-du-jour');
    if (!zone) return; // pas de section veille sur cette page

    try {
        // ?v= évite qu'une ancienne version reste en cache
        const reponse = await fetch('veille.json?v=' + Date.now());
        if (!reponse.ok) throw new Error(reponse.status);
        const donnees = await reponse.json();

        veilleArticles = (Array.isArray(donnees) ? donnees : [])
            .filter(a => a && a.titre)
            .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    } catch (e) {
        zone.textContent = '';
        zone.append(creer('div', 'card-custom veille-chargement', 'La veille n’a pas pu être chargée. Réessaie dans quelques instants.'));
        return;
    }

    if (veilleArticles.length === 0) {
        zone.textContent = '';
        zone.append(creer('div', 'card-custom veille-chargement', 'Aucune veille validée pour le moment : la prochaine arrive bientôt.'));
        return;
    }

    afficherVeilleDuJour(veilleArticles[0]);

    // Remplit le filtre avec les domaines présents
    const filtre = document.getElementById('veille-filtre');
    [...new Set(veilleArticles.slice(1).map(a => a.domaine).filter(Boolean))].sort()
        .forEach(d => filtre.append(new Option(d, d)));
    filtre.addEventListener('change', () => { veilleAffiches = VEILLE_PAR_PAGE; afficherHistorique(); });

    document.getElementById('veille-plus').addEventListener('click', () => {
        veilleAffiches += VEILLE_PAR_PAGE;
        afficherHistorique();
    });

    afficherHistorique();
}

window.addEventListener('DOMContentLoaded', chargerVeille);
