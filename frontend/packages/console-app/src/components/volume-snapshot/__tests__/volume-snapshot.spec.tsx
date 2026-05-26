import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { VolumeSnapshotPage } from '../volume-snapshot';

jest.mock('@console/internal/components/factory/ListPage/ListPageCreate', () => ({
  __esModule: true,
  ListPageCreateLink: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

describe('VolumeSnapshotPage', () => {
  beforeEach(() => {
    window.SERVER_FLAGS = { k8sMode: 'on-cluster' } as typeof window.SERVER_FLAGS;
  });

  it('should render the page heading when showTitle is true', () => {
    renderWithProviders(<VolumeSnapshotPage namespace="default" showTitle mock />);

    expect(screen.getByRole('heading', { name: 'VolumeSnapshots' })).toBeVisible();
  });

  it('should not render a page heading when showTitle is false', () => {
    renderWithProviders(<VolumeSnapshotPage namespace="default" showTitle={false} mock />);

    expect(screen.queryByRole('heading', { name: 'VolumeSnapshots' })).not.toBeInTheDocument();
  });

  it('should render Create VolumeSnapshot link when canCreate is true', () => {
    renderWithProviders(<VolumeSnapshotPage namespace="default" canCreate />);

    const createLink = screen.getByRole('link', { name: 'Create VolumeSnapshot' });
    expect(createLink).toBeVisible();
    expect(createLink).toHaveAttribute('href', '/k8s/ns/default/volumesnapshots/~new/form');
  });

  it('should not render Create link when canCreate is false', () => {
    renderWithProviders(<VolumeSnapshotPage namespace="default" canCreate={false} mock />);

    expect(screen.queryByRole('link', { name: 'Create VolumeSnapshot' })).not.toBeInTheDocument();
  });

  it('should not render Create link when mock is true', () => {
    renderWithProviders(<VolumeSnapshotPage namespace="default" canCreate mock />);

    expect(screen.queryByRole('link', { name: 'Create VolumeSnapshot' })).not.toBeInTheDocument();
  });

  it('should show empty list message when mock mode returns no resources', () => {
    renderWithProviders(<VolumeSnapshotPage namespace="default" mock />);

    expect(screen.getByText(/No VolumeSnapshots found/i)).toBeVisible();
  });
});
