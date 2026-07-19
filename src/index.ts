/**
 * Root TypeScript entry — NestJS-style dependency monitoring sample.
 * Required by Testable Dependabot training repo layout.
 */
export interface AppConfig {
  name: string;
  monitoring: boolean;
}

export function createApp(config: AppConfig): AppConfig {
  return {
    name: config.name,
    monitoring: config.monitoring,
  };
}

export function bootstrap(): void {
  const app = createApp({
    name: "typescript-tool-testing-dependabot",
    monitoring: true,
  });
  console.log(`[dependabot-training] ${app.name} monitoring=${app.monitoring}`);
}

bootstrap();
