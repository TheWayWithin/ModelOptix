/**
 * Editorial Override Integration
 *
 * Editorial overrides allow the ModelOptix team to manually adjust
 * recommendations based on editorial judgment. This handles cases
 * where automated scoring doesn't capture important nuances.
 *
 * Override Types:
 * - exclude: Model is completely removed from recommendations
 * - downrank: Model receives a 50% penalty to final score
 * - flag: Model is included but UI shows a warning
 *
 * @see architecture.md Section 4.1 - Editorial Override System
 */

import type { EditorialStatus } from '@/types/recommendation';
import { DOWNRANK_PENALTY } from './thresholds';

/**
 * Editorial override as stored in database.
 */
export interface EditorialOverride {
  id: string;
  modelId: string;
  overrideType: 'exclude' | 'downrank' | 'flag';
  reason: string;
  active: boolean;
  createdAt: string;
  expiresAt: string | null;
}

/**
 * Check if a model should be excluded from recommendations.
 *
 * @param overrides - Active editorial overrides for the model
 * @returns true if model should be excluded
 */
export function shouldExcludeModel(overrides: EditorialOverride[]): boolean {
  return overrides.some(o => o.active && o.overrideType === 'exclude');
}

/**
 * Get the downrank penalty to apply to a model's score.
 *
 * @param overrides - Active editorial overrides for the model
 * @returns Penalty multiplier (1.0 = no penalty, 0.5 = 50% reduction)
 */
export function getDownrankPenalty(overrides: EditorialOverride[]): number {
  const hasDownrank = overrides.some(o => o.active && o.overrideType === 'downrank');
  return hasDownrank ? DOWNRANK_PENALTY : 1.0;
}

/**
 * Get editorial status for display in UI.
 * Returns the most severe active override.
 *
 * Severity order: exclude > downrank > flag
 *
 * @param overrides - Active editorial overrides for the model
 * @returns EditorialStatus or undefined if no overrides
 */
export function getEditorialStatus(overrides: EditorialOverride[]): EditorialStatus | undefined {
  const activeOverrides = overrides.filter(o => o.active);

  if (activeOverrides.length === 0) {
    return undefined;
  }

  // Check for exclude first (most severe)
  const excludeOverride = activeOverrides.find(o => o.overrideType === 'exclude');
  if (excludeOverride) {
    return {
      type: 'exclude',
      reason: excludeOverride.reason,
    };
  }

  // Check for downrank
  const downrankOverride = activeOverrides.find(o => o.overrideType === 'downrank');
  if (downrankOverride) {
    return {
      type: 'downrank',
      reason: downrankOverride.reason,
    };
  }

  // Check for flag
  const flagOverride = activeOverrides.find(o => o.overrideType === 'flag');
  if (flagOverride) {
    return {
      type: 'flag',
      reason: flagOverride.reason,
    };
  }

  return undefined;
}

/**
 * Apply editorial adjustments to a raw FitScore.
 *
 * @param rawScore - The calculated FitScore before editorial adjustments
 * @param overrides - Active editorial overrides for the model
 * @returns Adjusted score (0 if excluded, reduced if downranked, unchanged otherwise)
 */
export function applyEditorialAdjustments(
  rawScore: number,
  overrides: EditorialOverride[]
): number {
  // Excluded models get score of 0
  if (shouldExcludeModel(overrides)) {
    return 0;
  }

  // Apply downrank penalty
  const penalty = getDownrankPenalty(overrides);
  return rawScore * penalty;
}

/**
 * Filter out models that should be excluded from recommendations.
 *
 * @param models - Array of models with their editorial overrides
 * @returns Filtered array excluding models with active 'exclude' overrides
 */
export function filterExcludedModels<T extends { editorialOverrides: EditorialOverride[] }>(
  models: T[]
): T[] {
  return models.filter(model => !shouldExcludeModel(model.editorialOverrides));
}

/**
 * Format editorial reason for display.
 * Adds prefix based on override type.
 *
 * @param status - Editorial status
 * @returns Formatted string for UI display
 */
export function formatEditorialReason(status: EditorialStatus): string {
  switch (status.type) {
    case 'exclude':
      return `Not recommended: ${status.reason}`;
    case 'downrank':
      return `Caution: ${status.reason}`;
    case 'flag':
      return `Note: ${status.reason}`;
    default:
      return status.reason;
  }
}
