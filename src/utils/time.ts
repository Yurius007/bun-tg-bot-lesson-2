const TZ = "Europe/Kyiv";

function kyivParts(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map(p => [p.type, p.value]));
  return parts;
}

export function localISOString(): string {
  const p = kyivParts(new Date());
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}+03:00`;
}

export function localDateString(): string {
  const p = kyivParts(new Date());
  return `${p.year}-${p.month}-${p.day}`;
}
