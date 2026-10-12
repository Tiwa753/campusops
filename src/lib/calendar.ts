export function campusDate(date = new Date(), timeZone = "Africa/Lagos") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) =>
    parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

// Convert university wall time to an instant independently of the viewer's timezone.
export function campusInstant(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const nominal = Date.UTC(year, month - 1, day, hour, minute);
  const format = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const wallTime = (instant: number) => {
    const parts = format.formatToParts(new Date(instant));
    const part = (type: string) =>
      Number(parts.find((item) => item.type === type)!.value);
    return Date.UTC(
      part("year"),
      part("month") - 1,
      part("day"),
      part("hour"),
      part("minute"),
    );
  };
  let instant = nominal;
  for (let i = 0; i < 3; i++) instant += nominal - wallTime(instant);
  if (wallTime(instant) !== nominal)
    throw new Error(
      "This local time does not exist in the university timezone.",
    );
  return instant;
}
