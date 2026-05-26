import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import VolumeSnapshotContentPage from '../volume-snapshot-content';

jest.mock('@console/internal/components/factory/ListPage/ListPageCreate', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

describe('VolumeSnapshotContentPage', () => {
  it('should render the page heading when showTitle is true', () => {
    renderWithProviders(<VolumeSnapshotContentPage showTitle />);

    expect(screen.getByRole('heading', { name: 'VolumeSnapshotContents' })).toBeVisible();
  });

  it('should not render a page heading when showTitle is false', () => {
    renderWithProviders(<VolumeSnapshotContentPage showTitle={false} />);

    expect(
      screen.queryByRole('heading', { name: 'VolumeSnapshotContents' }),
    ).not.toBeInTheDocument();
  });

  it('should render Create VolumeSnapshotContent button when canCreate is true', () => {
    renderWithProviders(<VolumeSnapshotContentPage canCreate />);

    expect(screen.getByRole('button', { name: 'Create VolumeSnapshotContent' })).toBeVisible();
  });

  it('should not render Create button when canCreate is false', () => {
    renderWithProviders(<VolumeSnapshotContentPage canCreate={false} />);

    expect(
      screen.queryByRole('button', { name: 'Create VolumeSnapshotContent' }),
    ).not.toBeInTheDocument();
  });
});
