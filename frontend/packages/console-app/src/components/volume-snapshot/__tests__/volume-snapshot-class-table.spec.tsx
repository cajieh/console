import { screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/app/src/components/data-view/types';
import type { RowProps, VolumeSnapshotClassKind } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { getDataViewRowsCreator } from '../volume-snapshot-class';

const tableColumnInfo = [{ id: 'name' }, { id: 'driver' }, { id: 'deletionPolicy' }, { id: '' }];

const getDataViewRows = getDataViewRowsCreator((key) =>
  key === 'console-app~Default' ? 'Default' : key,
);

const testColumns = tableColumnInfo.map(({ id }) => ({
  id,
  title: id,
})) as ConsoleDataViewColumn<VolumeSnapshotClassKind>[];

const mockVolumeSnapshotClass: VolumeSnapshotClassKind = {
  apiVersion: 'snapshot.storage.k8s.io/v1',
  kind: 'VolumeSnapshotClass',
  metadata: {
    name: 'csi-hostpath-snapclass',
    uid: 'test-uid',
  },
  driver: 'hostpath.csi.k8s.io',
  deletionPolicy: 'Delete',
};

describe('getDataViewRows', () => {
  let testData: RowProps<VolumeSnapshotClassKind>[];

  beforeEach(() => {
    testData = [
      {
        obj: mockVolumeSnapshotClass,
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

  it('should render class name as a link with driver and deletion policy', () => {
    const rows = getDataViewRows(testData, testColumns);

    renderWithProviders(rows[0].find((cell) => cell.id === 'name').cell);
    expect(screen.getByRole('link', { name: /csi-hostpath-snapclass/ })).toBeVisible();

    renderWithProviders(rows[0].find((cell) => cell.id === 'driver').cell);
    expect(screen.getByText('hostpath.csi.k8s.io')).toBeVisible();

    renderWithProviders(rows[0].find((cell) => cell.id === 'deletionPolicy').cell);
    expect(screen.getByText('Delete')).toBeVisible();
  });

  it('should render row action menu control', () => {
    const rows = getDataViewRows(testData, testColumns);

    renderWithProviders(rows[0].find((cell) => cell.id === '').cell);
    expect(screen.getByRole('button', { name: 'Actions' })).toBeVisible();
  });
});
