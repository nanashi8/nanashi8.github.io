export type GuardSeverity = 'info' | 'warning' | 'error';

export type GuardViolation = {
  id?: string;
  severity: GuardSeverity;
  message: string;
  file?: string;
  line?: number;
  suggestedActions?: string[];
  rawOutput?: string;
};

export type GuardResult = {
  success: boolean;
  summary: string;
  violations: GuardViolation[];
  /** Optional: raw stdout/stderr captured from underlying runner */
  logs?: string;
};

export interface GuardRunner {
  /**
   * Execute guard checks.
   *
   * Runner implementation may call repo-local scripts or native TypeScript checks.
   */
  run(options: {
    workspaceRoot: string;
    stagedFiles?: string[];
    userRequestNote?: string;
  }): Promise<GuardResult>;
}
