# Sammenheng

**Et visuelt fagkart som hjelper deg å forstå, koble sammen og skrive om organisasjon, ledelse og etikk.**

Sammenheng samler teorier, modeller og begreper i et interaktivt nettverk. Hver sirkel er et tema, og linjene viser hvor naturlig det er å knytte temaene sammen i en faglig drøfting. Du kan utforske forbindelser, lese forklaringer og praksiseksempler, og tilpasse tekstene med egne notater.

Appen tar utgangspunkt i *Hvordan organisasjoner fungerer*, sammendrag og supplerende kursmateriale. Faginnhold 3 inneholder **157 temaer**, **12 246 vektede forbindelser** og **praksiseksempler til alle temaene**. Kartet dekker blant annet mål og strategi, struktur, kultur, makt, omgivelser, motivasjon, kommunikasjon, beslutninger, læring, endring og ledelse.

Sammenheng kjører lokalt på Windows og Mac. Du trenger ingen programmeringskunnskaper, GitHub-konto eller utviklerverktøy for å installere og bruke appen. Lesing, utforsking og redigering fungerer uten internett etter installasjon.

## Last ned

**[Åpne nedlastingssiden for nyeste apputgave →](https://github.com/KevinAmundsenDale/org-webpage/releases/latest)**

På GitHub-siden ruller du ned til **Assets** og velger filen for maskinen din. Klikk på «Assets» hvis fillisten er skjult.

| Maskin | Filen du skal laste ned |
| --- | --- |
| Windows, x64 | `Sammenheng-<versjon>-win-x64.exe` |
| Mac, både Apple Silicon og Intel | `Sammenheng-<versjon>-mac-universal.dmg` |

For eksempel heter Windows-installasjonsfilen til versjon 1.3.0 `Sammenheng-1.3.0-win-x64.exe`. Versjonsnummeret endres ved nye utgaver.

**Velg EXE eller DMG.** Filene `latest.yml`, `.blockmap` og Mac-utgavens `.zip` brukes av oppdateringssystemet. «Source code» og den grønne «Code → Download ZIP»-knappen laster ned prosjektets kildekode, ikke den ferdige appen. Utgaver kalt `content-v…` er faginnholdspakker som appen håndterer selv.

## Installer og åpne appen

### Windows

1. Last ned `.exe`-filen fra nedlastingssiden over.
2. Åpne filen fra **Nedlastinger** i Filutforsker og følg installasjonen.
3. Start **Sammenheng** fra Start-menyen eller snarveien på skrivebordet.

Hvis filen åpnes i Word og du får spørsmål om **filkonvertering eller tegnkoding**, lukk Word. Kontroller at du har lastet ned den faktiske `.exe`-filen under Assets, og åpne den fra Filutforsker.

### Mac

1. Last ned `.dmg`-filen fra nedlastingssiden over.
2. Åpne den og dra **Sammenheng** til **Programmer / Applications**.
3. Åpne Sammenheng fra Programmer. Du kan deretter løse ut installasjonsdisken i Finder.

Den samme Mac-filen brukes på både Intel-maskiner og maskiner med Apple Silicon, som M1, M2 og nyere.

### Hvorfor kommer det et sikkerhetsvarsel?

**Versjon 1.3.0 er usignert.** Appen har foreløpig ikke en verifisert utgiversignatur for Windows eller Developer ID-signering og notarization fra Apple. Operativsystemet kan derfor advare om ukjent utgiver eller si at det ikke kan bekrefte at appen er fri for skadelig programvare. Et slikt varsel er ikke i seg selv et funn av skadevare, men appen har heller ikke denne bekreftelsen fra utgiverkontrollen.

Last ned fra dette prosjektets offisielle utgivelsesside. Hvis du stoler på denne kopien og vil åpne den:

- **Windows:** Ved SmartScreen-varselet «Windows beskyttet PC-en» kan du velge **Mer informasjon / More info → Kjør likevel / Run anyway**, dersom valget er tilgjengelig. Se [Microsofts forklaring av SmartScreen](https://learn.microsoft.com/windows/security/threat-protection/microsoft-defender-smartscreen/microsoft-defender-smartscreen-overview).
- **Mac:** Prøv først å åpne appen. Gå deretter til **Systeminnstillinger → Personvern og sikkerhet**, finn varselet om Sammenheng, og velg **Åpne likevel / Open Anyway**. Bekreft åpningen. macOS lagrer da et unntak for appen. Se [Apples veiledning](https://support.apple.com/102445).

På skole- eller jobbmaskiner kan administratorregler hindre dette. Windows Smart App Control kan også blokkere apper uten et «Kjør likevel»-valg. Kontakt da administrator eller [meld fra om problemet](https://github.com/KevinAmundsenDale/org-webpage/issues). Ikke slå av maskinens generelle sikkerhetsbeskyttelse for å installere appen. Et konkret skadevarevarsel eller en melding om at filen er skadet bør undersøkes før du fortsetter.

Du trenger ikke kjøpe et Apple-utviklerabonnement for å bruke Sammenheng. Signering er et ansvar på utgiversiden. Nye nedlastede utgaver kan utløse et nytt varsel.

## Kom i gang på noen minutter

Et eksempel: Du skal skrive om organisasjonskultur og vil finne naturlige koblinger til andre teorier.

1. Søk etter **Schein** og velg «Scheins kulturnivåer». Temaet blir satt i fokus og flyttes til midten.
2. Høyreklikk eller dobbeltklikk på noden for å åpne forklaringen, hovedpunktene og praksiseksemplet i sidepanelet.
3. Velg **1** under «Maks steg fra fokus» for å se direkte forbindelser. Velg flere steg for å utforske temaer via andre noder.
4. Juster **Minste relasjonsvekt**. Høy verdi viser bare de nærmeste koblingene; lavere verdi åpner for flere forbindelser, også på tvers av fagområder.
5. Under **Nære forbindelser** kan du lese hvorfor to temaer er koblet sammen. Trykk **Fokus →** for å gå videre til et nabotema.
6. Vil du avgrense utforskingen til kultur, velger du **Organisasjonskultur** under «Fagområde i fokus».

Bruk kartet til å finne mulige argumenter og overganger i teksten din. Kontroller faglige påstander og kildehenvisninger mot pensum før du bruker dem i en innlevering.

## Slik fungerer kartet

### Noder og forbindelser

En **node** er en sirkel med en teori, modell eller et begrep. Alle noder har samme størrelse. Fargen viser fagområdet; den angir ikke hvor viktig temaet er. Knappen **Fagområder** åpner fargeforklaringen.

En **forbindelse** er en linje mellom to temaer. Tallet på linjen er en faglig vurdering av hvor naturlig temaene hører sammen i en drøfting. Vektene er ikke statistiske korrelasjoner eller fasitsvar. Kartet har en positiv vekt mellom alle par av temaer, men terskelen avgjør hvilke forbindelser du ser.

Klikk på en linje for å lese begrunnelsen. Hold pekeren over en linje for å se vekten når det er trangt om plassen. Lav terskel gir mange linjer; bruk fokus, avstand og zoom for å få et lesbart utsnitt.

### Søk og avgrensning

| Kontroll | Hva den gjør |
| --- | --- |
| **Finn et tema** | Søker i navn, teoretikere og fagtekst, inkludert eksempler og egne lagrede notater. Navnetreff kommer først; teksttreff sorteres etter antall forekomster. Valg av treff setter temaet i fokus. |
| **Tema i fokus** | Viser temaer som kan nås fra fokusnoden innen valgt antall steg, langs forbindelser som oppfyller terskelen. × fjerner temafokus. |
| **Fagområde i fokus** | Viser bare noder i valgt kategori, også noder uten synlige forbindelser. Valg av kategori fjerner tidligere temafokus. Du kan deretter velge en node for å bruke avstandsgrensen innenfor kategorien. |
| **Maks steg fra fokus** | Velg 1–5 forbindelser langs den korteste stien. Fokusnoden er steg 0; 1 viser direkte naboer, og 2 inkluderer naboenes naboer. Standard er 2. Kontrollen er inaktiv uten temafokus. |
| **Minste relasjonsvekt** | Viser forbindelser med vekt større enn eller lik terskelen. Området er 1–0,01 i trinn på 0,01; startverdien er 0,88. Du kan også skrive i tallfeltet. |

Søket går gjennom hele fagkartet. Hvis du velger et treff utenfor det aktive fagområdet, fjernes fagområdefilteret og treffet settes i fokus. Det samme gjelder når du åpner et nabotema med **Fokus →**.

For å komme tilbake til hele kartet, velg **Alle fagområder** og fjern eventuelt temafokus med ×. Ved svært høy terskel kan en fokusnode stå alene; senk terskelen for å se flere koblinger.

### Flytt, zoom og åpne detaljer

- **Enkeltklikk** fremhever og sentrerer en node.
- **Høyreklikk eller dobbeltklikk** setter noden i fokus og åpner detaljene. På berøringsskjerm kan du dobbelttrykke.
- **Dra en node** for å flytte den. Dra bakgrunnen for å flytte utsnittet.
- **Rull eller knip** for å zoome. Du kan også bruke pluss/minus nederst i kartet. Knappen med fire hjørner tilpasser utsnittet til de synlige nodene.
- **Dynamisk** lar nodene bevege seg og finne plass når kartet endres. En node du slipper, inngår igjen i bevegelsen. **Statisk** fryser plasseringen og lar flyttede noder bli der du slipper dem.

Tastatur: `/` åpner søket. Pil opp/ned velger søkeresultat, og Enter setter det i fokus. Når selve kartet har tastaturfokus, åpner Enter detaljene til valgt node, piltastene flytter utsnittet, `+`/`−` zoomer og `0` tilpasser utsnittet.

## Les, rediger og ta egne notater

Sidepanelet viser forklaring, hovedpunkter, bruk i drøfting, begrensninger, praksiseksempler og eventuelle figurer. Kildegrunnlag og mer faglig analyse ligger nederst i panelet. Praksiseksemplene er konstruerte situasjoner som skal vise hvordan teoriene kan brukes.

Klikk **Rediger** øverst til høyre for å endre navn, forklaring, hovedpunkter og egne notater. Klikk **Lagre** når du er ferdig. Eksempler og flere felt kan redigeres under «Flere fagfelt og figurer (JSON)»; det er et mer teknisk redigeringsfelt.

**Endringene lagres på din egen maskin.** Andre brukere får dem ikke automatisk. Endring av en tekst beregner heller ikke nye relasjonsvekter; panelet gjør oppmerksom på at vektene fortsatt bygger på den opprinnelige teksten.

### Sikkerhetskopi og bytte av maskin

1. Åpne **Oppdateringer og backup** øverst i appen.
2. Velg **Lagre sikkerhetskopi** og oppbevar JSON-filen et trygt sted.
3. På den andre maskinen åpner du samme panel og velger **Åpne sikkerhetskopi**. Gå gjennom eventuelle konflikter før importen fullføres.

Sikkerhetskopien inneholder dine egne tekster og private notater. Del den bare når du ønsker å dele dette innholdet. Det er ingen automatisk synkronisering av egne notater mellom maskiner.

## Oppdateringer: appen og faginnholdet

Det finnes to typer oppdateringer. Begge trenger internett, men du kan fortsette å studere og redigere uten nett.

| Type | Hva du får | Slik oppdaterer du |
| --- | --- | --- |
| **Appoppdatering** | Nye funksjoner og feilrettinger i programmet | På Windows: **Hjelp → Se etter appoppdateringer**, eller appdelen i **Oppdateringer og backup**. Last ned, lagre arbeidet og velg å starte på nytt og installere. Du kan også laste ned ny EXE fra utgivelsessiden. |
| **Faginnhold** | Godkjente rettelser, nye temaer, eksempler og relasjoner | **Oppdateringer og backup → Se etter nytt faginnhold**. Se gjennom oppdateringen før du bruker den. |

**Mac oppdateres foreløpig manuelt:** Last ned den nye DMG-filen, avslutt Sammenheng og erstatt appen i Programmer. Automatisk appoppdatering på Mac krever en signert utgave. Oppdatering av faginnhold fungerer separat inne i Mac-appen.

Egne lagrede tekster ligger separat fra programfilene. Dersom både du og en felles oppdatering har endret samme felt, får du velge mellom **Min tekst** og **Ny felles tekst**. Egne notater beholdes. Sjekk også etter nytt faginnhold etter en appoppdatering; de har separate versjonsnumre, som vises i oppdateringspanelet.

## Foreslå en forbedring til alle

1. Rediger og lagre et tema i appen.
2. Klikk **Foreslå endring til felles kart** i temaets sidepanel.
3. Velg feltene du ønsker å foreslå og les gjennom forhåndsvisningen.
4. Åpne GitHub og fullfør innsendingen som en **issue**. Ved lange forslag kan du få tilbud om å kopiere teksten og lime den inn selv.

Du trenger en GitHub-konto for å sende inn et forslag. Forslaget publiseres først når du selv sender det på GitHub; det separate feltet for egne notater tas ikke med. De valgte forslagstekstene blir offentlige i prosjektets issue.

Vedlikeholderen vurderer forslaget og om relasjonsvektene også bør endres. Godkjente endringer kan deretter bli med i en ny felles innholdsutgave. Dette er bidrag som blir gjennomgått, ikke samtidig redigering av ett felles kart.

Fant du en feil i programmet? [Opprett en issue](https://github.com/KevinAmundsenDale/org-webpage/issues) med appversjon, operativsystem, hva du gjorde og den nøyaktige feilmeldingen.

## Vanlige spørsmål

**Må jeg betale eller opprette en konto?** Nei, du trenger ingen konto for å laste ned eller bruke appen. GitHub-konto trengs bare hvis du vil sende inn et forslag eller en issue.

**Kan jeg dele appen med medstudenter?** Del [lenken til nyeste utgave](https://github.com/KevinAmundsenDale/org-webpage/releases/latest), så får de riktig installer og gjeldende informasjon. Hver bruker får sin egen lokale kopi og egne notater.

**Jeg ser ikke alle noder.** Sjekk «Tema i fokus», «Fagområde i fokus» og avstandsgrensen. Fjern filtrene og bruk knappen som tilpasser utsnittet for å se hele kartet.

**Jeg ser ikke praksiseksemplene.** Åpne temaets sidepanel og bla til «Eksempler». Sjekk appversjon og faginnholdsversjon under «Oppdateringer og backup». Faginnhold 3 inneholder eksempler til alle 157 temaer.

**Windows sier at appen ikke kan lukkes eller at en fil ikke kan skrives.** Avslutt appen og sjekk ledig diskplass, både på installasjonsdisken og disken for midlertidige filer, vanligvis C:. Ha gjerne rundt 2 GB ledig på begge før du prøver igjen. Se [feilsøking og gjenoppretting](docs/SHARING-AND-UPDATES.md#storage-and-recovery) hvis problemet fortsetter.

## For utviklere og vedlikeholdere

### Kjør fra kildekoden

Prosjektet bruker JavaScript, D3, Canvas og esbuild, med en lokal Node-server. Skrivebordsappen pakkes med Electron. Ressurser og figurer leveres lokalt, uten eksterne fonter eller CDN.

Installer **Node.js 22** (versjonen som brukes i GitHub Actions) og Git. Klon prosjektet og kjør:

```sh
git clone https://github.com/KevinAmundsenDale/org-webpage.git
cd org-webpage
npm ci
npm run build
npm start
```

Åpne **http://localhost:4317**. Behold terminalen åpen mens serveren kjører; Ctrl+C stopper den. Serveren lytter bare lokalt. På Windows kan `Start.cmd` brukes etter at avhengighetene er installert. Dersom PowerShell blokkerer `npm.ps1`, bruk `npm.cmd` i kommandoene.

`npm run dev` overvåker JavaScript/CSS; oppdater nettleseren etter endringer. Endringer i `public/` krever ny bygging. Miljøvariabelen `PORT` kan brukes for en annen port. `npm run desktop` bygger og åpner Electron-utgaven lokalt.

### Filer og lagring

| Fil/mappe | Innhold |
| --- | --- |
| `src/`, `public/` | Grensesnitt, graftegning, søk og statiske ressurser |
| `desktop/`, `electron-builder.cjs` | Skrivebordsapp og pakking |
| `data/topics.json`, `data/topics.schema.json` | Felles temaer og formatvalidering |
| `data/relationships.json` | Komplett kantliste med vekter |
| `data/relationship-matrix.json` | Samme vekter som matrise |
| `data/relationship-analysis.json` | Faglige begrunnelser for forbindelsene |
| `data/source-map.json`, `public/assets/figures/` | Kildekart og figurer |
| `data/content-version.json` | Versjon og informasjon om fellesinnholdet |
| `distribution.json` | GitHub-repositorier for utgaver, faginnhold og forslag |
| `dist/`, `release/` | Genererte nettleserfiler og installasjonsfiler; ikke sjekket inn i Git |

Skrivebordsappens brukerdata ligger normalt i `%APPDATA%\Sammenheng\profile` på Windows og `~/Library/Application Support/Sammenheng/profile` på Mac. Nettleserutgaven fra kildekoden bruker prosjektets `data/`-mappe.

`edits.json` inneholder personlige endringer og peker til aktivt fellesinnhold under `.content/`. `backups/` beholder de siste 20 tidligere tilstandsfilene. Bruk eksport/import i appen for vanlig flytting av egne data. Ikke slett innholdskopier som en lagret tilstand viser til.

### Tester, bygging og publisering

```sh
npm test
npm run test:browser
npm run test:sync-browser
npm run test:desktop
```

Kjør `npm run build` først. Nettlesertestene bruker Microsoft Edge og isolerte testdata. Testene dekker blant annet datavalidering, søk, kategorier, fokus, redigering, lagring, konflikter, oppdateringer og skrivebordsappen.

`npm run desktop:dist` bygger installasjonsfiler for vertsplattformen. GitHub Actions-workflowen **Build desktop installers** bygger Windows x64 og Mac universal og oppretter en utgave som utkast. **Build shared content release** lager et separat utkast for faginnhold. Et push til GitHub alene oppdaterer ikke installerte apper.

- [Deling, publisering og godkjenning av forslag](docs/SHARING-AND-UPDATES.md)
- [Oppsett av signering](docs/SIGNING-SETUP.md)
- [Faglig gjennomgang og endringer i faginnhold 3](docs/CONTENT-REVIEW-2026-09.md)
- [Utgivelsesnotater](docs/RELEASE-NOTES.md)

Publiser apputgaver som **Latest**. Innholdsutgaver (`content-v…`) skal ikke merkes Latest. Endring av fagdata krever konsistente revisjoner, innholdshasher og relasjonsfiler; bruk vedlikeholdsverktøyene og gjennomgå vektene når betydningen av et tema endres. Originale forelesnings-PDF-er og bokutdrag distribueres ikke med appen.
