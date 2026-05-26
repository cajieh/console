import { screen } from '@testing-library/react';
import type { VolumeSnapshotClassKind } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { isDefaultSnapshotClass, VolumeSnapshotClassPage } from '../volume-snapshot-class';

jest.mock('@console/internal/components/factory/ListPage/ListPageCreate', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

describe('VolumeSnapshotClassPage', () => {
  it('should render the page heading when showTitle is true', () => {
    renderWithProviders(<VolumeSnapshotClassPage showTitle />);

    expect(screen.getByRole('heading', { name: 'VolumeSnapshotClasses' })).toBeVisible();
  });

  it('should not render a page heading when showTitle is false', () => {
    renderWithProviders(<VolumeSnapshotClassPage showTitle={false} />);

    expect(
      screen.queryByRole('heading', { name: 'VolumeSnapshotClasses' }),
    ).not.toBeInTheDocument();
  });

  it('should render Create VolumeSnapshotClass button when canCreate is true', () => {
    renderWithProviders(<VolumeSnapshotClassPage canCreate />);

    expect(screen.getByRole('button', { name: 'Create VolumeSnapshotClass' })).toBeVisible();
  });

  it('should not render Create button when canCreate is false', () => {
    renderWithProviders(<VolumeSnapshotClassPage canCreate={false} />);

    expect(
      screen.queryByRole('button', { name: 'Create VolumeSnapshotClass' }),
    ).not.toBeInTheDocument();
  });
});

describe('isDefaultSnapshotClass', () => {
  it('should return true when snapshot class has default annotation set to true', () => {
    const defaultClass: VolumeSnapshotClassKind = {
      apiVersion: 'snapshot.storage.k8s.io/v1',
      kind: 'VolumeSnapshotClass',
      metadata: {
        name: 'default-class',
        annotations: {
          'snapshot.storage.kubernetes.io/is-default-class': 'true',
        },
      },
      driver: 'test-driver',
      deletionPolicy: 'Delete',
    };

    expect(isDefaultSnapshotClass(defaultClass)).toBe(true);
  });

  it('should return false when snapshot class has no default annotation', () => {
    const nonDefaultClass: VolumeSnapshotClassKind = {
      apiVersion: 'snapshot.storage.k8s.io/v1',
      kind: 'VolumeSnapshotClass',
      metadata: {
        name: 'non-default-class',
      },
      driver: 'test-driver',
      deletionPolicy: 'Delete',
    };

    expect(isDefaultSnapshotClass(nonDefaultClass)).toBe(false);
  });
});
