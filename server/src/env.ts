import { Logger } from '@nestjs/common';

const logger = new Logger('Env');

export function env(name: string, defaultValue: string): string {
  const value = process.env[name];
  if (!value) {
    logger.warn(
      `Environment variable ${name} is not set, using default: "${defaultValue}"`,
    );
    return defaultValue;
  }
  return value;
}
