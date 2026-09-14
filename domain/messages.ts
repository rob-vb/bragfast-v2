export const nlMessages = {
  hero: "Ontbijt- en brunchplekken, per stad.",
  intro: "Zoek een woonplaats. Bezoekers voegen ontbijtplekken toe.",
  searchLabel: "Zoek een woonplaats",
  searchPlaceholder: "Haarlem, Den Haag, Giethoorn",
  searchSubmit: "Zoek",
  featuredCities: "Steden om te ontdekken",
  moreCities: "Meer steden",
  noSearchResults: "Geen stad met die naam. Probeer Haarlem of Amsterdam.",
  footerLine: "Brag je ontbijt.",
  footerExplain: "Bezoekers voegen ontbijtplekken toe.",
  noSpotsYet: "Nog geen plekken in deze stad.",
  closed: "Gesloten",
  backToCity: "Terug naar",
  signIn: "Inloggen",
  signOut: "Uitloggen",
  signInTitle: "Log in bij brag.fast",
  signInIntro: "Log in met Apple, Google, of met je gebruikersnaam en wachtwoord.",
  emailLabel: "E-mailadres",
  emailPlaceholder: "jij@voorbeeld.nl",
  identifierLabel: "E-mail of gebruikersnaam",
  usernameLabel: "Gebruikersnaam",
  usernamePlaceholder: "jouw-naam",
  passwordLabel: "Wachtwoord",
  createAccount: "Account maken",
  haveAccount: "Al een account? Log in",
  invalidUsername: "Kies minstens 3 tekens: letters, cijfers en koppeltekens.",
  wrongPassword: "Onjuiste inloggegevens.",
  usernameTaken: "Die gebruikersnaam is al in gebruik.",
  or: "of",
  continueGoogle: "Ga verder met Google",
  continueApple: "Ga verder met Apple",
  close: "Sluiten",
  language: "Taal",
  howItWorks: "Hoe het werkt",
  myProfile: "Mijn profiel",
  googleUnavailable: "Google is nog niet ingesteld.",
  appleUnavailable: "Apple is nog niet ingesteld.",
  viewList: "Lijst",
  viewMap: "Kaart",
  viewMode: "Weergave",
  passportEmpty: "Nog geen plekken op dit paspoort.",
  viewPassport: "Paspoort",
  leaderboard: "Leaderboard",
  leaderboardIntro: "Adders, gerangschikt op likes op hun plekken.",
  leaderboardEmpty: "Nog niemand heeft een plek toegevoegd.",
  sortByLikes: "Likes",
  sortByName: "Naam",
  sortDirDesc: "Aflopend",
  sortDirAsc: "Oplopend",
  sortKey: "Sorteren",
  sortDir: "Richting",
  adminTitle: "Beheer",
  openReports: "Open meldingen",
  restoreBrag: "Zet terug",
  keepHidden: "Houd verborgen",
  closeSpot: "Sluit plek",
  reopenSpot: "Zet open",
  noOpenReports: "Geen open meldingen",
  adminSpots: "Plekken",
  viewAdmin: "Beheer",
  addSpot: "Plek toevoegen",
  addSpotPhoto: "Foto van de plek",
  addSpotTypeRejected: "Dit is geen ontbijt- of brunchplek.",
  addSpotPhotoRequired: "Voeg een foto toe.",
  addSpotNoWoonplaats: "Die plek valt buiten een Nederlandse woonplaats.",
  placesUnavailable: "Places is nog niet ingesteld.",
  privacy: "Privacy",
  dataDeletion: "Gegevens wissen",
  share: "Deel",
  linkCopied: "Link gekopieerd",
  shareFailed: "Delen lukte niet",
  like: "Leuk",
  photosHeading: "Foto's",
  deletePhoto: "Wissen",
} as const;

export type MessageKey = keyof typeof nlMessages;

export const enMessages = {
  hero: "Breakfast and brunch spots, by city.",
  intro: "Search a city. Visitors add breakfast spots.",
  searchLabel: "Search a city",
  searchPlaceholder: "Haarlem, Den Haag, Giethoorn",
  searchSubmit: "Search",
  featuredCities: "Cities to explore",
  moreCities: "More cities",
  noSearchResults: "No city by that name. Try Haarlem or Amsterdam.",
  footerLine: "Brag your breakfast.",
  footerExplain: "Visitors add breakfast spots.",
  noSpotsYet: "No spots in this city yet.",
  closed: "Closed",
  backToCity: "Back to",
  signIn: "Sign in",
  signOut: "Sign out",
  signInTitle: "Sign in to brag.fast",
  signInIntro: "Sign in with Apple, Google, or with your username and password.",
  emailLabel: "Email address",
  emailPlaceholder: "you@example.com",
  identifierLabel: "Email or username",
  usernameLabel: "Username",
  usernamePlaceholder: "your-name",
  passwordLabel: "Password",
  createAccount: "Create account",
  haveAccount: "Already have an account? Sign in",
  invalidUsername: "Use at least 3 characters: letters, numbers, and hyphens.",
  wrongPassword: "Wrong username, email, or password.",
  usernameTaken: "That username is already taken.",
  or: "or",
  continueGoogle: "Continue with Google",
  continueApple: "Continue with Apple",
  close: "Close",
  language: "Language",
  howItWorks: "How it works",
  myProfile: "My profile",
  googleUnavailable: "Google is not configured yet.",
  appleUnavailable: "Apple is not configured yet.",
  viewList: "List",
  viewMap: "Map",
  viewMode: "View",
  passportEmpty: "No spots on this passport yet.",
  viewPassport: "Passport",
  leaderboard: "Leaderboard",
  leaderboardIntro: "Adders, ranked by likes on spots they added.",
  leaderboardEmpty: "Nobody has added a spot yet.",
  sortByLikes: "Likes",
  sortByName: "Name",
  sortDirDesc: "Descending",
  sortDirAsc: "Ascending",
  sortKey: "Sort",
  sortDir: "Direction",
  adminTitle: "Queue",
  openReports: "Open reports",
  restoreBrag: "Restore",
  keepHidden: "Keep hidden",
  closeSpot: "Close spot",
  reopenSpot: "Reopen",
  noOpenReports: "No open reports",
  adminSpots: "Spots",
  viewAdmin: "Queue",
  addSpot: "Add a spot",
  addSpotPhoto: "Photo of the spot",
  addSpotTypeRejected: "That is not a breakfast or brunch spot.",
  addSpotPhotoRequired: "Add a photo.",
  addSpotNoWoonplaats: "That place is outside a Dutch woonplaats.",
  placesUnavailable: "Places is not configured yet.",
  privacy: "Privacy",
  dataDeletion: "Delete my data",
  share: "Share",
  linkCopied: "Link copied",
  shareFailed: "Could not share",
  like: "Like",
  photosHeading: "Photos",
  deletePhoto: "Delete",
} as const satisfies Record<MessageKey, string>;

export type Locale = "nl" | "en";

const catalogs: Record<Locale, Record<MessageKey, string>> = {
  nl: nlMessages,
  en: enMessages,
};

export function t(locale: Locale, key: MessageKey): string {
  return catalogs[locale][key];
}

export function boardCityLabel(locale: Locale, count: number): string {
  if (locale === "en") {
    if (count === 1) {
      return "1 spot on the board";
    }
    return `${count} spots on the board`;
  }
  if (count === 1) {
    return "1 plek op de board";
  }
  return `${count} plekken op de board`;
}

export function uniqueSpotsLabel(locale: Locale, count: number): string {
  if (locale === "en") {
    if (count <= 0) {
      return "No spots yet";
    }
    if (count === 1) {
      return "1 spot";
    }
    return `${count} spots`;
  }
  if (count <= 0) {
    return "Nog geen plekken";
  }
  if (count === 1) {
    return "1 plek";
  }
  return `${count} plekken`;
}

export function likeCountLabel(locale: Locale, count: number): string {
  if (locale === "en") {
    if (count === 1) {
      return "1 like";
    }
    return `${count} likes`;
  }
  if (count === 1) {
    return "1 like";
  }
  return `${count} likes`;
}

