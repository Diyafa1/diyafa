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
| Paiement | **Paiement de test** → **Stripe** (LLC du propriétaire : cartes, Apple Pay, Google Pay) ; Moyasar prêt si société saoudienne plus tard | Changer `PAYMENT_PROVIDER` + clé |
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
1. **Mise en ligne** (besoin de toi) : ~~GitHub~~ ✅ fait (dépôt privé Diyafa1/diyafa) — reste Supabase et Vercel → voir « Étapes de mise en ligne »
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
1. ✅ **GitHub** : dépôt privé https://github.com/Diyafa1/diyafa (code envoyé)
2. **Supabase** : créer un projet (région la plus proche : Frankfurt ou Mumbai), récupérer l'adresse de la base (`DATABASE_URL`), l'URL du projet et la clé `service_role` ; créer 2 espaces de stockage : `photos` (public) et `documents` (privé)
3. **Vercel** : se connecter avec GitHub, importer le dépôt, coller les variables de `.env.example` (avec `STORAGE_PROVIDER=supabase`), déployer
4. Créer le vrai compte admin : mettre ton e-mail dans `ADMIN_EMAILS` sur Vercel, puis t'inscrire normalement sur le site → tu deviens admin
5. La base de données se crée toute seule à chaque mise en ligne (`prisma migrate deploy` dans `npm run build`)

## Organisation du code (pour s'y retrouver)
- `prisma/schema.prisma` — structure de la base · `prisma/migrations` — dont la protection anti-double réservation
- `src/lib/` — la logique : `bookings.ts` (réservations), `pricing.ts` (prix), `cancellation.ts` (remboursements), `payouts.ts` (versements), `payments/` (passerelle), `access.ts` (qui a accès à quoi), `i18n/` (traductions ar/en/fr)
- `src/app/` — les pages : `/` accueil, `/search`, `/listings/[id]`, `/trips`, `/messages`, `/host/...`, `/admin/...`
- `tests/` — tests automatiques

## Journal des séances
- **Séance 1** : construction complète de la plateforme (3 espaces, 3 langues, réservations, paiements de test, commissions, versements, messagerie, avis, litiges, PWA), 36 tests automatiques + parcours navigateur. Bugs trouvés et corrigés pendant les tests : boutons multiples (Valider/Refuser) qui n'envoyaient pas le bon choix ; photos envoyées non affichées.
- **Séance 1 (suite)** : code sauvegardé sur GitHub (Diyafa1/diyafa, branche main).
- **Pause (fin séance 1)** — mise en ligne en cours :
  - ✅ GitHub : https://github.com/Diyafa1/diyafa
  - ✅ Supabase étape 1 : projet créé (URL https://lqttjuzeznkwexfgqppv.supabase.co), adresses DATABASE_URL (Transaction pooler :6543 + `?pgbouncer=true&connection_limit=1`) et DIRECT_URL (Session pooler :5432) notées par le propriétaire (jamais dans le chat)
  - 🔜 Supabase étape 2 : Storage → créer les buckets `photos` (public) et `documents` (privé)
  - 🔜 Supabase étape 3 : Project Settings → API Keys → copier la clé secrète (sb_secret_… ou service_role) = SUPABASE_SERVICE_ROLE_KEY
  - 🔜 Étape 5 (après Vercel) : Stripe → Developers → API keys → Secret key dans Vercel (`STRIPE_SECRET_KEY`, `PAYMENT_PROVIDER=stripe`). Tester d'abord avec sk_test_ et la carte 4242 4242 4242 4242.
  - 🔜 Étape 4 : Vercel (importer le dépôt, coller les variables : DATABASE_URL, DIRECT_URL, AUTH_SECRET, APP_URL, PAYMENT_PROVIDER=test, EMAIL_PROVIDER=console, STORAGE_PROVIDER=supabase, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAILS, CRON_SECRET)
  - Expliquer une seule étape à la fois, très simplement.
- Paiement : le propriétaire a une LLC (non saoudienne) + compte Stripe → Stripe Checkout ajouté (SAR, remboursements partiels, 3 tests). Limites rappelées : pas de Mada ; vérifier TVA/ZATCA et règles du ministère du Tourisme avec un professionnel. Délai de paiement passé à 30 min (minimum Stripe).
- **Devise : euros (€)** à la demande du propriétaire (tout le site, Stripe, e-mails, données de démo). Montants stockés en centimes. Pour changer de devise : `CURRENCY` dans `src/lib/money.ts` + libellés « (€) » dans `src/lib/i18n`. Moyasar ne fonctionne qu'en SAR. TVA toujours à 15 % par défaut (réglable dans Admin → Commissions) — à valider avec un comptable.
- Nom de domaine : à acheter par le propriétaire (ex. via Vercel → Domains, ou OVH/Namecheap), puis on le relie à Vercel.
- **Séance 2 (18 nov.)** : 🎉 **site en ligne sur Vercel** (projet `diyafa`, compte belgiumtx-1049), base Supabase région Singapour (aws-1-ap-southeast-1), buckets `photos` et `documents` créés, compte admin créé via ADMIN_EMAILS. Base en ligne vide (pas de données de démo, c'est voulu).
  - 🔜 Stripe : Vercel → Settings → Environment Variables : `STRIPE_SECRET_KEY` + `PAYMENT_PROVIDER=stripe` → Redeploy. Tester avec sk_test_ et la carte 4242 4242 4242 4242, puis passer en sk_live_.
  - 🔜 Nom de domaine (Vercel → Domains), puis mettre à jour `APP_URL`.
  - Plus tard : Resend (e-mails réels), relecture juridique, comptable (TVA).
- Vitesse : les fonctions Vercel tournent à Singapour (`regions: ["sin1"]` dans vercel.json), à côté de la base Supabase ; l'utilisateur connecté n'est lu qu'une fois par page (`cache`). Adresse du site : https://diyafa-omega.vercel.app (APP_URL).
- Sécurité Supabase : migration `lock_tables` (RLS activé sur toutes les tables + droits retirés aux rôles publics anon/authenticated). Le site n'est pas concerné (il se connecte en propriétaire des tables).
- Admin → tableau de bord : bouton « Créer une annonce de test (Médine) » (hôte de test demo-host@diyafa.test). Supprimer ces annonces avant le lancement.
- **Fin séance 2 — À REPRENDRE ICI :**
  1. 🔴 Paiement Stripe refusé (« payment_unavailable ») : lire dans Vercel → Logs la ligne `[payment] stripe createPayment failed: …`. Soupçon : clé collée = `mk_…` au lieu de `sk_test_…`, ou clé mal copiée. Corriger STRIPE_SECRET_KEY puis Redeploy. Tester avec 4242 4242 4242 4242.
  2. 🔴 Photos des annonces ne s'affichent pas : vérifier que le bucket Supabase `photos` est bien **Public** (documents doit rester privé).
  3. Réfléchir à un **nom de marque en anglais** (le propriétaire le souhaite) → changer `app.name` dans `src/lib/i18n/*.ts`, le titre dans `src/app/layout.tsx` et `src/app/manifest.ts`, et peut-être le logo ض.
  4. Ensuite : nom de domaine (diyafa.com est pris → idées : diyafastay.com, diyafa.co, diyafa.app, mydiyafa.com), puis APP_URL.
  5. **Stratégie de lancement** — cible prioritaire : **pèlerins de Belgique et de France** (c'est de là que viennent le plus de demandes). Idées techniques liées : langue choisie automatiquement selon le navigateur (français pour FR/BE), textes et FAQ pensés pour eux (vols, transferts depuis Jeddah/Madinah, Omra), prix en € déjà fait. trouver les premiers hôtes, cible (pèlerins étrangers / habitants), prix et commissions, marketing (réseaux sociaux, agences Omra, mosquées, bouche-à-oreille), date de lancement selon la saison (Ramadan, Omra, Hajj).
  6. Supprimer les annonces de test avant le lancement.

## Liste avant la date de lancement
- [ ] Paiement Stripe testé (carte 4242), puis clé **live** `sk_live_…` dans Vercel + Redeploy
- [ ] Photos visibles (bucket `photos` public)
- [ ] Nom de marque (anglais) + nom de domaine branché, APP_URL mis à jour
- [ ] E-mails réels (Resend + domaine) — sinon les clients ne reçoivent aucune confirmation
- [ ] Annonces et comptes de test supprimés
- [ ] Premiers vrais hôtes inscrits et annonces validées (avoir des logements le jour J)
- [ ] Conditions d'utilisation / confidentialité relues par un juriste ; TVA vérifiée par un comptable
- [ ] Test complet sur téléphone : inscription, réservation, paiement, annulation, remboursement

## Séance 3 (22 nov.) — changements demandés
- **Licences retirées** partout (inscription hôte, annonces, fiches, admin, textes). Les hôtes envoient seulement leur pièce d'identité. Les conditions d'utilisation disent que l'hôte reste responsable des autorisations éventuelles.
- **Nouveau modèle de paiement** : le voyageur paie **en ligne uniquement la part Diyafa** (frais voyageur 10 % + commission hôte 20 % + TVA éventuelle sur cette part) ; **le reste est payé à l'hôte sur place**. Exemple 1 000 € (TVA 0 %) : 300 € en ligne, 800 € à l'hôte, le voyageur paie 1 100 € au total. Plus de versements aux hôtes (onglet supprimé). Les remboursements ne portent que sur la part en ligne. Champs `onlineAmount` et `payOnSite` sur chaque réservation.
- **Commissions** : 20 % hôte, 10 % voyageur (valeurs par défaut + migration qui met à jour les réglages existants).
- **Pas de TVA sur le site** (décision du propriétaire) : TVA à 0 % partout, réglage TVA retiré de l'admin, aucune ligne TVA affichée. Affichage client : Prix (fixé par l'hôte) → Frais de service (10 %) → Total ; puis « à payer en ligne » / « à payer à l'hôte à l'arrivée ». Exemple 10 €/nuit : le client paie 11 € (3 € en ligne, 8 € à l'hôte).
- **Lits hommes / femmes** : filtre « Lits pour » dans la recherche, liens Hommes / Femmes sur l'accueil, badges sur les cartes, choix Hommes / Femmes dans la réservation (enregistré sur le compte à la première réservation).
- **Connexion avec Google (Gmail)** : bouton sur Connexion et Inscription, actif dès que `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont dans Vercel. URI de redirection à déclarer chez Google : `https://diyafa-omega.vercel.app/api/auth/google/callback` (à refaire avec le nom de domaine définitif).
- 42 tests automatiques OK.

## Séance 3 (suite) — nouvelles fonctions
- **Langue automatique** à la première visite : France/Belgique/Maghreb → français, pays arabes → arabe, sinon langue du navigateur ou anglais (`src/lib/locale-detect.ts`, middleware).
- **Carte** OpenStreetMap (gratuite) : bouton Liste / Carte dans la recherche, carte sur chaque fiche. Seuls les logements avec coordonnées GPS apparaissent → demander aux hôtes de remplir latitude/longitude.
- **Heures d'arrivée / départ** par annonce (défaut 15:00 / 12:00), affichées sur la fiche, la réservation et l'e-mail. Les délais d'annulation se calculent à partir de l'heure réelle d'arrivée (heure de La Mecque).
- **Prix de saison** : Admin → Saisons (ex. Ramadan +30 %) ; l'hôte active « prix de saison » sur son annonce. Les prix spéciaux du calendrier restent prioritaires.
- **Codes promo** : Admin → Codes promo. La réduction est prise sur la commission Diyafa, jamais sur la part de l'hôte.
- **Parrainage** : lien personnel dans « Mon compte » (+ partage WhatsApp) ; le filleul a -10 % sur sa 1re réservation, le parrain reçoit un code -10 % par e-mail.
- **Mot de passe oublié** : lien valable 1 h (nécessite les vrais e-mails pour fonctionner en ligne).
- **Bouton « Aide sur WhatsApp »** pour les visiteurs : variable `SUPPORT_WHATSAPP`.
- **Messagerie protégée** : numéros, e-mails, liens et applis (WhatsApp, Telegram…) bloqués, même déguisés (chiffres arabes, en lettres, espacés, « arobase »). Le message n'est pas envoyé, un rappel « craignez Allah et respectez les règles » s'affiche, et la tentative apparaît dans Admin → Modération. Même filtre sur les annonces, la bio de l'hôte et les avis. Le bouton WhatsApp de l'hôte n'apparaît plus qu'une fois la réservation confirmée.
- **Alertes pour le propriétaire** à chaque réservation, annulation, refus, nouvel hôte, nouvelle annonce, litige, message de contact : e-mail aux admins + WhatsApp via CallMeBot (`OWNER_WHATSAPP`, `CALLMEBOT_API_KEY`).
- 53 tests automatiques OK.

### À configurer par le propriétaire (Vercel → Environment Variables, puis Redeploy)
- E-mails réels : compte Resend + domaine → `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`
- WhatsApp alertes : `OWNER_WHATSAPP`, `CALLMEBOT_API_KEY` · Aide visiteurs : `SUPPORT_WHATSAPP`
- Google : `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Bancontact et SMS : abandonnés (décision du propriétaire).
- **Règles de la messagerie et de remboursement** : à rédiger ensemble.

## Séance 3 (suite 2) — annulations, employés, automatisations
- **Admin → Annulations** : qui a annulé (voyageur / hôte / Diyafa / demande refusée / refus automatique), quand, et pourquoi. La raison est **obligatoire** pour le voyageur et l'hôte. Classement des hôtes qui annulent le plus (12 mois).
- **Suspension automatique** : après N annulations par l'hôte en 12 mois (réglable, défaut 3), toutes ses annonces passent en « Suspendue » et disparaissent du site ; alerte e-mail/WhatsApp pour le propriétaire et e-mail à l'hôte. Pour les remettre : Admin → Annonces → Valider.
- **Employés (rôle STAFF)** : Admin → Employés. La personne crée d'abord un compte, puis le propriétaire l'ajoute par e-mail et coche ses droits : valider hôtes, annonces, voir réservations (sans les montants Diyafa), annuler/rembourser, annulations, suspendre utilisateurs, modération, litiges, contact, codes promo, saisons. **Jamais** pour un employé : chiffre d'affaires, commissions, paiements, réglages, gestion des employés. Les employés ne peuvent pas agir sur les comptes admin/employés ni changer les rôles. Compte démo local : staff@diyafa.test / Staff12345!
- **Automatisations** (cron quotidien Vercel + au chargement des tableaux de bord) : refus + remboursement automatique des demandes sans réponse après X heures (réglable, défaut 24 h), rappel la veille de l'arrivée (voyageur + hôte), demande d'avis après le départ, libération des dates non payées, fin des séjours. Réglages dans Admin → Commissions → Automatisations.
- 58 tests automatiques OK.

## Séance 3 (suite 3)
- **Lits : un appartement = hommes OU femmes**, jamais mélangé. L'hôte choisit « Appartement de lits pour : Hommes / Femmes » ; toutes les chambres suivent. Changement impossible tant qu'il y a des réservations actives. Fiche, carte et réservation affichent « Appartement réservé aux hommes / aux femmes ». Plus aucun « Hommes et femmes » sur le site. Migration : les anciens appartements prennent le genre de leur première chambre.
- **Admin → Réservations** : onglets avec compteurs (en attente de l'hôte, confirmées, en attente de paiement, terminées, annulées, refusées) + **« Pas trouvées »** = recherches sans résultat sur 90 jours (table `SearchLog`), avec le « plus demandé sans résultat ».
- ✅ **E-mails actifs (Resend)** depuis le 22 nov. : EMAIL_PROVIDER=resend + RESEND_API_KEY dans Vercel ; expéditeur par défaut `Diyafa <onboarding@resend.dev>` (le code l'utilise si EMAIL_FROM est vide). ⚠️ Sans nom de domaine vérifié dans Resend, seuls les e-mails vers l'adresse du compte Resend (Gmail du propriétaire) partent → alertes admin OK, clients/hôtes pas encore. Étape suivante : acheter le domaine → Resend → Domains → ajouter les enregistrements DNS → EMAIL_FROM=`Diyafa <contact@domaine>`.
- ✅ **Photos OK** (22 nov.) : envoi vers Supabase Storage fonctionne (le code tolère maintenant espaces / `/` final dans SUPABASE_URL et la clé ; les refus sont notés `[storage]` dans les logs).
- Restent à configurer : Stripe (erreur à diagnostiquer dans les logs `[payment]`), alertes WhatsApp (CallMeBot), Google, nom de domaine.
- **Location longue durée** : plus de réservation ni de paiement sur le site. Bouton « Demander une visite sur WhatsApp » vers le WhatsApp Diyafa (+32 465 99 45 02, modifiable avec `LONG_TERM_WHATSAPP`), message prêt en arabe + français avec la référence du bien (`DY-XXXXXX`, affichée sur chaque fiche) et le lien. Le serveur refuse toute réservation longue durée.
- **Alertes annonces** : e-mail/WhatsApp au propriétaire quand un hôte clique « Envoyer pour validation » (avec lien direct) et quand une annonce publiée est modifiée et repasse en vérification. Rappel bien visible pour l'hôte tant que son annonce est en brouillon (cause probable de l'alerte manquante : annonce jamais envoyée).
- 59 tests OK.
- Contrôles annonces : l'hôte doit saisir le prix correspondant au type (par nuit / par mois) ; l'admin ne peut plus publier une annonce sans photo, sans prix ou sans lit (message explicatif + avertissement ⚠️ sur la carte). Constat : les annonces « Villa 5 chambres » (0 €/mois) et « Appartemet – Médine » (0 photo) avaient été validées directement par l'admin, sans envoi par l'hôte → pas d'alerte.
- **Longue durée = loyer annuel en riyals (SAR)** : champ `pricePerYear` (halalas), saisi par l'hôte « Loyer par an (SAR) », affiché « 72 000 SAR / an » (cartes, fiche, carte, admin). Pas de paiement en ligne (visite via WhatsApp). Les filtres de prix en € ne s'appliquent pas à la longue durée. Les anciennes annonces longue durée doivent ressaisir leur loyer annuel (sinon ⚠️ prix manquant).
- **Longue durée = pas d'hôte, uniquement le propriétaire** : aucun hôte affiché ni contactable (pas de messagerie, pas de WhatsApp de l'hôte) ; seul le bouton WhatsApp Diyafa (le propriétaire de Diyafa gère les visites). Champ obligatoire « Numéro WhatsApp du propriétaire » (`ownerPhone`), visible uniquement dans l'admin (lien WhatsApp direct). Option « Paiement possible en 2 fois (tous les 6 mois) » (`allowTwoPayments`) affichée « 2 × 27 000 SAR » et mentionnée dans le message WhatsApp. Libellé « Propriétaire » au lieu d'« Hôte » dans l'admin.
- **E-mails professionnels** (style Airbnb/Booking) : logo ض bordeaux, carte du logement avec photo, récapitulatif (n°, arrivée/départ avec heures, voyageurs, lit), encadré des montants (payé en ligne / à payer sur place / total), bouton d'action, pied de page. Version texte incluse. **Langue du destinataire** (fr/en/ar, arabe en RTL). Fichiers : `src/lib/email-layout.ts` (mise en page), `src/lib/emails.ts` (contenus). Concernés : confirmation, demande envoyée, acceptée, refusée, annulation (client + hôte), nouvelle réservation / demande (hôte), rappel veille d'arrivée, demande d'avis, mot de passe oublié, nouveau message, hôte validé/refusé, annonce publiée/refusée/suspendue, parrainage, alertes admin.
- **L'hôte ne voit que son montant net** (« Vous recevez », commission déjà déduite) : plus de prix brut ni de ligne commission dans Réservations, Revenus et e-mails hôte. Page Revenus : « Déjà reçu » / « À recevoir », tableau par réservation.
- **Admin → Diagnostic** (propriétaire uniquement) : montre ce que le site en ligne lit dans Vercel (PAYMENT_PROVIDER, début des clés, e-mails, stockage, Google, WhatsApp…) sans jamais afficher les secrets.
- ✅ **Paiements Stripe OK** (22 nov., mode test). Problème trouvé grâce à Admin → Diagnostic : la clé avait été collée dans PAYMENT_PROVIDER et un morceau de page dans STRIPE_SECRET_KEY.
- **Webhook Stripe** ajouté (`/api/stripe/webhook`, signature vérifiée) : confirme la réservation même si le client ferme la page après avoir payé. À configurer : Stripe → Développeurs → Webhooks → Ajouter un endpoint `https://diyafa-omega.vercel.app/api/stripe/webhook`, événements `checkout.session.completed` + `checkout.session.expired` → copier le « Secret de signature » (`whsec_…`) dans Vercel `STRIPE_WEBHOOK_SECRET` → Redeploy. À refaire avec la clé live et le nom de domaine au lancement.
- **Avant le lancement** : remplacer `sk_test_` par `sk_live_` (compte Stripe activé) + nouveau webhook en mode live.
- ✅ **Webhook Stripe actif** (STRIPE_WEBHOOK_SECRET) et ✅ **Connexion Google active** (projet Google Cloud « Diyafa », application publiée, client « Diyafa site », redirection `https://diyafa-omega.vercel.app/api/auth/google/callback`). Bouton « Aide sur WhatsApp » actif avec le numéro Diyafa par défaut.
- Alertes WhatsApp : CallMeBot complet → reporté ; alertes par e-mail en attendant (notifications Gmail sur le téléphone).
- **Reste avant lancement** : 1) nom de marque anglais + nom de domaine ; 2) au changement de domaine, mettre à jour : APP_URL, Google (origines + URI de redirection + branding), webhook Stripe (URL), Resend (vérifier le domaine, EMAIL_FROM) ; 3) Stripe en mode réel (sk_live_ + nouveau webhook live) ; 4) supprimer les annonces de test ; 5) textes juridiques / comptable.

## Fin de séance 3 (22 nov.) — À REPRENDRE ICI
- **Nom / domaine pas encore choisi.** Pris : diyafa.com, diyyafa.com, dardiyafa.com. Libres (vérifiés par le propriétaire) : diyafabayt.com, dardiyyafa.com, addiyafa.com. À vérifier : aldiyafa.com (favori s'il est libre), diyafastay.com, getdiyafa.com, mydiyafa.com. Idée : garder « Diyafa » comme nom affiché si le domaine a un mot en plus.
- Renommage de marque préparé sur la branche `rename-dar-diyafa` (« Dar Diyyafa ») — NON fusionné ; à adapter au nom final.
- Domaine à acheter chez **o2switch** (offre avec boîtes mail pro) ; le site reste sur **Vercel**. Ensuite : DNS vers Vercel (A @ → valeur donnée par Vercel, CNAME www → cname.vercel-dns.com), boîte contact@, domaine dans Resend + EMAIL_FROM, Google (origines/redirect/branding), webhook Stripe (URL), APP_URL.
- **Stripe : problème de vérification de la société (LLC)** signalé par le propriétaire → à voir à la prochaine séance (nécessaire pour passer en mode réel sk_live_).
- Projet futur : ouverture internationale (villes/pays gérés depuis l'admin, point d'intérêt par ville, devises).
- **Admin → Remise à zéro** (propriétaire uniquement, mot SUPPRIMER requis) : 1) supprime réservations, paiements, avis, litiges, versements, recherches non trouvées (comptes et annonces conservés) ; 2) supprime les annonces cochées (ou toutes) avec photos, lits, calendrier, conversations. Utilisée au lancement (23 nov.) pour effacer les données de test.
- Annonce de lancement envoyée aux hôtes le 23 nov. (FR/EN/AR) avec le lien `…/register?as=host`.
- **Disponibilités (hôtes, courte durée)** : bouton bien visible « 📅 Disponibilités » ; bloquer / débloquer une période « du … au … » en une fois (en plus du calendrier jour par jour) ; bouton « ⏸️ Mettre en pause » / « ▶️ Réactiver » (champ `paused` : annonce invisible dans la recherche et non réservable). Boutons des cartes d'annonces corrigés sur téléphone (passage à la ligne).
- Réservations simultanées : réessai automatique des conflits passagers de la base (aucune double réservation, plus d'« erreur » affichée dans ce cas rare).
- **Rapport quotidien automatique** : chaque matin (~8 h heure de La Mecque, cron Vercel `0 5 * * *`), e-mail aux admins avec l'activité de la veille : nouvelles réservations, confirmées (détail), annulées (qui + raison), refusées, séjours terminés, nouveaux clients / hôtes / annonces, messages, recherches sans résultat, encaissé en ligne, remboursé, commissions, « à faire » (hôtes/annonces à valider, demandes en attente, litiges, messages signalés) et totaux. Page **Admin → Rapport** (propriétaire) pour n'importe quel jour + bouton « M'envoyer le rapport d'hier ». Fichier `src/lib/report.ts`.
- **Alertes Telegram** (gratuit, API officielle) en plus des e-mails : toutes les alertes propriétaire (réservations, annulations, nouveaux hôtes/annonces, litiges, contact) + le rapport du matin. Configuration : bot créé avec @BotFather → `TELEGRAM_BOT_TOKEN` dans Vercel → envoyer un message au bot → Admin → Commissions → Telegram → « Connecter » (le chat id est mémorisé) → « Envoyer un test ».
- **Distance au Haram simplifiée** (suite au 1er hôte qui avait tapé « 4 » pour 4 km) : le formulaire hôte a 3 cases — Distance (avec choix mètres / kilomètres), Temps à pied (min), Temps en voiture (min). Distance < 30 m refusée avec message clair. Affichage : « 4 km du Haram · 55 min à pied · 10 min en voiture » (temps saisis par l'hôte prioritaires, sinon temps à pied estimé). Champs `walkMinutes`, `driveMinutes`. Lien Google Maps / GPS retirés du formulaire (la carte n'affiche que les annonces avec coordonnées). Correction rapide par l'admin dans Admin → Annonces (« 📍 … — corriger »).
- Alertes Telegram : en attente du token BotFather du propriétaire (étape 1 envoyée).
- **Stratégie (24 nov.)** : démarrage Makkah + Madinah uniquement. Idée future : un responsable par ville payé à la commission (le propriétaire pensait à 50 % ; conseil : 30–40 % de la commission Diyafa + bonus, contrat écrit avec confidentialité / non-concurrence / hôtes et clients appartenant à Diyafa). Expansion ensuite : 1 ville test au Maroc (Marrakech), puis Tanger, Rabat. À préparer le moment venu : comptes « responsable de ville » limités à une ville, calcul mensuel automatique de leur part, rapport par ville, villes/pays gérés depuis l'admin.
- **Galerie photos plein écran** sur les fiches : toucher une photo l'agrandit, glisser / flèches pour naviguer, miniatures, ✕ / Échap pour fermer ; bouton « Voir les N photos » (toutes les photos, plus seulement 5).

