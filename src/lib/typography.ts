/**
 * French typography: narrow no-break spaces (U+202F) before : ; ? ! », after «,
 * and as thousands separators ("CHF 435 000"), so lines never break inside them.
 * Applied to French content at load time; other locales are returned unchanged.
 */
const NNBSP = " ";

export function frenchTypography(text: string): string {
  return (
    text
      // "mot :" → "mot :"  (only when the author already put a space before the sign)
      .replace(/([^\s|])[  ]+([:;?!»])/gu, `$1${NNBSP}$2`) // never after a table pipe
      .replace(/«[  ]+/g, `«${NNBSP}`)
      // one apostrophe style: typographic ’ between letters (l'impôt → l’impôt)
      .replace(/(\p{L})'(?=\p{L})/gu, "$1\u2019")
      // thousands groups: "435 000", "1 250 000"
      .replace(/(\d)[  ](?=\d{3}(?!\d))/g, `$1${NNBSP}`)
  );
}

export function typeset(locale: string, text: string): string {
  return locale === "fr" ? frenchTypography(text) : text;
}
