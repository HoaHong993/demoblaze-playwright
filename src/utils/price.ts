/** "$360 *includes tax" -> 360, "790" -> 790 */
export function parsePrice(text: string): number {
  const match = text.replace(/,/g, '').match(/\d+(\.\d+)?/);
  if (!match) {
    throw new Error(`Cannot parse price from "${text}"`);
  }
  return Number(match[0]);
}
