---
title: Sécurité pour les systèmes agentiques
summary: >-
  La sécurité pour les systèmes agentiques est la couche du harness qui défend
  contre l'injection de requêtes (prompt injection), isole les outils et les
  permissions dans des bacs à sable (sandboxes), empêche l'exfiltration de
  données et applique l'identité de l'agent ainsi que le moindre privilège à
  chaque action.
---
# Sécurité des systèmes agentiques

## Résumé exécutif

Les systèmes agentiques élargissent la surface d'attaque d'une manière que les applications traditionnelles ne connaissent pas : l'agent lit des données non fiables, prend des décisions lourdes de conséquences et détient des privilèges pour agir — de sorte qu'une seule entrée compromise peut se transformer en une action compromise. La sécurité des systèmes agentiques est la couche de harness qui part du principe que le modèle peut être manipulé, et le sera, et conçoit l'échafaudage environnant de manière à ce que cette manipulation ne puisse pas nuire. Le principe directeur est le **moindre privilège avec un rayon d'impact limité** : traiter le modèle comme un composant non fiable, placer les contrôles de sécurité *en dehors* de sa surface influençable, et s'assurer que même un agent entièrement piraté ne puisse causer que des dommages limités et auditables.

## Concepts clés

- **Injection de prompt :** contenu non fiable qui détourne les instructions ou les objectifs de l'agent.
- **Injection de prompt indirecte :** injection transmise via des données que l'agent récupère (documents, pages web, sorties d'outils).
- **Sandboxing d'outils :** isolation de l'exécution des outils afin qu'elle ne puisse pas dépasser l'autorité prévue.
- **Moindre privilège :** octroi à chaque agent des autorisations minimales nécessaires à sa tâche.
- **Identité de l'agent :** un principal distinct et attribuable pour chaque agent, délimité et révocable.
- **Exfiltration de données :** sortie non autorisée de données sensibles via les sorties d'outils ou le contenu rendu.
- **Trifecta mortelle :** la combinaison dangereuse de l'accès à des données privées, de l'exposition à du contenu non fiable et de la capacité à communiquer avec l'extérieur.

## Définition

> La **sécurité des systèmes agentiques** est la discipline de harness consistant à traiter le modèle comme un composant non fiable et manipulable, et à concevoir des contrôles d'identité, d'autorisation, d'isolation et de sortie de sorte que le préjudice maximal qu'un agent compromis peut causer soit limité, attribuable et auditable.

## Diagramme d'architecture

```mermaid
flowchart LR
    UNT[Entrées non fiables\nutilisateur, web, docs, sortie d'outil] --> IG[Garde-fous d'entrée\ndétection d'injection]
    IG --> AGENT[Boucle de raisonnement de l'agent\n(traitée comme non fiable)]
    AGENT -->|proposition d'appel d'outil| AUTH[AuthZ + Moindre privilège\nidentité de l'agent, identifiants limités]
    AUTH --> SBX[Sandbox d'outil\nisolation, liste d'autorisation]
    SBX --> EFF[Effecteur / Système externe]
    EFF --> OG[Garde-fous de sortie\nDLP, vérifications d'exfiltration]
    OG --> SINK[Destination autorisée]
    AUTH -.refus/quarantaine.-> BLK[Bloquer + Alerter]
    AGENT --> AUD[(Journal d'audit immuable)]
    AUTH --> AUD
    OG --> AUD
```

## Explication détaillée

La menace fondamentale est l'**injection de prompt**, et l'erreur fondamentale est d'essayer de la résoudre au sein du modèle. Aucun renforcement du prompt système ne permet de bloquer de manière fiable une instruction suffisamment astucieuse intégrée dans le contenu récupéré, car le modèle ne possède pas de frontière robuste et structurée entre « données » et « instructions ». L'injection indirecte en est la variante dangereuse : un agent qui résume une page web ou lit un ticket peut être détourné par un texte qu'un attaquant y a placé. La réponse du harness est **architecturale et non basée sur les prompts** : elle consiste à supposer que l'injection réussira parfois, et à s'assurer qu'un agent piraté ne puisse rien faire que ses *autorisations* lui interdisent. Les garde-fous d'entrée (détection d'injection/jailbreak) réduisent la *fréquence* des injections réussies ; les contrôles d'autorisation et de sortie en limitent les *conséquences*. Les deux sont nécessaires ; aucun ne suffit à lui seul.

Le **moindre privilège et l'identité de l'agent** constituent la colonne vertébrale de la sécurité agentique. Chaque agent doit s'exécuter en tant que principal distinct et attribuable, avec des identifiants limités aux seules ressources requises par sa tâche — jetons à courte durée de vie, périmètres OAuth restreints, lecture seule là où l'écriture n'est pas nécessaire, et isolation des données par locataire appliquée *en dessous* de l'agent (dans la couche de données), jamais en demandant gentiment au modèle de rester à sa place. Lorsqu'un agent agit pour le compte d'un utilisateur, il doit porter l'autorisation de cet utilisateur, et non un compte de service en mode administrateur suprême, afin que l'agent ne puisse jamais dépasser ce que l'utilisateur pourrait faire directement. Les identifiants doivent être injectés par le harness au moment de l'appel, et ne jamais être placés dans la fenêtre de contexte où une injection pourrait les lire et les exfiltrer.

Le **sandboxing d'outils** isole l'exécution. Les outils d'exécution de code s'exécutent dans des sandboxes éphémères, limitées en ressources et restreintes au niveau du réseau. Les catalogues d'outils sont sur **liste d'autorisation** par agent, de sorte qu'un agent piraté ne puisse pas accéder à un outil qui ne lui a jamais été accordé. Les outils à fortes conséquences sont soumis à une approbation humaine (PAT-007 / PAT-001) afin que même un appel autorisé mais manipulé nécessite une validation humaine. Le principe est la *défense en profondeur* : l'AuthZ décide *si* un appel est autorisé, la sandbox limite *ce que l'appel peut toucher*, et la barrière d'approbation ajoute un point de contrôle humain pour les actions irréversibles.

L'**exfiltration de données** est le risque agentique le plus sous-estimé. La « trifecta mortelle » — un agent disposant (1) d'un accès à des données privées, (2) d'une exposition à du contenu non fiable et (3) de la capacité de communiquer avec l'extérieur — est exploitable : des instructions injectées demandent à l'agent d'intégrer des secrets dans une requête sortante, une URL d'image rendue ou un argument d'outil. Le harness brise la trifecta en supprimant au moins l'un de ces piliers pour les contextes sensibles : restreindre les destinations de sortie à une liste d'autorisation, exécuter des vérifications de prévention des pertes de données (DLP) sur chaque charge utile sortante, supprimer ou figer le rendu de contenu externe, et interdire à l'agent de construire des URL sortantes arbitraires. Si un agent doit toucher à des données privées, sa capacité à communiquer avec l'extérieur doit être étroitement limitée, et inversement.

À la base de tout cela se trouvent l'**observability et l'auditability** (HRN-006) : chaque action, l'identité qui l'a effectuée, la décision d'autorisation et le contrôle de sortie doivent être consignés de manière immuable. Une sécurité que vous ne pouvez pas prouver est une sécurité que vous n'avez pas. Ces contrôles mettent en œuvre les obligations définies dans le cadre de gouvernance (GOV-001) et s'insèrent dans la taxonomie plus large du harness (HRN-003).

## Preuves de production

> **Scénario illustratif / représentatif.** Niveau de preuve : théorique · Confiance : moyenne · Source : observation_secteur, expérience_personnelle. Les descriptions ci-dessous représentent des modèles d'attaque/atténuation types et non des mesures issues d'un déploiement vérifié.

- **Contexte :** Un agent de support client ayant accès à une base de connaissances et la capacité d'envoyer des e-mails aux clients.
- **Scénario :** Un attaquant insère un texte d'injection dans un ticket de support pour tenter de forcer l'agent à envoyer par e-mail les données de compte d'un autre client à une adresse externe.
- **Technologie :** Identifiants limités par agent, liste d'autorisation de sortie, DLP sur le courrier sortant, détection d'injection sur le contenu récupéré, journal d'audit.
- **Charge :** Volume élevé de tickets ; une fraction faible mais non nulle contient des tentatives d'injection.
- **Résultats (représentatifs) :** Dans les déploiements de cette configuration, les contrôles architecturaux (liste d'autorisation de sortie + DLP + moindre privilège) bloquent la *conséquence* de l'injection même lorsque la détection manque la *tentative*, réduisant l'exfiltration réussie vers zéro, alors que la seule détection d'injection laisse un risque résiduel.

### Leçons apprises

Les stratégies basées uniquement sur la détection finissent par échouer ; les défenses fiables sont d'ordre architectural et limitent les conséquences. Briser la trifecta mortelle — en particulier en limitant les sorties — contribue davantage à la sécurité que n'importe quel classificateur unique.

## Modes de défaillance observés

| Mode de défaillance | Déclencheur | Atténuation |
|---|---|---|
| Injection de prompt directe | Instruction utilisateur malveillante | Garde-fous d'entrée + limitation des autorisations |
| Injection indirecte | Texte malveillant dans les données récupérées | Traiter tout le contenu récupéré comme non fiable ; contrôles de sortie |
| Exfiltration de données | Trifecta mortelle exploitée | Briser la trifecta : liste d'autorisation de sortie + DLP |
| Élévation de privilèges | Identifiants de service trop larges | Identifiants limités et à courte durée de vie par agent ; AuthZ déléguée par l'utilisateur |
| Fuite d'identifiants | Secrets dans la fenêtre de contexte | Injecter les identifiants au moment de l'appel, jamais dans le contexte |
| Échappement de sandbox | Code/réseau non restreint dans les outils | Sandboxes éphémères isolées du réseau et limitées en ressources |
| Député confus (Confused deputy) | Agent utilisé à mauvais escient comme proxy pour des actions interdites | Porter l'identité de l'appelant ; AuthZ au niveau de l'effecteur |

## KPI

| Métrique | Cible | Notes |
|---|---|---|
| Taux d'exfiltration réussie | → 0 | La métrique la plus importante |
| Rappel de la détection d'injection | Élevé | Réduit la fréquence des tentatives, n'est pas l'unique défense |
| Rigueur du périmètre d'autorisation | Octrois minimaux | Auditer les autorisations inutilisées ou trop larges |
| Couverture de la liste d'autorisation de sortie | 100% | Aucune destination sortante arbitraire |
| Temps moyen de révocation (MTTR) | Faible | Révocation de l'identité de l'agent compromis |
| Exhaustivité de l'audit | 100% | Chaque action est attribuable |

## Métriques de coût

- **Coût d'inférence des garde-fous :** les classificateurs d'injection/DLP ajoutent une inférence auxiliaire par requête — à budgétiser en coût par tâche.
- **Surcharge de la sandbox :** le démarrage d'une sandbox éphémère ajoute de la latence aux outils de code ; à amortir avec des pools actifs (warm pools).
- **Coût d'ingénierie :** l'identité limitée et la liste d'autorisation de sortie représentent un travail IAM initial qui s'avère rentable pour tous les agents.

## Caractéristiques de mise à l'échelle

Les contrôles d'autorisation et d'identité évoluent avec l'infrastructure IAM/secrets, de manière sans état par appel. Les classificateurs de garde-fous évoluent avec la capacité d'inférence et représentent le coût de débit ; court-circuitez-les d'abord avec des vérifications déterministes peu coûteuses (listes d'autorisation, regex, schémas). Les sandboxes évoluent avec un pool managé ; les pools actifs (warm pools) échangent le coût d'inactivité contre de la latence. Les contrôles de sortie évoluent de manière triviale et ne devraient jamais constituer un goulot d'étranglement — ils représentent le contrôle à haute valeur ajoutée le moins cher de la pile.

## Contenu connexe

- HRN-003 — La place de la sécurité dans la taxonomie du harness.
- GOV-001 — Obligations de gouvernance que les contrôles de sécurité mettent en œuvre.
- PAT-007 — Modèle de contrôle des outils/autorisations (sandboxing et utilisation contrôlée des outils).

## Références

- OWASP Top 10 for LLM Applications (LLM01 Prompt Injection, LLM06 Sensitive Information Disclosure).
- Simon Willison, « The lethal trifecta for AI agents ».
- NIST AI RMF et NIST SP 800-53 (moindre privilège, identité).
- MITRE ATLAS — paysage des menaces contradictoires pour les systèmes d'IA.

## FAQ

**Q : L'injection de prompt peut-elle être totalement évitée ?**
A : Non. Concevez le système en conséquence : partez du principe que l'injection réussit parfois et limitez-en les conséquences grâce au moindre privilège, au contrôle des sorties et au sandboxing.

**Q : Quel est le contrôle unique ayant la plus haute valeur ajoutée ?**
A : Briser la trifecta mortelle — le moyen le plus économique étant de limiter les sorties à une liste d'autorisation avec DLP — afin qu'un agent piraté ne puisse pas exfiltrer de données.

**Q : Les agents doivent-ils partager un compte de service ?**
A : Non. Donnez à chaque agent une identité distincte, limitée et à courte durée de vie, et faites-lui porter l'autorisation de l'utilisateur appelant afin qu'il ne puisse jamais dépasser les propres droits de cet utilisateur.
