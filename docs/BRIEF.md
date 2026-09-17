# BRIEF — Električar Jovan (demo sajt, Vercel)

Kompletan, vizuelno izuzetan, funkcionalan i proveren jednostrani demo sajt „Električar Jovan“, spreman za Vercel.
Tema u jednoj rečenici: nestala je struja, sajt je u mraku, a svetlo se vraća dok skroluješ — jer Jovan popravlja kvar po kvar.

## 1. Agenti i ekonomičnost (sažetak; puna verzija je u originalnom promptu)

Podagenti: scout (haiku), builder (sonnet), motion-engineer (opus), copywriter (sonnet), qa-runner (haiku), reviewer (opus). Vidi `.claude/agents/`.
Pravila: delegacija je kratka; izveštaj podagenta ≤150 reči (promenjeni fajlovi, urađeno, provere + rezultat, otvoreni problemi; puni logovi u `docs/reports/`); najviše dva agenta istovremeno na disjunktnim fajlovima; interfejsi zaključani u `docs/CONTRACT.md`; najviše dva pokušaja na istoj kapiji pre eskalacije; nove zavisnosti samo uz liniju u `docs/DECISIONS.md`; commit posle svake faze.

## 2. Ishod i način rada

Premium, filmski oblikovan portfolio za lokalnog električara iz Beograda. Glavni doživljaj je priča koja se otkriva skrolovanjem: struja putuje kablom kroz celu stranicu, kvarovi se rastavljaju i popravljaju pred očima (varnice, puknuta žica, treperava sijalica), a na kraju se pali svetlo koje otkriva kontakt.

Sav vidljiv tekst na sajtu: prirodan srpski, latinica, ekavica, bez anglicizama. Kod, komentari i identifikatori: engleski.

## 3. Opseg, podaci i tehnologije

- Isključivo frontend. Bez autentifikacije, baze, CMS-a, backenda, tajnih ključeva.
- React + Vite + TypeScript + Tailwind CSS v4. shadcn/ui gde je koristan, prilagođen ovom dizajnu.
- Animacije: samo `gsap` (ScrollTrigger, SplitText, DrawSVG, MotionPath) + `@gsap/react` (useGSAP, zbog StrictMode-a) + `lenis`. Bez Framer Motion-a, Three.js-a, WebGL-a ili druge paralelne animacione biblioteke. Alati za kvalitet (Playwright, Lighthouse, ESLint) su dozvoljeni.
- Bez udaljenih i stock fotografija. Sve vizuelno nastaje iz inline SVG-a, CSS-a i gradijenata. Fontovi su dozvoljeni.
- Svi poslovni podaci u `src/config/site.ts`, tipizirani, korišćeni u svim komponentama i metapodacima. Ovo je višekratno upotrebljiv šablon za zanatlije.

Obavezne početne vrednosti:

```ts
name: "Električar Jovan"
wordmark: "Jovan"
trade: "električar"
city: "Beograd"
email: "stefanbrkk@gmail.com"
phone: ""                          // prazno → nema tel: linkova ni dugmadi za poziv
hours: "Pon–Sub 07–20, hitni pozivi 0–24"
siteUrl: ""                        // upiši posle prvog deploy-a; koristi se za canonical, OG i sitemap
```

Tu su i usluge, statistike, koraci rada, koraci anatomije, pitanja/odgovori i utisci. Statistike i utiske označi komentarom `// DEMO`, izaberi uverljive primere i nenametljivo označi demo podatke u sekcijama. Izmišljene recenzije ne idu u strukturirane podatke kao stvarne ocene.

Hero ima dva funkcionalna poziva na akciju: „Pošalji upit“ → `#kontakt` i „Pogledaj usluge“ → `#usluge`. Nema obrasca za slanje. Kontakt je samo stefanbrkk@gmail.com.

## 4. Vizuelni identitet

Tema: noć bez struje, električarska radionica, šeme instalacija, topla svetlost sijalice i hladan plavo-beli luk varnice. Sajt mora izgledati namenski dizajnirano, ne kao generička landing stranica.

Tačne boje:

| Uloga | Boja |
|---|---|
| Pozadina | `#0A0B10` |
| Površine | `#13151E` |
| Linije | `#262B3B` |
| Glavni tekst | `#F3F1EA` |
| Sporedni tekst | `#9AA0B4` |
| Volt — primarna dugmad, struja u kablu, svetlo sijalice | `#FFB92B` (gradijent `#FFD36A → #F59E0B`) |
| Luk — varnice, električni luk, focus ring, „pod naponom“ indikatori | `#8FD8FF` |
| Kvar — iskočeni osigurač, čađ, upozorenje (samo u stanjima kvara) | `#FF6A3D` |

Tekst na volt dugmadima je `#0A0B10` (proveri AA kontrast, ne pretpostavljaj ga).

Tekstura: diskretna mreža tačkica kao na perforiranoj pločici (oko 6% opacity), fino filmsko zrno, meko ćilibarno svetlo iza ključnih elemenata. Efekti ne smeju zaklanjati sadržaj.

Google Fonts (self-hosted preko Fontsource, latin-ext, proveri č ć š ž đ u svakom fontu):

- Bricolage Grotesque 700–800 — veliki naslovi.
- Instrument Serif italic — naglašene reči i „Jovan rešava.“.
- Geist — osnovni tekst.
- JetBrains Mono — oznake, brojači, brojevi.

Samo potrebne težine, `font-display: swap`, preload display fonta. Naslovi sa `clamp`, na širokim ekranima do ~9rem, tight tracking; osnovni tekst 16–18px / 1.6; izdašan prazan prostor (sekcije ≥120px desktop / ≥80px mobilni); linije 1px, radijus 8px, staklaste površine (backdrop-blur + 1px svetla ivica).

Kursor (samo fini pokazivač): tačka + prsten, raste na interaktivnim elementima, blago magnetno privlačenje na primarnim dugmadima. Ništa od toga na touch uređajima i u reduced-motion režimu; ne kvari prirodni pokazivač ni fokus.

Motion: expo/quart-out easing, 60fps, animiraj samo `transform`, `opacity` i (gde je traženo) SVG `stroke-dashoffset`; bez layout thrash-a; `ScrollTrigger.refresh()` grupisano, posle učitavanja fontova i promene visine sadržaja; sve se čisti na unmount-u.

**Fotosenzitivnost (obavezno):** nijedan element ne menja svetlinu više od 3 puta u sekundi; svaka „treperi pa se upali“ sekvenca ima najviše 3 promene i traje ≤600ms; varnice su male (ispod 1% viewporta) i kratke; reduced-motion uklanja svako treperenje i svaki luk.

## 5. Animacioni sistem i glavna priča

### 5.1 Glavni vod

Jedan vizuelno neprekinut kabl (tamni plašt sa tankim bakarnim jezgrom na presecima) prati levu ivicu cele stranice na ≥1024px, sa obujmicama na savijanjima. Savija se prema sekcijama i završava se **zidnim prekidačem i visećom sijalicom** iznad kontakta. Deo kabla „pod naponom“ svetli volt bojom i raste sa ukupnim napretkom skrola (`stroke-dashoffset` scrub); po energizovanom delu klizi kratak svetliji impuls (samo dok je vidljiv, statičan u reduced-motion). Geometrija i napredak ostaju tačni posle promene veličine, učitavanja fontova i promene visine sadržaja.

Ispod 1024px zameni kabl tankom trakom napretka na vrhu (tamno → volt). Prekidač, sijalica i kontakt animacija ostaju.

### 5.2 Petlja i čišćenje

GSAP/ScrollTrigger i Lenis imaju jednu koordinisanu petlju (Lenis na GSAP tickeru, `lagSmoothing(0)`). Bez duplih tickera, duplog smooth-scroll-a, curenja listenera, zastarelih merenja ili konflikta sa React StrictMode-om (`useGSAP`/`gsap.context`). Na unmount-u očisti animacije, ScrollTrigger-e, listenere i Lenis instancu. Teške sekcije inicijalizuj kada se približe viewportu, sa rezervisanom visinom.

`prefers-reduced-motion` je punopravno iskustvo: bez pinning-a, scrub-a, smooth-scroll-a, parallax-a, treperenja i neprekidnih pokreta. Sve je vidljivo u završnom stanju: svih pet koraka anatomije, sva četiri koraka rada, upaljena sijalica i kontakt odmah upotrebljiv. Sadržaj nikad ne zavisi od izvršene animacije da bi bio vidljiv.

### 5.3 Zajednički motion alati (`src/motion/`)

- **`Sparks`** — mali SVG/CSS sistem čestica: 8–14 tankih linija/tačaka luk boje, nasumični uglovi, kratak život (300–600ms), samo `transform`/`opacity`, `pointer-events: none`, spawn samo dok je scena aktivna i vidljiva; na mobilnom prepolovi broj; u reduced-motion isključeno (ostaje statična ilustracija).
- **`Flicker`** — timeline „treperi pa se upali“ koji poštuje pravilo iz §4 (≤3 promene, ≤600ms), sa parametrima za intenzitet i glow; koristi ga hero, anatomija (korak 5) i finale.
- **`CurrentPath`** — struja duž SVG putanje: energizovani deo (DrawSVG/`stroke-dashoffset` scrub) + svetli impuls (MotionPath) koji staje na zadatoj tački; koristi ga glavni vod, anatomija i „Kako radim“.

## 6. Sve sekcije, ovim redom

### 6.1 — Uvodno otkrivanje

Loader jednom po sesiji, najviše 1,2s, prekida se na bilo koji unos: u mraku se zažari vlakno sijalice (kratki Flicker), svetlo se širi radijalno i otkriva stranicu. Ne čekaj mrežu ni fontove. U reduced-motion režimu preskoči ga.

### 6.2 — Navigacija

Sticky navigacija sa staklastom podlogom, wordmark „Jovan“ sa malim znakom munje, sidreni linkovi, volt dugme „Pošalji upit“ → `#kontakt`. Nestaje pri skrolovanju nadole, vraća se nagore, bez treperenja; indikator aktivne sekcije. Ne skrivaj je dok korisnik radi u njoj tastaturom.

Mobilni meni preko celog ekrana: semantičko dugme sa `aria-expanded`, zadržavanje fokusa, Escape zatvara, fokus se vraća, zatvaranje posle izbora linka, linkovi ulaze sa staggerom. Zaključaj skrol pozadine bez kvarenja Lenis-a i vrati stanje pri zatvaranju.

### 6.3 — Hero

Tačan glavni tekst: **„Iskače? Treperi? Varniči?“**. Svaka reč se pali redom kao neonska cev — dva kratka trzaja svetla pa mirno (Flicker, u granicama iz §4); uz „Varniči?“ mali Sparks efekat. Zatim se mirno pojavljuje **„Jovan rešava.“** u Instrument Serif italic — bez treperenja, jer je kvar rešen.

Kratak podnaslov o brzom dolasku, urednoj instalaciji i garanciji. Dva dugmeta iz §3. Pozadina: sporo pomeranje dva velika ćilibarna svetlosna polja (radijalni gradijenti, samo `transform`), mreža tačkica i veliki SVG utikača sa kablom u donjem levom uglu sa blagim mouse parallax-om (fini pokazivač); kroz kabl jednom prođe impuls struje pri učitavanju. Pokazatelj da se priča nastavlja skrolovanjem: kratka vertikalna žica niz koju klizi impuls.

### 6.4 — Poverenje

Statistike sa count-up animacijom pri ulasku (godine iskustva, broj intervencija, prosečan dolazak u minutima), brojevi u JetBrains Mono sa rezervisanom širinom da nema pomeranja rasporeda; vrednosti iz konfiguracije, jasno demo. Beskonačna pokretna traka usluga bez trzaja na spoju; pauza na hover/fokus; statična u reduced-motion.

### 6.5 — „Anatomija kvara“ (centralna scena)

Pinned/scrubbed sekcija sa pet koraka. Napravi verodostojan, namenski SVG **strujnog kola** kao jedne neprekinute linije: razvodna tabla → automatski osigurač → FID sklopka → kabl → utičnica → prekidač sa sijalicom. Kroz kolo putuje struja (CurrentPath). Na početku je sve mirno i ugašeno. U svakom koraku aktivna komponenta se izdvaja iz linije (blagi pomak duž svoje ose + skala), pokazuje svoj kvar, zatim se popravlja, pa struja nastavlja do sledeće. Neaktivni delovi su prigušeni; aktivni ima glow.

Svaki korak ima tri takta (scrubbed, pa skrol unazad sve vraća): **kvar → popravka → struja ide dalje.** Kartica objašnjenja prikazuje **problem · simptom · šta Jovan radi**. Obavezni delovi, sadržaj i mikroanimacije:

1. **Automatski osigurač** — Problem: preopterećeno kolo ili kratak spoj. Simptom: struja nestane čim uključite više uređaja. Šta Jovan radi: meri opterećenje, nalazi uzrok, menja osigurač ili deli kolo. *Kvar:* ručica pada uz kratak bljesak i par varnica. *Popravka:* ručica se vraća gore, indikator svetli.
2. **FID sklopka** — Problem: struja „curi“ ka zemlji (oštećen uređaj, vlaga, stara instalacija). Simptom: cela kuća u mraku, sklopka neće da se vrati. Šta Jovan radi: isključuje kola jedno po jedno, nalazi krivca, otklanja kvar i testira sklopku. *Kvar:* sklopka iskače, kvar-crveni indikator. *Popravka:* test dugme se utisne, sklopka se vraća.
3. **Kabl** — Problem: prekinuta žica ili oštećena izolacija. Simptom: „mrtva“ utičnica, varničenje ili miris paljevine iz zida. Šta Jovan radi: locira prekid, spaja deonicu klemom i propisno je izoluje. *Kvar:* žica je puknuta, izolacija ogoljena, bakarne niti vire, između krajeva **treperi električni luk** (nazubljena polilinija) i **varnice šikljaju** (Sparks). *Popravka:* **izolir traka** se namotava oko spoja u 3–4 navoja (progresivni clip-path duž spoja, sa dijagonalnim prugama trake), luk i varnice prestaju, struja ponovo prolazi.
4. **Utičnica** — Problem: labav kontakt, pregoreli priključak. Simptom: utikač se greje, utičnica varniči ili ima tamnu mrlju. Šta Jovan radi: menja utičnicu, steže spojeve, proverava presek kabla za uređaj. *Kvar:* čađava mrlja i sitne varnice na rupicama. *Popravka:* stara utičnica klizi napolje, nova ulazi sa svetlim odsjajem.
5. **Prekidač i sijalica** — Problem: loš kontakt u grlu ili prekidaču. Simptom: svetlo treperi ili se samo gasi. Šta Jovan radi: menja grlo ili prekidač, proverava spoj i vraća mirno svetlo. *Kvar:* sijalica **treperi** (Flicker, u granicama iz §4). *Popravka:* sijalica se upali mirno, toplo i punim sjajem, glow raste.

Brojač „01/05“ (JetBrains Mono) i pet tačaka napretka usklađenih sa aktivnim korakom; tačke su klikabilne (skrol na korak). Završni takt: struja prolazi celim kolom, sve komponente svetle, sijalica gori, tekst **„Spojeno. Bez varnica.“**

Desktop: kolo zauzima ~60% širine, kartica desno. Mobilni: kolo vertikalno (komponente jedna ispod druge, struja teče nadole), kartica ispod crteža, pin kraći; kartica, crtež i brojač se ne preklapaju niti seku ni na 360×640. Reduced-motion: statični prikaz svih pet koraka sa spojenim kolom. Ispravno podrži skrol napred, nazad i promenu veličine usred sekcije.

### 6.6 — Usluge

Asimetrična bento mreža sa šest usluga:

- Hitne intervencije 0–24.
- Zamena razvodne table i osigurača.
- Nove instalacije i adaptacije.
- Rasveta, prekidači i utičnice.
- Priključenje uređaja (bojler, šporet, klima).
- Pronalaženje kvarova i merenja.

Namenske SVG ikone sa mikroanimacijom na hover-u (ručica osigurača se prebaci, sijalica se upali, utikač uđe u utičnicu, kazaljka merača se pomeri, kratka varnica), kratki prirodni opisi, postepeno otkrivanje kartica, blagi 3D tilt i lokalni spotlight koji prati kursor (fini pokazivač). Na touch uređajima sve je dostupno bez hover-a; tilt i praćenje kursora isključeni.

### 6.7 — „Kako radim“

Pinned horizontalno kretanje kroz četiri koraka: **Javite se → Dijagnoza → Popravka → Garancija**, povezanih kablom koji se energizuje prema napretku (CurrentPath), sa kratkim objašnjenjem svakog koraka (u dijagnozi: merenje i dogovor pre početka rada; u popravci: rad sa isključenom strujom i čisto radno mesto; u garanciji: proba pod opterećenjem).

Desktop obavezno horizontalno. Ispod 768px pretvori u vertikalnu priču sa istim koracima i istim punjenjem, bez gubitka sadržaja. Reduced-motion: običan statični tok.

### 6.8 — „Pre / posle“

Uporedni klizač sa dve autorske SVG ilustracije istog prizora: **stara razvodna tabla** (keramički osigurači, zamršene žice, čađ) i **nova tabla** (automatski osigurači u redu, FID sklopka, obeležena kola, uredno vezane žice). Povlačenje mišem i dodirom, tastatura (strelice), `role="slider"` sa `aria-valuenow`, vidljiv fokus; podela prikaza i drška ostaju sinhronizovane. Nemoj ih prikazivati kao fotografije stvarno izvedenog posla.

### 6.9 — „Utisci“

Dva reda kartica u suprotnim smerovima (ime, naselje, tekst, pet zvezdica) iz konfiguracije; pauza na hover-u i pri fokusu; duplikati za petlju `aria-hidden`; diskretna dostupna kontrola pauza/pokreni; statične kartice u reduced-motion. Sačuvaj demo oznaku.

### 6.10 — „Pitanja“

Animirana, pristupačna harmonika sa šest pitanja: izlazak na teren, vikendi i praznici, garancija, plaćanje, koliko traje popravka, i **„Šta da radim dok čekam?“** (bezbedno: ako oseti miris paljevine ili vidi varnice, isključi glavni osigurač i ne dira instalaciju). Odgovori kratki i korisni. Bez izmišljenih cenovnika, atesta, sertifikata ili konkretnih garantnih rokova. Ispravne veze dugme–panel, fokus, stanje otvoreno/zatvoreno.

### 6.11 — Finale / kontakt

Glavni vod ulazi u sekciju i spaja se sa zidnim prekidačem; iznad visi sijalica na kratkom kablu. Pri ulasku, kao jedna usklađena scena:

1. Struja stigne do prekidača (poslednji deo kabla se energizuje).
2. Prekidač se prebaci (kratka rotacija, „klik“ odsjaj).
3. Vlakno sijalice se zažari — dva kratka trzaja pa puno, toplo svetlo (Flicker).
4. Iz sijalice se nadole širi svetlosni konus (samo `opacity`), a **u tom svetlu se pojavljuje staklasta kontakt-kartica**: otkrivanje odozgo nadole (clip-path) uz blagi uspon sa overshoot-om i jedan prelaz odsjaja preko stakla.

Animacija se ponavlja pri ponovnom ulasku nakon potpunog izlaska iz sekcije (prekidač nazad, svetlo se gasi tek po izlasku), bez preklapanja timeline-ova, bez skrivanja sadržaja u kojem je fokus i bez dupliranja listenera. Reduced-motion: svetlo upaljeno, kartica vidljiva odmah.

Sadržaj kartice:

- **„Hajde da upalimo svetlo.“**
- Veliki email **stefanbrkk@gmail.com** iz konfiguracije kao pravi `mailto:` link sa `?subject=Upit%20sa%20sajta`.
- Dugme **„Kopiraj“** (Clipboard API + fallback); posle uspešnog kopiranja pristupačno obaveštenje **„Kopirano ✓“** (`aria-live`) i kratak rafal varnica (Sparks) koji ne blokira klikove. „Kopirano ✓“ se ne prikazuje dok kopiranje nije uspelo; kod odbijene dozvole omogući ručno kopiranje uz jasnu poruku.
- Radno vreme iz konfiguracije.
- Dugme za poziv samo ako je telefon unet.

Email se na 360px prelama (`overflow-wrap: anywhere`) i nikad ne izlazi iz kartice. Bez nefunkcionalnog obrasca.

### 6.12 — Footer

Minimalan: naziv iz konfiguracije, © tekuća godina, dugme za povratak na vrh (poštuje reduced-motion, radi sa Lenis-om).

## 7. Mobilni prioritet, pristupačnost, SEO i performanse

**Telefon je prvoklasan, ne izvedeno stanje:**

- Ciljni viewporti: 360×640 (kratak, obavezan), 390×844, 768×1024, 1440×900.
- Touch: bez kursora, tilt-a, spotlight-a, parallax-a i Lenis-a; sve dostupno tapom. Dodirne mete ≥44px, sticky navigacija ≤64px visine.
- Pinovi kraći (anatomija najviše ~300vh skrol distance na mobilnom); horizontalna priča postaje vertikalna; unutar pina sadržaj koraka (crtež + kartica + brojač) mora stati bez unutrašnjeg skrola na 360×640.
- Dekorativni efekti smanjeni: SVG turbulencija samo na ≥1024px, backdrop-blur samo na malim površinama, prepolovljen broj čestica, petlje van ekrana pauzirane, nema stalne petlje po elementu.
- Visine preko `dvh`/`svh`, iOS safe-area insets, pasivni listeneri, bez 100vh skokova.
- Naslov stanje u najviše dva reda na 360px; email se prelama; bez horizontalnog overflow-a (ne skrivaj ga `overflow-x: hidden` na body-ju umesto popravke širina).

**Pristupačnost:** `lang="sr-Latn"`, semantički landmark-ovi, jedan H1, logičan redosled naslova, link za preskakanje navigacije, vidljiv fokus (luk boja), kontrast najmanje AA, dekorativni SVG `aria-hidden`, funkcionalni elementi sa oznakama, Escape i zadržavanje fokusa u meniju, SplitText sa `aria-label` na roditelju.

**SEO (obavezno u isporučenom HTML-u, ne samo posle JavaScript-a — reši malim build-time postupkom):** naslov **„Električar Jovan | Beograd“** iz konfiguracije, meta opis ≤155 znakova, canonical, Open Graph i Twitter tagovi sa `og:image` (`public/og.png` 1200×630, generisan skriptom `og:build` koja renderuje brendirani `og.html` Playwright-om) i `twitter:card: summary_large_image`, `theme-color #0A0B10`, SVG favicon sa munjom + apple-touch-icon, `robots.txt`, `sitemap.xml`. JSON-LD `@type: "Electrician"` iz konfiguracije: prazan telefon i prazan `siteUrl` se izostavljaju, bez `aggregateRating` iz demo utisaka, bez izmišljene adrese. Hero tekst i metapodaci moraju postojati u `dist/index.html`.

**Performanse:** teške sekcije inicijalizuj blizu viewporta sa rezervisanom visinom (CLS < 0,05), bez pomeranja od fontova i loadera. Cilj Lighthouse mobile na produkcionom build-u: Performance ≥85, Accessibility ≥95, Best Practices ≥95, SEO 100. Izmeri, popravi konkretna uska grla, navedi stvaran rezultat i uslove. Ne izmišljaj ocenu.

## 8. Vercel

Statičan Vite frontend, bez servera i tajnih ključeva.

- Skripte iz faze 1; jedan package manager (npm) sa lockfile-om.
- Framework preset Vite, build `npm run build`, output `dist`. `vercel.json` samo za immutable cache zaglavlja na `/assets/*`; bez rewrite pravila (jedna stranica sa sidrima).
- Proveri produkcioni build: `vite preview`, učitavanje resursa, direktno otvaranje, refresh, sidreni linkovi.
- Ako `vercel whoami` prolazi: `vercel deploy --yes` (preview) → provera → `vercel deploy --prod --yes`. Zatim upiši produkcioni domen u `siteUrl`, regeneriši OG/sitemap/canonical i objavi još jednom. Predlog imena projekta: `jovan-elektro`.
- Ako nema prijave: završi lokalni projekat i provere, pa navedi jedini korak potreban za objavu. Ne tvrdi da je sajt objavljen ako nije.
- README: pokretanje, build, objava, mesto za promenu poslovnih podataka (`src/config/site.ts`) i kako se sajt pretvara u drugi zanat (naziv, boje, tekstovi).

## 9. Kapije i kriterijumi završetka

Svaka kapija prolazi samo uz dokaz (kratak rezime rezultata + putanje screenshot-ova u `test-results/shots/`). Nedostupna provera ostaje označena kao neizvršena, nikad kao prolazna.

- **G1 Statika:** `typecheck`, `lint`, `build` → 0 grešaka, 0 upozorenja.
- **G2 E2E** (sva 4 viewporta, nad `vite preview`): nula console grešaka i upozorenja; `scrollWidth ≤ innerWidth`; svih 12 sekcija prisutno u redosledu; sidra iz navigacije i oba hero dugmeta vode na pravu sekciju; mobilni meni se otvara, zatvara Escape-om i zadržava fokus; skip link radi; `mailto:` tačan; „Kopiraj“ upisuje u clipboard i prikazuje toast; harmonika i klizač rade tastaturom; kontrola pauze trake radi; nema dugmeta za poziv dok je telefon prazan; nema `tel:` linkova.
- **G3 Motion:** screenshot-ovi anatomije na 0/20/40/60/80/100% napretka se razlikuju i prikazuju očekivani korak; na koraku 3 screenshot u taktu kvara sadrži luk i varnice, a u taktu popravke traku bez varnica; korak 5 završava upaljenom sijalicom; `stroke-dashoffset` glavnog voda opada sa skrolom; finale posle ulaska ima upaljenu sijalicu i vidljivu karticu u završnom položaju; ponovni ulazak ponavlja scenu bez duplih elemenata; sa `reducedMotion: 'reduce'` sav sadržaj je vidljiv, nema `.pin-spacer`, nema loadera, nema treperenja.
- **G4 Lighthouse** (mobile, nad `vite preview`, Chrome iz Playwright-a preko `CHROME_PATH`): pragovi iz §7. Ako alat neće da radi posle dva pokušaja, zapiši zašto i idi dalje.
- **G5 Revizija:** `reviewer` prijavljuje 0 critical i 0 major.
- **G6 Živo:** produkcioni URL vraća 200; `dist`/živi HTML sadrži hero H1, meta opis, OG tagove i JSON-LD; `og:image` vraća 200; nula console grešaka na 390 i 1440.

Standard završetka: kompletan sajt bez poznatih nerešenih grešaka u zahtevanom opsegu, potkrepljen stvarnim proverama. Bez skeleton-a, TODO-a, praznih sekcija, neaktivnih dugmadi, obećanih animacija ili plana za kasnije.
