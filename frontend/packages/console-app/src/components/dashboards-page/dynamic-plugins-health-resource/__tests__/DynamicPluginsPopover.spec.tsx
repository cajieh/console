import { screen } from '@testing-library/react';
import { Map as ImmutableMap } from 'immutable';
import type { LoadedDynamicPluginInfo, FailedDynamicPluginInfo } from '@console/plugin-sdk/src';
import { usePluginInfo } from '@console/plugin-sdk/src/api/usePluginInfo';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import DynamicPluginsPopover from '../DynamicPluginsPopover';

jest.mock('@console/plugin-sdk/src/api/usePluginInfo', () => ({
  usePluginInfo: jest.fn(),
}));

jest.mock('../NotLoadedDynamicPlugins', () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => label,
}));

jest.mock('@console/shared/src/components/dashboard/status-card/StatusPopup', () => ({
  StatusPopupSection: ({
    firstColumn,
    secondColumn,
    children,
  }: {
    firstColumn: string;
    secondColumn: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <>
      {firstColumn}
      {secondColumn}
      {children}
    </>
  ),
}));

const mockUsePluginInfo = usePluginInfo as jest.Mock;

const createLoadedPlugin = (name: string, enabled = true): LoadedDynamicPluginInfo => ({
  status: 'loaded',
  pluginName: name,
  manifest: { name, version: '1.0.0', extensions: [] },
  enabled,
});

const createFailedPlugin = (name: string): FailedDynamicPluginInfo => ({
  status: 'failed',
  pluginName: name,
  errorMessage: 'Failed to load',
  errorCause: 'Error',
});

describe('DynamicPluginsPopover', () => {
  const mockConsolePlugins = {
    data: [{ metadata: { name: 'plugin-a' } }, { metadata: { name: 'plugin-b' } }],
    loaded: true,
    loadError: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.SERVER_FLAGS = { k8sMode: 'on-cluster' } as typeof window.SERVER_FLAGS;
  });

  it('should render description text about dynamic plugins', () => {
    mockUsePluginInfo.mockReturnValue([]);

    renderWithProviders(<DynamicPluginsPopover consolePlugins={mockConsolePlugins} />);

    expect(screen.getByText(/A dynamic plugin allows you to add custom pages/)).toBeVisible();
  });

  it('should render loaded plugins count', () => {
    mockUsePluginInfo.mockReturnValue([
      createLoadedPlugin('plugin-a'),
      createLoadedPlugin('plugin-b'),
    ]);

    renderWithProviders(<DynamicPluginsPopover consolePlugins={mockConsolePlugins} />);

    expect(screen.getByText(/Loaded plugins/)).toBeVisible();
    expect(screen.getByText(/2\/2 enabled/)).toBeVisible();
  });

  it('should show failed plugins section when there are failed plugins', () => {
    mockUsePluginInfo.mockReturnValue([
      createLoadedPlugin('plugin-a'),
      createFailedPlugin('plugin-b'),
    ]);

    renderWithProviders(<DynamicPluginsPopover consolePlugins={mockConsolePlugins} />);

    expect(screen.getByText('Failed plugins')).toBeVisible();
  });

  it('should not show failed plugins section when no plugins failed', () => {
    mockUsePluginInfo.mockReturnValue([createLoadedPlugin('plugin-a')]);

    renderWithProviders(<DynamicPluginsPopover consolePlugins={mockConsolePlugins} />);

    expect(screen.queryByText('Failed plugins')).not.toBeInTheDocument();
  });

  it('should show CSP violations warning when plugins have violations', () => {
    mockUsePluginInfo.mockReturnValue([createLoadedPlugin('plugin-a')]);

    renderWithProviders(<DynamicPluginsPopover consolePlugins={mockConsolePlugins} />, {
      initialState: {
        UI: ImmutableMap({
          pluginCSPViolations: { 'plugin-a': true },
        }),
      },
    });

    expect(
      screen.getByText(/One or more plugins might have Content Security Policy violations/),
    ).toBeVisible();
  });

  it('should render View all link to console plugins page', () => {
    mockUsePluginInfo.mockReturnValue([]);

    renderWithProviders(<DynamicPluginsPopover consolePlugins={mockConsolePlugins} />);

    const viewAllLink = screen.getByRole('link', { name: 'View all' });
    expect(viewAllLink).toBeVisible();
    expect(viewAllLink).toHaveAttribute(
      'href',
      '/k8s/cluster/operator.openshift.io~v1~Console/cluster/console-plugins',
    );
  });

  it('should show only enabled plugins count in normal mode', () => {
    mockUsePluginInfo.mockReturnValue([
      createLoadedPlugin('plugin-a', true),
      createLoadedPlugin('plugin-b', false),
    ]);

    renderWithProviders(<DynamicPluginsPopover consolePlugins={mockConsolePlugins} />);

    expect(screen.getByText(/1\/2 enabled/)).toBeVisible();
  });
});
