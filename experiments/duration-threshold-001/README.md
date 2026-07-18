# Duration threshold 001

Esperimento separato dal Batch 001. Lo scopo è distinguere una soglia espressa
in frame da una soglia in millisecondi, eventualmente arrotondata.

## Evidenza iniziale

Stato: `OBSERVED`.

```text
OBSERVATION:
The official converter rejected a 100-frame mono PCM16 44.1 kHz WAV
because the sample must be longer than 100 ms.
```

- converter: SP-404SX Wave Converter 1.00;
- sistema: macOS High Sierra;
- file: `mono-silence-100f.wav`;
- frame: 100;
- durata: `100 / 44100` secondi, circa 2,27 ms;
- risultato: rifiutato;
- messaggio esatto: non ancora trascritto alla lettera; non sostituirlo con
  una parafrasi.

Questa evidenza non conferma ancora la soglia. Deve restare `OBSERVED` finché
non vengono eseguiti i casi immediatamente sotto, uguale e sopra 100 ms.

## Matrice da eseguire

Usa un progetto o ambiente pulito e importa un solo file per volta da
`fixtures/source/duration-threshold`.

| Ordine | ID | File | Frame | Durata esatta |
|---:|---|---|---:|---:|
| 1 | `threshold-4409f` | `mono-silence-4409f.wav` | 4409 | `4409 / 44100` s (circa 99,9773 ms) |
| 2 | `threshold-4410f` | `mono-silence-4410f.wav` | 4410 | `4410 / 44100` s (100 ms) |
| 3 | `threshold-4411f` | `mono-silence-4411f.wav` | 4411 | `4411 / 44100` s (circa 100,0227 ms) |
| 4 | `threshold-4500f` | `mono-silence-4500f.wav` | 4500 | `4500 / 44100` s (circa 102,0408 ms) |
| 5 | `threshold-5000f` | `mono-silence-5000f.wav` | 5000 | `5000 / 44100` s (circa 113,3787 ms) |

Per ogni caso registra accettato/rifiutato, testo UI esatto, eventuale pad o
fase in cui avviene il rifiuto, hash del sorgente, versione del converter e
sistema operativo. Non creare `PAD_INFO.BIN` appositamente per questo test e
non pubblicare output Roland.
