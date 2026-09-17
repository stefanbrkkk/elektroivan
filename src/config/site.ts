// Single source of truth for all business data and visible copy.
// Serbian (Latin script, ekavica) text lives only here; components read from `site`.

export interface NavLink {
  label: string;
  href: `#${string}`;
}

export interface Stat {
  value: number;
  suffix?: string;
  label: string;
} // DEMO

export interface AnatomyStep {
  id: 'breaker' | 'rcd' | 'cable' | 'socket' | 'lamp';
  name: string;
  problem: string;
  symptom: string;
  fix: string;
}

export interface Service {
  id: 'emergency' | 'panel' | 'wiring' | 'lighting' | 'appliances' | 'diagnostics';
  title: string;
  description: string;
  size: 'lg' | 'md' | 'sm';
}

export interface ProcessStep {
  title: string;
  description: string;
}

export interface Testimonial {
  name: string;
  area: string;
  text: string;
  rating: 5;
} // DEMO

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SiteConfig {
  name: string;
  wordmark: string;
  trade: string;
  city: string;
  email: string;
  phone: string;
  hours: string;
  siteUrl: string;
  seo: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    locale: 'sr_RS';
  };
  nav: {
    links: NavLink[];
    cta: string;
    menuOpen: string;
    menuClose: string;
    skipLink: string;
  };
  hero: {
    words: [string, string, string];
    tagline: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    scrollHint: string;
  };
  trust: {
    eyebrow: string;
    stats: Stat[];
    marquee: string[];
    demoNote: string;
  };
  anatomy: {
    eyebrow: string;
    title: string;
    intro: string;
    labels: { problem: string; symptom: string; fix: string };
    steps: AnatomyStep[];
    finalText: string;
  };
  services: {
    eyebrow: string;
    title: string;
    intro: string;
    items: Service[];
  };
  process: {
    eyebrow: string;
    title: string;
    steps: ProcessStep[];
  };
  beforeAfter: {
    eyebrow: string;
    title: string;
    intro: string;
    beforeLabel: string;
    afterLabel: string;
    sliderLabel: string;
    demoNote: string;
  };
  testimonials: {
    eyebrow: string;
    title: string;
    items: Testimonial[];
    demoNote: string;
    pause: string;
    play: string;
    ratingLabel: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    items: FaqItem[];
  };
  contact: {
    eyebrow: string;
    title: string;
    lead: string;
    emailLabel: string;
    copy: string;
    copied: string;
    copyFailed: string;
    hoursLabel: string;
    call: string;
    subject: string;
  };
  footer: {
    backToTop: string;
    rights: string;
  };
  ui: {
    demoBadge: string;
    loaderLabel: string;
    menuLabel: string;
  };
}

export const site = {
  name: 'Električar Jovan',
  wordmark: 'Jovan',
  trade: 'električar',
  city: 'Beograd',
  email: 'stefanbrkk@gmail.com',
  phone: '',
  hours: 'Pon–Sub 07–20, hitni pozivi 0–24',
  siteUrl: '',

  seo: {
    title: 'Električar Jovan | Beograd',
    description:
      'Električar Jovan — hitne intervencije, razvodne table, instalacije i rasveta u Beogradu. Brz dolazak, uredan rad, garancija.',
    ogTitle: 'Električar Jovan — struja se vraća, kvar po kvar',
    ogDescription:
      'Hitne intervencije, razvodne table, instalacije i rasveta. Pouzdan električar u Beogradu, dostupan i za hitne pozive.',
    locale: 'sr_RS',
  },

  nav: {
    links: [
      { label: 'Usluge', href: '#usluge' },
      { label: 'Anatomija', href: '#anatomija' },
      { label: 'Kako radim', href: '#kako-radim' },
      { label: 'Pre/posle', href: '#pre-posle' },
      { label: 'Utisci', href: '#utisci' },
      { label: 'Pitanja', href: '#pitanja' },
    ],
    cta: 'Pošalji upit',
    menuOpen: 'Otvori meni',
    menuClose: 'Zatvori meni',
    skipLink: 'Preskoči na sadržaj',
  },

  hero: {
    words: ['Iskače?', 'Treperi?', 'Varniči?'],
    tagline: 'Jovan rešava.',
    subtitle:
      'Brz dolazak, uredna instalacija i garancija na svaku intervenciju — od pregorelog osigurača do kompletne adaptacije.',
    ctaPrimary: 'Pošalji upit',
    ctaSecondary: 'Pogledaj usluge',
    scrollHint: 'Prati struju',
  },

  trust: {
    eyebrow: 'Poverenje',
    stats: [
      { value: 8, suffix: '+', label: 'godina iskustva' },
      { value: 640, suffix: '+', label: 'rešenih intervencija' },
      { value: 35, suffix: ' min', label: 'prosečan dolazak' },
    ], // DEMO
    marquee: [
      'Hitne intervencije',
      'Razvodne table',
      'Nove instalacije',
      'Rasveta',
      'Prekidači i utičnice',
      'Priključenje uređaja',
      'Dijagnostika kvarova',
      'Adaptacije stanova',
      'Osigurači i sklopke',
    ],
    demoNote: 'Demo podaci radi prikaza',
  },

  anatomy: {
    eyebrow: 'Anatomija kvara',
    title: 'Svaki kvar ima uzrok. Jovan ga nalazi.',
    intro:
      'Pet najčešćih mesta gde instalacija otkazuje — i tačno šta se radi da svetlo ponovo gori.',
    labels: {
      problem: 'Problem',
      symptom: 'Simptom',
      fix: 'Šta Jovan radi',
    },
    steps: [
      {
        id: 'breaker',
        name: 'Automatski osigurač',
        problem: 'Preopterećeno kolo ili kratak spoj.',
        symptom: 'Struja nestane čim uključite više uređaja.',
        fix: 'Meri opterećenje, nalazi uzrok, menja osigurač ili deli kolo.',
      },
      {
        id: 'rcd',
        name: 'FID sklopka',
        problem: 'Struja „curi” ka zemlji — oštećen uređaj, vlaga, stara instalacija.',
        symptom: 'Cela kuća u mraku, sklopka neće da se vrati.',
        fix: 'Isključuje kola jedno po jedno, nalazi krivca, otklanja kvar i testira sklopku.',
      },
      {
        id: 'cable',
        name: 'Kabl',
        problem: 'Prekinuta žica ili oštećena izolacija.',
        symptom: '„Mrtva” utičnica, varničenje ili miris paljevine iz zida.',
        fix: 'Locira prekid, spaja deonicu klemom i propisno je izoluje.',
      },
      {
        id: 'socket',
        name: 'Utičnica',
        problem: 'Labav kontakt, pregoreli priključak.',
        symptom: 'Utikač se greje, utičnica varniči ili ima tamnu mrlju.',
        fix: 'Menja utičnicu, steže spojeve, proverava presek kabla za uređaj.',
      },
      {
        id: 'lamp',
        name: 'Prekidač i sijalica',
        problem: 'Loš kontakt u grlu ili prekidaču.',
        symptom: 'Svetlo treperi ili se samo gasi.',
        fix: 'Menja grlo ili prekidač, proverava spoj i vraća mirno svetlo.',
      },
    ],
    finalText: 'Spojeno. Bez varnica.',
  },

  services: {
    eyebrow: 'Usluge',
    title: 'Sve što instalaciji treba, na jednom mestu.',
    intro: 'Od hitne intervencije do kompletne adaptacije — jasan posao, bez iznenađenja.',
    items: [
      {
        id: 'emergency',
        title: 'Hitne intervencije 0–24',
        description: 'Nestalo svetlo, iskočio osigurač ili varniči negde u kući — Jovan dolazi i van radnog vremena.',
        size: 'lg',
      },
      {
        id: 'panel',
        title: 'Zamena razvodne table i osigurača',
        description: 'Stara tabla sa keramičkim osiguračima zamenjuje se preglednom, savremenom i bezbednom.',
        size: 'md',
      },
      {
        id: 'wiring',
        title: 'Nove instalacije i adaptacije',
        description: 'Kompletno ožičenje za novogradnju ili adaptaciju, po važećim standardima.',
        size: 'md',
      },
      {
        id: 'lighting',
        title: 'Rasveta, prekidači i utičnice',
        description: 'Ugradnja i zamena rasvetnih tela, prekidača i utičnica, unutra i napolju.',
        size: 'sm',
      },
      {
        id: 'appliances',
        title: 'Priključenje uređaja',
        description: 'Bojler, šporet, klima — bezbedno priključenje i provera opterećenja kola.',
        size: 'sm',
      },
      {
        id: 'diagnostics',
        title: 'Pronalaženje kvarova i merenja',
        description: 'Merenje instalacije i lociranje skrivenih kvarova pre nego što postanu ozbiljan problem.',
        size: 'md',
      },
    ],
  },

  process: {
    eyebrow: 'Kako radim',
    title: 'Četiri koraka do rešenog kvara.',
    steps: [
      {
        title: 'Javite se',
        description: 'Pišete ili pozovete — kratak opis problema i dogovor oko termina.',
      },
      {
        title: 'Dijagnoza',
        description: 'Merenje na licu mesta i dogovor oko obima posla pre nego što se bilo šta uradi.',
      },
      {
        title: 'Popravka',
        description: 'Rad sa isključenom strujom, uredno radno mesto i pažljivo vraćanje svega na svoje mesto.',
      },
      {
        title: 'Garancija',
        description: 'Proba pod opterećenjem pre odlaska i garancija na obavljen posao.',
      },
    ],
  },

  beforeAfter: {
    eyebrow: 'Pre / posle',
    title: 'Ista razvodna tabla, druga priča.',
    intro: 'Prevucite klizač i uporedite staru instalaciju sa uređenom, obeleženom i bezbednom razvodnom tablom.',
    beforeLabel: 'Pre',
    afterLabel: 'Posle',
    sliderLabel: 'Uporedi staru i novu razvodnu tablu',
    demoNote: 'Ilustracija radi prikaza, ne fotografija stvarnog posla',
  },

  testimonials: {
    eyebrow: 'Utisci',
    title: 'Šta kažu komšije.',
    items: [
      {
        name: 'Milica J.',
        area: 'Vračar',
        text: 'Došao je isto veče kad je nestala struja u celom stanu. Za sat vremena je sve radilo.',
        rating: 5,
      },
      {
        name: 'Nenad P.',
        area: 'Zemun',
        text: 'Zamenio nam je celu razvodnu tablu, sve obeleženo i uredno. Konačno znamo koji je osigurač za šta.',
        rating: 5,
      },
      {
        name: 'Ana V.',
        area: 'Novi Beograd',
        text: 'Utičnica je počela da varniči, javili smo se ujutru, do podneva je sve bilo rešeno.',
        rating: 5,
      },
      {
        name: 'Marko S.',
        area: 'Zvezdara',
        text: 'Precizna dijagnoza, jasna cena unapred, bez naknadnih iznenađenja.',
        rating: 5,
      },
      {
        name: 'Jovana T.',
        area: 'Voždovac',
        text: 'Sijalice su nam treperele mesecima, drugi majstor nije uspeo da nađe uzrok. Jovan jeste.',
        rating: 5,
      },
      {
        name: 'Dragan M.',
        area: 'Banovo brdo',
        text: 'Uveo nam je instalaciju za klimu i bojler bez ikakvih problema. Preporučujem.',
        rating: 5,
      },
    ], // DEMO
    demoNote: 'Demo utisci radi prikaza',
    pause: 'Pauziraj traku',
    play: 'Pokreni traku',
    ratingLabel: 'od 5', // screen-reader suffix: "5 od 5"
  },

  faq: {
    eyebrow: 'Pitanja',
    title: 'Često postavljana pitanja.',
    items: [
      {
        question: 'Da li dolazite van Beograda?',
        answer: 'Izlazak na teren dogovaramo pojedinačno, u zavisnosti od lokacije i obima posla.',
      },
      {
        question: 'Radite li vikendom i praznikom?',
        answer: 'Za hitne slučajeve da, radim i vikendom i praznikom. Redovan termin je lakše dogovoriti radnim danima.',
      },
      {
        question: 'Da li dajete garanciju na izveden posao?',
        answer: 'Da, svaka intervencija se testira pod opterećenjem pre nego što se posao smatra završenim.',
      },
      {
        question: 'Kako se plaća?',
        answer: 'Cena se dogovara unapred, na osnovu obima posla utvrđenog na licu mesta.',
      },
      {
        question: 'Koliko traje popravka?',
        answer: 'Manje intervencije traju sat do dva, veći poduhvati poput zamene table dogovaramo unapred.',
      },
      {
        question: 'Šta da radim dok čekam?',
        answer: 'Ako osetite miris paljevine ili vidite varnice, isključite glavni osigurač i ne dirajte instalaciju do dolaska.',
      },
    ],
  },

  contact: {
    eyebrow: 'Kontakt',
    title: 'Hajde da upalimo svetlo.',
    lead: 'Pišite direktno na mejl — odgovaram brzo i dogovaramo termin.',
    emailLabel: 'Mejl',
    copy: 'Kopiraj',
    copied: 'Kopirano ✓',
    copyFailed: 'Kopiranje nije uspelo, mejl selektujte ručno.',
    hoursLabel: 'Radno vreme',
    call: 'Pozovi',
    subject: 'Upit sa sajta',
  },

  footer: {
    backToTop: 'Nazad na vrh',
    rights: 'Sva prava zadržana.',
  },

  ui: {
    demoBadge: 'demo',
    loaderLabel: 'Učitavanje',
    menuLabel: 'Meni',
  },
} satisfies SiteConfig;

export const mailtoHref = `mailto:${site.email}?subject=${encodeURIComponent(site.contact.subject)}`;
