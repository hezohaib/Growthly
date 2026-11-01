/** Round an axis maximum up to a "nice" number so grid labels look clean. */
export function niceMax(m: number) {
  if (m <= 0) return 1;
  const step = Math.pow(10, Math.floor(Math.log10(m))) / 2;
  return Math.ceil(m / step) * step;
}
