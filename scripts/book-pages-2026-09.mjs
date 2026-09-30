// Curated locators from the user's licensed Bookshelf copy, not generated from keywords.
// Re-running is safe: the release is applied only once.
import {readFile,writeFile} from 'node:fs/promises';
import {sha} from '../lib/content.mjs';
const read=async n=>JSON.parse(await readFile(`data/${n}.json`,'utf8'));
const write=async(n,v)=>writeFile(`data/${n}.json`,JSON.stringify(v,null,2)+'\n');
// id | printed pages explicitly located in contents/index/text | scope
const rows=`
organisasjon|15,16|Definisjon av organisasjon
produksjonssystem|16,17|Organisasjonen som produksjonssystem
organisasjonsatferd|18,19|Organisasjonsatferd
formelle-uformelle-trekk|19,20,21|Formelle og uformelle trekk
omgivelsesavhengighet|21,22|Avhengighet av omgivelsene
helhetlig-organisasjonsmodell|22,23|Bokens helhetlige modell
varer-tjenester|23,24|Vare- og tjenesteproduksjon
maalhierarki|36,38|Målhierarki
porter-generiske-strategier|41,42|Generiske konkurransestrategier
miles-snow|42|Strategiske typer
ressursbasert-strategi|40,45|Ressursbasert strategiperspektiv
swot|44|SWOT
business-model-canvas|46,47|Forretningsmodeller (tematisk henvisning; Canvas-detaljene er ikke sideverifisert)
produktivitet-effektivitet|49,50,52,53|Produktivitet og effektivitet
balansert-maalstyring|53|Balansert målstyring
fremvoksende-strategi|57|Fremvoksende strategi
maalforskyvning|59,60|Målforskyvning
samfunnsansvar|54,55|Samfunnsansvar og bærekraft (supplerer forelesningen; ikke kildeverifisering av alle fire ansvarskategorier)
transaksjonskostnader|50,51|Transaksjonskostnader
taylor-arbeidsdeling|68,69|Arbeidsdeling og vitenskapelig arbeidsledelse
funksjonsgruppering|69,70,71|Funksjonsbasert gruppering
markedsgruppering|71,72|Markedsbasert gruppering
matrisestruktur|73|Matrise- og prosjektstrukturer
prosjektorganisering|73|Matrise- og prosjektstrukturer
linjeorganisasjon|77,78|Linje og stab
mintzberg-hoveddeler|77,78|Linje, teknostruktur og støttestruktur
sentralisering|78|Sentralisering og desentralisering
koordinering|80,81,82,83|Koordineringsmekanismer
styringsmekanismer|86,87,88|Styring og kontroll
mintzberg-konfigurasjoner|89,95|Strukturelle konfigurasjoner: innledning og oversikt
entreprenororganisasjon|89|Entreprenørorganisasjonen
maskinbyraakrati|90|Maskinbyråkratiet
profesjonelt-byraakrati|92|Profesjonalisering (registerhenvisning til faglig organisering)
adhockrati|93,94|Adhockrati
divisjonalisert-struktur|95|Divisjonalisert organisering
organisasjonskultur|110,111,112|Organisasjonskultur og Scheins definisjon
schein-kulturnivaaer|112,113,114,115,116,117|Kulturnivåer: grunnleggende antakelser, verdier, normer og artefakter
artefakter|116,117,118|Artefakter og symbolsk mening
cameron-quinn|119,120|Kulturtyper
martin-kulturperspektiver|121,122|Kulturmangfold og de tre kulturperspektivene
hofstede|131|Nasjonal kultur
gruppetenkning|125|Gruppetenkning
maktformer|141,144,145,146|Åpen og skjult makt
byttemakt|141|Byttemakt
interessentmodellen|147|Organisasjonen som politisk arena
maktbaser|148,151|Maktbaser
weber-autoritet|152,153|Autoritet og legitimering av makt
profesjonell-autoritet|153|Profesjonell autoritet
konflikt-beslutningskvalitet|154,155,156|Konflikt og beslutningskvalitet
bemyndiggjoring|160|Bemyndiggjøring
tekniske-omgivelser|174|Tekniske omgivelser
omgivelsesusikkerhet|175,176,177|Kompleksitet og endring i omgivelsene
haandtere-tekniske-omgivelser|180,182|Håndtering av tekniske omgivelser
institusjonelle-omgivelser|182,183|Institusjonelle omgivelser
teknisk-institusjonelt-samspill|185|Tekniske og institusjonelle omgivelser
institusjonelle-strategier|186,187,188,189,191|Isomorfi, konformitet, dekobling og omdømme
interorganisatoriske-relasjoner|191,192,193,194,195,196|Interorganisatoriske relasjoner
indre-ytre-motivasjon|207,209|Motivasjon; indre og ytre motivasjon
selvbestemmelsesteori|209|Selvbestemmelse (kort omtale; forelesningen utdyper reguleringsformene)
maslow|210,211|Behov og Maslow
forventningsteori|213,214|Forventningsteori
maalsettingsteori|213,216|Belønninger og mål (tematisk henvisning til delkapittel 7.4)
beloenningssystemer|217|Belønningssystemer
kollektiv-individuell-beloenning|218,219|Individ-, gruppe- og systembelønninger
karrieresystemer|219,220|Karrieresystemer
herzberg|222,223,224|Motivasjons- og hygienefaktorer
hackman-oldham|224,227|Jobbkarakteristika og jobbutforming
organisatorisk-tilknytning|231,232|Psykologiske kontrakter og forpliktelse (supplerer forelesningens tredeling)
psykologisk-kontrakt|231|Psykologiske kontrakter
hrm|232|Human Resource Management
organisatorisk-rettferdighet|221|Likeverdsteori (kun fordelingsperspektivet; øvrige rettferdighetsformer er fra forelesningen)
prososial-motivasjon|208|Altruisme og offentlig tjenestemotivasjon
thorsrud-jobbkrav|229|Sosioteknikk og skandinavisk jobbutforming (supplerer forelesningens jobbkrav)
kommunikasjonsprosess|245,246|Kommunikasjonsprosessen
kommunikasjonskanaler|247,249|Kanaler, synkron og asynkron kommunikasjon
effektiv-kommunikasjon|250,251|Effektiv kommunikasjon
vertikal-horisontal-kommunikasjon|252,254|Vertikal og horisontal kommunikasjon
barnard-uformell-kommunikasjon|254,256|Uformell kommunikasjon og rykter (tematisk henvisning)
omdoemme|257,258|Omdømme og virksomhetskommunikasjon
granovetter-svake-baand|261|Kommunikasjonsnettverk og Granovetter
strukturelle-hull|261|Strukturelle hull
kommunikasjon-beslutninger|263|Kommunikasjon og beslutningsprosesser (oppsummerende omtale)
beslutningsprosesser|270|Hva en beslutning er
perfekt-rasjonalitet|271,272|Perfekt rasjonalitet
begrenset-rasjonalitet|274,275|Satisfiering og begrenset rasjonalitet
march-konsekvenslogikk|279,280|Konsekvenslogikk
march-passendehet|280|Passendehetslogikk
beslutningsstroemmer|279,282,283|Individuelle beslutninger og organisatoriske rammer (tematisk henvisning)
beslutningsfora|282,283|Deltakelsesrettigheter, prosedyrer og beslutningsstruktur
beslutningsmodeller|283,284|Oversikt over beslutningsmodeller
rasjonell-organisasjon|283,284|Modelloversikt (tematisk henvisning til rasjonelle beslutningsmodeller)
regelmodellen|287|Regelmodellen
forhandlingsmodeller|289|Forhandlingsmodeller
kommunikativ-rasjonalitet|290|Kommunikativ rasjonalitet
inkrementelle-beslutninger|292|Inkrementelle beslutninger
organisert-anarki|294|Organisert anarki
stiavhengighet|297,298|Stiavhengighet
iverksettingsproblemer|299|Iverksetting av beslutninger
symbolske-beslutninger|300|Symbolske beslutninger
organisatorisk-laering|307|Hva læring er
betinging|309|Klassisk og operant betinging
kognitiv-laering|311|Kognitive kart
sosial-laering|312|Sosial læringsteori
argyris-laeringskretser|312,313|Enkeltkrets- og dobbeltkretslæring
nonaka-kunnskap|316,317,318|Taus og eksplisitt kunnskap; læringsspiralen
march-utnyttelse-utforsking|318|Utnyttelse og utforsking
suksessfellen|319|Suksessfellen
innovasjon|320,321|Innovasjonstyper
laerende-organisasjoner|321,322,324,325,326,327,328|Lærende organisasjoner: systemtenkning, kunnskapsproduksjon, absorpsjon og ambideksteritet
toyota-hvorfor|323|Hvorfor-analyse
laering-endring|307,329|Læring, endring og makt (tematisk henvisning)
endringsomfang|339|Hva organisasjonsendring er
endringsagenter|340,341,343|Planlagt endring og endringsagenter
endringspress|341,343|Behov for endring; proaktiv og reaktiv endring
endringsmotstand|344|Motstand mot endring
endringsstrategier|347,348,352|Endringsstrategier
lewin|353|Opptining, endring og nedfrysing
endringsgjennomfoering|355|Vellykket endring
uplanlagt-endring|358,359,360|Livssyklus, evolusjon og andre perspektiver på endring
ledelse|367|Hva ledelse er
direkte-indirekte-ledelse|367,369|Ledelse og organisatoriske rammer (tematisk henvisning)
administrasjon-ledelse|368|Administrasjon og ledelse
lederstiler|370,371|Lederstiler
ledergitteret|371,372|Ledergitteret
hersey-blanchard|373,374,375|Situasjonsbetinget ledelse
fiedler|376,377|Fiedlers modell
lmx|378|Leder–medarbeider-relasjoner
delt-ledelse|380|Distribuert ledelse
adaptiv-ledelse|381|Adaptiv ledelse
kompetanseledelse|382|Kompetanseledelse
selznick-verdibasert-ledelse|383,384|Institusjonell ledelse
transaksjonsledelse|385|Transaksjonsledelse
transformasjonsledelse|385|Transformasjonsledelse
karismatisk-ledelse|386|Karismatisk ledelse
etisk-ledelse|387|Moralske ledelsesteorier
autentisk-ledelse|387|Autentisk ledelse
lederroller|390,392,394|Lederroller og lederarbeid
tjenende-ledelse|388|Tjenende lederskap (kort omtale; de seks dimensjonene utdypes i bokutdraget)
`.trim().split('\n').map(line=>{const[id,pages,scope]=line.split('|');return{id,pages:pages.split(',').map(Number),scope};});

const data=await read('topics'),version=await read('content-version');
if(version.version!==3)throw new Error('Expected content version 3; do not apply twice.');
const chapterStarts=[13,35,65,107,139,171,205,241,267,305,337,365];
const byId=new Map(data.topics.map(t=>[t.id,t]));
for(const row of rows){
 const t=byId.get(row.id);if(!t)throw new Error('Unknown topic '+row.id);
 const chapter=chapterStarts.findLastIndex(p=>p<=row.pages[0])+1;
 t.source_refs.unshift({source_id:'book-01',locator:`6. trykte utgave (e-utgave 2025), kapittel ${chapter}: ${row.scope}. Utvalgte boksider; kontrollert mot boktekst, innhold eller register.`,paragraph_start:Math.min(...row.pages),paragraph_end:Math.max(...row.pages),pages:row.pages});
 t.revision++;
 const{content_hash,...body}=t;t.content_hash=sha(body);
}
const source=data.sources.find(s=>s.id==='book-01');
Object.assign(source,{authors:['Dag Ingvar Jacobsen','Jan Thorsvik'],edition:'6. trykte utgave; e-utgave 1. versjon',year:2025,access:'direct_via_licensed_bookshelf',notes:[
 'Kolofonen (s. 4) angir e-utgave 2025, ISBN 978-82-450-5928-1, basert på 6. trykte utgave, 1. opplag (ISBN 978-82-450-4976-3). Året gjelder e-utgaven.',
 'Sidehenvisningene er bokas trykte sidenummer slik de vises i Bookshelf, ikke PDF-sider eller skjermposisjoner. Kontrollert 30. september 2026 mot tilgjengelig boktekst, innholdsfortegnelse og stikkord-/personregister. Henvisningene er redaksjonelt utvalgte innganger til hovedtemaene, ikke en uttømmende liste eller en ny verifisering av all nodetekst.',
 'Tematiske og delvise henvisninger er merket i locator. Øvrige kilder beholdes. Konstruerte praksiseksempler er fortsatt redaksjonelle og er ikke hentet fra disse boksidene.',
 'For book-01 brukes de obligatoriske kompatibilitetsfeltene paragraph_start og paragraph_end som laveste/høyeste oppgitte bokside; pages er den autoritative listen over enkeltsider, ikke nødvendigvis et sammenhengende intervall.'
]});
data.dataset_revision++;
const manifest=data.topics.map(t=>({id:t.id,revision:t.revision,content_hash:t.content_hash})).sort((a,b)=>a.id<b.id?-1:1);
for(const name of ['relationships','relationship-matrix','relationship-analysis']){
 const d=await read(name);d.topics_fingerprint=sha(manifest);
 if('topic_manifest'in d)d.topic_manifest=manifest;
 if('dataset_revision'in d)d.dataset_revision=data.dataset_revision;
 await write(name,d);
}
await write('topics',data);
await write('content-version',{...version,version:4,notes:`Bokhenvisninger til ${rows.length} temaer fra Hvordan organisasjoner fungerer, 6. utgave (e-utgave 2025). Trykte boksider vises under Faglig analyse og kildegrunnlag → Kilder. Tematiske/delvise henvisninger er merket. Øvrige kilder og eksempler beholdes. Ingen endring i relasjonsvekter eller appfunksjoner. Lokale endringer beholdes; eventuelle kildekonflikter kan gjennomgås.`});
const omitted=data.topics.filter(t=>!rows.some(r=>r.id===t.id)).map(t=>({id:t.id,title:t.title,reason:'Ingen tilstrekkelig presis bokside verifisert i denne gjennomgangen; eksisterende kilder beholdt. Dette betyr ikke at temaet nødvendigvis mangler i boka.'}));
await writeFile('docs/book-pages-2026-09.json',JSON.stringify({date:'2026-09-30',source_id:'book-01',content_version:4,method:'Redaksjonell kobling av eksisterende noder til boktekst, innholdsfortegnelse og stikkord-/personregister lest i brukerens lisensierte Bookshelf. Ingen boktekst distribuert. Kun sidehenvisninger; full nodetekst og relasjonsvekter er ikke revidert.',references:rows,without_verified_book_page:omitted},null,2)+'\n');
console.log(JSON.stringify({references:rows.length,without_verified_book_page:omitted.map(t=>t.id)},null,2));
