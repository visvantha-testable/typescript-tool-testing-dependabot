/**
 * Root TypeScript entry — Dependabot training sample with intentionally vulnerable deps.
 */
import merge from "lodash/merge.js";
import minimist from "minimist";
import "axios";

export interface AppConfig {
  name: string;
  monitoring: boolean;
  vulnerableDeps: string[];
}

export function createApp(config: AppConfig): AppConfig {
  return merge({}, config);
}

export function bootstrap(): void {
  const args = minimist(process.argv.slice(2));
  const app = createApp({
    name: "typescript-tool-testing-dependabot",
    monitoring: true,
    vulnerableDeps: ["lodash", "minimist", "axios"],
  });

  if (args.check) {
    void app.vulnerableDeps.length;
  }

  console.log(`[dependabot-training] ${app.name} monitoring=${app.monitoring}`);
}

bootstrap();
