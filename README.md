
# Quixit — Qix-like (Phaser + Capacitor Android)

Prototipo HTML5/Phaser con configurazione Capacitor pronta per aggiungere Android/iOS.

## Qix – Meccanica di gioco originale

**Qix** è un videogioco arcade del 1981 sviluppato da Taito America.  
L’obiettivo del giocatore è **conquistare una certa percentuale dello schermo** tracciando linee e creando aree chiuse, evitando i nemici.

### Area di gioco
- Lo schermo è inizialmente un **rettangolo vuoto** con il bordo come unica “zona sicura”.
- All’interno si muove il **Qix**, una figura astratta composta da linee animate che rimbalzano e si deformano.
- Sul bordo si muovono due **Sparx** (nemici) che inseguono il giocatore lungo il perimetro.

### Controllo del giocatore
- Il giocatore muove un **marcatore** lungo il bordo.
- Premendo un tasto di “disegno” può scendere all’interno e tracciare una linea (*stix*).
- Rilasciando il tasto o tornando sul bordo si chiude un’area:
  - L’area viene “conquistata” e colorata.
  - Il Qix rimane confinato nella parte più grande: la più piccola diventa zona sicura.

### Condizioni di pericolo
- **Qix**: se tocca la linea mentre la si sta tracciando → perdita di una vita.
- **Sparx**: se toccano il giocatore sia sul bordo che sulla linea → perdita di una vita.
- Restare troppo a lungo su una linea senza completare → compare un *Fast Sparx* che accelera la fine.

### Obiettivo
- Conquistare **almeno il 75% dello schermo** per completare il livello.
- Nei livelli successivi aumentano velocità e numero dei nemici.
- Il punteggio dipende dalla percentuale conquistata e dalla velocità di tracciamento scelta:
  - **Lento**: meno punti, più sicuro.
  - **Veloce**: più punti, più rischioso.

## Requisiti
- Node 18+
- Java JDK + Android Studio (per build Android)
- SDK/NDK Android configurati (Android Studio > SDK Manager)

## Avvio locale (web)
```bash
npm install
npm run dev
```
Apri l’URL stampato (es. http://localhost:5173).

## Capacitor — inizializzazione
Inclusi `capacitor.config.ts` e dipendenze. Per creare i progetti nativi:

```bash
npm run cap:init
npm run cap:add:android
npm run cap:open:android
```

### Comandi utili
```bash
npm run cap:sync        # sincronizza web -> nativo
npm run cap:copy        # copia solo asset
npm run cap:open:android
```

> Nota: il `webDir` è impostato a `.`. Se passi a build Vite, imposta `webDir` a `dist` e lancia `npm run build` prima di `cap sync`.

## AdMob (schema rapido)
1. `npm i @capacitor-community/admob`
2. Configura App ID in `AndroidManifest.xml` (dopo `cap add android`).
3. Usa banner in menu/game over; rewarded per “continua”.

## Roadmap
- Nemico (Qix) con collisione su linea in tracciamento
- Sparks sui bordi
- Vite/punteggio/livelli
- UI touch (D-pad) + vibrazione
- Audio minimi
- Monetizzazione (AdMob) + IAP Remove Ads

## Licenza
MIT
