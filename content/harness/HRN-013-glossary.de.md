---
title: Glossar
summary: >-
  Ein kanonisches Glossar der Terminologie für Harness Engineering und
  agentische Systeme – Harness, Agent, Tool, Orchestrierung, Evaluierung, Span,
  RAG, MCP, Guardrail und mehr – mit präzisen, zitierfähigen Definitionen.
---
# Glossar

## Executive Summary

Dieses Glossar ist die kanonische Referenz für Begriffe, die im gesamten Harness Engineering-Handbuch und auf der übergeordneten Santismm Knowledge Platform verwendet werden. Die Definitionen sind präzise, maschinell extrahierbar und für die direkte Zitierung gedacht. Wenn ein Begriff ein eigenes Kapitel hat, verweist der Eintrag darauf.

## Definitionen

Im Folgenden finden Sie die kanonischen Definitionen der in diesem Korpus verwendeten Begriffe. Die Begriffe sind zur besseren Lesbarkeit gruppiert; innerhalb der Gruppen sind sie grob von den Grundlagen bis hin zu spezialisierten Themen geordnet.

### Kernkonzepte

- **Agent:** ein System, das ein Sprachmodell in einer Schleife nutzt, um ein Ziel zu verfolgen, und basierend auf Beobachtungen entscheidet, welche Aktionen (Tool-Aufrufe) ausgeführt werden sollen, bis eine Abbruchbedingung erfüllt ist.
- **Agentisches System:** ein Softwaresystem, dessen Verhalten von einem oder mehreren Agenten gesteuert wird, einschließlich des gesamten umgebenden Gerüsts (Scaffolding), das erforderlich ist, um sie zuverlässig zu machen.
- **Harness:** das entwickelte Gerüst (Scaffolding) um ein Modell herum – Speicher, Tools, Planung, Orchestrierung, Observability, Evaluierung, Governance und Sicherheit –, das ein reines Modell in ein zuverlässiges agentisches System verwandelt.
- **Harness Engineering:** die entstehende Disziplin, die für den Aufbau zuverlässiger agentischer Systeme für Unternehmensumgebungen durch den Entwurf und Betrieb des Harness verantwortlich ist.
- **Modell / LLM:** das zugrunde liegende große Sprachmodell (Large Language Model), das logisches Denken (Reasoning) und Generierung durchführt; im Harness wird es als eine leistungsstarke, aber nicht-deterministische, manipulierbare Komponente behandelt.
- **Autonomie-Gradient:** das Spektrum der Kontrollmodi von vollständig autonom bis hin zu „Human-in-the-Loop“, das pro Aktionsklasse per Richtlinie (Policy) zugewiesen wird.
- **Explosionsradius (Blast Radius):** der maximale Schaden, den eine Aktion (oder ein kompromittierter Agent) verursachen kann; eine zentrale Größe, die es zu begrenzen gilt.

### Tools und Aktionen

- **Tool:** eine Funktion oder Fähigkeit, die der Agent aufrufen kann, um die Welt zu beobachten oder zu beeinflussen (Suche, Code-Ausführung, API-Aufruf, Datenbankabfrage).
- **Tool-Aufruf / Funktionsaufruf:** eine strukturierte Anfrage des Modells, ein Tool mit Argumenten aufzurufen.
- **Effector:** ein Tool, das einen Seiteneffekt in einem externen System erzeugt (sendet, schreibt, überträgt).
- **Idempotenz:** die Eigenschaft, dass die mehrfache Ausführung einer Operation denselben Effekt hat wie die einmalige Ausführung; unerlässlich für sichere Wiederholungsversuche (Retries) und Fortsetzungen.
- **Seiteneffekt:** eine extern sichtbare Änderung, die durch einen Tool-Aufruf hervorgerufen wird.
- **Allowlist:** eine explizite Menge zulässiger Elemente (Tools, Egress-Ziele); der sichere Standard für sicherheitsrelevante Entscheidungen.

### Speicher und Kontext

- **Kontextfenster:** die begrenzte Spanne an Token, die das Modell bei einer einzelnen Inferenz berücksichtigen kann.
- **Speicher:** die Harness-Schicht, die Informationen über Schritte und Sitzungen hinweg speichert und abruft (Kurzzeit-, Langzeit-, episodischer, semantischer Speicher).
- **RAG (Retrieval-Augmented Generation):** die Bereitstellung relevanter, abgerufener Inhalte für das Modell zum Inferenzzeitpunkt, sodass seine Ausgabe in einem Korpus verankert ist und nicht nur auf dem parametrischen Speicher basiert.
- **Embedding:** eine Vektordarstellung von Text, die für die semantische Ähnlichkeitssuche beim Abruf verwendet wird.
- **Vektorspeicher:** eine Datenbank, die für die Suche nach den nächsten Nachbarn über Embeddings optimiert ist.
- **Grounding:** das Verankern generierter Behauptungen in abgerufenen, zitierfähigen Belegen.
- **Context Engineering:** die Praxis der präzisen Entscheidung darüber, welche Informationen in das Kontextfenster für jeden Schritt einfließen.

### Planung

- **Ziel:** der gewünschte Endzustand mit expliziten Erfolgskriterien.
- **Plan:** eine geordnete oder teilgeordnete Menge von Aufgaben, von denen erwartet wird, dass sie ein Ziel erreichen.
- **Dekomposition:** das Zerlegen eines Ziels in Teilaufgaben (siehe PAT-010, HRN-009).
- **DAG (gerichteter azyklischer Graph):** eine Plandarstellung, die Aufgabenabhängigkeiten erfasst und Parallelität aufzeigt.
- **Replanning:** das Überarbeiten eines Plans als Reaktion auf Fehler, neue Informationen oder geänderte Einschränkungen.
- **Abbruchkriterien:** die Budgets und Bedingungen (Schritte, Zeit, Kosten), die einen Agenten sicher stoppen.

### Orchestrierung

- **Orchestrierung:** die Harness-Schicht, die die Ausführung über Agenten und Tools hinweg steuert (siehe HRN-010).
- **Topologie:** die Anordnung von Agenten – einzeln, Pipeline, Supervisor/Worker oder Netzwerk.
- **Supervisor-Agent (Orchestrator-Agent):** ein Agent, der plant und an Worker-Agenten delegiert (siehe PAT-002).
- **Worker-Agent:** ein spezialisierter Agent, der eine delegierte Teilaufgabe ausführt (siehe PAT-005).
- **Routing:** das Auswählen des nächsten Agenten, Tools oder Zweigs basierend auf dem Zustand.
- **Handoff:** die Übergabe von Kontrolle und Kontext von einem Agenten an einen anderen.
- **Zustandsautomat:** ein expliziter Graph von Zuständen und gesteuerten Übergängen, der die Ausführung kontrolliert.
- **Durable Execution:** Workflow-Semantik, bei der der Fortschritt durch Checkpoints gesichert wird und nach Fehlern fortgesetzt werden kann.
- **Saga:** eine Sequenz von Operationen mit kompensierenden Aktionen, um unvollständige Arbeit im Fehlerfall rückgängig zu machen.

### Governance und Sicherheit

- **Governance:** die Runtime-Harness-Schicht, die Richtlinien (Policies), Genehmigungen und Guardrails durchsetzt (siehe HRN-008).
- **Policy-as-Code:** Governance-Regeln, die in einem deklarativen, versionierten und testbaren Format ausgedrückt sind.
- **PEP / PDP:** Policy Enforcement Point (fängt Aktionen ab) und Policy Decision Point (wertet Richtlinien aus).
- **Guardrail:** eine Laufzeitprüfung von Ein- oder Ausgaben, die das Verhalten des Agenten einschränkt.
- **Approval Gate:** eine Kontrolle, die die Ausführung bis zu einer Entscheidung durch einen Menschen oder eine höhere Instanz aussetzt (siehe PAT-001).
- **Least Privilege:** das Gewähren der minimalen Berechtigungen, die ein Agent für seine Aufgabe benötigt.
- **Agenten-Identität:** ein eindeutiger, zuschreibbarer, eingegrenzter und widerrufbarer Principal für jeden Agenten.
- **Prompt-Injection:** nicht vertrauenswürdige Inhalte, die die Anweisungen oder Ziele eines Agenten kapern.
- **Indirekte Prompt-Injection:** eine Injection, die über Daten erfolgt, die der Agent abruft.
- **Datenexfiltration:** der unbefugte Abfluss sensibler Daten über Agenten-Ausgaben oder Tool-Argumente.
- **Lethal Trifecta:** die gefährliche Kombination aus dem Zugriff auf private Daten, dem Kontakt mit nicht vertrauenswürdigen Inhalten und der Fähigkeit zur externen Kommunikation.
- **Sandbox:** eine isolierte, Ressourcen- und Netzwerk-beschränkte Umgebung zur Ausführung von nicht vertrauenswürdigen Tools/Code.
- **DLP (Data Loss Prevention):** Kontrollen, die sensible Daten in ausgehenden Payloads erkennen und blockieren.

### Observability und Evaluierung

- **Observability:** die Harness-Schicht, die das Verhalten von Agenten über Traces, Logs und Metriken überprüfbar macht (siehe HRN-006).
- **Trace:** die End-to-End-Aufzeichnung eines einzelnen Agentendurchlaufs.
- **Span:** eine einzelne zeitlich erfasste Arbeitseinheit innerhalb eines Traces (ein Tool-Aufruf, ein Modell-Aufruf), der Baustein des verteilten Tracings (Distributed Tracing).
- **Evaluierung (Eval):** die systematische Messung der Qualität, Sicherheit und Zuverlässigkeit von Agenten (siehe HRN-007).
- **LLM-as-Judge:** die Verwendung eines Modells zur Bewertung der Ausgaben eines anderen Modells anhand einer Rubrik.
- **Groundedness:** der Grad, in dem generierte Behauptungen durch bereitgestellte Belege gestützt werden.
- **Regressions-Suite:** ein fester Satz von Evaluierungsfällen, der bei jeder Änderung ausgeführt wird, um Qualitätsverschlechterungen (Regressionen) aufzudecken.
- **Eval-driven Development:** das Erstellen und Ändern von Agenten im Abgleich mit einem messbaren Evaluierungs-Harness.

### Protokolle und Standards

- **MCP (Model Context Protocol):** ein offenes Protokoll zur Verbindung von Modellen/Agenten mit Tools und Datenquellen über eine standardisierte Schnittstelle.
- **Tool-Schema:** die typisierte Deklaration des Namens, der Argumente und der Beschreibung eines Tools, die das Modell verwendet, um es aufzurufen.
- **llms.txt:** eine vorgeschlagene Konvention für eine Markdown-Datei auf Website-Ebene, die ein kuratiertes, agentenfreundliches Inhaltsverzeichnis bereitstellt.
- **JSON-LD:** ein strukturiertes Datenformat, das verwendet wird, um Dokumente in der Discovery-Schicht maschinenlesbar zu machen.
- **NIST AI RMF / ISO 42001 / EU AI Act:** die wichtigsten KI-Risiko-, Managementsystem- und Regulierungsrahmen, die ein Enterprise-Harness erfüllen muss (siehe HRN-014, GOV-001).

## FAQs

**F: Woher zitiere ich eine Definition?**
A: Zitieren Sie den Begriff mit Namen plus `HRN-013`. Wenn ein Begriff ein eigenes Kapitel hat, zitieren Sie vorzugsweise dieses Kapitel für mehr Tiefe.

**F: Ein Begriff, den ich benötige, fehlt – was soll ich tun?**
A: Fügen Sie ihn hier in der entsprechenden Gruppe mit einer prägnanten Definition in einem Satz hinzu und verlinken Sie das entsprechende Kapitel, falls eines existiert.
