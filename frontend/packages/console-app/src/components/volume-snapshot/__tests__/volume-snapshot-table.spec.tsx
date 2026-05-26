import { screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/app/src/components/data-view/types';
import type {
  PersistentVolumeClaimKind,
  RowProps,
  VolumeSnapshotKind,
} from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import {
  checkPVCSnapshot,
  getDataViewRows,
  volumeSnapshotTableColumnInfo,
} from '../volume-snapshot';

const mockVolumeSnapshot: VolumeSnapshotKind = {
  apiVersion: 'snapshot.storage.k8s.io/v1',
  kind: 'VolumeSnapshot',
  metadata: {
    name: 'test-snapshot',
    namespace: 'default',
    uid: 'test-uid',
    creationTimestamp: '2024-01-15T10:00:00Z',
  },
  spec: {
    volumeSnapshotClassName: 'csi-hostpath-snapclass',
    source: {
      persistentVolumeClaimName: 'test-pvc',
    },
  },
  status: {
    readyToUse: true,
    restoreSize: '1Gi',
    boundVolumeSnapshotContentName: 'snapcontent-test',
  },
};

const allColumnIds = volumeSnapshotTableColumnInfo.map(({ id }) => id);

const buildTestColumns = (hideSnapshotContentColumn: boolean) =>
  volumeSnapshotTableColumnInfo
    .filter(({ id }) => !(hideSnapshotContentColumn && id === 'snapshotContent'))
    .map(({ id }) => ({ id, title: id })) as ConsoleDataViewColumn<VolumeSnapshotKind>[];

const buildTestData = (hideSnapshotContentColumn: boolean): RowProps<VolumeSnapshotKind>[] => [
  {
    obj: mockVolumeSnapshot,
    rowData: { hideSnapshotContentColumn },
    activeColumnIDs: new Set(allColumnIds),
    index: 0,
  },
];

describe('getDataViewRows', () => {
  it('should return data view rows with correct structure', () => {
    const rows = getDataViewRows(buildTestData(false), buildTestColumns(false));

    expect(rows).toHaveLength(1);
    expect(rows[0].length).toBeGreaterThan(0);
  });

  it('should render snapshot name and PVC source as links', () => {
    const rows = getDataViewRows(buildTestData(false), buildTestColumns(false));

    renderWithProviders(rows[0].find((cell) => cell.id === 'name').cell);
    expect(screen.getByRole('link', { name: 'test-snapshot' })).toBeVisible();

    renderWithProviders(rows[0].find((cell) => cell.id === 'source').cell);
    expect(screen.getByRole('link', { name: 'test-pvc' })).toBeVisible();
  });

  it('should render snapshot status and size', () => {
    const rows = getDataViewRows(buildTestData(false), buildTestColumns(false));

    renderWithProviders(rows[0].find((cell) => cell.id === 'status').cell);
    expect(screen.getByText('Ready')).toBeVisible();

    renderWithProviders(rows[0].find((cell) => cell.id === 'size').cell);
    expect(screen.getByText('1 GiB')).toBeVisible();
  });

  it('should render snapshot content and class links when content column is shown', () => {
    const rows = getDataViewRows(buildTestData(false), buildTestColumns(false));

    renderWithProviders(rows[0].find((cell) => cell.id === 'snapshotContent').cell);
    expect(screen.getByRole('link', { name: 'snapcontent-test' })).toBeVisible();

    renderWithProviders(rows[0].find((cell) => cell.id === 'snapshotClass').cell);
    expect(screen.getByRole('link', { name: 'csi-hostpath-snapclass' })).toBeVisible();
  });

  it('should omit snapshot content cell when content column is hidden', () => {
    const rows = getDataViewRows(buildTestData(true), buildTestColumns(true));

    expect(rows[0].find((cell) => cell.id === 'snapshotContent')).toBeUndefined();
    renderWithProviders(rows[0].find((cell) => cell.id === 'snapshotClass').cell);
    expect(screen.getByRole('link', { name: 'csi-hostpath-snapclass' })).toBeVisible();
  });

  it('should render row action menu control', () => {
    const rows = getDataViewRows(buildTestData(false), buildTestColumns(false));

    renderWithProviders(rows[0].find((cell) => cell.id === '').cell);
    expect(screen.getByRole('button', { name: 'Actions' })).toBeVisible();
  });
});

describe('checkPVCSnapshot', () => {
  const mockPVC: PersistentVolumeClaimKind = {
    apiVersion: 'v1',
    kind: 'PersistentVolumeClaim',
    metadata: {
      name: 'test-pvc',
      namespace: 'default',
      uid: 'pvc-uid',
    },
    spec: {
      accessModes: ['ReadWriteOnce'],
      resources: { requests: { storage: '1Gi' } },
    },
  };

  const mockOtherSnapshot: VolumeSnapshotKind = {
    ...mockVolumeSnapshot,
    metadata: {
      name: 'other-snapshot',
      namespace: 'default',
      uid: 'other-uid',
      creationTimestamp: '2024-01-15T11:00:00Z',
    },
    spec: {
      volumeSnapshotClassName: 'csi-hostpath-snapclass',
      source: { persistentVolumeClaimName: 'other-pvc' },
    },
  };

  it('should return only snapshots for the given PVC', () => {
    const filtered = checkPVCSnapshot([mockVolumeSnapshot, mockOtherSnapshot], mockPVC);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].metadata.name).toBe('test-snapshot');
  });
});
