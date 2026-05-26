import { screen } from '@testing-library/react';
import type { ConsolePluginKind } from '@console/internal/module/k8s';
import { DASH } from '@console/shared/src/constants/ui';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import ConsolePluginBackendDetail from '../ConsolePluginBackendDetail';

const createConsolePlugin = (backend: ConsolePluginKind['spec']['backend']): ConsolePluginKind =>
  ({
    apiVersion: 'console.openshift.io/v1',
    kind: 'ConsolePlugin',
    metadata: {
      name: 'test-plugin',
    },
    spec: {
      displayName: 'Test Plugin',
      backend,
    },
  } as ConsolePluginKind);

describe('ConsolePluginBackendDetail', () => {
  it('should render ResourceLink when backend type is Service', () => {
    const plugin = createConsolePlugin({
      type: 'Service',
      service: {
        name: 'my-service',
        namespace: 'my-namespace',
        port: 9443,
      },
    });

    renderWithProviders(<ConsolePluginBackendDetail obj={plugin} />);

    const link = screen.getByRole('link', { name: 'my-service' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '/k8s/ns/my-namespace/services/my-service');
  });

  it('should render dash when backend type is not Service', () => {
    const plugin = createConsolePlugin({
      type: 'Deployment',
    } as ConsolePluginKind['spec']['backend']);

    renderWithProviders(<ConsolePluginBackendDetail obj={plugin} />);

    expect(screen.getByText(DASH)).toBeVisible();
  });

  it('should render dash when service is undefined', () => {
    const plugin = createConsolePlugin({
      type: 'Service',
    } as ConsolePluginKind['spec']['backend']);

    renderWithProviders(<ConsolePluginBackendDetail obj={plugin} />);

    expect(screen.getByText(DASH)).toBeVisible();
  });

  it('should display service name in ResourceLink', () => {
    const plugin = createConsolePlugin({
      type: 'Service',
      service: {
        name: 'backend-svc',
        namespace: 'openshift-console',
        port: 8080,
      },
    });

    renderWithProviders(<ConsolePluginBackendDetail obj={plugin} />);

    expect(screen.getByText('backend-svc')).toBeVisible();
  });

  it('should link to correct namespace in ResourceLink', () => {
    const plugin = createConsolePlugin({
      type: 'Service',
      service: {
        name: 'plugin-service',
        namespace: 'plugin-ns',
        port: 443,
      },
    });

    renderWithProviders(<ConsolePluginBackendDetail obj={plugin} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('/ns/plugin-ns/'));
  });
});
