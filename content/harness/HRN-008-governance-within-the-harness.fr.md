---
title: Gouvernance au sein du harness
summary: >-
  La gouvernance est une couche d'ingénierie du harness qui applique des
  politiques, des approbations et des garde-fous au moment de l'exécution,
  transformant les obligations d'IA de l'entreprise en contrôles exécutables qui
  filtrent chaque action de l'agent.
---
# Gouvernance au sein du harness

## Résumé opérationnel

La gouvernance n'est pas un document qui vit dans un wiki — dans un système agentique fiable, il s'agit d'une **couche d'exécution (runtime) du harness**. Ce chapitre soutient que les obligations d'IA d'entreprise (réglementaires, contractuelles et basées sur les risques) doivent être compilées en contrôles exécutables situés sur le chemin critique entre l'intention du modèle et l'action du système. Harness Engineering traite la gouvernance comme du code : points de décision de politique (PDP), barrières d'approbation et garde-fous qui observent, autorisent, transforment ou bloquent chaque appel d'outil. Sans cette couche, l'autonomie d'un agent est, par construction, non gouvernée ; avec elle, l'autonomie devient délimitée, auditable et défendable.

## Concepts clés

- **Point d'application des politiques (PEP - Policy Enforcement Point) :** le composant du harness qui intercepte une action de l'agent et demande une décision.
- **Point de décision de politique (PDP - Policy Decision Point) :** le moteur qui évalue la politique par rapport au contexte de l'action et renvoie autoriser/refuser/transformer.
- **Garde-fou (Guardrail) :** un contrôle à l'exécution sur les entrées ou les sorties (contenu, schéma, PII, juridiction) qui contraint le comportement.
- **Barrière d'approbation (Approval gate) :** un contrôle qui suspend l'exécution en attendant une décision humaine ou d'une autorité supérieure (voir PAT-001).
- **Politique en tant que code (Policy-as-code) :** règles de gouvernance exprimées dans un format déclaratif, versionné et testable.
- **Piste d'audit (Audit trail) :** le registre immuable de ce qui a été tenté, de ce qui a été décidé et pourquoi.

## Définition

> **La gouvernance au sein du harness** est la discipline consistant à intégrer l'application des politiques, les flux de travail d'approbation et les garde-fous en tant que couche d'exécution de premier ordre d'un système agentique, de sorte que chaque action initiée par le modèle soit arbitrée par une décision explicite et auditable dérivée de la politique de l'entreprise.

## Diagramme d'architecture

```mermaid
flowchart LR
    M[Modèle / Boucle de raisonnement] -->|action proposée| PEP[Point d'application des politiques (PEP)]
    PEP -->|contexte + action| PDP[Point de décision de politique (PDP)]
    G[(Bundle de politiques en tant que code)] --> PDP
    PDP -->|autoriser| TOOL[Outil / Effecteur]
    PDP -->|transformer| RW[Masquer / Contraindre] --> TOOL
    PDP -->|refuser| BLK[Bloquer + Expliquer]
    PDP -->|escalader| APR[Barrière d'approbation / Humain]
    APR -->|approuvé| TOOL
    APR -->|rejeté| BLK
    PEP --> AUD[(Journal d'audit immuable)]
    PDP --> AUD
    APR --> AUD
    TOOL --> AUD
```

## Explication détaillée

La couche de gouvernance est structurée autour de la séparation classique **PEP/PDP** empruntée à l'architecture d'autorisation (XACML, OPA), adaptée aux agents non déterministes. Le point d'application est intégré au chemin d'invocation des outils du harness de sorte qu'*aucune* action à effet — envoyer un e-mail, écrire dans une base de données, transférer des fonds, appeler une API externe — n'atteigne un effecteur sans avoir été préalablement évaluée. Le point de décision évalue l'action par rapport à un **bundle de politiques** : un ensemble de règles versionné et testable définissant pour qui l'agent agit, quelles classes de données il touche, quelles juridictions s'appliquent et quelles limites de dépenses ou de rayon d'impact (blast radius) sont en vigueur.

Trois résultats d'application importent au-delà du simple autoriser/refuser. **Transformer** permet au harness d'autoriser une action tout en neutralisant le risque — en masquant les données personnelles (PII) avant un appel sortant, en restreignant la portée d'une requête ou en plafonnant le montant d'une transaction. **Escalader** oriente l'action vers une barrière d'approbation (PAT-001), suspendant durablement le plan de l'agent jusqu'à ce qu'un humain ou un agent superviseur prenne une décision. **Refuser avec explication** renvoie une justification structurée dans le contexte de l'agent afin que la boucle de raisonnement puisse replanifier plutôt que de réessayer aveuglément.

Les garde-fous opèrent à deux frontières. Les *garde-fous d'entrée* filtrent le contenu récupéré et les instructions de l'utilisateur pour détecter les injections, les modèles de jailbreak et les requêtes hors de portée avant qu'ils n'influencent le plan. Les *garde-fous de sortie* valident le contenu généré et les arguments d'outils structurés par rapport au schéma, à la politique de contenu et aux règles de perte de données avant qu'ils ne quittent la frontière de confiance. Crucialement, les garde-fous sont **superposés et non uniques** : un seul classificateur constitue un point de défaillance unique, c'est pourquoi la défense en profondeur combine des contrôles déterministes (regex, schéma, listes d'autorisation), des contrôles statistiques (classificateurs) et des contrôles basés sur des modèles (LLM-as-judge) avec des comportements par défaut sécurisés (fail-closed) conservateurs pour les actions à haut risque.

La gouvernance définit également le **gradient d'autonomie**. Le harness attribue à chaque classe d'action un mode de contrôle le long d'un spectre : entièrement autonome, autonome avec journalisation, humain dans la boucle (approbation requise) ou humain au-dessus de la boucle (l'humain peut interrompre). Cette correspondance est elle-même une politique : un remboursement inférieur à 50 $ peut être autonome ; un remboursement supérieur à 5 000 $, ou toute action touchant à des données réglementées, exige une barrière d'approbation. La taxonomie de ces modes de contrôle se connecte directement à la taxonomie du harness (HRN-003) et au cadre de gouvernance de l'entreprise (GOV-001), qui fournit les obligations que cette couche compile.

Enfin, la gouvernance n'est crédible que si elle est **observable et prouvable**. Chaque décision — l'action proposée, la version de la politique consultée, les entrées, le verdict et la justification — est inscrite dans une piste d'audit immuable et interrogeable. C'est ce qui transforme le discours « nous avons une politique d'IA » en « nous pouvons démontrer, pour chaque action, que la politique a été appliquée », ce qui constitue le niveau de preuve que les régulateurs et les auditeurs exigent réellement.

## Preuves de production

> **Scénario illustratif / représentatif.** Niveau de preuve : théorique · Confiance : moyenne · Source : observation_secteur, expérience_personnelle. Les chiffres ci-dessous sont des fourchettes réalistes tirées de modèles observés, et non des mesures provenant d'un déploiement unique vérifié.

- **Contexte :** Un agent de back-office de services financiers qui rédige et exécute des mesures correctives pour les clients.
- **Scénario :** L'agent doit résoudre de manière autonome les litiges de faible valeur tout en ne déplaçant jamais de fonds de manière autonome au-delà d'un certain seuil ni en touchant aux données d'un autre client.
- **Technologie :** Orchestrateur avec un PEP sur chaque appel d'outil ; bundle de politiques de type OPA ; garde-fous de type classificateur + schéma + liste d'autorisation ; file d'attente d'approbation durable.
- **Charge :** Des dizaines de milliers d'actions/jour ; un pourcentage à un chiffre orienté vers des barrières d'approbation.
- **Résultats (représentatifs) :** Dans des déploiements illustratifs de cette nature, les couches de gouvernance réduisent généralement les violations de politique de haute gravité d'un ordre de grandeur par rapport à une référence non gouvernée, au prix d'une latence supplémentaire par action de l'ordre de quelques dizaines de millisecondes pour les contrôles déterministes, et d'une latence de bout en bout accrue pour les actions escaladées, limitée par le temps de réponse humain.

### Leçons apprises

Les comportements par défaut sécurisés (fail-closed) sur les classes d'actions à haut risque sont non négociables ; les défaillances coûteuses proviennent d'actions qui n'ont *jamais été évaluées* parce qu'un nouvel outil a été ajouté sans politique correspondante. La gouvernance doit donc contrôler l'**enregistrement des outils**, et pas seulement l'invocation des outils.

## Modes de défaillance observés

| Mode de défaillance | Déclencheur | Atténuation |
|---|---|---|
| Contournement de politique | Nouvel outil ajouté sans crochet PEP | Contrôler l'enregistrement des outils ; refus par défaut pour les actions non mappées |
| Évasion de garde-fou | Une injection de prompt réécrit l'intention en contournant un classificateur unique | Garde-fous superposés et sécurisés (fail-closed) ; contrôles d'entrée + sortie |
| Fatigue d'approbation | Des barrières trop larges submergent les humains, qui approuvent aveuglément | Barrières hiérarchisées par niveau de risque ; approbation automatique des risques faibles avec journalisation |
| Politique obsolète | Le bundle de politiques s'écarte de la réglementation | Versionner + tester la politique en tant que code ; examen périodique de conformité |
| Transformation silencieuse | Le masquage corrompt une action légitime | Journaliser les transformations ; faire remonter la justification dans le contexte de l'agent |
| Lacunes d'audit | Les décisions ne sont pas persistées avant l'exécution de l'action | Audit d'écriture préalable (write-ahead) ; refuser si le récepteur d'audit est indisponible |

## KPI

| Métrique | Cible | Notes |
|---|---|---|
| Couverture de la politique (classes d'actions mappées) | 100 % | Non mappé → refus par défaut |
| Taux de violation de haute gravité | → 0 | Pour 10 000 actions |
| Précision de la barrière d'approbation | Élevée | Fraction des escalades qui étaient justifiées |
| Latence de décision (p95) | < 50 ms déterministe | Exclut l'attente de l'approbation humaine |
| Complétude de l'audit | 100 % | Chaque action à effet possède un enregistrement de décision |
| Temps moyen de mise à jour de la politique | Faible (heures) | CI/CD de politique en tant que code |

## Métriques de coût

- **Surcharge de gouvernance par action :** les contrôles déterministes ajoutent un calcul négligeable ; les garde-fous basés sur des modèles ajoutent un ou plusieurs appels d'inférence auxiliaires — à budgétiser dans le coût par tâche.
- **Coût de l'approbation humaine :** le coût variable dominant ; minimisé par une hiérarchisation précise des risques afin que seules les actions justifiées soient escaladées.
- **Coût d'ingénierie :** rédaction des politiques et tests de conformité ; amorti sous forme de bundles de politiques réutilisables entre les agents.

## Caractéristiques de mise à l'échelle

L'application déterministe s'adapte horizontalement et de manière sans état (stateless) avec l'orchestrateur. Les garde-fous basés sur des modèles s'adaptent à la capacité d'inférence et constituent le goulot d'étranglement du débit en cas de volume d'actions élevé — mettez-les en cache et court-circuitez-les d'abord avec des contrôles déterministes peu coûteux. Les barrières d'approbation s'adaptent à la capacité humaine, et non au calcul, l'objectif de conception est donc de maintenir la fraction escaladée faible et stable à mesure que le volume d'actions augmente.

## Contenu connexe

- HRN-003 — Taxonomie des couches du harness et des modes de contrôle.
- GOV-001 — Cadre de gouvernance de l'IA d'entreprise (les obligations que cette couche applique).
- PAT-001 — Modèle d'approbation humaine (le mécanisme de barrière d'approbation).

## Références

- NIST AI Risk Management Framework (AI RMF 1.0).
- ISO/IEC 42001:2023 — Systèmes de management de l'IA.
- OASIS XACML et le modèle d'autorisation PEP/PDP.
- Open Policy Agent (OPA) — moteur de politique en tant que code.

## FAQ

**Q : Pourquoi ne pas gérer la gouvernance dans le prompt ?**
A : Les instructions du prompt sont indicatives et contournables par injection ; l'application au niveau du harness est obligatoire et auditable. La gouvernance doit se situer en dehors de la surface d'influence du modèle.

**Q : Le contrôle de chaque action n'ajoute-t-il pas trop de latence ?**
A : Les contrôles déterministes coûtent de quelques millisecondes à quelques dizaines de millisecondes. Seules les actions escaladées entraînent un délai à l'échelle humaine, et celles-ci sont délibérément rares.

**Q : En quoi cela diffère-t-il de GOV-001 ?**
A : GOV-001 définit les obligations et le cadre ; HRN-008 explique comment ces obligations sont compilées en contrôles d'exécution à l'intérieur du harness.
