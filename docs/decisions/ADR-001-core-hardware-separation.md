# ADR-001 — Core / Hardware Separation

## Status

Accepted

## Date

July 2026

## Context

SP404ToolKit nasce inizialmente per supportare il workflow Roland SP-404SX.

Durante la fase di Reverse Engineering sono stati analizzati file proprietari Roland, in particolare:

- PAD_INFO.BIN;
- struttura SD;
- mapping dei pad;
- metadata associati ai sample.

È emerso che il formato hardware contiene informazioni specifiche del dispositivo che non devono diventare parte del modello principale dell'applicazione.

Il progetto ha inoltre l'obiettivo futuro di supportare altri sampler hardware.

Per questo motivo è necessario definire una separazione chiara tra:

- modello interno del progetto;
- logica audio;
- implementazioni specifiche hardware.

---

# Decision

SP404ToolKit adotterà un'architettura a livelli.

Il sistema sarà diviso in:
                SP404ToolKit


                     |

              Project Core


      +--------------+--------------+

      |                             |

Audio Engine              Hardware Adapter Layer


                                    |

                               SP-404SX


---

# Project Core

Il Project Core rappresenta il modello interno del progetto musicale.

Responsabilità:

- gestione dei sample;
- metadata audio;
- organizzazione;
- assegnazioni;
- versioning;
- stato del progetto.

Il Project Core NON deve conoscere:

- nomi file Roland;
- offset binari;
- struttura SD;
- campi proprietari.

---

# Audio Engine

L'Audio Engine gestisce la preparazione del materiale sonoro.

Responsabilità:

- analisi WAV;
- loudness;
- true peak;
- durata;
- formato;
- processing;
- profili di preparazione.

Esempio:

Original Sample
   |

   v
Audio Preparation
   |

   v
Hardware Ready Sample

---

# Hardware Adapter Layer

Ogni hardware supportato deve avere un adapter dedicato.

Responsabilità:

- import/export;
- formati proprietari;
- filesystem;
- limiti hardware;
- validazione.

Il primo adapter sarà:

Roland SP-404SX Adapter

---

# Consequences

## Positive

### Estensibilità

Nuovi hardware possono essere aggiunti senza modificare il core.

Esempio:

Project Core
  |

  +-- SP-404SX Adapter

  +-- SP-404MKII Adapter

  +-- MPC Adapter

  +-- Digitakt Adapter

---

### Maggiore affidabilità

Le informazioni non confermate restano isolate.

Il reverse engineering può evolvere senza contaminare il modello prodotto.

---

### Migliore UX

L'utente ragiona in termini musicali:

- sample;
- progetto;
- pad;
- performance.

Non in termini di:

- byte;
- offset;
- record binari.

---

## Negative

Questa architettura richiede:

- maggiore progettazione iniziale;
- adapter separati;
- più codice di collegamento.

Tuttavia evita dipendenze future da un singolo hardware.

---

# Rules

## Rule 1 — No hardware leakage

I dettagli dei formati hardware non devono entrare nel Project Core.

---

## Rule 2 — Evidence before implementation

Un formato proprietario può essere scritto solo dopo:

- osservazione;
- documentazione;
- conferma.

---

## Rule 3 — Original data is immutable

I file originali non vengono modificati.

Ogni processo genera una copia derivata.

---

# Related Documents

- `docs/product-vision.md`
- `docs/roadmap.md`
- `docs/reverse-engineering/`
- `packages/pad-info`

---

# Summary

SP404ToolKit non è un convertitore Roland.

È una piattaforma di gestione del workflow audio per sampler hardware.

Il supporto SP-404SX rappresenta il primo adapter di una possibile architettura multi-hardware.
