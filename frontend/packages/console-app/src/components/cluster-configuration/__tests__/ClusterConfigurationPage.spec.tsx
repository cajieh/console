import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as reactRouter from 'react-router';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import ClusterConfigurationPage from '../ClusterConfigurationPage';
import type { ResolvedClusterConfigurationGroup, ResolvedClusterConfigurationItem } from '../types';
import useClusterConfigurationGroups from '../useClusterConfigurationGroups';
import useClusterConfigurationItems from '../useClusterConfigurationItems';

const mockNavigate = jest.fn();

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(() => ({ group: 'general' })),
  useNavigate: () => mockNavigate,
}));

const mockUseParams = reactRouter.useParams as jest.Mock;

jest.mock('../useClusterConfigurationGroups', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../useClusterConfigurationItems', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../ClusterConfigurationForm', () => ({
  __esModule: true,
  default: ({ items }: { items: ResolvedClusterConfigurationItem[] }) => (
    <div>Form with {items.length} items</div>
  ),
}));

jest.mock('@console/internal/components/utils/status-box', () => ({
  LoadingBox: () => <div role="status">Loading</div>,
}));

const mockUseClusterConfigurationGroups = useClusterConfigurationGroups as jest.Mock;
const mockUseClusterConfigurationItems = useClusterConfigurationItems as jest.Mock;

describe('ClusterConfigurationPage', () => {
  const mockGroups: ResolvedClusterConfigurationGroup[] = [
    { id: 'general', label: 'General' },
    { id: 'console', label: 'Console' },
  ];

  const mockItems: ResolvedClusterConfigurationItem[] = [
    {
      id: 'item1',
      groupId: 'general',
      label: 'Item 1',
      field: { type: 'text' },
    },
    {
      id: 'item2',
      groupId: 'console',
      label: 'Item 2',
      field: { type: 'checkbox' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state when data is not resolved', () => {
    mockUseClusterConfigurationGroups.mockReturnValue([[], false, []]);
    mockUseClusterConfigurationItems.mockReturnValue([[], false, []]);

    renderWithProviders(<ClusterConfigurationPage />);

    expect(screen.getByText('Loading')).toBeVisible();
  });

  it('should render page heading with title and help text', () => {
    mockUseClusterConfigurationGroups.mockReturnValue([mockGroups, true, []]);
    mockUseClusterConfigurationItems.mockReturnValue([mockItems, true, []]);

    renderWithProviders(<ClusterConfigurationPage />);

    expect(screen.getByRole('heading', { name: 'Cluster configuration' })).toBeVisible();
    expect(screen.getByText(/Set cluster-wide configuration/)).toBeVisible();
  });

  it('should render empty state when no configuration groups are available', () => {
    mockUseClusterConfigurationGroups.mockReturnValue([[], true, []]);
    mockUseClusterConfigurationItems.mockReturnValue([[], true, []]);

    renderWithProviders(<ClusterConfigurationPage />);

    expect(screen.getByRole('heading', { name: 'Insufficient permissions' })).toBeVisible();
    expect(screen.getByText(/You do not have sufficient permissions/)).toBeVisible();
  });

  it('should render tabs for each configuration group', () => {
    mockUseClusterConfigurationGroups.mockReturnValue([mockGroups, true, []]);
    mockUseClusterConfigurationItems.mockReturnValue([mockItems, true, []]);

    renderWithProviders(<ClusterConfigurationPage />);

    expect(screen.getByRole('tab', { name: 'General' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Console' })).toBeVisible();
  });

  it('should navigate to selected tab when clicked', async () => {
    mockUseClusterConfigurationGroups.mockReturnValue([mockGroups, true, []]);
    mockUseClusterConfigurationItems.mockReturnValue([mockItems, true, []]);
    const user = userEvent.setup();

    renderWithProviders(<ClusterConfigurationPage />);

    const consoleTab = screen.getByRole('tab', { name: 'Console' });
    await user.click(consoleTab);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cluster-configuration/console', {
        replace: true,
      });
    });
  });

  it('should render ClusterConfigurationForm for each tab content', () => {
    mockUseClusterConfigurationGroups.mockReturnValue([mockGroups, true, []]);
    mockUseClusterConfigurationItems.mockReturnValue([mockItems, true, []]);

    renderWithProviders(<ClusterConfigurationPage />);

    expect(screen.getAllByText('Form with 1 items')).toHaveLength(2);
  });

  it('should show warning when group is not found', () => {
    mockUseParams.mockReturnValue({ group: 'nonexistent' });
    mockUseClusterConfigurationGroups.mockReturnValue([mockGroups, true, []]);
    mockUseClusterConfigurationItems.mockReturnValue([mockItems, true, []]);

    renderWithProviders(<ClusterConfigurationPage />);

    expect(screen.getByText(/nonexistent not found/)).toBeVisible();
  });
});
