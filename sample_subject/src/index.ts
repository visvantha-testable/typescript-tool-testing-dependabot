/**
 * sample_subject — TypeScript npm project with intentionally vulnerable ws dependency.
 */
import WebSocket from "ws";

export function greet(name: string): string {
  return `Hello, ${name}! Dependabot monitoring active.`;
}

export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

export function createSocket(url: string): WebSocket {
  return new WebSocket(url);
}

if (import.meta.url.endsWith("index.ts") || import.meta.url.includes("index.js")) {
  console.log(greet("Testable"));
  console.log("ws version monitored for Dependabot alerts");
}
