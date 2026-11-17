# Diyafa (ضيافة) — Notes du projet

Plateforme de location de logements **uniquement à Makkah et Madinah** : séjours courts (pèlerins), location longue durée (habitants) et lits en appartements partagés (chambres hommes / femmes).

_Dernière mise à jour : séance 1 — 17 nov. 2026_

---

## Outils choisis
| Rôle | Outil | Pourquoi |
|---|---|---|
| Site (pages + serveur) | **Next.js 15** (React 19, TypeScript) | Standard, gratuit, se déploie sur Vercel en un clic |
| Base de données | **PostgreSQL** (en local) → **Supabase** en ligne | Gratuit pour démarrer, fiable |
| Accès à la base | **Prisma** | Structure claire dans `prisma/schema.prisma` |
| Design | **Tailwind CSS 4**, police **Readex Pro** (incluse, pas de Google Fonts) | |
| Photos / documents | Disque local → **Supabase Storage** en ligne | Les licences et pièces d'identité sont **privées** |
| E-mails | Affichés dans le terminal → **Resend** en ligne | |
| Paiement | **Paiement de test** → **Moyasar** (Mada, Apple Pay, cartes) | Le code Moyasar est déjà écrit (`src/lib/payments`) |
| Hébergement | **Vercel** | Gratuit pour démarrer |

## Ce qui est FAIT ✅

**Général**
- 3 langues : arabe (droite à gauche, par défaut), anglais, français — sélecteur en haut de page
- Pensé pour le téléphone (barre d'onglets en bas), marche sur ordinateur
- Installable sur l'écran d'accueil (PWA : icône ض, page hors-ligne)
- Design : fond blanc, gris neutres, bordeaux #7A2E3A, Readex Pro, boutons 12 px
- 3 espaces séparés et protégés : voyageur, hôte, admin (vérifié à 2 niveaux : à l'entrée et sur chaque page/action)
- **Aucune double réservation** : garantie par la base de données elle-même (y compris pour chaque lit, et même si 10 personnes cliquent en même temps)
- Pages : conditions d'utilisation, confidentialité, aide/FAQ, contact (textes à faire relire par un juriste)

**Espace voyageur**
- Accueil : choix Makkah / Madinah, recherche par dates, personnes, type
- Recherche : filtres prix, distance au Haram, nombre de mois, tri (proche du Haram, prix, note)
- Fiche logement : photos, distance + temps de marche au Haram, équipements, règles, hôte, licence, politique d'annulation, avis
- Réservation avec détail : prix, frais de service, TVA 15 %, total
- Lits : choix du lit, chambres hommes/femmes respectées (le sexe est demandé dans « Mon compte »)
- Paiement de test (réussite / échec), dates bloquées 15 min pendant le paiement
- Mes réservations, annulation selon la politique (montant remboursé affiché avant de confirmer)
- Messagerie avec l'hôte (+ bouton WhatsApp), signalement d'un message
- Avis après le séjour, favoris, signalement d'un problème (litige)
- E-mails automatiques (réservation, acceptation, annulation, messages…)

**Espace hôte**
- Inscription + licence + pièce d'identité + IBAN → validation par l'admin
- Annonces : création/modification, photos (couverture, suppression), équipements, règles, politique d'annulation, réservation instantanée ou sur demande
- Lits : chambres hommes/femmes et lits avec prix
- Distance au Haram calculée automatiquement si on donne les coordonnées GPS
- Calendrier : bloquer des jours, prix spéciaux par jour
- Demandes à accepter / refuser (refus = remboursement intégral)
- Revenus : brut, commission Diyafa, net, déjà versé, historique des versements
- Réponses aux avis

**Espace admin**
- Tableau de bord : réservations, volume, commissions, TVA, dû aux hôtes, taux d'occupation — par ville et par type, sur 30 j / 12 mois / tout
- Valider / refuser hôtes (voir les documents) et annonces ; suspendre, supprimer
- Utilisateurs : suspendre, réactiver, changer le rôle, supprimer
- Réservations : annuler avec remboursement (pourcentage au choix)
- Paiements et remboursements
- Commissions : % hôte, frais voyageur, TVA — par type de logement, modifiables à tout moment (les anciennes réservations gardent leur taux)
- Versements : ce que je dois à chaque hôte, créer un versement, marquer comme payé (avec référence de virement)
- Litiges, modération des avis et des messages signalés, messages du formulaire de contact

**Tests automatiques** : 36 tests (`npm test`) — prix/commissions/TVA, annulations, double réservation (y compris clics simultanés), lits hommes/femmes, accès aux espaces, versements, recherche. + parcours complets testés dans un vrai navigateur.

## Comment les calculs fonctionnent
- **Voyageur paie** = prix du logement + frais de service (% voyageur) + TVA (15 % sur logement + frais)
- **Hôte reçoit** = prix du logement − commission (% hôte)
- **Diyafa garde** = frais de service + commission hôte (la TVA est à reverser à l'État)
- Taux par défaut : séjours courts et lits 10 % hôte + 5 % voyageur ; longue durée 5 % + 2 % (modifiables dans Admin → Commissions)
- Versement à l'hôte possible dès le début du séjour

## Comptes de démonstration (mot de passe)
| Rôle | E-mail | Mot de passe |
|---|---|---|
| Admin | admin@diyafa.test | Admin12345! |
| Hôte | host@diyafa.test | Host12345! |
| Hôte 2 | host2@diyafa.test | Host12345! |
| Hôte en attente | pending@diyafa.test | Host12345! |
| Voyageur (homme) | guest@diyafa.test | Guest12345! |
| Voyageuse | guest2@diyafa.test | Guest12345! |

⚠️ À supprimer avant la vraie mise en ligne (ne pas lancer `npm run db:seed` en production).

## Ce qui RESTE À FAIRE 🔜
1. **Mise en ligne** (besoin de toi) : créer les comptes GitHub, Supabase, Vercel → voir « Étapes de mise en ligne »
2. **Vraie passerelle de paiement** : ouvrir un compte Moyasar (registre du commerce nécessaire), puis mettre `PAYMENT_PROVIDER=moyasar` + les clés. Ajouter le webhook Moyasar en plus du retour navigateur.
3. **E-mails réels** : compte Resend + nom de domaine
4. **Nom de domaine** (ex. diyafa.sa)
5. Faire relire conditions d'utilisation / confidentialité par un juriste saoudien
6. **TVA** : vérifier avec un comptable — la location résidentielle longue durée est en principe **exonérée** de TVA en Arabie saoudite (le taux se règle par type dans Admin → Commissions, mettre 0 % si besoin). Facture électronique ZATCA à prévoir.
7. Améliorations possibles : carte (plan) des logements, mot de passe oublié, vérification de l'e-mail / du téléphone (OTP), notifications push, photos compressées automatiquement, traduction automatique des annonces, calendrier hégirien en option, export comptable CSV

## Lancer le projet (sur un ordinateur)
```bash
npm install
cp .env.example .env        # puis remplir les valeurs
npx prisma migrate deploy   # crée les tables
npm run db:seed             # données de démo (efface tout !)
npm run dev                 # ouvre http://localhost:3000
npm test                    # lance les tests (base séparée diyafa_test)
```

## Étapes de mise en ligne (à faire ensemble)
1. **GitHub** : créer un compte, puis un dépôt privé « diyafa » → j'y envoie le code
2. **Supabase** : créer un projet (région la plus proche : Frankfurt ou Mumbai), récupérer l'adresse de la base (`DATABASE_URL`), l'URL du projet et la clé `service_role` ; créer 2 espaces de stockage : `photos` (public) et `documents` (privé)
3. **Vercel** : se connecter avec GitHub, importer le dépôt, coller les variables de `.env.example` (avec `STORAGE_PROVIDER=supabase`), déployer
4. Créer le vrai compte admin

## Organisation du code (pour s'y retrouver)
- `prisma/schema.prisma` — structure de la base · `prisma/migrations` — dont la protection anti-double réservation
- `src/lib/` — la logique : `bookings.ts` (réservations), `pricing.ts` (prix), `cancellation.ts` (remboursements), `payouts.ts` (versements), `payments/` (passerelle), `access.ts` (qui a accès à quoi), `i18n/` (traductions ar/en/fr)
- `src/app/` — les pages : `/` accueil, `/search`, `/listings/[id]`, `/trips`, `/messages`, `/host/...`, `/admin/...`
- `tests/` — tests automatiques

## Journal des séances
- **Séance 1** : construction complète de la plateforme (3 espaces, 3 langues, réservations, paiements de test, commissions, versements, messagerie, avis, litiges, PWA), 36 tests automatiques + parcours navigateur. Bugs trouvés et corrigés pendant les tests : boutons multiples (Valider/Refuser) qui n'envoyaient pas le bon choix ; photos envoyées non affichées.
