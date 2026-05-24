/** True when running a local / development build (not production). */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}
