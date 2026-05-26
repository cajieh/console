import { Map as ImmutableMap } from 'immutable';
import type { AdmissionWebhookWarning } from '@console/dynamic-plugin-sdk/src/app/redux-types';
import { useToast } from '@console/shared/src/components/toast/useToast';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { AdmissionWebhookWarningNotifications } from '../AdmissionWebhookWarningNotifications';

jest.mock('@console/internal/components/utils/documentation', () => ({
  documentationURLs: { admissionWebhookWarning: 'admission-webhook-warning' },
  getDocumentationURL: jest.fn(() => 'https://docs.example.com'),
}));

jest.mock('@console/shared/src/components/toast/useToast', () => ({
  useToast: jest.fn(),
}));

const mockUseToast = useToast as jest.Mock;

const createInitialState = (warnings: ImmutableMap<string, AdmissionWebhookWarning>) => ({
  sdkCore: {
    user: {},
    userResource: null,
    admissionWebhookWarnings: warnings,
  },
});

describe('AdmissionWebhookWarningNotifications', () => {
  const mockAddToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToast.mockReturnValue({ addToast: mockAddToast });
  });

  it('should render without crashing when no warnings exist', () => {
    expect(() =>
      renderWithProviders(<AdmissionWebhookWarningNotifications />, {
        initialState: createInitialState(ImmutableMap<string, AdmissionWebhookWarning>()),
      }),
    ).not.toThrow();
  });

  it('should not call addToast when there are no warnings', () => {
    renderWithProviders(<AdmissionWebhookWarningNotifications />, {
      initialState: createInitialState(ImmutableMap<string, AdmissionWebhookWarning>()),
    });

    expect(mockAddToast).not.toHaveBeenCalled();
  });

  it('should call addToast for each admission webhook warning', () => {
    const warnings = ImmutableMap<string, AdmissionWebhookWarning>({
      'warning-1': { kind: 'Pod', name: 'test-pod', warning: 'Violates security policy' },
      'warning-2': { kind: 'Deployment', name: 'test-deployment', warning: 'Missing labels' },
    });

    renderWithProviders(<AdmissionWebhookWarningNotifications />, {
      initialState: createInitialState(warnings),
    });

    expect(mockAddToast).toHaveBeenCalledTimes(2);
  });

  it('should dispatch removeAdmissionWebhookWarning for each warning', () => {
    const warnings = ImmutableMap<string, AdmissionWebhookWarning>({
      'warning-1': { kind: 'Pod', name: 'test-pod', warning: 'Violates security policy' },
    });

    const { store } = renderWithProviders(<AdmissionWebhookWarningNotifications />, {
      initialState: createInitialState(warnings),
    });

    expect(store.getState().sdkCore.admissionWebhookWarnings?.size).toBe(0);
  });

  it('should show toast with warning variant and correct title', () => {
    const warnings = ImmutableMap<string, AdmissionWebhookWarning>({
      'warning-1': { kind: 'Pod', name: 'test-pod', warning: 'Violates security policy' },
    });

    renderWithProviders(<AdmissionWebhookWarningNotifications />, {
      initialState: createInitialState(warnings),
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'warning',
        title: 'Admission Webhook Warning',
        dismissible: true,
        timeout: true,
      }),
    );
  });

  it('should include Learn more action in toast', () => {
    const warnings = ImmutableMap<string, AdmissionWebhookWarning>({
      'warning-1': { kind: 'Pod', name: 'test-pod', warning: 'Violates security policy' },
    });

    renderWithProviders(<AdmissionWebhookWarningNotifications />, {
      initialState: createInitialState(warnings),
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          expect.objectContaining({
            label: 'Learn more',
            dismiss: true,
            dataTest: 'admission-webhook-warning-learn-more',
          }),
        ]),
      }),
    );
  });

  it('should open documentation URL when Learn more action is triggered', () => {
    const warnings = ImmutableMap<string, AdmissionWebhookWarning>({
      'warning-1': { kind: 'Pod', name: 'test-pod', warning: 'Violates security policy' },
    });
    const mockWindowOpen = jest.spyOn(window, 'open').mockImplementation(() => null);

    renderWithProviders(<AdmissionWebhookWarningNotifications />, {
      initialState: createInitialState(warnings),
    });

    const toastCall = mockAddToast.mock.calls[0][0];
    const learnMoreAction = toastCall.actions[0];
    learnMoreAction.callback();

    expect(mockWindowOpen).toHaveBeenCalledWith('https://docs.example.com', '_blank');
    mockWindowOpen.mockRestore();
  });
});
