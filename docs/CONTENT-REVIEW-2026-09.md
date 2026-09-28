# Kursgjennomgang, september 2026

Faginnhold 3 leveres også med Sammenheng 1.2.1. Kartet har **157 noder, 12 246 forbindelser og et konstruert praksiseksempel til hver node**. Eksisterende node-ID-er er beholdt, slik at lokale notater og endringer fortsatt kan flettes med fellesinnholdet.

## Hva som er gjennomgått

Grunnlaget er 13 brukerleverte forelesningsfiler fra HSM121 og to bokutdrag. Gjennomgangen sammenholder temaer, forklaringer, sentrale figurer og relevante tekstpassasjer med de 132 eksisterende nodene. Dette er en redaksjonell pensumgjennomgang, ikke uavhengig kontroll av alle originalverk, empiriske påstander eller alle bildeelementer i lysbildene.

PDF-ene og tekstuttrekkene distribueres ikke. Fagtekstene er omformulert, og eksemplene er nyskrevne, fiktive situasjoner. Eksisterende figurer fra det tidligere sammendraget er uendret; ingen nye skannede bokfigurer er lagt til.

Kilder og presise sidereferanser finnes under **Faglig analyse og kildegrunnlag** i hver berørt node. Full kildeinventarliste med filnavn og SHA-256 ligger i [source-inventory.json](../scripts/review-2026-09/source-inventory.json). For PDF-kildene bruker de eldre `paragraph_start/end`-feltene PDF-side som kildeenhet. `locator` forklarer dette; `pages` angir trykte boksider for bokutdrag og PDF-sider for forelesninger. Dette bevarer kompatibilitet med eksisterende appversjoner.

**Kildeavvik:** Filen som heter «Kaufmann … (2015) … 5. utg. … (Kap. 4, 5)» inneholder ifølge omslag og innhold **Geir Kaufmann, Astrid Kaufmann og Thorvald Hærem (2023), 6. utgave, kapittel 4, s. 127–165**. Kapittel 5 finnes ikke i den leverte filen. Det andre utdraget er kapittel 9, s. 315–350, i samme utgave. Vi har ikke fylt inn en hel personlighetsteori fra et kapittel som mangler.

## Nye temaer

| Område | Nye noder |
|---|---|
| Ledelse og etikk | Tjenende ledelse; pliktetikk; konsekvensetikk; dydsetikk; diskursetikk; navigasjonshjulet; destruktiv ledelse |
| Mål og strategi | Samfunnsansvar (CSR); transaksjonskostnader |
| Motivasjon og arbeidsmiljø | Jobbholdninger (ABC); jobbtilfredshet; psykologisk kontrakt; psykososialt arbeidsmiljø; jobbstress; jobbengasjement; psykologisk kapital; Adams og organisatorisk rettferdighet; McClellands behov; regulatorisk fokus; prososial motivasjon; Thorsruds psykologiske jobbkrav; Alderfers ERG |
| Kultur | Gruppetenkning |
| Læring | Erfaringslæring |
| Endring | Kotters åtte endringstrinn |

De eksisterende kapittelkategoriene er beholdt. Etikknodene ligger under ledelse; arbeidsmiljønodene ligger under motivasjon og ytelse. Dette er plassering i grensesnittet, ikke en bonus i relasjonsvektene.

## Viktige presiseringer i eksisterende noder

- **Selvbestemmelsesteori:** autonomi, kompetanse og tilhørighet, samt forskjellen mellom å verdsette et mål og å like selve aktiviteten.
- **Forventningsteori:** forventning × instrumentalitet × valens. Den eldre forenklede figuren er identifisert som forenklet; tekst og uttrykk bruker tre ledd uten å påstå presis måling.
- **Organisasjonstilknytning:** affektive, normative og kalkulerende bånd. Tilfredshet, engasjement og tilknytning skilles.
- **Hersey–Blanchard:** forelesningen viser både en eldre beredskapsvariant og en senere utviklingsvariant. Forklaring, eksempel og kildemerknad hindrer at de blandes i én tabell.
- **Lederstiler:** oppgaveorientering er ikke synonymt med autoritær ledelse, og relasjonsorientering er ikke automatisk medbestemmelse.
- **Transformasjonsledelse:** de fire komponentene er tydelig navngitt. Sterk visjon er ikke i seg selv etisk kvalitet.
- **Transaksjonsledelse:** aktiv og passiv avviksledelse skilles fra fraværende ledelse.
- **Selznick:** formål, institusjonalisering, integritet og interne konflikter.
- **Kompetanseledelse:** kompetanseutvikling skilles fra mobilisering av kompetanse som allerede finnes.
- **Lewin og endring:** stabilisering betyr ikke permanent stillstand; dialektisk interesse- og maktkamp er lagt til endringsperspektivene.
- **Målsetting og Maslow:** læringsmål ved ukjente oppgaver; behovshierarkiet brukes ikke som en rigid trapp.
- **Struktur, kultur og omgivelser:** fem Mintzberg-deler, formalisering og differensiering, sosialisering, Cameron–Quinns akser og institusjonell likhet er tydeliggjort.
- **Konflikt og ytelse:** saklig uenighet er ikke det samme som personkonflikt; et «middels konfliktnivå» er ingen universell anbefaling.
- **Produktivitet:** output per ressursinnsats skilles fra måloppnåelse og kvalitet.

22 eksisterende forklaringer er omskrevet. I tillegg er korte definisjoner, enkelte navn, uttrykk, statusmerknader og utvalgte kildehenvisninger oppdatert. Alle eksisterende noder har fått eksempel og ny innholdsrevisjon. Det tidligere godkjente Schein-innholdet er beholdt, med supplerende kilder og eksempel.

## Praksiseksemplene

Alle 157 noder har et eget, konstruert eksempel, normalt omkring 90–140 ord og lengre der modellen krever det. De står under **Eksempler** i nodens sidepanel og kan redigeres gjennom det eksisterende feltet **Flere fagfelt og figurer (JSON)**.

Eksemplene identifiserer modellens sentrale deler og viser både bruk og begrensninger. Schein dekker artefakter, verdier, normer og grunnleggende antakelser; Hackman–Oldham dekker fem jobbegenskaper, tre psykologiske tilstander og betingelser; tjenende ledelse dekker seks dimensjoner; Kotter dekker alle åtte trinn. Et eksempel er ikke et forskningsfunn eller bevis for at en teori alltid virker.

Kortfattede kildeseksjoner som kommunikasjonskanaler, effektiv kommunikasjon og enkelte lærings-/ledelsesperspektiver beholder begrensningsmerknader. Illustrasjoner fyller ikke automatisk et dokumentasjonsgap. Det er heller ikke lagt inn ukontrollerte juridiske regler, kliniske anbefalinger eller historiske anekdoter fra lysbildene.

## Relasjonsvekter

Vektene betyr **faglig og argumentativ nærhet**, ikke statistisk korrelasjon, sannsynlighet eller kausal effekt. Alle ulike par har fortsatt en positiv, symmetrisk vekt; diagonalen er `null`.

**1 085 eksisterende vekter er endret, og 3 600 forbindelser er lagt til** for de 25 nye nodene. De fleste endringene følger av reviderte semantiske profiler og nye mulige skriveveier. Dette er ikke 12 246 uavhengige, manuelle parvurderinger. Datasettet har 638 særskilt vurderte direkte par; øvrige vekter er transparente profil- eller stiestimater.

Eksempler på endrede direkte vurderinger:

| Forbindelse | Før | Nå | Begrunnelse |
|---|---:|---:|---|
| Kompetanseledelse – HRM | 0,31 | 0,94 | Utvikling og mobilisering kobler ferdigheter til praktisk handlingsmulighet. |
| Uplanlagt endring – forhandling | 0,08 | 0,86 | Den nye dialektiske delen handler om interesser og maktkamp. |
| Målsetting – organisatorisk læring | 0,35 | 0,86 | Ukjente oppgaver kan kreve læringsmål før prestasjonsmål. |
| Kompetanseledelse – Hackman–Oldham | 0,37 | 0,86 | Jobbutforming påvirker bruk av eksisterende kompetanse. |
| Selznick – interessentmodellen | 0,38 | 0,87 | Institusjonelt formål, integritet og konflikt mellom grupper. |

Nye koblinger på tvers inkluderer psykologisk kontrakt–endringsmotstand (0,94), diskursetikk–kommunikativ rasjonalitet (0,97), tjenende ledelse–selvbestemmelsesteori (0,89), og gruppetenkning–beslutningskvalitet (0,94).

Metoden viderefører den tidligere rubrikken: manuelt kodede begreper, mekanismer og anvendelser; vektet profiloverlapp; direkte parvurderinger som overstyrer estimatet; dempede skriveveier på to eller tre trinn gjennom sterke, særskilt vurderte forbindelser. Ingen bonus for samme kapittel, forfatter eller felles navn i et eksempel. Alle avledede scorer er beregnet på nytt, og profiler, parvurderinger, nodehasher, liste og matrise er synkronisert. Forskjeller på noen hundredeler bør ikke leses som objektiv presisjon.

Full endringsliste og begrunnelser: [content-review-2026-09.json](content-review-2026-09.json). Reviderte [profiler](../scripts/review-2026-09/reviewed-profiles.json), [parvurderinger](../scripts/review-2026-09/reviewed-pairs.json) og [rubrikk](../scripts/review-2026-09/reviewed-rubric.json) er lagret med fingeravtrykk som samsvarer med distribusjonsfilene.

## Oppdatering og vedlikehold

Eksisterende brukere kan hente **Faginnhold 3** gjennom appens fellesinnholdsoppdatering. Windows kan også oppdatere til app 1.2.1, som inkluderer innholdet fra første oppstart. Mac-brukere kan installere den nye DMG-en. Appoppdatering og innholdsoppdatering er to forskjellige utgivelser; innholdsutgivelsen skal ikke merkes som siste appversjon.

Lokale endringer beholdes av den eksisterende flettingen. Dersom både du og felleskartet har endret samme felt, må valget mellom lokal og felles tekst gjennomgås. En lokal gammel eksempelliste kan derfor kreve et eksplisitt valg før nye eksempler overtas.

`node scripts/review-2026-09/build.mjs` gjenskaper akkurat denne redaksjonelle oppdateringen fra Git-commit `f98e5eaa6813284593877806e39c475ee7fc4466`. Den krever historikken til denne commiten og **overskriver de kanoniske innholdsfilene**; den er et historisk reproduksjonsverktøy, ikke en generell kommando for senere innholdsendringer. PDF-ene trengs ikke for reproduksjon. Fremtidige oppdateringer må ta utgangspunkt i den da gjeldende innholdsversjonen.
