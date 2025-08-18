/**
 * PatternFly Donut Utilization Chart implementation for PVC capacity
 * Following: https://www.patternfly.org/charts/donut-utilization-chart/design-guidelines
 */

/**
 * Enum representing different PVC capacity states
 */
export enum PVCCapacityState {
  /** Normal usage - under warning threshold */
  NORMAL = 'NORMAL',
  /** Warning threshold reached (75-90%) */
  WARNING = 'WARNING',
  /** Danger threshold reached (90%+) */
  DANGER = 'DANGER',
  /** Full capacity reached (100%) */
  FULL = 'FULL',
  /** Exceeding capacity - treat as FULL per PatternFly guidelines */
  EXCEEDING = 'EXCEEDING',
  /** Error - missing metric usage data */
  ERROR = 'ERROR',
}

/**
 * Thresholds for capacity states (percentages)
 */
export const PVC_CAPACITY_THRESHOLDS = {
  WARNING: 75, // Warning at 75%
  DANGER: 90, // Danger at 90%
  FULL: 100, // Full at 100%
};

/**
 * PatternFly standard colors for donut utilization charts
 */
export const PVC_UTILIZATION_COLORS = {
  // PatternFly standard colors from design guidelines
  USED_NORMAL: '#0066cc', // Blue for normal usage
  USED_WARNING: '#F0AB00', // Warning yellow
  USED_DANGER: '#C9190B', // Danger red
  UNUSED: '#EDEDED', // Unused area (PatternFly standard)
  ERROR: '#C9190B', // Error state (red for negative values)
};

/**
 * Configuration for different capacity states
 */
export interface PVCCapacityStateConfig {
  state: PVCCapacityState;
  title: string;
  description: string;
  usedColor: string;
  unusedColor: string;
  warningMessage?: string;
}

/**
 * Determines the PVC capacity state based on usage percentage
 */
export const determinePVCCapacityState = (
  totalCapacity: number,
  usedMetrics: number | null,
): PVCCapacityState => {
  // Error state - missing usage metrics or negative used value
  if (usedMetrics === null || usedMetrics === undefined || totalCapacity <= 0 || usedMetrics < 0) {
    return PVCCapacityState.ERROR;
  }

  // Calculate usage percentage
  const usagePercentage = (usedMetrics / totalCapacity) * 100;

  // Exceeding state - usage exceeds total capacity
  if (usagePercentage > 100) {
    return PVCCapacityState.EXCEEDING;
  }

  // Full state - 100% usage
  if (usagePercentage >= PVC_CAPACITY_THRESHOLDS.FULL) {
    return PVCCapacityState.FULL;
  }

  // Danger state - 90%+ usage
  if (usagePercentage >= PVC_CAPACITY_THRESHOLDS.DANGER) {
    return PVCCapacityState.DANGER;
  }

  // Warning state - 75%+ usage
  if (usagePercentage >= PVC_CAPACITY_THRESHOLDS.WARNING) {
    return PVCCapacityState.WARNING;
  }

  // Normal state - under 75% usage
  return PVCCapacityState.NORMAL;
};

/**
 * Gets the configuration for a specific capacity state
 */
export const getPVCCapacityStateConfig = (
  state: PVCCapacityState,
  t: (key: string) => string,
): PVCCapacityStateConfig => {
  switch (state) {
    case PVCCapacityState.NORMAL:
      return {
        state,
        title: t('public~Storage utilization'),
        description: t('public~Storage capacity usage'),
        usedColor: PVC_UTILIZATION_COLORS.USED_NORMAL,
        unusedColor: PVC_UTILIZATION_COLORS.UNUSED,
      };

    case PVCCapacityState.WARNING:
      return {
        state,
        title: t('public~Storage utilization - Warning'),
        description: t('public~Storage usage is approaching capacity'),
        usedColor: PVC_UTILIZATION_COLORS.USED_WARNING,
        unusedColor: PVC_UTILIZATION_COLORS.UNUSED,
        warningMessage: t(
          'public~Storage usage has reached the warning threshold (75%). Consider monitoring usage closely.',
        ),
      };

    case PVCCapacityState.DANGER:
      return {
        state,
        title: t('public~Storage utilization - Danger'),
        description: t('public~Storage usage is critically high'),
        usedColor: PVC_UTILIZATION_COLORS.USED_NORMAL, // Use blue for danger state
        unusedColor: PVC_UTILIZATION_COLORS.UNUSED,
        warningMessage: t(
          'public~Storage usage has reached the danger threshold (90%). Immediate action may be required.',
        ),
      };

    case PVCCapacityState.FULL:
      return {
        state,
        title: t('public~Storage utilization - Full'),
        description: t('public~Storage capacity is full'),
        usedColor: PVC_UTILIZATION_COLORS.USED_DANGER,
        unusedColor: PVC_UTILIZATION_COLORS.UNUSED,
        warningMessage: t(
          'public~Storage capacity is completely utilized. No additional space is available.',
        ),
      };

    case PVCCapacityState.EXCEEDING:
      return {
        state,
        title: t('public~Storage utilization - Full'),
        description: t('public~Storage capacity reached'),
        usedColor: PVC_UTILIZATION_COLORS.USED_DANGER,
        unusedColor: PVC_UTILIZATION_COLORS.UNUSED,
        warningMessage: t(
          'public~Storage has reached capacity. Some storage types like NFS may allow usage beyond the allocated space.',
        ),
      };

    case PVCCapacityState.ERROR:
      return {
        state,
        title: t('public~Storage utilization - Data unavailable'),
        description: t('public~Unable to determine storage usage'),
        usedColor: PVC_UTILIZATION_COLORS.ERROR,
        unusedColor: PVC_UTILIZATION_COLORS.UNUSED,
        warningMessage: t(
          'public~Storage usage data is not available. This may occur when metrics are not being collected properly.',
        ),
      };

    default:
      return {
        state: PVCCapacityState.ERROR,
        title: t('public~Storage utilization - Unknown'),
        description: t('public~Unknown storage state'),
        usedColor: PVC_UTILIZATION_COLORS.ERROR,
        unusedColor: PVC_UTILIZATION_COLORS.UNUSED,
      };
  }
};

/**
 * Prepares donut chart data following PatternFly utilization chart patterns
 */
export const preparePVCDonutData = (
  state: PVCCapacityState,
  totalCapacity: number,
  usedMetrics: number | null,
  t: (key: string) => string,
) => {
  const usedValue = usedMetrics || 0;

  switch (state) {
    case PVCCapacityState.NORMAL:
    case PVCCapacityState.WARNING:
    case PVCCapacityState.DANGER: {
      // Standard utilization chart: used + available
      const availableValue = Math.max(0, totalCapacity - usedValue);
      return [
        { x: t('public~Used'), y: usedValue },
        { x: t('public~Available'), y: availableValue },
      ];
    }

    case PVCCapacityState.FULL:
      // Full capacity: show as 100% used
      return [
        { x: t('public~Used'), y: totalCapacity },
        { x: t('public~Available'), y: 0 },
      ];

    case PVCCapacityState.EXCEEDING:
      // Exceeding: treat as full capacity per PatternFly guidelines
      return [
        { x: t('public~Used'), y: totalCapacity },
        { x: t('public~Available'), y: 0 },
      ];

    case PVCCapacityState.ERROR:
      // Error state: show as unknown data
      return [
        { x: t('public~Unknown'), y: totalCapacity },
        { x: t('public~Available'), y: 0 },
      ];

    default:
      return [
        { x: t('public~Used'), y: usedValue },
        { x: t('public~Available'), y: Math.max(0, totalCapacity - usedValue) },
      ];
  }
};

/**
 * Gets the utilization percentage for display (capped at 100%)
 */
export const getPVCUtilizationPercentage = (
  state: PVCCapacityState,
  totalCapacity: number,
  usedMetrics: number | null,
): number => {
  if (state === PVCCapacityState.ERROR || !usedMetrics || totalCapacity <= 0) {
    return 0;
  }

  const percentage = (usedMetrics / totalCapacity) * 100;

  // Cap at 100% for display purposes (PatternFly guideline)
  return Math.min(Math.round(percentage), 100);
};

/**
 * Gets the donut chart title following PatternFly patterns
 */
export const getPVCDonutTitle = (
  state: PVCCapacityState,
  totalCapacity: number,
  usedMetrics: number | null,
): string => {
  if (state === PVCCapacityState.ERROR) {
    return 'N/A';
  }

  const percentage = getPVCUtilizationPercentage(state, totalCapacity, usedMetrics);
  return `${percentage}%`;
};

/**
 * Gets the donut chart subtitle
 */
export const getPVCDonutSubtitle = (
  state: PVCCapacityState,
  totalCapacityString: string,
  t: (key: string) => string,
): string => {
  switch (state) {
    case PVCCapacityState.ERROR:
      return t('public~Data unavailable');
    default:
      return `${t('public~of')} ${totalCapacityString} ${t('public~used')}`;
  }
};
