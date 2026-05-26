import { screen } from '@testing-library/react';
import type { ConsolePluginKind } from '@console/internal/module/k8s';
import { DASH } from '@console/shared/src/constants/ui';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import ConsolePluginProxyDetail from '../ConsolePluginProxyDetail';

const createConsolePlugin = (proxy?: ConsolePluginKind['spec']['proxy']): ConsolePluginKind =>
  ({
    apiVersion: 'console.openshift.io/v1',
    kind: 'ConsolePlugin',
    metadata: {
      name: 'test-plugin',
    },
    spec: {
      displayName: 'Test Plugin',
      backend: { type: 'Service', service: { name: 'svc', namespace: 'ns', port: 443 } },
      proxy,
    },
  } as ConsolePluginKind);

describe('ConsolePluginProxyDetail', () => {
  it('should render dash when proxy is undefined', () => {
    const plugin = createConsolePlugin(undefined);

    renderWithProviders(<ConsolePluginProxyDetail obj={plugin} />);

    expect(screen.getByText(DASH)).toBeVisible();
  });

  it('should render dash when proxy is empty array', () => {
    const plugin = createConsolePlugin([]);

    renderWithProviders(<ConsolePluginProxyDetail obj={plugin} />);

    expect(screen.getByText(DASH)).toBeVisible();
  });

  it('should render ResourceLink for Service endpoint', () => {
    const plugin = createConsolePlugin([
      {
        alias: 'proxy-alias',
        endpoint: {
          type: 'Service',
          service: {
            name: 'proxy-service',
            namespace: 'proxy-namespace',
            port: 8080,
          },
        },
      },
    ]);

    renderWithProviders(<ConsolePluginProxyDetail obj={plugin} />);

    const link = screen.getByRole('link', { name: 'proxy-service' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '/k8s/ns/proxy-namespace/services/proxy-service');
  });

  it('should render multiple proxy services as list', () => {
    const plugin = createConsolePlugin([
      {
        alias: 'proxy-1',
        endpoint: {
          type: 'Service',
          service: { name: 'service-1', namespace: 'ns-1', port: 8080 },
        },
      },
      {
        alias: 'proxy-2',
        endpoint: {
          type: 'Service',
          service: { name: 'service-2', namespace: 'ns-2', port: 9090 },
        },
      },
    ]);

    renderWithProviders(<ConsolePluginProxyDetail obj={plugin} />);

    expect(screen.getByRole('link', { name: 'service-1' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'service-2' })).toBeVisible();
  });

  it('should render list element for proxy services', () => {
    const plugin = createConsolePlugin([
      {
        alias: 'proxy-1',
        endpoint: {
          type: 'Service',
          service: { name: 'my-service', namespace: 'my-ns', port: 443 },
        },
      },
    ]);

    renderWithProviders(<ConsolePluginProxyDetail obj={plugin} />);

    expect(screen.getByRole('list')).toBeVisible();
  });
});
