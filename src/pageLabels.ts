import type { Page } from './types';

export function getPageLabel(page: Page) {
  if (page === 'A') return 'Main Workspace';
  if (page === 'B') return 'Documentation Mode';
  if (page === 'C') return 'Audit Log';
  if (page === 'D') return 'Teams Map';
  if (page === 'E') return 'Prompts Library';
  if (page === 'G') return 'Cross Verification';
  if (page === 'H') return 'Saved Chat Versions';
  return 'Secondary Workspace';
}

export function getBottomNavPageLabel(page: Page, secondaryWorkspaceLabel?: string) {
  if (page === 'F') {
    if (secondaryWorkspaceLabel === 'Cross Verification') {
      return secondaryWorkspaceLabel;
    }

    return secondaryWorkspaceLabel
      ? `Secondary Workspace | ${secondaryWorkspaceLabel}`
      : 'Secondary Workspace';
  }

  return getPageLabel(page);
}

export function getTopRibbonSectionLabel(page: Page, secondaryWorkspaceLabel?: string) {
  if (page === 'F') {
    return secondaryWorkspaceLabel ?? 'Secondary Workspace';
  }

  return getPageLabel(page);
}
