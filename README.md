# Sammenheng

Et lokalt, interaktivt fagkart for **Organisasjon, ledelse og etikk**. Inneholder 132 temaer, 8 646 vektede forbindelser og figurene fra sammendraget.

## Åpne nettsiden

Dobbeltklikk **Start.cmd** og åpne **http://localhost:4317** i nettleseren. Behold terminalvinduet åpent; Ctrl+C stopper serveren. Hvis siden allerede kjører, åpner du bare adressen. Du kan også kjøre `npm start` fra denne mappen. Node.js må være installert; avhengighetene er installert på denne maskinen.

## Slik bruker du kartet

- **Søk** etter tema, navn eller stikkord. Velg et treff for å sentrere det. Søket fjerner ikke andre temaer. Hvis treffet ligger utenfor et aktivt fokusområde, flyttes fokus til treffet.
- **Tema i fokus** beholder hele den sammenhengende komponenten: alle temaer som kan nås via én eller flere forbindelser som oppfyller terskelen. Dette inkluderer indirekte stier. Ved høy terskel kan fokusnoden stå alene. Velg «Hele fagkartet» eller × for å fjerne fokus.
- **Terskelen** går fra 1 til 0,01 i trinn på 0,01. En forbindelse vises når vekten er større enn eller lik terskelen. Startverdien er 0,88. Feltet ved siden av slideren kan også redigeres.
- **Dynamisk** bruker fjærkrefter, frastøting og kollisjonsunngåelse. **Statisk** fryser posisjonene. Du kan dra i begge modusene. I dynamisk modus frigjøres en dratt node og får elastisk bevegelse igjen, også fokusnoden. I statisk modus blir den der du slipper den.
- **Rull eller knip** for å zoome, dra bakgrunnen for å panorere. Knappen med fire hjørner viser hele grafen. Startvisningen er zoomet inn for å gjøre navnene lesbare; alle temaer er fortsatt med.
- **Høyreklikk eller dobbeltklikk** på en node for detaljer. På berøringsskjerm kan du dobbelttrykke eller bruke søk og tastatur. **Klikk på en forbindelse** for forklaringen bak vekten. Enkeltklikk på en node sentrerer og fremhever den.
- **Rediger** øverst til høyre i detaljpanelet åpner redigeringen. Klikk **Lagre** når du er ferdig. Du kan endre navn, tekst, hovedpunkter, egne notater og, under «Flere fagfelt», eksempler, analyse, figurtekster og kildehenvisninger. Tomme punktfelt fjerner punktene.
- **Fagområder** viser fargeforklaringen. Alle noder har lik størrelse; størrelse og farge betyr ikke høyere vekt.

Tastatur: `/` åpner søket; pil ned/opp velger treff; Enter sentrerer. Med kartet i fokus åpner Enter detaljene til valgt node, piltastene panorerer, `+`/`−` zoomer og `0` viser hele kartet. Ved redusert bevegelse i systeminnstillingene starter kartet statisk.

Vektene er faglige vurderinger av relevans i en drøfting, ikke statistiske korrelasjoner. Vektetikettene søker ledig plass langs linjene, men et komplett nettverk med 8 646 forbindelser kan ikke vises uten overlapp på én skjerm. Fokus, terskel og zoom gjør det mulig å undersøke utsnitt. Hold pekeren over en linje for å lese den eksakte vekten også i tette områder. Kraftoppsettet reduserer klynger og nodeoverlapp; det er ingen garanti for et minimum av kryssende linjer.

## Hvor endringene lagres

- `data/topics.json`: opprinnelige temaer. Denne filen overskrives ikke av redigering.
- `data/edits.json`: dine lagrede endringer og notater, brukt av alle nettlesere som åpner denne lokale serveren. Filen opprettes ved første lagring.
- `data/backups/`: de siste 20 kopiene av tidligere redigeringsfiler.
- `data/relationships.json`: den komplette kantlisten som nettsiden bruker.
- `data/relationship-matrix.json`: samme vekter som en matrise, for senere viderebruk.
- `data/relationship-analysis.json`: begrunnelser for forbindelsene.
- `data/source-map.json`: det opprinnelige kildekartet for videre arbeid.
- `public/assets/figures/`: figurene. De kopieres til `dist/` ved bygging.

Lagring gjøres på serveren med en midlertidig fil og atomisk filbytte. Samtidige endringer i samme tema oppdages og avvises med en forklaring, slik at de ikke stille overskriver hverandre. Ved feil blir teksten værende i skjemaet. Lag gjerne en ekstra kopi av hele `data/`-mappen som din egen sikkerhetskopi.

Originale innholdshasher og revisjoner beskriver fortsatt grunnlaget som vektene ble laget fra. API-et legger redigerte felt oppå originalen og merker dem med `_edit.relationships_need_review`. Nye faglige formuleringer beregner ikke nye vekter automatisk. Ved en senere relasjonsrevisjon må endringene flettes inn i hoveddatasettet og vurderes mot scoringmaterialet fra den opprinnelige arbeidsmappen.

## Prosjekt og videreutvikling

Siden bruker JavaScript, D3 for grafbevegelse/zoom, Canvas for graftegning, esbuild og en liten lokal Node-server. Alle nettleserressurser leveres lokalt, uten CDN eller eksterne fonter. Etter installasjon kan nettsiden brukes uten internett.

```sh
npm ci
npm run build
npm start
```

Kjør `npm run build` etter endringer i kildekoden. `npm run dev` overvåker JavaScript/CSS, men nettleseren må oppdateres manuelt. Endringer i `public/` krever en ny bygging. For annen port: sett miljøvariabelen `PORT` før serveren startes. Nettleseren og API-et bruker samme port.

`npm test` kontrollerer datalogikken. `npm run test:browser` bruker Microsoft Edge i bakgrunnen og kontrollerer sentrering, fokus, redigering, lagring over omstart, konfliktvern, dra/zoom, statisk/dynamisk modus, mobilvisning og tastatur. Testene bruker en isolert midlertidig datamappe og port 4318, og endrer ikke egne notater. De to WebMCP-verktøyene for å lese og konfigurere grafvisningen er testet mot en simulert registreringskontekst; faktisk nettleserstøtte er valgfri.

## Dele med andre

For å gi noen sin egen lokale kopi: kopier prosjektmappen, inkludert `data/` og `public/`, men utelat `node_modules/`; mottakeren kjører `npm ci`, `npm run build`, `npm start`. Ta med `data/edits.json` hvis du vil dele dine endringer. Bare du avgjør hvilke egne notater du deler.

Serveren lytter på maskinens lokale adresse. En felles nettutgave eller Docker-oppsett er et senere steg; da må blant annet den vedvarende datamappen og redigeringstilgang settes opp. Det er ikke publisert noen nettkopi nå.
