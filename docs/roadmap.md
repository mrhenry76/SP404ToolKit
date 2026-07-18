# SP404ToolKit Roadmap

## Vision

SP404ToolKit nasce come ambiente per preparare, organizzare e trasferire sample audio verso sampler hardware.

Il primo hardware supportato è Roland SP-404SX.

L'architettura mantiene separati:

- core audio/project;
- hardware adapter;
- formati proprietari.

---

# Completed Milestones

## Foundation v0.1

Status: completed

Obiettivi:

- struttura repository;
- monorepo setup;
- CI;
- test framework;
- documentazione iniziale.

---

## Reverse Engineering Lab v0.2

Status: completed

Obiettivi:

- ambiente controllato per esperimenti;
- fixture sintetiche;
- confronto binario;
- raccolta evidenze.

Principi:

- nessuna interpretazione senza evidenza;
- nessun writer;
- nessuna modifica ai file Roland originali.

---

## Batch 001 Fixture Framework

Status: completed

Obiettivi:

- fixture audio controllate;
- verifica soglie durata;
- validazione conversione Roland;
- raccolta output.

---

## PAD_INFO Analyzer v0.1

Status: completed

Obiettivi:

- parser read-only PAD_INFO.BIN;
- mapping pad A1-J12;
- analisi record;
- riconoscimento mono/stereo;
- gestione campi sconosciuti.

---

# Milestone v0.4 — Core Audio Preparation Engine Foundation

Status: planned

## Obiettivo

Creare il nucleo audio indipendente dall'hardware.

Il Toolkit deve poter:

- importare sample;
- analizzare caratteristiche audio;
- generare metadata;
- applicare profili di preparazione;
- salvare risultati in un progetto.

---

## Componenti

### Audio Analyzer

Funzioni:

- formato WAV;
- sample rate;
- bit depth;
- durata;
- mono/stereo;
- loudness;
- peak;
- true peak.

---

### Audio Preparation Engine

Funzioni iniziali:

- loudness target;
- normalizzazione LUFS;
- conversione mono/stereo;
- trim silenzi;
- export preparato.

---

### Project Model

Definisce:

- progetto;
- sample;
- metadata;
- assegnazioni.

---

# Milestone v0.5 — Project Model

Status: planned

Obiettivo:

Creare il modello dati principale.

Il progetto interno deve essere hardware-independent.

---

# Milestone v0.6 — Web Interface

Status: planned

Obiettivo:

Creare la prima esperienza utente.

Funzioni:

- sample browser;
- preview audio;
- pad grid;
- drag & drop;
- progetto visuale.

---

# Milestone v0.7 — SP-404SX Export Layer

Status: planned

Obiettivo:

Collegare il project model al formato hardware.

Nota:

PAD_INFO writer e file proprietari saranno implementati solo dopo conferma completa del formato.

---

# Future Directions

Possibili adapter:

- Roland SP-404MKII;
- Akai MPC;
- Elektron Digitakt;
- altri sampler.

Possibili funzioni:

- classificazione sample;
- rilevamento transienti;
- gestione live set;
- analisi armonica.

---

# Non Goals

Il progetto non vuole diventare:

- una DAW;
- un marketplace sample;
- un sistema cloud obbligatorio.

Il focus rimane:

**Prepare the sound. Shape the performance.**