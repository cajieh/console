import { render, screen, within } from '@testing-library/react';
import type { IdentityProvider, OAuthKind } from '@console/internal/module/k8s';
import { IdentityProviders } from '../IdentityProviders';

const mockLaunchModal = jest.fn();

jest.mock('@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay', () => ({
  useOverlay: () => mockLaunchModal,
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel', () => ({
  useK8sModel: () => [{ kind: 'OAuth', apiVersion: 'config.openshift.io/v1' }],
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref', () => ({
  getGroupVersionKindForResource: () => ({
    group: 'config.openshift.io',
    version: 'v1',
    kind: 'OAuth',
  }),
}));

jest.mock('@console/internal/components/utils/status-box', () => ({
  EmptyBox: ({ label }: { label: string }) => <div>{label}</div>,
}));

jest.mock('@console/internal/components/utils/kebab', () => ({
  Kebab: ({ options }: { options: { label: string; callback: () => void }[] }) => (
    <button onClick={() => options[0]?.callback()} aria-label="Actions" type="button">
      Actions
    </button>
  ),
}));

jest.mock('@console/internal/components/modals/remove-idp-modal', () => ({
  RemoveIdentityProviderModal: jest.fn(),
}));

describe('IdentityProviders', () => {
  const mockOAuthObj: OAuthKind = {
    apiVersion: 'config.openshift.io/v1',
    kind: 'OAuth',
    metadata: {
      name: 'cluster',
      uid: 'test-uid',
    },
    spec: {
      identityProviders: [],
    },
  };

  const createMockIdentityProvider = (
    name: string,
    type: string,
    mappingMethod?: string,
  ): IdentityProvider => ({
    name,
    type,
    mappingMethod,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty box when no identity providers exist', () => {
    render(<IdentityProviders identityProviders={[]} obj={mockOAuthObj} />);

    expect(screen.getByText('Identity providers')).toBeVisible();
  });

  it('should render table with identity providers', () => {
    const providers = [
      createMockIdentityProvider('github-idp', 'GitHub'),
      createMockIdentityProvider('ldap-idp', 'LDAP', 'add'),
    ];

    render(<IdentityProviders identityProviders={providers} obj={mockOAuthObj} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('github-idp')).toBeVisible();
    expect(screen.getByText('ldap-idp')).toBeVisible();
  });

  it('should render table headers for Name, Type, and Mapping method', () => {
    const providers = [createMockIdentityProvider('test-idp', 'GitHub')];

    render(<IdentityProviders identityProviders={providers} obj={mockOAuthObj} />);

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Type' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Mapping method' })).toBeVisible();
  });

  it('should display claim as default mapping method when not specified', () => {
    const providers = [createMockIdentityProvider('htpasswd-idp', 'HTPasswd')];

    render(<IdentityProviders identityProviders={providers} obj={mockOAuthObj} />);

    const row = screen.getByRole('row', { name: /htpasswd-idp/i });
    expect(within(row).getByText('claim')).toBeVisible();
  });

  it('should display specified mapping method', () => {
    const providers = [createMockIdentityProvider('oidc-idp', 'OpenID', 'add')];

    render(<IdentityProviders identityProviders={providers} obj={mockOAuthObj} />);

    const row = screen.getByRole('row', { name: /oidc-idp/i });
    expect(within(row).getByText('add')).toBeVisible();
  });

  it('should render actions button for identity provider rows', () => {
    const providers = [createMockIdentityProvider('google-idp', 'Google', 'lookup')];

    render(<IdentityProviders identityProviders={providers} obj={mockOAuthObj} />);

    expect(screen.getByRole('button', { name: 'Actions' })).toBeVisible();
  });

  it('should render multiple identity providers in order', () => {
    const providers = [
      createMockIdentityProvider('first-idp', 'GitHub'),
      createMockIdentityProvider('second-idp', 'LDAP'),
      createMockIdentityProvider('third-idp', 'OpenID'),
    ];

    render(<IdentityProviders identityProviders={providers} obj={mockOAuthObj} />);

    const rows = screen.getAllByRole('row');
    // First row is header, subsequent rows are data rows
    expect(rows).toHaveLength(4);
    expect(screen.getByText('first-idp')).toBeVisible();
    expect(screen.getByText('second-idp')).toBeVisible();
    expect(screen.getByText('third-idp')).toBeVisible();
  });
});
