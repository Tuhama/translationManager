export function defaultSourceLang(languages, fallback = 'en') {
    if (!Array.isArray(languages) || languages.length === 0) return fallback;
    return languages.includes('en') ? 'en' : languages[0];
}
