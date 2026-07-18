# Batch 001 — conversioni richieste

Obiettivo: ottenere il minimo insieme controllato di output dal converter
Roland originale. Non modificare gate, loop, trigger o BPM.

## Preparazione

1. Esegui `npm run lab:fixtures`.
2. Copia in `source/` i cinque WAV richiesti.
3. Crea inoltre due copie byte-identiche di `mono-impulse-100f.wav`:
   `impulse-name-alpha.wav` e `impulse-name-beta.wav`.
4. Per ciascun caso usa un progetto o una scheda vuota e conserva i risultati
   in una sottocartella con l'ID esatto del caso.

## Conversioni WAV

| ID | Sorgente | Mapping |
|---|---|---|
| `001-mono-silence-a1` | `mono-silence-100f.wav` | solo A1 |
| `002-mono-impulse-a1` | `mono-impulse-100f.wav` | solo A1 |
| `003-mono-ascending-a1` | `mono-ascending-100f.wav` | solo A1 |
| `004-stereo-channel-id-a1` | `stereo-channel-id-100f.wav` | solo A1 |
| `005-mono-sine-a1` | `mono-sine-1000f.wav` | solo A1 |
| `006a-impulse-name-alpha-a1` | `impulse-name-alpha.wav` | solo A1 |
| `006b-impulse-name-beta-a1` | `impulse-name-beta.wav` | solo A1 |

I casi `006a` e `006b` devono differire soltanto per il nome del file.

## Casi `PAD_INFO.BIN`

| ID | Contenuto |
|---|---|
| `007-empty` | progetto o scheda vuota |
| `008-impulse-a1` | solo `mono-impulse-100f.wav` su A1 |
| `009-impulse-a2` | lo stesso file solo su A2 |
| `010-impulse-a1-a2` | lo stesso file su A1 e A2 |

Per ogni ID conserva:

```text
roland-output/<ID>/
pad-info/<ID>/PAD_INFO.BIN
reports/<ID>/
catalog/<ID>.json
```

Non riutilizzare un `PAD_INFO.BIN` tra casi diversi e non pubblicare questi
output finché provenienza e redistribuibilità non sono state verificate.
