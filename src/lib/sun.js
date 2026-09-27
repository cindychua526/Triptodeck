/* sunrise & sunset for a place and a date (NOAA approximation), returned as local "HH:MM" */
export function sunTimes(lat, lng, date = new Date(), tzMin) {
  const rad = Math.PI / 180, d0 = Date.UTC(date.getFullYear(), 0, 0), n = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - d0) / 864e5);
  const g = (2 * Math.PI / 365) * (n - 1 + (12 - 12) / 24);
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl)) - Math.tan(lat * rad) * Math.tan(decl)) / rad;
  const tz = tzMin != null ? tzMin : -date.getTimezoneOffset();
  const rise = 720 - 4 * (lng + ha) - eqt + tz, set = 720 - 4 * (lng - ha) - eqt + tz;
  const f = m => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(Math.round(m % 60)).padStart(2, "0"); };
  return isNaN(ha) ? null : { rise: f(rise), set: f(set) };
}
