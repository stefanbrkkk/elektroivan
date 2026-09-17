import type { ConsoleMessage, Page } from '@playwright/test';

export interface ConsoleIssue {
  type: string;
  text: string;
}

/**
 * Attaches console/page-error listeners and returns the (live) array they
 * push into. Errors and warnings are both collected — gate G2 requires zero
 * of either (docs/BRIEF.md §9).
 */
export function collectConsoleIssues(page: Page): ConsoleIssue[] {
  const issues: ConsoleIssue[] = [];

  page.on('console', (message: ConsoleMessage) => {
    const type = message.type();
    if (type === 'error' || type === 'warning') {
      issues.push({ type, text: message.text() });
    }
  });

  page.on('pageerror', (error) => {
    issues.push({ type: 'pageerror', text: error.message });
  });

  return issues;
}
