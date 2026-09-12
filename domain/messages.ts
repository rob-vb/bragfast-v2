export const nlMessages = {
  hero: "Ontbijt- en brunchplekken, per stad.",
  intro: "Zoek een woonplaats. Bezoekers voegen ontbijtplekken toe.",
  searchLabel: "Zoek een stad of plek",
  searchPlaceholder: "Haarlem of een bakkerij",
  searchSubmit: "Zoek",
  searchHint: "Typ minstens 2 tekens.",
  searchClear: "Wis zoek",
  featuredCities: "Steden om te ontdekken",
  moreCities: "Meer steden",
  searchResults: "Zoekresultaten",
  noSearchResults: "Geen stad of plek met die naam. Probeer Haarlem of Amsterdam.",
  footerLine: "Brag je ontbijt.",
  footerExplain: "Bezoekers voegen ontbijtplekken toe.",
  noSpotsYet: "Nog geen plekken in deze stad.",
  closed: "Gesloten",
  openNow: "Open nu",
  hoursHeading: "Openingstijden",
  hoursUnknown: "Openingstijden volgen.",
  backToCity: "Terug naar",
  filters: "Filters:",
  signIn: "Inloggen",
  signOut: "Uitloggen",
  signInTitle: "Log in bij brag.fast",
  signInIntro: "Log in met Google, of met je gebruikersnaam en wachtwoord.",
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
  close: "Sluiten",
  language: "Taal",
  googleUnavailable: "Google is nog niet ingesteld.",
  viewList: "Lijst",
  viewMap: "Kaart",
  viewMode: "Weergave",
  passportSpots: "Unieke plekken",
  passportWeek: "Deze week",
  passportEmpty: "Nog geen plekken op dit paspoort.",
  thisWeekEmpty: "Deze week nog geen brags.",
  viewPassport: "Paspoort",
  nearMe: "Dichtbij",
  nearMeDenied: "Locatie niet beschikbaar. Sta locatie toe of kies een stad.",
  nearMePending: "Locatie ophalen…",
  nearMeRetry: "Opnieuw",
  nearMeDismiss: "Verberg",
  nearestCity: "Dichtstbijzijnde stad",
  sortByName: "Naam",
  sortByDistance: "Afstand",
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
} as const;

export type MessageKey = keyof typeof nlMessages;

export const enMessages = {
  hero: "Breakfast and brunch spots, by city.",
  intro: "Search a woonplaats. Visitors add breakfast spots.",
  searchLabel: "Search a city or spot",
  searchPlaceholder: "Haarlem or a bakery",
  searchSubmit: "Search",
  searchHint: "Type at least 2 characters.",
  searchClear: "Clear search",
  featuredCities: "Cities to explore",
  moreCities: "More cities",
  searchResults: "Search results",
  noSearchResults: "No city or spot by that name. Try Haarlem or Amsterdam.",
  footerLine: "Brag your breakfast.",
  footerExplain: "Visitors add breakfast spots.",
  noSpotsYet: "No spots in this city yet.",
  closed: "Closed",
  openNow: "Open now",
  hoursHeading: "Hours",
  hoursUnknown: "Hours to follow.",
  backToCity: "Back to",
  filters: "Filters:",
  signIn: "Sign in",
  signOut: "Sign out",
  signInTitle: "Sign in to brag.fast",
  signInIntro: "Sign in with Google, or with your username and password.",
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
  close: "Close",
  language: "Language",
  googleUnavailable: "Google is not configured yet.",
  viewList: "List",
  viewMap: "Map",
  viewMode: "View",
  passportSpots: "Unique spots",
  passportWeek: "This week",
  passportEmpty: "No spots on this passport yet.",
  thisWeekEmpty: "No brags this week.",
  viewPassport: "Passport",
  nearMe: "Near me",
  nearMeDenied: "Location not available. Allow location or pick a city.",
  nearMePending: "Getting your location…",
  nearMeRetry: "Try again",
  nearMeDismiss: "Hide",
  nearestCity: "Nearest city",
  sortByName: "Name",
  sortByDistance: "Distance",
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
      return "No unique spots yet";
    }
    if (count === 1) {
      return "1 unique spot";
    }
    return `${count} unique spots`;
  }
  if (count <= 0) {
    return "Nog geen unieke plekken";
  }
  if (count === 1) {
    return "1 unieke plek";
  }
  return `${count} unieke plekken`;
}

export function postsThisWeekLabel(locale: Locale, count: number): string {
  if (locale === "en") {
    if (count === 1) {
      return "1 brag this week";
    }
    return `${count} brags this week`;
  }
  if (count === 1) {
    return "1 brag deze week";
  }
  return `${count} brags deze week`;
}
