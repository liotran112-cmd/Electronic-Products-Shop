/** Named revalidation windows (seconds). Services declare intent, not magic numbers. */
export const TTL = {
  minute: 60,
  fiveMinutes: 300,
  fifteenMinutes: 900,
  hour: 3600,
  day: 86_400,
} as const;
