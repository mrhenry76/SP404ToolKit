# Primo batch di esperimenti

Il batch 001 isola contenuto, canali, nome e mapping minimo dei pad. Non include
gate, loop, trigger o BPM.

La checklist eseguibile e i nomi obbligatori delle cartelle sono in
[`experiments/batch-001/README.md`](../../experiments/batch-001/README.md).

## Sequenza consigliata

1. Rigenera le fixture con `npm run lab:fixtures`.
2. Verifica almeno un file con `npm run lab:inspect -- <file>`.
3. Copia le sole sorgenti richieste in `experiments/batch-001/source`.
4. Esegui ogni conversione in un progetto o scheda pulita.
5. Conserva WAV convertiti, `PAD_INFO.BIN`, report e catalogo in cartelle con lo
   stesso ID.
6. Valida ogni record con `npm run lab:validate-experiment -- <record.json>`.
7. Non fare commit degli output Roland finché provenienza e permessi non sono
   stati verificati.

Lo schema pubblicato si trova in
`packages/reverse-engineering-lab/schema/experiment-v1.schema.json`. Lo stato
iniziale di un caso non ancora analizzato è `UNKNOWN`; non usare valori diversi
da `CONFIRMED`, `OBSERVED`, `HYPOTHESIS` e `UNKNOWN`.
