# Procedura semplice per la conversione ufficiale Roland

Questa procedura serve a produrre prove controllate. Lavora sempre su copie e
non sulla tua unica scheda SD.

## Prima di iniziare

1. Fai un backup completo della scheda SD.
2. Usa una scheda o un progetto vuoto per ogni caso.
3. Prendi esclusivamente i WAV richiesti da `fixtures/source`.
4. Non aprire e risalvare i WAV con una DAW o un editor.
5. Non pubblicare ancora output Roland o `PAD_INFO.BIN`: prima dobbiamo
   verificarne provenienza e redistribuibilità.

## File da usare

- `mono-silence-100f.wav`
- `mono-impulse-100f.wav`
- `mono-ascending-100f.wav`
- `stereo-channel-id-100f.wav`
- `mono-sine-1000f.wav`

Per il test del nome crea due copie identiche di `mono-impulse-100f.wav` e
chiamale `impulse-name-alpha.wav` e `impulse-name-beta.wav`. Non modificarne il
contenuto.

## Conversione

1. Apri il Roland SP-404SX Wave Converter originale.
2. Importa un solo caso alla volta, come indicato in
   `experiments/batch-001/README.md`.
3. Non cambiare le impostazioni predefinite tra un caso e l'altro.
4. Non attivare volontariamente normalizzazione, conversione di formato,
   editing, gate, loop, trigger o modifiche BPM.
5. Se il programma mostra impostazioni già selezionate, non indovinarne il
   significato: lasciale invariate e annotale esattamente nel catalogo.
6. Assegna soltanto i pad indicati per quel caso.
7. Esegui l'esportazione con il normale comando del software Roland.

## Recuperare i risultati

1. Chiudi il software Roland dopo che l'operazione è terminata.
2. Copia dalla scheda tutti i WAV convertiti senza aprirli o rinominarli.
3. Copia `PAD_INFO.BIN` senza modificarlo.
4. Conserva anche un elenco della struttura delle cartelle della scheda.
5. Calcola gli hash soltanto dopo aver copiato i file nel batch.

## Nomi delle cartelle

Usa esattamente gli identificatori elencati nel README del batch, per esempio:

```text
experiments/batch-001/roland-output/001-mono-silence-a1/
experiments/batch-001/pad-info/001-mono-silence-a1/PAD_INFO.BIN
experiments/batch-001/catalog/001-mono-silence-a1.json
```

Ogni caso deve avere cartelle separate. Non sovrascrivere il risultato di un
caso con quello successivo.

## Informazioni da annotare

- data e nome dell'operatore;
- versione esatta del Wave Converter;
- sistema operativo e versione;
- tutte le impostazioni visibili, anche se lasciate ai valori predefiniti;
- nome originale del file e pad assegnato;
- modello e firmware del sampler, se usato;
- eventuali messaggi o comportamenti inattesi;
- SHA-256 del sorgente, del WAV convertito e di `PAD_INFO.BIN`;
- base legale o autorizzazione prima di rendere pubblico ogni output Roland.

Se un dettaglio non è noto, scrivi `UNKNOWN`: non completarlo per supposizione.
