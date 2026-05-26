import { screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/app/src/components/data-view/types';
import type { RowProps } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { getDataViewRows, tableColumnInfo } from '../PDBList';
import type { PodDisruptionBudgetKind } from '../types';

jest.mock('../utils/get-pdb-resources', () => ({
  isDisruptionViolated: jest.fn(() => false),
}));

const createMockPDB = (overrides?: Partial<PodDisruptionBudgetKind>): PodDisruptionBudgetKind => ({
  apiVersion: 'policy/v1',
  kind: 'PodDisruptionBudget',
  metadata: {
    name: 'test-pdb',
    namespace: 'default',
    uid: 'test-uid',
    creationTimestamp: '2024-01-15T10:00:00Z',
  },
  spec: {
    minAvailable: 1,
    selector: {
      matchLabels: {
        app: 'test-app',
      },
    },
  },
  status: {
    conditions: [],
    currentHealthy: 2,
    desiredHealthy: 1,
    disruptionsAllowed: 1,
  },
  ...overrides,
});

const testColumns = tableColumnInfo.map(({ id }) => ({
  id,
  title: id,
})) as ConsoleDataViewColumn<PodDisruptionBudgetKind>[];

const renderCell = (cell: React.ReactNode) => {
  renderWithProviders(cell);
};

describe('getDataViewRows', () => {
  let testData: RowProps<PodDisruptionBudgetKind>[];

  beforeEach(() => {
    jest.clearAllMocks();
    testData = [
      {
        obj: createMockPDB(),
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
    rows[0].forEach((cell) => {
      expect(cell).toHaveProperty('id');
      expect(cell).toHaveProperty('cell');
    });
  });

  it('should render PDB name and namespace as links', () => {
    testData[0].obj = createMockPDB({
      metadata: { name: 'my-pdb', namespace: 'production', uid: 'uid' },
    });
    const rows = getDataViewRows(testData, testColumns);
    const nameCell = rows[0].find((cell) => cell.id === 'name');
    const namespaceCell = rows[0].find((cell) => cell.id === 'namespace');

    renderCell(nameCell.cell);
    expect(screen.getByRole('link', { name: 'my-pdb' })).toBeVisible();

    renderCell(namespaceCell.cell);
    expect(screen.getByRole('link', { name: 'production' })).toBeVisible();
  });

  it('should render selector match labels', () => {
    testData[0].obj = createMockPDB({
      spec: {
        minAvailable: 1,
        selector: {
          matchLabels: {
            app: 'frontend',
            tier: 'web',
          },
        },
      },
    });
    const rows = getDataViewRows(testData, testColumns);
    const selectorCell = rows[0].find((cell) => cell.id === 'selector');

    renderCell(selectorCell.cell);
    expect(screen.getByText(/app=frontend, tier=web/)).toBeVisible();
  });

  it('should render min available availability text', () => {
    testData[0].obj = createMockPDB({
      spec: { minAvailable: 2, selector: { matchLabels: {} } },
    });
    const rows = getDataViewRows(testData, testColumns);
    const availabilityCell = rows[0].find((cell) => cell.id === 'minAvailable');

    renderCell(availabilityCell.cell);
    expect(screen.getByText(/Min available 2/)).toBeVisible();
  });

  it('should render disruptions allowed count', () => {
    testData[0].obj = createMockPDB({
      status: {
        conditions: [],
        currentHealthy: 3,
        desiredHealthy: 2,
        disruptionsAllowed: 1,
      },
    });
    const rows = getDataViewRows(testData, testColumns);
    const disruptionsCell = rows[0].find((cell) => cell.id === 'disruptionsAllowed');

    renderCell(disruptionsCell.cell);
    expect(screen.getByText('1')).toBeVisible();
  });

  it('should render creation timestamp', () => {
    testData[0].obj = createMockPDB({
      metadata: {
        name: 'test-pdb',
        namespace: 'default',
        uid: 'uid',
        creationTimestamp: '2024-03-20T15:30:00Z',
      },
    });
    const rows = getDataViewRows(testData, testColumns);
    const createdCell = rows[0].find((cell) => cell.id === 'creationTimestamp');

    renderCell(createdCell.cell);
    expect(screen.getByText(/Mar 20, 2024/)).toBeVisible();
  });

  it('should render a row action menu control', () => {
    const rows = getDataViewRows(testData, testColumns);
    const actionsCell = rows[0].find((cell) => cell.id === '');

    renderCell(actionsCell.cell);
    expect(screen.getByRole('button', { name: /Actions/i })).toBeVisible();
  });

  it('should return a row for each PDB in the data set', () => {
    testData = [
      {
        obj: createMockPDB({ metadata: { name: 'pdb-one', namespace: 'ns1', uid: 'uid1' } }),
        rowData: undefined,
        activeColumnIDs: new Set(tableColumnInfo.map(({ id }) => id)),
        index: 0,
      },
      {
        obj: createMockPDB({ metadata: { name: 'pdb-two', namespace: 'ns2', uid: 'uid2' } }),
        rowData: undefined,
        activeColumnIDs: new Set(tableColumnInfo.map(({ id }) => id)),
        index: 1,
      },
    ];
    const rows = getDataViewRows(testData, testColumns);

    expect(rows).toHaveLength(2);
    renderCell(rows[0].find((cell) => cell.id === 'name').cell);
    expect(screen.getByRole('link', { name: 'pdb-one' })).toBeVisible();

    renderCell(rows[1].find((cell) => cell.id === 'name').cell);
    expect(screen.getByRole('link', { name: 'pdb-two' })).toBeVisible();
  });
});
