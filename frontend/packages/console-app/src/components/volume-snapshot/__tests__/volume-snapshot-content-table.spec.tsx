import { screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/app/src/components/data-view/types';
import type { RowProps, VolumeSnapshotContentKind } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { getDataViewRows, tableColumnInfo } from '../volume-snapshot-content';

const testColumns = tableColumnInfo.map(({ id }) => ({
  id,
  title: id,
})) as ConsoleDataViewColumn<VolumeSnapshotContentKind>[];

const mockVolumeSnapshotContent: VolumeSnapshotContentKind = {
  apiVersion: 'snapshot.storage.k8s.io/v1',
  kind: 'VolumeSnapshotContent',
  metadata: {
    name: 'snapcontent-test',
    uid: 'test-uid',
    creationTimestamp: '2024-01-15T10:00:00Z',
  },
  spec: {
    deletionPolicy: 'Delete',
    driver: 'hostpath.csi.k8s.io',
    source: {
      snapshotHandle: 'snapshot-handle-123',
    },
    volumeSnapshotRef: {
      name: 'test-snapshot',
      namespace: 'default',
    },
    volumeSnapshotClassName: 'csi-hostpath-snapclass',
  },
  status: {
    readyToUse: true,
    restoreSize: 1073741824,
    snapshotHandle: 'snapshot-handle-123',
  },
};

describe('getDataViewRows', () => {
  let testData: RowProps<VolumeSnapshotContentKind>[];

  beforeEach(() => {
    testData = [
      {
        obj: mockVolumeSnapshotContent,
        rowData: undefined,
        activeColumnIDs: new Set(tableColumnInfo.map(({ id }) => id)),
        index: 0,
      },
    ];
  });

  it('should return data view rows with correct structure', () => {
    const rows = getDataViewRows(testData, testColumns);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveLength(testColumns.length);
  });

  it('should render content name, status, and related snapshot links', () => {
    const rows = getDataViewRows(testData, testColumns);

    renderWithProviders(rows[0].find((cell) => cell.id === 'name').cell);
    expect(screen.getByRole('link', { name: 'snapcontent-test' })).toBeVisible();

    renderWithProviders(rows[0].find((cell) => cell.id === 'status').cell);
    expect(screen.getByText('Ready')).toBeVisible();

    renderWithProviders(rows[0].find((cell) => cell.id === 'size').cell);
    expect(screen.getByText('1 GiB')).toBeVisible();

    renderWithProviders(rows[0].find((cell) => cell.id === 'volumeSnapshot').cell);
    expect(screen.getByRole('link', { name: 'test-snapshot' })).toBeVisible();

    renderWithProviders(rows[0].find((cell) => cell.id === 'snapshotClass').cell);
    expect(screen.getByRole('link', { name: 'csi-hostpath-snapclass' })).toBeVisible();
  });

  it('should render row action menu control', () => {
    const rows = getDataViewRows(testData, testColumns);

    renderWithProviders(rows[0].find((cell) => cell.id === '').cell);
    expect(screen.getByRole('button', { name: 'Actions' })).toBeVisible();
  });
});
