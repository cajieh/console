import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { OAuthKind } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { OAuthConfigDetails } from '../OAuthConfigDetails';

const mockNavigate = jest.fn();

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@console/shared/src/hooks/useQueryParams', () => ({
  useQueryParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}));

jest.mock('@console/internal/components/utils/details-page', () => ({
  ResourceSummary: ({ children }: { children: React.ReactNode }) => (
    <div data-test="resource-summary">{children}</div>
  ),
}));

jest.mock('../IdentityProviders', () => ({
  IdentityProviders: () => <div>Identity Providers Table</div>,
}));

describe('OAuthConfigDetails', () => {
  const createMockOAuth = (overrides?: Partial<OAuthKind>): OAuthKind => ({
    apiVersion: 'config.openshift.io/v1',
    kind: 'OAuth',
    metadata: {
      name: 'cluster',
      uid: 'test-uid',
    },
    spec: {
      identityProviders: [],
      ...overrides?.spec,
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render OAuth details section heading', () => {
    const mockOAuth = createMockOAuth();
    renderWithProviders(<OAuthConfigDetails obj={mockOAuth} />);

    expect(screen.getByText('OAuth details')).toBeVisible();
  });

  it('should render Identity providers section heading', () => {
    const mockOAuth = createMockOAuth();
    renderWithProviders(<OAuthConfigDetails obj={mockOAuth} />);

    expect(screen.getByText('Identity providers')).toBeVisible();
  });

  it('should render Add dropdown button for identity providers', () => {
    const mockOAuth = createMockOAuth();
    renderWithProviders(<OAuthConfigDetails obj={mockOAuth} />);

    expect(screen.getByRole('button', { name: 'Add' })).toBeVisible();
  });

  it('should display access token max age when tokenConfig is present', () => {
    const mockOAuth = createMockOAuth({
      spec: {
        identityProviders: [],
        tokenConfig: {
          accessTokenMaxAgeSeconds: 86400,
        },
      },
    });
    renderWithProviders(<OAuthConfigDetails obj={mockOAuth} />);

    expect(screen.getByText('Access token max age')).toBeVisible();
    expect(screen.getByText('1d')).toBeVisible();
  });

  it('should open dropdown and show identity provider options when Add button is clicked', async () => {
    const user = userEvent.setup();
    const mockOAuth = createMockOAuth();
    renderWithProviders(<OAuthConfigDetails obj={mockOAuth} />);

    const addButton = screen.getByRole('button', { name: 'Add' });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeVisible();
    });

    expect(screen.getByRole('menuitem', { name: 'GitHub' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: 'LDAP' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: 'HTPasswd' })).toBeVisible();
  });

  it('should navigate to IDP settings page when dropdown item is selected', async () => {
    const user = userEvent.setup();
    const mockOAuth = createMockOAuth();
    renderWithProviders(<OAuthConfigDetails obj={mockOAuth} />);

    const addButton = screen.getByRole('button', { name: 'Add' });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeVisible();
    });

    const githubOption = screen.getByRole('menuitem', { name: 'GitHub' });
    await user.click(githubOption);

    expect(mockNavigate).toHaveBeenCalledWith('/settings/idp/github');
  });

  it('should render IdentityProviders component', () => {
    const mockOAuth = createMockOAuth();
    renderWithProviders(<OAuthConfigDetails obj={mockOAuth} />);

    expect(screen.getByText('Identity Providers Table')).toBeVisible();
  });
});
