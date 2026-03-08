export type Language = 'he' | 'en';

export const translations = {
  he: {
    // Nav
    home: 'בית',
    search: 'חיפוש',
    watchlist: 'רשימה',
    settings: 'הגדרות',

    // Hero
    play: 'הפעל',
    details: 'פרטים',

    // Content rows
    trendingNow: 'פופולרי עכשיו 🔥',
    newOnSite: 'חדש באתר',
    topRated: 'הכי מדורגים',
    topSeries: 'סדרות מובילות',
    actionThriller: 'אקשן ומתח',

    // Search
    searchTitle: 'חיפוש',
    searchPlaceholder: 'חפש סרטים, סדרות...',
    noResults: 'לא נמצאו תוצאות',
    tryAnother: 'נסה חיפוש אחר',

    // Watchlist
    myList: 'הרשימה שלי',
    emptyList: 'הרשימה שלך ריקה',
    addLater: 'הוסף סרטים וסדרות לצפייה מאוחרת',

    // Movie details
    playNow: 'הפעל עכשיו',
    synopsis: 'תקציר',
    seasons: 'עונות',
    season: 'עונה',
    episode: 'פרק',
    minutes: 'דקות',

    // Settings
    settingsTitle: 'הגדרות',
    account: 'חשבון',
    accountDesc: 'פרטי חשבון והתחברות',
    videoQuality: 'איכות וידאו',
    videoQualityDesc: 'בחר איכות סטרימינג ברירת מחדל',
    subtitles: 'כתוביות',
    subtitlesDesc: 'שפה, גודל וסגנון כתוביות',
    notifications: 'התראות',
    notificationsDesc: 'ניהול התראות פוש',
    language: 'שפת ממשק',
    languageDesc: 'עברית',
    uiSize: 'גודל ממשק',
    uiSizeDesc: 'שנה את גודל הטקסט והאלמנטים',
    cache: 'מטמון',
    cacheDesc: 'נקה קבצים שמורים',
    about: 'אודות',
    aboutDesc: 'Lumina Streams v1.0',
  },
  en: {
    // Nav
    home: 'Home',
    search: 'Search',
    watchlist: 'Watchlist',
    settings: 'Settings',

    // Hero
    play: 'Play',
    details: 'Details',

    // Content rows
    trendingNow: 'Trending Now 🔥',
    newOnSite: 'New on Site',
    topRated: 'Top Rated',
    topSeries: 'Top Series',
    actionThriller: 'Action & Thriller',

    // Search
    searchTitle: 'Search',
    searchPlaceholder: 'Search movies, series...',
    noResults: 'No results found',
    tryAnother: 'Try a different search',

    // Watchlist
    myList: 'My List',
    emptyList: 'Your list is empty',
    addLater: 'Add movies and series to watch later',

    // Movie details
    playNow: 'Play Now',
    synopsis: 'Synopsis',
    seasons: 'Seasons',
    season: 'Season',
    episode: 'Episode',
    minutes: 'min',

    // Settings
    settingsTitle: 'Settings',
    account: 'Account',
    accountDesc: 'Account details and login',
    videoQuality: 'Video Quality',
    videoQualityDesc: 'Choose default streaming quality',
    subtitles: 'Subtitles',
    subtitlesDesc: 'Language, size and subtitle style',
    notifications: 'Notifications',
    notificationsDesc: 'Manage push notifications',
    language: 'Interface Language',
    languageDesc: 'English',
    uiSize: 'UI Size',
    uiSizeDesc: 'Change text and element sizes',
    cache: 'Cache',
    cacheDesc: 'Clear saved files',
    about: 'About',
    aboutDesc: 'Lumina Streams v1.0',
  },
} as const;

export type TranslationKey = keyof typeof translations.he;
