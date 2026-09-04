/**
 * Normalize user-provided display text so decorative Unicode renders as
 * plain letters. X/GitHub display names often use Mathematical Alphanumeric
 * Symbols (e.g. "𝗠𝗔𝗟𝗜𝗡" — U+1D5D4 block) which common fonts don't include,
 * so those glyphs show up as missing-character boxes (tofu). NFKC folds
 * them back to regular ASCII (and full-width forms, ligatures, etc.).
 *
 * Private Use Area characters are also stripped — fxtwitter appends a PUA
 * marker (U+EA00) to display names, and PUA glyphs have no font coverage in
 * most stacks, so they render as stray tofu boxes too.
 *
 * Emoji and other pictographs are left untouched.
 */
export function toPlainText(value: string): string {
       return value
              .normalize("NFKC")
              .replace(
                     /[\u{E000}-\u{F8FF}\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/gu,
                     "",
              );
}
