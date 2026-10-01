import type { Locale } from "./messages";

/**
 * The privacy statement and the terms, for the website and the iOS app alike.
 * The app links to these pages, and the stores take their URLs: the privacy
 * policy URL, the account deletion URL (`/privacy#delete-account`) and the
 * EULA. Section ids are shared across locales, so an anchor works in both.
 *
 * Inline links use `[text](href)`.
 */

export const LEGAL_ENTITY = {
  name: "Rob van Baaren",
  kvk: "57288135",
  address: "Zilverschoon, 7577 CB Oldenzaal",
  email: "support@brag.fast",
} as const;

/** The section the stores and the app link to for account deletion. */
export const DELETE_ACCOUNT_ID = "delete-account";

export type LegalDocKey = "privacy" | "terms";

export type LegalBlock =
  | string
  | { h3: string }
  | { list: readonly string[] }
  | { defs: readonly (readonly [term: string, body: string])[] };

export type LegalSection = {
  id: string;
  title: string;
  blocks: readonly LegalBlock[];
};

export type LegalDoc = {
  title: string;
  metaDescription: string;
  lead: string;
  updated: string;
  summaryTitle: string;
  summary: readonly string[];
  tocTitle: string;
  sections: readonly LegalSection[];
};

const MAIL = `[${LEGAL_ENTITY.email}](mailto:${LEGAL_ENTITY.email})`;
const ENTITY_NL = `${LEGAL_ENTITY.name}, ingeschreven bij de KvK onder nummer ${LEGAL_ENTITY.kvk}, ${LEGAL_ENTITY.address}`;
const ENTITY_EN = `${LEGAL_ENTITY.name}, registered with the Dutch Chamber of Commerce (KvK) under number ${LEGAL_ENTITY.kvk}, ${LEGAL_ENTITY.address}, the Netherlands`;

const PRIVACY_NL: LegalDoc = {
  title: "Privacy",
  metaDescription:
    "Welke gegevens brag.fast op de website en in de app bewaart, waarom, en hoe je je account of foto's verwijdert.",
  lead: "Wat brag.fast van je bewaart, waarom, en hoe je het weer weghaalt. Voor de website en de app.",
  updated: "Bijgewerkt op 1 oktober 2026",
  summaryTitle: "In het kort",
  summary: [
    "Kijken kan zonder account. Dan bewaren we niets over jou.",
    "Met een account bewaren we je e-mailadres, je gebruikersnaam en wat je plaatst: foto's, plekken en likes.",
    "Je gebruikersnaam en je foto's zijn openbaar. Je e-mailadres nooit.",
    "Geen advertenties, geen trackers, geen analytics. We verkopen niets door.",
    "Je verwijdert je account in de app, of met één mail.",
  ],
  tocTitle: "Op deze pagina",
  sections: [
    {
      id: "who",
      title: "Wie we zijn",
      blocks: [
        `brag.fast is een dienst van ${ENTITY_NL}. Wij zijn verantwoordelijk voor je gegevens op de website brag.fast en in de brag.fast-app voor iPhone.`,
        `Vragen over je gegevens? Mail ${MAIL}.`,
      ],
    },
    {
      id: "data",
      title: "Welke gegevens we gebruiken",
      blocks: [
        { h3: "Je account" },
        "Maak je een account, dan bewaren we je e-mailadres, je gebruikersnaam en je wachtwoord. Het wachtwoord slaan we alleen versleuteld op; wij kunnen het niet lezen. Log je in met Google of Apple, dan krijgen we van hen je e-mailadres en, als je dat deelt, je naam en profielfoto. Die naam en foto tonen we nergens. Kies je bij Apple voor ‘Verberg mijn e-mailadres’, dan zien wij alleen een doorstuuradres.",
        "Waarom: zonder deze gegevens werkt je account niet (uitvoering van de overeenkomst).",
        { h3: "Wat je plaatst" },
        "Je foto's, de plek waar ze bij horen en wanneer je ze plaatste. Plaats je de eerste foto van een plek, dan staat jouw gebruikersnaam erbij als ontdekker. Voor een foto naar ons komt, verkleint de app hem en verdwijnt de metadata, zoals de GPS-locatie en het cameramerk.",
        "Waarom: dit is waar brag.fast om draait (uitvoering van de overeenkomst).",
        "We bekijken nieuwe foto's regelmatig op dingen die niet mogen, met hulp van AI. Daarvoor gaan de foto's, die toch al openbaar zijn, langs Anthropic.",
        { h3: "Likes" },
        "Welke plekken je liket, en via welke foto. Daarmee zetten we de plekken op volgorde en tellen we de leaderboard. Wie wat liket, tonen we niet; alleen de totalen zijn openbaar.",
        { h3: "Je locatie (alleen in de app)" },
        "Alleen als je de app toestemming geeft. Zoek je een plek, dan stuurt de app je locatie mee, zodat plekken in de buurt (binnen zo'n 25 km) bovenaan staan. We slaan je locatie niet op en zetten hem nooit op een foto. Zonder toestemming werkt zoeken ook, alleen zonder plekken in de buurt bovenaan.",
        "Waarom: je hebt er toestemming voor gegeven. Die trek je in wanneer je wilt, in de instellingen van je iPhone.",
        { h3: "Zoeken naar plekken" },
        "Wat je in de app typt om een plek te vinden, sturen we door naar Google Places om de juiste zaak te vinden. Je zoekopdrachten bewaren we niet.",
        { h3: "Technische gegevens" },
        "Onze webserver houdt, zoals elke webserver, een logboek bij met je IP-adres, de pagina die je opvroeg en je browser. Bij een inlogsessie bewaren we je IP-adres en het type apparaat. Daarmee vinden we storingen en misbruik. Op de homepage gebruiken we je IP-adres om een stad in de buurt te laten zien; dat gebeurt op onze eigen server en we bewaren het niet.",
        "Waarom: een veilige dienst die werkt (gerechtvaardigd belang).",
        { h3: "Meldingen en blokkades" },
        "Meld je een foto, dan bewaren we wie meldde en waarom. Is de melding afgehandeld, dan halen we jouw naam eraf. Blokkeer je iemand in de app, dan onthouden we dat, zodat je hun foto's niet meer ziet. Wie je blokkeert, krijgt dat niet te zien.",
        "Waarom: een veilige dienst (gerechtvaardigd belang).",
        { h3: "Als je ons mailt" },
        "Dan gebruiken we je e-mailadres en je bericht om je te helpen.",
      ],
    },
    {
      id: "public",
      title: "Wat openbaar is",
      blocks: [
        "brag.fast draait om delen. Dit kan iedereen zien, ook zonder account:",
        {
          list: [
            "je gebruikersnaam en je profielpagina, met al je foto's, je stempels per woonplaats en hoeveel likes je binnenbrengt;",
            "je foto's, bij de plek en op het bord van de woonplaats;",
            "je gebruikersnaam als ontdekker bij plekken die je als eerste plaatste;",
            "je plek op de leaderboard.",
          ],
        },
        "Niet openbaar: je e-mailadres, je naam en profielfoto van Google of Apple, je wachtwoord en welke plekken je liket.",
        "Openbare pagina's kunnen in zoekmachines terechtkomen. Verwijder je een foto of je account, dan is die meteen van brag.fast af. Zoekmachines doen er soms even over om bij te werken.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies en opslag op je apparaat",
      blocks: [
        "De website zet alleen cookies die nodig zijn: één die je ingelogd houdt (alleen als je inlogt) en één die onthoudt welke taal je koos. Geen trackingcookies, dus ook geen cookiebanner.",
        "De app bewaart alleen je inlogsleutel, veilig in de iOS-sleutelhanger. Er zit geen analytics- of advertentiesoftware in de app, en de app volgt je niet in andere apps of op websites.",
      ],
    },
    {
      id: "sharing",
      title: "Met wie we gegevens delen",
      blocks: [
        "We verkopen je gegevens niet en delen ze niet voor advertenties. Wel werken we met een paar diensten die brag.fast laten draaien. Die krijgen alleen wat ze daarvoor nodig hebben:",
        {
          defs: [
            ["Convex", "Database en opslag van foto's. Servers in Ierland (EU)."],
            ["Hetzner", "De server van de website. Servers in Finland (EU)."],
            [
              "Google",
              "Zoeken naar plekken (Google Places): je zoekterm en, als je toestemming gaf, je locatie als middelpunt van de zoekopdracht. En inloggen met Google, als je daarvoor kiest.",
            ],
            ["Apple", "Inloggen met Apple, als je daarvoor kiest, en de App Store."],
            [
              "Expo",
              "Levert updates voor de app. Ziet je IP-adres, de versie van de app en een willekeurige installatiecode.",
            ],
            [
              "OpenStreetMap",
              "De kaarten op de website. Je browser haalt de kaart daar op, dus zij zien je IP-adres.",
            ],
            ["Resend", "Verstuurt e-mail van brag.fast, als we je die sturen."],
            ["Anthropic", "AI die ons helpt nieuwe foto's te controleren. Ziet de foto, niet wie hem plaatste."],
          ],
        },
        "Convex, Google, Apple, Expo, Resend en Anthropic zijn Amerikaanse bedrijven. Gaan gegevens naar de Verenigde Staten, dan gebeurt dat op basis van het EU-VS Data Privacy Framework of de standaardcontractbepalingen van de Europese Commissie.",
        "Verder geven we gegevens alleen af als de wet ons daartoe verplicht.",
      ],
    },
    {
      id: "retention",
      title: "Hoe lang we gegevens bewaren",
      blocks: [
        {
          list: [
            "Je account: tot je het verwijdert.",
            "Foto's en likes: tot je ze verwijdert, je like intrekt of je account verwijdert.",
            "Je locatie en je zoekopdrachten: niet bewaard.",
            "Logboeken van de webserver: 14 dagen.",
            "Inlogsessies: verlopen na een week zonder gebruik, en verdwijnen in elk geval met je account.",
            "Meldingen: met jouw naam tot ze afgehandeld zijn, daarna zonder.",
            "Blokkades: tot je ze opheft of je account verwijdert.",
            "Mails aan ons: zolang dat nodig is om je vraag af te handelen.",
          ],
        },
      ],
    },
    {
      id: DELETE_ACCOUNT_ID,
      title: "Je account of foto's verwijderen",
      blocks: [
        { h3: "In de app" },
        "Tik op het camerascherm op Account, kies Account verwijderen en bevestig. Je account is dan meteen en definitief weg.",
        { h3: "Zonder de app" },
        `Mail [${LEGAL_ENTITY.email}](mailto:${LEGAL_ENTITY.email}?subject=Account%20verwijderen) vanaf het e-mailadres van je account en noem je gebruikersnaam. Zo weten we dat het echt jouw account is. We verwijderen het binnen 30 dagen en laten je weten wanneer het gebeurd is.`,
        { h3: "Wat er weggaat" },
        {
          list: [
            "je account en je inloggegevens, ook de koppeling met Google of Apple;",
            "al je foto's, ook uit de opslag;",
            "al je likes (de volgorde op de borden past zich aan);",
            "je profielpagina en je plek op de leaderboard;",
            "je blokkades, en je naam bij meldingen die je deed.",
          ],
        },
        "Plekken die je als eerste toevoegde, blijven op brag.fast, zonder jouw naam. Een plek is een openbare zaak en geen persoonsgegeven. Was jouw foto de grote foto van een plek, dan neemt de oudste foto van iemand anders die plaats in.",
        { h3: "Eén foto verwijderen" },
        "Log in op brag.fast, ga naar de plek en tik bij je foto op Wissen. De rest van je account blijft staan.",
      ],
    },
    {
      id: "rights",
      title: "Je rechten",
      blocks: [
        `Je kunt ons vragen welke gegevens we van je hebben, en ze laten verbeteren of verwijderen. Je kunt de verwerking laten beperken, er bezwaar tegen maken, en je gegevens opvragen in een bestand dat je kunt meenemen. Mail ${MAIL}; we reageren binnen een maand.`,
        "Locatietoestemming trek je in via Instellingen › Privacy en beveiliging › Locatievoorzieningen › brag.fast.",
        "Ben je het niet eens met hoe we met je gegevens omgaan? Laat het ons eerst weten. Je kunt ook een klacht indienen bij de [Autoriteit Persoonsgegevens](https://autoriteitpersoonsgegevens.nl).",
      ],
    },
    {
      id: "security",
      title: "Beveiliging",
      blocks: [
        "Alle verbindingen zijn versleuteld (HTTPS) en wachtwoorden slaan we versleuteld op. Alleen de beheerder van brag.fast kan bij de gegevens. Raakt een datalek jou, dan laten we het je weten, en melden we het bij de Autoriteit Persoonsgegevens als de wet dat vraagt.",
      ],
    },
    {
      id: "age",
      title: "Leeftijd",
      blocks: ["Voor een account moet je 16 jaar of ouder zijn. Kijken kan iedereen."],
    },
    {
      id: "changes",
      title: "Wijzigingen",
      blocks: [
        "Passen we deze verklaring aan, dan zie je dat aan de datum bovenaan. Belangrijke wijzigingen melden we ook op de website of in de app.",
      ],
    },
  ],
};

const PRIVACY_EN: LegalDoc = {
  title: "Privacy",
  metaDescription:
    "What brag.fast stores on the website and in the app, why, and how to delete your account or photos.",
  lead: "What brag.fast keeps about you, why, and how to remove it. For the website and the app.",
  updated: "Updated 1 October 2026",
  summaryTitle: "The short version",
  summary: [
    "You can look around without an account. Then we keep nothing about you.",
    "With an account we keep your email address, your username and what you post: photos, spots and likes.",
    "Your username and photos are public. Your email address never is.",
    "No ads, no trackers, no analytics. We sell nothing on.",
    "You delete your account in the app, or with one email.",
  ],
  tocTitle: "On this page",
  sections: [
    {
      id: "who",
      title: "Who we are",
      blocks: [
        `brag.fast is run by ${ENTITY_EN}. We are responsible for your data on the brag.fast website and in the brag.fast iPhone app.`,
        `Questions about your data? Email ${MAIL}.`,
      ],
    },
    {
      id: "data",
      title: "What data we use",
      blocks: [
        { h3: "Your account" },
        "When you create an account, we keep your email address, your username and your password. The password is stored hashed only; we cannot read it. If you sign in with Google or Apple, they give us your email address and, if you share it, your name and profile picture. We never show that name or picture. If you choose ‘Hide My Email’ with Apple, we only see a relay address.",
        "Why: your account cannot work without it (performance of a contract).",
        { h3: "What you post" },
        "Your photos, the spot they belong to and when you posted them. If you post the first photo of a spot, your username shows as the one who found it. Before a photo reaches us, the app shrinks it and drops its metadata, such as the GPS location and the camera make.",
        "Why: this is what brag.fast is for (performance of a contract).",
        "We regularly check new photos for anything that breaks the rules, with help from AI. For that, the photos, which are public anyway, pass through Anthropic.",
        { h3: "Likes" },
        "Which spots you like, and through which photo. That is how we order the spots and count the leaderboard. We never show who liked what; only the totals are public.",
        { h3: "Your location (app only)" },
        "Only if you allow it. When you search for a spot, the app sends your location along so nearby spots (within about 25 km) come first. We do not store your location and never put it on a photo. Without permission, search still works, just without nearby spots first.",
        "Why: you gave permission. You can take it back at any time in your iPhone's settings.",
        { h3: "Searching for spots" },
        "What you type in the app to find a spot, we pass on to Google Places to find the right place. We do not store your searches.",
        { h3: "Technical data" },
        "Like any web server, ours keeps a log with your IP address, the page you asked for and your browser. With a signed-in session we keep your IP address and the type of device. We use this to find faults and abuse. On the homepage we use your IP address to show a nearby town; that happens on our own server and we do not store it.",
        "Why: a service that is safe and works (legitimate interest).",
        { h3: "Reports and blocks" },
        "When you report a photo, we keep who reported it and why. Once the report is handled, we remove your name from it. When you block someone in the app, we remember that so you no longer see their photos. The person you block is not told.",
        "Why: a safe service (legitimate interest).",
        { h3: "When you email us" },
        "We use your email address and your message to help you.",
      ],
    },
    {
      id: "public",
      title: "What is public",
      blocks: [
        "brag.fast is about sharing. Anyone can see this, even without an account:",
        {
          list: [
            "your username and your profile page, with all your photos, your stamps per town and how many likes you bring in;",
            "your photos, on the spot and on the town's board;",
            "your username as the finder of spots you posted first;",
            "your place on the leaderboard.",
          ],
        },
        "Not public: your email address, your name and picture from Google or Apple, your password and which spots you like.",
        "Public pages can end up in search engines. When you delete a photo or your account, it is gone from brag.fast at once. Search engines can take a while to catch up.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies and storage on your device",
      blocks: [
        "The website only sets cookies it needs: one that keeps you signed in (only when you sign in) and one that remembers the language you chose. No tracking cookies, so no cookie banner either.",
        "The app only keeps your sign-in key, safely in the iOS keychain. There is no analytics or advertising software in the app, and the app does not track you across other apps or websites.",
      ],
    },
    {
      id: "sharing",
      title: "Who we share data with",
      blocks: [
        "We do not sell your data and do not share it for advertising. We do use a few services that keep brag.fast running. They only get what they need for that:",
        {
          defs: [
            ["Convex", "Database and photo storage. Servers in Ireland (EU)."],
            ["Hetzner", "The website's server. Servers in Finland (EU)."],
            [
              "Google",
              "Searching for spots (Google Places): your search term and, if you gave permission, your location as the centre of the search. And Sign in with Google, if you choose it.",
            ],
            ["Apple", "Sign in with Apple, if you choose it, and the App Store."],
            [
              "Expo",
              "Delivers app updates. Sees your IP address, the app version and a random install code.",
            ],
            [
              "OpenStreetMap",
              "The maps on the website. Your browser loads the map from them, so they see your IP address.",
            ],
            ["Resend", "Sends email from brag.fast, when we send you any."],
            ["Anthropic", "AI that helps us check new photos. Sees the photo, not who posted it."],
          ],
        },
        "Convex, Google, Apple, Expo, Resend and Anthropic are US companies. When data goes to the United States, that happens under the EU-US Data Privacy Framework or the European Commission's standard contractual clauses.",
        "Beyond that, we only hand over data when the law requires it.",
      ],
    },
    {
      id: "retention",
      title: "How long we keep data",
      blocks: [
        {
          list: [
            "Your account: until you delete it.",
            "Photos and likes: until you delete them, undo the like or delete your account.",
            "Your location and your searches: not stored.",
            "Web server logs: 14 days.",
            "Sign-in sessions: expire after a week without use, and go with your account in any case.",
            "Reports: with your name until they are handled, without it after.",
            "Blocks: until you lift them or delete your account.",
            "Emails to us: as long as we need to handle your question.",
          ],
        },
      ],
    },
    {
      id: DELETE_ACCOUNT_ID,
      title: "Delete your account or photos",
      blocks: [
        { h3: "In the app" },
        "On the camera screen, tap Account, choose Delete account and confirm. Your account is gone at once, for good.",
        { h3: "Without the app" },
        `Email [${LEGAL_ENTITY.email}](mailto:${LEGAL_ENTITY.email}?subject=Delete%20my%20account) from the email address on your account and include your username. That way we know it is really your account. We delete it within 30 days and let you know when it is done.`,
        { h3: "What goes" },
        {
          list: [
            "your account and sign-in details, including the link to Google or Apple;",
            "all your photos, from storage too;",
            "all your likes (the order on the boards adjusts);",
            "your profile page and your place on the leaderboard;",
            "your blocks, and your name on reports you made.",
          ],
        },
        "Spots you added first stay on brag.fast, without your name. A spot is a public business, not personal data. If your photo was the big photo of a spot, the oldest photo by someone else takes its place.",
        { h3: "Delete one photo" },
        "Sign in on brag.fast, go to the spot and tap Delete on your photo. The rest of your account stays.",
      ],
    },
    {
      id: "rights",
      title: "Your rights",
      blocks: [
        `You can ask us what data we hold about you, and have it corrected or deleted. You can have its processing restricted, object to it, and ask for your data in a file you can take elsewhere. Email ${MAIL}; we reply within a month.`,
        "To take back location permission: Settings › Privacy & Security › Location Services › brag.fast.",
        "Unhappy with how we handle your data? Tell us first. You can also complain to the Dutch Data Protection Authority, the [Autoriteit Persoonsgegevens](https://autoriteitpersoonsgegevens.nl).",
      ],
    },
    {
      id: "security",
      title: "Security",
      blocks: [
        "All connections are encrypted (HTTPS) and passwords are stored hashed. Only the person who runs brag.fast can reach the data. If a data breach affects you, we tell you, and we report it to the Autoriteit Persoonsgegevens when the law requires it.",
      ],
    },
    {
      id: "age",
      title: "Age",
      blocks: ["You need to be 16 or older for an account. Anyone can look around."],
    },
    {
      id: "changes",
      title: "Changes",
      blocks: [
        "When we change this statement, the date at the top changes. We also announce important changes on the website or in the app.",
      ],
    },
  ],
};

const TERMS_NL: LegalDoc = {
  title: "Voorwaarden",
  metaDescription:
    "De afspraken voor brag.fast, op de website en in de app: wat je mag plaatsen, wat niet, en wat er met je foto's gebeurt.",
  lead: "De afspraken voor brag.fast, op de website en in de app.",
  updated: "Bijgewerkt op 1 oktober 2026",
  summaryTitle: "In het kort",
  summary: [
    "Plaats alleen je eigen foto's van ontbijt of brunch, bij de juiste plek.",
    "Je foto's blijven van jou. Wij mogen ze laten zien op brag.fast.",
    "Niets aanstootgevends, haatdragends of illegaals. Dat halen we weg, en je account kan eraf.",
    "Zie je iets dat niet mag? Tik op Meld; de foto is meteen weg tot wij gekeken hebben.",
    "Likes zijn niet te koop. Rommelen met likes kost je je account.",
    "brag.fast is gratis en komt zonder garanties.",
  ],
  tocTitle: "Op deze pagina",
  sections: [
    {
      id: "about",
      title: "Over deze voorwaarden",
      blocks: [
        `brag.fast is een dienst van ${ENTITY_NL}. Deze voorwaarden gelden voor de website brag.fast en de brag.fast-app. Met een account ga je ermee akkoord. Hoe we met je gegevens omgaan, lees je in de [privacyverklaring](/privacy).`,
      ],
    },
    {
      id: "account",
      title: "Je account",
      blocks: [
        {
          list: [
            "Je bent 16 jaar of ouder.",
            "Eén account per persoon, met een e-mailadres dat van jou is.",
            "Je wachtwoord houd je voor jezelf. Wat er via je account gebeurt, is jouw verantwoordelijkheid.",
            "Je gebruikersnaam is niet beledigend en doet zich niet voor als iemand anders of als een zaak. Anders mogen we hem aanpassen.",
          ],
        },
        `Je kunt je account altijd verwijderen, in de app of met een mail. Zie [Je account verwijderen](/privacy#${DELETE_ACCOUNT_ID}).`,
      ],
    },
    {
      id: "content",
      title: "Wat je plaatst",
      blocks: [
        "Een foto op brag.fast hoort bij een ontbijt- of brunchplek in Nederland. Plaats je een foto, dan sta je ervoor in dat:",
        {
          list: [
            "je de foto zelf maakte, of het recht hebt om hem te plaatsen;",
            "hij laat zien wat je at of dronk, en bij de juiste plek staat;",
            "mensen die herkenbaar in beeld zijn dat goedvinden;",
            "hij niet tegen de wet ingaat of tegen de rechten van een ander.",
          ],
        },
      ],
    },
    {
      id: "rules",
      title: "Wat niet mag",
      blocks: [
        "Voor aanstootgevende content en misbruik hebben we nultolerantie. Dit mag niet:",
        {
          list: [
            "naakt, seksuele content of geweld;",
            "haat, discriminatie, bedreiging of intimidatie;",
            "illegale content, of content die aanzet tot iets illegaals;",
            "spam, reclame of foto's die niets met de plek te maken hebben;",
            "foto's van iemand anders zonder toestemming, of andermans werk;",
            "likes kopen, ruilen of met meerdere accounts geven;",
            "bots, scrapers of andere manieren om brag.fast te overbelasten of te misbruiken.",
          ],
        },
        "We bekijken nieuwe foto's regelmatig. Breek je deze regels, dan halen we de content weg en kunnen we je account zonder waarschuwing blokkeren of verwijderen.",
      ],
    },
    {
      id: "license",
      title: "Je foto's blijven van jou",
      blocks: [
        "Je blijft eigenaar van je foto's. Door een foto te plaatsen geef je ons toestemming om hem op te slaan, te verkleinen of bij te snijden, en te laten zien op de website en in de app. Ook mogen we hem gebruiken om brag.fast te laten zien, bijvoorbeeld op sociale media, met je gebruikersnaam erbij waar dat kan. Die toestemming is niet exclusief, kost niets en geldt wereldwijd.",
        "Verwijder je een foto, dan stopt de toestemming. Wat we al gedeeld hebben, halen we weg waar dat kan.",
      ],
    },
    {
      id: "report",
      title: "Melden en blokkeren",
      blocks: [
        "Zie je een foto die niet mag, of staat hij bij de verkeerde plek? Tik bij de foto op Meld, op de website of in de app. De foto verdwijnt meteen tot wij hem bekeken hebben, binnen 24 uur. Mag hij niet, dan halen we hem weg. Wie zoiets plaatst, kan het account kwijtraken.",
        "In de app kun je ook iemand blokkeren. Dan zie je diens foto's niet meer, en krijgen wij een seintje om mee te kijken.",
        `Liever mailen? Dat kan via [${LEGAL_ENTITY.email}](mailto:${LEGAL_ENTITY.email}?subject=Melding), met de link naar de plek of de foto.`,
        "Heb je een zaak op brag.fast en klopt er iets niet, zoals het adres of dat je dicht bent? Mail ons. Foto's van bezoekers halen we alleen weg als ze tegen deze regels ingaan.",
      ],
    },
    {
      id: "spots",
      title: "Plekken, likes en de volgorde",
      blocks: [
        "Een plek komt op brag.fast doordat een bezoeker er een foto plaatst. De naam, het adres en de ligging halen we uit Google Places. We doen ons best, maar kunnen niet beloven dat alles klopt.",
        "De volgorde op een bord hangt alleen af van likes: één like per persoon per plek, de meeste likes bovenaan. Een betere plek kun je niet kopen. De volgorde is de mening van bezoekers, niet die van ons.",
        "Plekken die je toevoegde, blijven op brag.fast, ook als je je account verwijdert.",
      ],
    },
    {
      id: "ours",
      title: "Wat van ons is",
      blocks: [
        "De naam brag.fast, het logo, het ontwerp en de software zijn van ons. Je mag brag.fast gebruiken zoals het bedoeld is, maar niet kopiëren of namaken.",
      ],
    },
    {
      id: "ending",
      title: "Stoppen en blokkeren",
      blocks: [
        "Je kunt altijd stoppen door je account te verwijderen. Wij kunnen content weghalen of een account blokkeren als je deze voorwaarden breekt, of als dat nodig is om brag.fast of anderen te beschermen. We kunnen brag.fast ook veranderen of ermee stoppen. Stoppen we, dan laten we dat vooraf weten.",
      ],
    },
    {
      id: "liability",
      title: "Garantie en aansprakelijkheid",
      blocks: [
        "brag.fast is gratis en we leveren het zoals het is. We doen ons best om het goed te laten werken, maar beloven niet dat het altijd beschikbaar of foutloos is, of dat de informatie over plekken klopt.",
        "Voor zover de wet dat toestaat, zijn we niet aansprakelijk voor schade door het gebruik van brag.fast, behalve bij opzet of grove nalatigheid. Je rechten als consument blijven altijd gelden.",
      ],
    },
    {
      id: "app-store",
      title: "De app uit de App Store",
      blocks: [
        "Deze voorwaarden zijn een afspraak tussen jou en ons, niet met Apple. Wij zijn verantwoordelijk voor de app en voor ondersteuning, niet Apple. Apple en haar dochterondernemingen mogen deze voorwaarden als derde handhaven waar het de app betreft. Daarnaast gelden de gebruiksregels van de App Store.",
      ],
    },
    {
      id: "changes",
      title: "Wijzigingen",
      blocks: [
        "We kunnen deze voorwaarden aanpassen. Belangrijke wijzigingen laten we vooraf weten, op de website of in de app. Gebruik je brag.fast daarna, dan gelden de nieuwe voorwaarden.",
      ],
    },
    {
      id: "law",
      title: "Recht en contact",
      blocks: [
        "Op deze voorwaarden is Nederlands recht van toepassing. Een geschil leggen we voor aan de bevoegde rechter in Nederland.",
        `Vragen? Mail ${MAIL}.`,
      ],
    },
  ],
};

const TERMS_EN: LegalDoc = {
  title: "Terms",
  metaDescription:
    "The terms for brag.fast, on the website and in the app: what you can post, what you can't, and what happens to your photos.",
  lead: "The terms for brag.fast, on the website and in the app.",
  updated: "Updated 1 October 2026",
  summaryTitle: "The short version",
  summary: [
    "Only post your own photos of breakfast or brunch, on the right spot.",
    "Your photos stay yours. We may show them on brag.fast.",
    "Nothing offensive, hateful or illegal. We take it down, and your account can go.",
    "See something that breaks the rules? Tap Report; the photo is gone until we have looked.",
    "Likes are not for sale. Mess with likes and you lose your account.",
    "brag.fast is free and comes without guarantees.",
  ],
  tocTitle: "On this page",
  sections: [
    {
      id: "about",
      title: "About these terms",
      blocks: [
        `brag.fast is run by ${ENTITY_EN}. These terms apply to the brag.fast website and the brag.fast app. By creating an account you agree to them. How we handle your data is in the [privacy statement](/privacy).`,
      ],
    },
    {
      id: "account",
      title: "Your account",
      blocks: [
        {
          list: [
            "You are 16 or older.",
            "One account per person, with an email address that is yours.",
            "You keep your password to yourself. What happens through your account is your responsibility.",
            "Your username is not offensive and does not pose as someone else or as a business. Otherwise we may change it.",
          ],
        },
        `You can always delete your account, in the app or with an email. See [Delete your account](/privacy#${DELETE_ACCOUNT_ID}).`,
      ],
    },
    {
      id: "content",
      title: "What you post",
      blocks: [
        "A photo on brag.fast belongs to a breakfast or brunch spot in the Netherlands. When you post a photo, you confirm that:",
        {
          list: [
            "you took it yourself, or have the right to post it;",
            "it shows what you ate or drank, on the right spot;",
            "people who can be recognised in it are fine with it;",
            "it does not break the law or anyone else's rights.",
          ],
        },
      ],
    },
    {
      id: "rules",
      title: "What is not allowed",
      blocks: [
        "We have zero tolerance for objectionable content and abuse. Not allowed:",
        {
          list: [
            "nudity, sexual content or violence;",
            "hate, discrimination, threats or harassment;",
            "illegal content, or content that encourages something illegal;",
            "spam, advertising or photos unrelated to the spot;",
            "photos of someone else without permission, or other people's work;",
            "buying, trading or multi-account likes;",
            "bots, scrapers or other ways to overload or abuse brag.fast.",
          ],
        },
        "We regularly look at new photos. If you break these rules, we remove the content and may block or delete your account without warning.",
      ],
    },
    {
      id: "license",
      title: "Your photos stay yours",
      blocks: [
        "You keep ownership of your photos. By posting a photo you give us permission to store it, resize or crop it, and show it on the website and in the app. We may also use it to show what brag.fast is, for example on social media, with your username where we can. This permission is non-exclusive, free of charge and worldwide.",
        "When you delete a photo, the permission ends. Anything we already shared, we take down where we can.",
      ],
    },
    {
      id: "report",
      title: "Reporting and blocking",
      blocks: [
        "See a photo that breaks the rules, or one on the wrong spot? Tap Report on the photo, on the website or in the app. The photo disappears at once until we have looked at it, within 24 hours. If it breaks the rules, we remove it. Whoever posted it can lose their account.",
        "In the app you can also block someone. You then no longer see their photos, and we get a nudge to take a look.",
        `Prefer email? Write to [${LEGAL_ENTITY.email}](mailto:${LEGAL_ENTITY.email}?subject=Report) with the link to the spot or photo.`,
        "Run a business on brag.fast and something is off, like the address or that you have closed? Email us. We only remove visitors' photos when they break these rules.",
      ],
    },
    {
      id: "spots",
      title: "Spots, likes and the order",
      blocks: [
        "A spot joins brag.fast when a visitor posts a photo of it. Its name, address and location come from Google Places. We do our best, but cannot promise everything is right.",
        "The order on a board depends on likes alone: one like per person per spot, most likes on top. You cannot buy a better place. The order is visitors' opinion, not ours.",
        "Spots you added stay on brag.fast, even when you delete your account.",
      ],
    },
    {
      id: "ours",
      title: "What is ours",
      blocks: [
        "The brag.fast name, logo, design and software are ours. You may use brag.fast as intended, but not copy or imitate it.",
      ],
    },
    {
      id: "ending",
      title: "Stopping and blocking",
      blocks: [
        "You can stop at any time by deleting your account. We may remove content or block an account if you break these terms, or when needed to protect brag.fast or others. We may also change brag.fast or shut it down. If we shut it down, we will say so in advance.",
      ],
    },
    {
      id: "liability",
      title: "Warranty and liability",
      blocks: [
        "brag.fast is free and provided as is. We do our best to keep it working, but do not promise it is always available or free of errors, or that the information about spots is right.",
        "As far as the law allows, we are not liable for damage from using brag.fast, except in case of intent or gross negligence. Your rights as a consumer always apply.",
      ],
    },
    {
      id: "app-store",
      title: "The app from the App Store",
      blocks: [
        "These terms are between you and us, not Apple. We, not Apple, are responsible for the app and its support. Apple and its subsidiaries are third-party beneficiaries of these terms and may enforce them as far as the app is concerned. The App Store's usage rules also apply.",
      ],
    },
    {
      id: "changes",
      title: "Changes",
      blocks: [
        "We may change these terms. We announce important changes in advance, on the website or in the app. If you keep using brag.fast after that, the new terms apply.",
      ],
    },
    {
      id: "law",
      title: "Law and contact",
      blocks: [
        "Dutch law applies to these terms. Disputes go to the competent court in the Netherlands.",
        `Questions? Email ${MAIL}.`,
      ],
    },
  ],
};

export const LEGAL_DOCS: Record<LegalDocKey, Record<Locale, LegalDoc>> = {
  privacy: { nl: PRIVACY_NL, en: PRIVACY_EN },
  terms: { nl: TERMS_NL, en: TERMS_EN },
};

export type LegalInline = { text: string; href?: string };

/** Split `[text](href)` links out of a legal string. */
export function legalInline(source: string): LegalInline[] {
  const parts: LegalInline[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const match of source.matchAll(pattern)) {
    if (match.index > last) {
      parts.push({ text: source.slice(last, match.index) });
    }
    parts.push({ text: match[1], href: match[2] });
    last = match.index + match[0].length;
  }
  if (last < source.length) {
    parts.push({ text: source.slice(last) });
  }
  return parts;
}
