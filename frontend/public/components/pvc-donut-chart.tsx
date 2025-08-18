import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import './fonts.css';

import { ChartDonutUtilization } from '@patternfly/react-charts/victory';
import { Skeleton } from '@patternfly/react-core';
import {
  determinePVCCapacityState,
  getPVCCapacityStateConfig,
  getPVCUtilizationPercentage,
} from './storage/pvc-capacity-utils';
import { useTranslation } from 'react-i18next';

interface UsageData {
  x?: string;
  y?: number;
  name?: string;
}

interface ChartUtilRightAlignedLegendProps {
  totalCapacityMetric: number;
  usedMetrics: number | null;
  availableMetrics: number | null;
  totalCapacityString: string;
  usedCapacity: any;
  availableCapacity: any;
  loading: boolean;
  pvcStatus?: string;
}

export const ChartUtilRightAlignedLegend: React.FunctionComponent<ChartUtilRightAlignedLegendProps> = ({
  totalCapacityMetric,
  usedMetrics,
  totalCapacityString,
  usedCapacity,
  availableCapacity,
  loading,
  pvcStatus,
}) => {
  const { t } = useTranslation();

  // Show skeleton when PVC is bound but usage metrics are not available yet
  const shouldShowSkeleton =
    pvcStatus === 'Bound' && totalCapacityMetric && (loading || !usedMetrics);

  if (shouldShowSkeleton) {
    return (
      <div
        style={{
          height: '150px', // Match actual chart container height
          width: '450px', // Match actual chart container width
          display: 'flex',
          alignItems: 'flex-start',
          marginTop: '10px', // Match actual chart margin
          marginBottom: '20px', // Match actual chart margin
          marginLeft: '-48px', // Match actual chart margin
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingTop: '20px',
            paddingLeft: '50px', // Move everything more to the right
            width: '100%',
          }}
        >
          {/* Skeleton for donut chart */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginRight: '30px', // Space between chart and legend
            }}
          >
            <Skeleton shape="circle" width="100px" height="100px" />
          </div>

          {/* Skeleton for legend */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              justifyContent: 'center',
            }}
          >
            <Skeleton width="150px" height="12px" />
            <Skeleton width="140px" height="12px" />
          </div>
        </div>
      </div>
    );
  }

  // Don't show anything if PVC is not bound (pending, etc.)
  if (pvcStatus !== 'Bound') {
    return null;
  }

  // Don't show chart if no metrics available for bound PVC
  if (!totalCapacityMetric) {
    return null;
  }

  // Determine PVC capacity state using real data
  const capacityState = determinePVCCapacityState(totalCapacityMetric, usedMetrics);
  const stateConfig = getPVCCapacityStateConfig(capacityState, t);
  const utilizationPercentage = getPVCUtilizationPercentage(
    capacityState,
    totalCapacityMetric,
    usedMetrics,
  );

  // Prepare real data for the chart
  const data: UsageData = {
    x: t('public~Storage capacity'),
    y: utilizationPercentage,
  };

  // Create legend data with real values
  // Handle negative available capacity by showing 0
  const availableDisplayValue =
    availableCapacity.value < 0 ? `0 ${availableCapacity.unit}` : availableCapacity.string;

  const legendData: UsageData[] = usedMetrics
    ? [
        { name: `${t('public~Used capacity')}: ${usedCapacity.string}` },
        { name: `${t('public~Available capacity')}: ${availableDisplayValue}` },
      ]
    : [{ name: `${t('public~Total')}: ${totalCapacityString}` }];

  return (
    <div
      style={{
        height: '150px', // Increased height to accommodate legend text
        width: '450px', // Increased width to prevent text truncation
        display: 'flex',
        alignItems: 'flex-start',
        marginTop: '10px', // Small positive margin for proper spacing
        marginBottom: '20px', // Space before the next section
        marginLeft: '-48px', // Move much further left to align with resource Name field
      }}
    >
      <ChartDonutUtilization
        ariaDesc={stateConfig.description}
        ariaTitle={stateConfig.title}
        constrainToVisibleArea
        data={data}
        labels={({ datum }) => (datum.x ? `${datum.x}: ${datum.y}%` : null)}
        legendData={legendData}
        legendOrientation="vertical"
        name="pvc-capacity-chart"
        padding={{
          bottom: 20,
          left: 0, // No left padding to align with resource Name field
          right: 200, // Increased right padding to accommodate longer legend text
          top: 10,
        }}
        subTitle={`${t('public~of')} ${totalCapacityString}`}
        title={`${utilizationPercentage}%`}
        thresholds={[{ value: 75 }, { value: 90 }]}
        width={450} // Match container width
        height={150} // Match container height
        colorScale={[stateConfig.usedColor, stateConfig.unusedColor]}
      />
    </div>
  );
};
