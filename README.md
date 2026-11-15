# Portfolio BTS SIO – Neo Segard

Site : https://neosegard.github.io/

Portfolio statique (HTML, CSS, Bootstrap, JavaScript) hébergé sur GitHub Pages.

## Veille technologique automatique

Chaque jour, un scénario Make :

1. récupère les derniers articles du flux RSS d'IT-Connect ;
2. fait noter chaque article par Groq (modèle `openai/gpt-oss-120b`) selon sa pertinence pour le BTS SIO option SISR ;
3. garde l'article le mieux noté, récupère son texte complet et le fait reformuler et raccourcir ;
4. ajoute le résultat dans `veille.json` via l'API GitHub.

La page d'accueil lit `veille.json` et affiche la veille du jour, son résumé complet et l'historique.

## Format d'une entrée de `veille.json`

```json
{
  "date": "2026-11-15",
  "titre": "Titre de l'article",
  "source": "IT-Connect",
  "lien": "https://www.it-connect.fr/...",
  "domaine": "Cybersécurité",
  "mots_cles": ["mot 1", "mot 2", "mot 3"],
  "note": 8,
  "justification": "Pourquoi l'article est pertinent pour le BTS SIO SISR",
  "resume": "Résumé en deux phrases",
  "resume_complet": "Résumé reformulé, paragraphes séparés par une ligne vide"
}
```
