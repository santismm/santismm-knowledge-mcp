---
title: Glossaire
summary: >-
  Un glossaire canonique de la terminologie du Harness Engineering et des
  systèmes agentiques — harness, agent, outil, orchestration, évaluation, span,
  RAG, MCP, garde-fou, etc. — avec des définitions claires et citables.
---
# Glossaire

## Résumé exécutif

Ce glossaire est la référence canonique pour les termes utilisés dans le manuel de Harness Engineering et sur l'ensemble de la plateforme de connaissances Santismm. Les définitions sont claires, extractibles par machine et destinées à être citées directement. Lorsqu'un terme dispose d'un chapitre dédié, l'entrée renvoie vers celui-ci.

## Définition

Voici les définitions canoniques des termes utilisés dans l'ensemble de ce corpus. Les termes sont regroupés pour faciliter la lecture ; au sein des groupes, ils sont ordonnés de manière approximative, du plus fondamental au plus spécialisé.

### Concepts clés

- **Agent :** un système qui utilise un modèle de langage en boucle pour poursuivre un objectif, en décidant des actions (appels d'outils) à entreprendre sur la base d'observations jusqu'à ce qu'une condition d'arrêt soit remplie.
- **Système agentique :** un système logiciel dont le comportement est piloté par un ou plusieurs agents, incluant tout l'échafaudage environnant nécessaire pour les rendre fiables.
- **Harness :** l'échafaudage technique autour d'un modèle — mémoire, outils, planification, orchestration, observabilité, évaluation, gouvernance et sécurité — qui transforme un modèle brut en un système agentique fiable.
- **Harness Engineering :** la discipline émergente responsable de la construction de systèmes agentiques fiables pour les environnements d'entreprise en concevant et en exploitant le harness.
- **Modèle / LLM :** le modèle de langage sous-jacent qui effectue le raisonnement et la génération ; dans le harness, il est traité comme un composant puissant mais non déterministe et manipulable.
- **Gradient d'autonomie :** le spectre des modes de contrôle, de l'autonomie complète à l'intervention humaine (human-in-the-loop), attribué par classe d'action selon la politique.
- **Rayon d'impact :** le préjudice maximal qu'une action (ou un agent compromis) peut causer ; une grandeur essentielle à limiter.

### Outils et actions

- **Outil :** une fonction ou une capacité que l'agent peut invoquer pour observer ou influencer le monde (recherche, exécution de code, appel d'API, requête de base de données).
- **Appel d'outil / appel de fonction :** une requête structurée du modèle pour invoquer un outil avec des arguments.
- **Effecteur :** un outil qui produit un effet de bord dans un système externe (envoi, écriture, transfert).
- **Idempotence :** la propriété selon laquelle l'exécution multiple d'une opération a le même effet que son exécution unique ; essentielle pour les tentatives et les reprises sécurisées.
- **Effet de bord :** un changement visible de l'extérieur produit par un appel d'outil.
- **Liste d'autorisation (allowlist) :** un ensemble explicite d'éléments autorisés (outils, destinations de sortie) ; le choix par défaut sécurisé pour les décisions sensibles en matière de sécurité.

### Mémoire et contexte

- **Fenêtre de contexte :** la plage limitée de jetons (tokens) que le modèle peut traiter lors d'une seule inférence.
- **Mémoire :** la couche du harness qui persiste et récupère les informations à travers les étapes et les sessions (à court terme, à long terme, épisodique, sémantique).
- **RAG (Retrieval-Augmented Generation) :** le fait de fournir au modèle un contenu pertinent récupéré au moment de l'inférence afin que sa sortie soit ancrée dans un corpus plutôt que dans la seule mémoire paramétrique.
- **Embedding :** une représentation vectorielle de texte utilisée pour la recherche de similitude sémantique lors de la récupération.
- **Base de données vectorielle (vector store) :** une base de données optimisée pour la recherche des plus proches voisins sur des embeddings.
- **Ancrage (grounding) :** le fait d'ancrer les affirmations générées dans des preuves récupérées et citables.
- **Ingénierie de contexte (context engineering) :** la pratique consistant à décider précisément quelles informations entrent dans la fenêtre de contexte pour chaque étape.

### Planification

- **Objectif :** l'état final souhaité avec des critères de réussite explicites.
- **Plan :** un ensemble ordonné ou partiellement ordonné de tâches censées atteindre un objectif.
- **Décomposition :** la division d'un objectif en sous-tâches (voir PAT-010, HRN-009).
- **DAG (graphe orienté acyclique) :** une représentation de plan qui capture les dépendances entre les tâches et expose le parallélisme.
- **Replanification :** la révision d'un plan en réponse à un échec, à de nouvelles informations ou à des modifications de contraintes.
- **Critères d'arrêt :** les budgets et conditions (étapes, temps, coût) qui arrêtent un agent en toute sécurité.

### Orchestration

- **Orchestration :** la couche du harness qui pilote l'exécution à travers les agents et les outils (voir HRN-010).
- **Topologie :** la configuration des agents — unique, pipeline, superviseur/exécutant (supervisor/worker) ou réseau.
- **Agent superviseur (orchestrateur) :** un agent qui planifie et délègue aux agents exécutants (voir PAT-002).
- **Agent exécutant (worker) :** un agent spécialisé qui exécute une sous-tâche déléguée (voir PAT-005).
- **Routage :** la sélection de l'agent, de l'outil ou de la branche suivante en fonction de l'état.
- **Transfert (handoff) :** le transfert de contrôle et de contexte d'un agent à un autre.
- **Machine à états :** un graphe explicite d'états et de transitions régies contrôlant l'exécution.
- **Exécution durable :** sémantique de flux de travail (workflow) où la progression est sauvegardée par des points de contrôle (checkpoints) et peut être reprise après des défaillances.
- **Saga :** une séquence d'opérations avec des actions de compensation pour annuler le travail partiel en cas d'échec.

### Gouvernance et sécurité

- **Gouvernance :** la couche du harness au moment de l'exécution (runtime) qui applique les politiques, les approbations et les garde-fous (voir HRN-008).
- **Policy-as-code :** règles de gouvernance exprimées dans un format déclaratif, versionné et testable.
- **PEP / PDP :** Policy Enforcement Point (intercepte les actions) et Policy Decision Point (évalue la politique).
- **Garde-fou (guardrail) :** un contrôle à l'exécution sur les entrées ou les sorties qui limite le comportement de l'agent.
- **Porte d'approbation :** un contrôle qui suspend l'exécution dans l'attente d'une décision humaine ou d'une autorité supérieure (voir PAT-001).
- **Moindre privilège :** accorder à chaque agent les autorisations minimales requises pour sa tâche.
- **Identité d'agent :** un principal distinct, attribuable, délimité et révocable pour chaque agent.
- **Injection de prompt :** contenu non approuvé qui détourne les instructions ou les objectifs d'un agent.
- **Injection de prompt indirecte :** injection transmise via les données que l'agent récupère.
- **Exfiltration de données :** sortie non autorisée de données sensibles via les résultats de l'agent ou les arguments des outils.
- **Trifecta mortelle (lethal trifecta) :** la combinaison dangereuse de l'accès aux données privées, de l'exposition à du contenu non approuvé et de la capacité de communication externe.
- **Bac à sable (sandbox) :** un environnement isolé, limité en ressources et en réseau, pour exécuter des outils ou du code non approuvés.
- **DLP (Data Loss Prevention) :** contrôles qui détectent et bloquent les données sensibles dans les charges utiles sortantes.

### Observabilité et évaluation

- **Observability :** la couche du harness qui rend le comportement de l'agent inspectable via des traces, des journaux (logs) et des métriques (voir HRN-006).
- **Trace :** l'enregistrement de bout en bout d'une seule exécution d'agent.
- **Span :** une unité de travail chronométrée unique au sein d'une trace (un appel d'outil, un appel de modèle), l'élément de base du traçage distribué.
- **Évaluation (eval) :** la mesure systématique de la qualité, de la sécurité et de la fiabilité de l'agent (voir HRN-007).
- **LLM-as-judge :** l'utilisation d'un modèle pour évaluer les résultats d'un autre modèle par rapport à une grille d'évaluation.
- **Niveau d'ancrage (groundedness) :** le degré auquel les affirmations générées sont étayées par les preuves fournies.
- **Suite de régression :** un ensemble fixe de cas d'évaluation exécutés à chaque modification pour détecter les régressions de qualité.
- **Développement piloté par l'évaluation (eval-driven development) :** la construction et la modification d'agents par rapport à un harness d'évaluation mesurable.

### Protocoles et normes

- **MCP (Model Context Protocol) :** un protocole ouvert pour connecter des modèles/agents à des outils et des sources de données via une interface standardisée.
- **Schéma d'outil :** la déclaration typée du nom, des arguments et de la description d'un outil que le modèle utilise pour l'appeler.
- **llms.txt :** une proposition de convention pour un fichier Markdown au niveau du site qui présente un index de contenu sélectionné et adapté aux agents.
- **JSON-LD :** format de données structurées utilisé pour rendre les documents lisibles par machine dans la couche de découverte.
- **NIST AI RMF / ISO 42001 / EU AI Act :** les principaux cadres de réglementation, de gestion des risques et de systèmes de gestion de l'IA auxquels un harness d'entreprise doit se conformer (voir HRN-014, GOV-001).

## FAQ

**Q : D'où dois-je citer une définition ?**
R : Citez le terme par son nom suivi de `HRN-013`. Lorsqu'un terme dispose d'un chapitre dédié, privilégiez la citation de ce chapitre pour plus de précision.

**Q : Un terme dont j'ai besoin est manquant — que dois-je faire ?**
R : Ajoutez-le ici dans le groupe approprié avec une définition claire en une phrase, et liez le chapitre dédié s'il en existe un.
