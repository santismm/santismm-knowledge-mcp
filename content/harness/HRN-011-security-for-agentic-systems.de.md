---
title: Sicherheit für agentenbasierte Systeme
summary: >-
  Sicherheit für agentenbasierte Systeme ist die Harness-Schicht, die vor
  Prompt-Injection schützt, Tools und Berechtigungen in Sandboxes ausführt,
  Datenabfluss (Data Exfiltration) verhindert und die Agenten-Identität sowie
  das Prinzip der minimalen Rechtevergabe (Least Privilege) bei jeder Aktion
  durchsetzt.
---
# Sicherheit für agentische Systeme

## Executive Summary

Agentische Systeme vergrößern die Angriffsfläche auf eine Weise, wie es traditionelle Anwendungen nicht tun: Der Agent liest nicht vertrauenswürdige Daten, trifft folgenschwere Entscheidungen und besitzt Berechtigungen zum Handeln – so kann eine einzige kompromittierte Eingabe zu einer kompromittierten Aktion werden. Sicherheit für agentische Systeme ist die Harness-Ebene, die davon ausgeht, dass das Modell manipuliert werden kann und wird, und das umgebende Gerüst so konstruiert, dass eine Manipulation keinen Schaden anrichten kann. Das leitende Prinzip lautet **Least Privilege mit begrenztem Schadensradius**: Behandeln Sie das Modell als nicht vertrauenswürdige Komponente, platzieren Sie Sicherheitskontrollen *außerhalb* seiner beeinflussbaren Oberfläche und stellen Sie sicher, dass selbst ein vollständig gekaperter Agent nur begrenzten, auditierbaren Schaden anrichten kann.

## Schlüsselkonzepte

- **Prompt-Injection:** Nicht vertrauenswürdige Inhalte, die die Anweisungen oder Ziele des Agenten kapern.
- **Indirekte Prompt-Injection:** Injection, die über vom Agenten abgerufene Daten (Dokumente, Webseiten, Tool-Ausgaben) eingeschleust wird.
- **Tool-Sandboxing:** Isolierung der Tool-Ausführung, sodass sie ihre vorgesehenen Berechtigungen nicht überschreiten kann.
- **Least Privilege:** Gewährung der minimalen Berechtigungen, die jeder Agent für seine Aufgabe benötigt.
- **Agenten-Identität:** Ein eindeutiger, zuzuordnender Principal für jeden Agenten, im Berechtigungsumfang eingeschränkt (scoped) und widerrufbar.
- **Datenabfluss (Data Exfiltration):** Unbefugter Abfluss sensibler Daten über Tool-Ausgaben oder gerenderte Inhalte.
- **Tödliche Trias (Lethal Trifecta):** Die gefährliche Kombination aus Zugriff auf private Daten, Kontakt mit nicht vertrauenswürdigen Inhalten und der Fähigkeit zur externen Kommunikation.

## Definition

> **Sicherheit für agentische Systeme** ist die Harness-Disziplin, bei der das Modell als nicht vertrauenswürdige, manipulierbare Komponente behandelt wird und Identitäts-, Berechtigungs-, Isolations- und Egress-Kontrollen so konstruiert werden, dass der maximale Schaden, den ein kompromittierter Agent verursachen kann, begrenzt, zuzuordnen und auditierbar ist.

## Architekturdiagramm

```mermaid
flowchart LR
    UNT[Nicht vertrauenswürdige Eingaben\nBenutzer, Web, Dokumente, Tool-Ausgabe] --> IG[Input Guardrails\nInjection-Erkennung]
    IG --> AGENT[Agent Reasoning Loop\n(als nicht vertrauenswürdig behandelt)]
    AGENT -->|vorgeschlagener Tool-Aufruf| AUTH[AuthZ + Least Privilege\nAgenten-Identität, scoped Credentials]
    AUTH --> SBX[Tool-Sandbox\nIsolierung, Allowlist]
    SBX --> EFF[Effektor / Externes System]
    EFF --> OG[Output / Egress Guardrails\nDLP, Exfiltrationsprüfungen]
    OG --> SINK[Zulässiges Ziel]
    AUTH -.ablehnen/Quarantäne.-> BLK[Blockieren + Alarmieren]
    AGENT --> AUD[(Unveränderbares Audit-Log)]
    AUTH --> AUD
    OG --> AUD
```

## Detaillierte Erklärung

Die grundlegende Bedrohung ist **Prompt-Injection**, und der grundlegende Fehler besteht darin, zu versuchen, sie innerhalb des Modells zu lösen. Keine noch so starke Härtung des System-Prompts verhindert zuverlässig eine ausreichend clevere Anweisung, die in abgerufene Inhalte eingebettet ist, da das Modell keine robuste, prinzipielle Grenze zwischen „Daten“ und „Anweisungen“ kennt. Indirekte Injection ist die gefährliche Variante: Ein Agent, der eine Webseite zusammenfasst oder ein Ticket liest, kann durch Text gekapert werden, den der Angreifer dort platziert hat. Die Harness-Antwort ist **architektonisch, nicht prompt-basiert**: Gehen Sie davon aus, dass eine Injection manchmal erfolgreich sein wird, und stellen Sie sicher, dass ein gekaperter Agent dennoch nichts tun kann, was seine *Berechtigungen* verbieten. Input Guardrails (Injection-/Jailbreak-Erkennung) reduzieren die *Häufigkeit* erfolgreicher Injections; Berechtigungs- und Egress-Kontrollen begrenzen die *Folgen*. Beide sind erforderlich; keines von beiden reicht allein aus.

**Least Privilege und Agenten-Identität** bilden das Rückgrat der agentischen Sicherheit. Jeder Agent sollte als eindeutiger, zuzuordnender Principal mit Credentials ausgeführt werden, deren Berechtigungsumfang (Scope) genau auf die für seine Aufgabe erforderlichen Ressourcen beschränkt ist – kurzlebige Token, enge OAuth-Scopes, schreibgeschützt, wo keine Schreibzugriffe benötigt werden, und eine mandantenspezifische Datenisolierung, die *unterhalb* des Agenten (in der Datenebene) erzwungen wird, niemals indem man das Modell höflich bittet, in seiner Spur zu bleiben. Wenn ein Agent im Namen eines Benutzers handelt, sollte er die Autorisierung dieses Benutzers tragen und nicht ein Dienstkonto im „God-Mode“, sodass der Agent niemals das überschreiten kann, was der Benutzer direkt tun könnte. Credentials müssen vom Harness zum Aufrufzeitpunkt injiziert werden und dürfen niemals im Kontextfenster platziert werden, wo eine Injection sie auslesen und exfiltrieren könnte.

**Tool-Sandboxing** isoliert die Ausführung. Code-ausführende Tools laufen in ephemeren, netzwerkbeschränkten und ressourcenbegrenzten Sandboxes. Tool-Kataloge werden pro Agent auf eine **Allowlist** gesetzt, sodass ein gekaperter Agent kein Tool erreichen kann, das ihm nie freigegeben wurde. Tools mit schwerwiegenden Konsequenzen erfordern eine menschliche Freigabe (PAT-007 / PAT-001), sodass selbst ein autorisierter, aber manipulierter Aufruf eine menschliche Bestätigung erfordert. Das Prinzip lautet *Defense in Depth* (abgestufte Verteidigung): AuthZ entscheidet, *ob* ein Aufruf zulässig ist, die Sandbox begrenzt, *was der Aufruf berühren kann*, und das Freigabegate fügt einen menschlichen Kontrollpunkt für unumkehrbare Aktionen hinzu.

**Datenabfluss (Data Exfiltration)** ist das am meisten unterschätzte agentische Risiko. Die „tödliche Trias“ (lethal trifecta) – ein Agent mit (1) Zugriff auf private Daten, (2) Kontakt mit nicht vertrauenswürdigen Inhalten und (3) der Fähigkeit zur externen Kommunikation – ist ausnutzbar: Injizierte Anweisungen weisen den Agenten an, Geheimnisse in eine ausgehende Anfrage, eine gerenderte Bild-URL oder ein Tool-Argument einzubetten. Der Harness bricht diese Trias auf, indem er für sensible Kontexte mindestens eine Säule entfernt: Egress-Ziele auf eine Allowlist beschränken, Data-Loss-Prevention-Prüfungen (DLP) für jede ausgehende Payload durchführen, das Rendern externer Inhalte entfernen oder anheften (pinning) und dem Agenten verbieten, beliebige ausgehende URLs zu konstruieren. Wenn ein Agent mit privaten Daten in Berührung kommen muss, muss seine Fähigkeit zur externen Kommunikation streng eingeschränkt werden und umgekehrt.

Die Grundlage für all dies ist **Beobachtbarkeit und Auditierbarkeit (Observability and Auditability)** (HRN-006): Jede Aktion, die Identität, die sie ausgeführt hat, die Berechtigungsentscheidung und die Egress-Prüfung müssen unveränderbar protokolliert werden. Sicherheit, die Sie nicht beweisen können, ist Sicherheit, die Sie nicht haben. Diese Kontrollen setzen die im Governance-Framework (GOV-001) definierten Verpflichtungen um und fügen sich in die breitere Harness-Taxonomie (HRN-003) ein.

## Belege aus der Praxis

> **Illustratives / repräsentatives Szenario.** Evidenzgrad: theoretisch · Vertrauen: mittel · Quelle: Branchenbeobachtung, persönliche Erfahrung. Die folgenden Beschreibungen sind repräsentative Angriffs-/Abwehrmuster, keine Messungen aus einer verifizierten Bereitstellung.

- **Kontext:** Ein Kundensupport-Agent mit Zugriff auf eine Wissensdatenbank und der Fähigkeit, E-Mails an Kunden zu senden.
- **Szenario:** Ein Angreifer platziert Injection-Text in einem Support-Ticket, um den Agenten dazu zu bringen, die Kontodaten eines anderen Kunden per E-Mail an eine externe Adresse zu senden.
- **Technologie:** Pro Agent eingeschränkte Credentials (scoped credentials), Egress-Allowlist, DLP für ausgehende E-Mails, Injection-Erkennung für abgerufene Inhalte, Audit-Log.
- **Last:** Hohes Ticketvolumen; ein kleiner, aber nicht zu vernachlässigender Anteil enthält Injection-Versuche.
- **Ergebnisse (repräsentativ):** Bei Bereitstellungen dieser Art blockieren die architektonischen Kontrollen (Egress-Allowlist + DLP + Least Privilege) die *Folgen* einer Injection, selbst wenn die Erkennung den *Versuch* übersieht. Dies senkt den erfolgreichen Datenabfluss gegen Null, während eine reine Injection-Erkennung ein Restrisiko hinterlässt.

### Gewonnene Erkenntnisse

Strategien, die nur auf Erkennung setzen, scheitern irgendwann; die zuverlässigen Abwehrmechanismen sind architektonischer Natur und begrenzen die Folgen. Das Aufbrechen der tödlichen Trias – insbesondere die Einschränkung des Egress – trägt mehr zur Sicherheit bei als jeder einzelne Klassifikator.

## Beobachtete Fehlermuster

| Fehlermuster | Auslöser | Abmilderung (Mitigation) |
|---|---|---|
| Direkte Prompt-Injection | Böswillige Benutzeranweisung | Input Guardrails + Berechtigungsbegrenzung |
| Indirekte Injection | Böswilliger Text in abgerufenen Daten | Alle abgerufenen Inhalte als nicht vertrauenswürdig behandeln; Egress-Kontrollen |
| Datenabfluss (Data Exfiltration) | Tödliche Trias ausgenutzt | Trias aufbrechen: Egress-Allowlist + DLP |
| Rechteausweitung (Privilege Escalation) | Zu weit gefasste Service-Credentials | Pro Agent eingeschränkte, kurzlebige Credentials; benutzerdelegierte AuthZ |
| Abfluss von Credentials | Geheimnisse im Kontextfenster | Credentials zum Aufrufzeitpunkt injizieren, niemals im Kontext |
| Sandbox-Ausbruch | Uneingeschränkter Code/Netzwerkzugriff in Tools | Netzwerkisolierte, ressourcenbegrenzte ephemere Sandboxes |
| Confused Deputy | Agent wird als Proxy für verbotene Aktionen missbraucht | Identität des Aufrufers übertragen; AuthZ am Effektor |

## KPIs

| Metrik | Ziel | Anmerkungen |
|---|---|---|
| Rate erfolgreicher Datenabflüsse | → 0 | Die wichtigste Metrik |
| Recall der Injection-Erkennung | Hoch | Reduziert die Häufigkeit von Versuchen, ist aber nicht die einzige Verteidigung |
| Enge des Berechtigungsumfangs | Minimale Freigaben | Audit auf ungenutzte/zu weit gefasste Berechtigungen |
| Abdeckung der Egress-Allowlist | 100% | Keine beliebigen ausgehenden Ziele |
| Mittlere Zeit bis zum Widerruf (MTTR) | Niedrig | Widerruf kompromittierter Agenten-Identitäten |
| Vollständigkeit des Audits | 100% | Jede Aktion zuzuordnen |

## Kostenmetriken

- **Guardrail-Inferenzkosten:** Injection-/DLP-Klassifikatoren verursachen zusätzliche Inferenz pro Anfrage – zu budgetieren in Kosten-pro-Aufgabe.
- **Sandbox-Overhead:** Das Starten ephemerer Sandboxes erhöht die Latenz bei Code-Tools; Amortisierung durch Warm Pools.
- **Engineering-Kosten:** Eingeschränkte Identitäten und Egress-Allowlisting erfordern anfänglichen IAM-Aufwand, der sich jedoch über alle Agenten hinweg auszahlt.

## Skalierungseigenschaften

Berechtigungs- und Identitätskontrollen skalieren mit der IAM-/Secrets-Infrastruktur, zustandslos pro Aufruf. Guardrail-Klassifikatoren skalieren mit der Inferenzkapazität und stellen die Durchsatzkosten dar; schalten Sie zuerst günstige deterministische Prüfungen (Allowlists, Regex, Schemata) vor. Sandboxes skalieren mit einem verwalteten Pool; Warm Pools tauschen Leerlaufkosten gegen Latenz ein. Egress-Kontrollen skalieren trivial und sollten niemals der Engpass sein – sie sind die günstigste Kontrollinstanz mit hohem Nutzen im Stack.

## Verwandte Inhalte

- HRN-003 — Der Platz der Sicherheit in der Harness-Taxonomie.
- GOV-001 — Governance-Verpflichtungen, die durch Sicherheitskontrollen umgesetzt werden.
- PAT-007 — Muster für Tool-/Berechtigungskontrolle (Sandboxing und kontrollierte Tool-Nutzung).

## Referenzen

- OWASP Top 10 for LLM Applications (LLM01 Prompt Injection, LLM06 Sensitive Information Disclosure).
- Simon Willison, „The lethal trifecta for AI agents“.
- NIST AI RMF und NIST SP 800-53 (Least Privilege, Identität).
- MITRE ATLAS — Adversarial Threat Landscape für KI-Systeme.

## FAQs

**F: Kann Prompt-Injection vollständig verhindert werden?**
A: Nein. Planen Sie architektonisch damit: Gehen Sie davon aus, dass Injections manchmal erfolgreich sind, und begrenzen Sie die Folgen durch Least Privilege, Egress-Kontrolle und Sandboxing.

**F: Was ist die wirksamste Einzelmaßnahme?**
A: Das Aufbrechen der tödlichen Trias – am günstigsten durch die Beschränkung des Egress auf eine Allowlist mit DLP –, sodass ein gekaperter Agent keine Daten exfiltrieren kann.

**F: Sollten sich Agenten ein Dienstkonto teilen?**
A: Nein. Geben Sie jedem Agenten eine eigene, im Berechtigungsumfang eingeschränkte, kurzlebige Identität und lassen Sie ihn die Autorisierung des aufrufenden Benutzers tragen, sodass er niemals die Rechte des Benutzers selbst überschreiten kann.
