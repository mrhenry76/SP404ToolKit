# Generazione delle fixture sintetiche

Le fixture sorgente sono WAV PCM16 little-endian a 44.1 kHz generati
interamente dal progetto. Non contengono materiale audio di terzi.

## Generare il set iniziale

Dalla cartella principale del repository:

```sh
npm ci
npm run lab:fixtures -- --overwrite
```

Il comando crea sei WAV principali in `fixtures/source`, cinque WAV per la
soglia in `fixtures/source/duration-threshold` e un JSON con lo stesso nome
base per ciascun file. Il JSON contiene parametri, dimensione e SHA-256.
`--overwrite` è necessario perché le fixture iniziali sono già versionate nel
repository. Senza questa opzione il generatore rifiuta di sostituire sia il WAV
sia il relativo JSON.

Le sorgenti ufficiali del Batch 001 hanno 5000 frame. Le vecchie fixture da
100 e 1000 frame restano soltanto materiale interno per parser e test e non
devono essere trasferite al converter Roland.

Il set `duration-threshold` contiene silenzi da 4409, 4410, 4411, 4500 e 5000
frame. Serve esclusivamente a osservare il limite di durata del converter.

## Generare un file personalizzato

```sh
npm run lab:generate -- \
  --signal impulse \
  --frames 100 \
  --channels mono \
  --impulse-frame 10 \
  --amplitude 1 \
  --output experiments/my-impulse.wav
```

Per sostituire intenzionalmente un file già esistente, aggiungere
`--overwrite`. Senza questa opzione il comando termina con un errore non-zero.

Segnali disponibili:

- `silence`;
- `impulse`;
- `constant`;
- `ascending`;
- `sine`;
- `stereo-channel-id` (richiede `--channels stereo`).

Parametri facoltativi:

| Opzione | Significato | Default |
|---|---|---:|
| `--frequency` | frequenza della sinusoide in Hz | 440 |
| `--amplitude` | ampiezza normalizzata da 0 a 1 | 0.5 |
| `--impulse-frame` | frame contenente l'impulso | 0 |
| `--value` | valore PCM del segnale costante | 1000 |
| `--start` | primo valore della sequenza crescente | `-floor(frames/2)` |
| `--step` | incremento per frame | 1 |

Per la sinusoide stereo il canale destro usa una fase di 90 gradi. Per
`stereo-channel-id`, il frame `n` contiene `n + 1` a sinistra e `-(n + 1)` a
destra. I campioni stereo sono interleaved `L, R, L, R`.

## Determinismo

Il writer produce un header canonico di 44 byte e scrive tutti gli interi con
endianess esplicita. Non inserisce timestamp o dati dipendenti dal percorso.
Il metadata JSON non contiene una data di generazione. A configurazione e
versione del generatore uguali, WAV e SHA-256 devono essere uguali su Linux,
macOS e Windows.
