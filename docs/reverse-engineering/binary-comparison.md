# Ispezione WAV e confronto binario

Questi strumenti sono esclusivamente diagnostici e non modificano i file.

## Ispezionare un WAV

```sh
npm run lab:inspect -- fixtures/source/mono-impulse-5000f.wav
```

Output JSON:

```sh
npm run --silent lab:inspect -- input.wav --format json
```

Output Markdown con dump dei primi 128 byte dei chunk sconosciuti:

```sh
npm run --silent lab:inspect -- input.wav --format markdown --hex --hex-limit 128 > report.md
```

`RLND` non viene interpretato: appare come chunk sconosciuto con identificatore,
offset, dimensione, SHA-256 e, solo se richiesto, dump esadecimale.

## Confrontare due file

```sh
npm run lab:compare -- first.bin second.bin --context 8
```

Con viste diagnostiche degli interi e ASCII:

```sh
npm run --silent lab:compare -- first.bin second.bin --interpret --format markdown
```

Formati disponibili per entrambi i comandi:

- `human` (default);
- `json`;
- `markdown`.

Le viste `uint16 LE`, `uint32 LE`, `uint32 BE` e ASCII sono soltanto modi di
leggere i byte a un offset. Non dimostrano il significato di un campo Roland.
