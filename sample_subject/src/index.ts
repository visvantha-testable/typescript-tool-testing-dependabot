/**
 * sample_subject — TypeScript npm project monitored by Dependabot.
 * Safe pinned dependencies for training (no active CVE alerts).
 */
export function greet(name: string): string {
  return `Hello, ${name}! Dependabot monitoring active.`;
}

export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

if (import.meta.url.endsWith("index.ts") || import.meta.url.includes("index.js")) {
  console.log(greet("Testable"));
  console.log("Dependency count monitored:", 2);
}
