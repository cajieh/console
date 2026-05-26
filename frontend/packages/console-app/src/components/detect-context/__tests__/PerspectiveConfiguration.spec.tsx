import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fromJS, Map as ImmutableMap } from 'immutable';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import { thunk } from 'redux-thunk';
import storeHandler from '@console/dynamic-plugin-sdk/src/app/storeHandler';
import { getReferenceForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import * as k8sUtilsModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-utils';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import type { RootState } from '@console/internal/redux';
import { baseReducers } from '@console/internal/redux';
import { CONSOLE_OPERATOR_CONFIG_NAME } from '@console/shared/src/constants/resource';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import * as consoleFetchModule from '@console/shared/src/utils/console-fetch';
import PerspectiveConfiguration from '../PerspectiveConfiguration';

const mockFireTelemetryEvent = jest.fn();

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => mockFireTelemetryEvent,
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'),
  k8sGet: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-utils', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-utils'),
  k8sWatch: jest.fn(),
}));

jest.mock('@console/shared/src/utils/console-fetch', () => ({
  ...jest.requireActual('@console/shared/src/utils/console-fetch'),
  coFetchJSON: jest.fn(),
}));

const k8sGetMock = k8sResourceModule.k8sGet as jest.Mock;
const k8sWatchMock = k8sUtilsModule.k8sWatch as jest.Mock;
const coFetchJSONMock = consoleFetchModule.coFetchJSON as jest.Mock;

const mockConsoleConfig = {
  apiVersion: 'operator.openshift.io/v1',
  kind: 'Console',
  metadata: { name: CONSOLE_OPERATOR_CONFIG_NAME },
  spec: {
    customization: {
      perspectives: [
        {
          id: 'admin',
          visibility: {
            state: 'Enabled',
          },
        },
      ],
    },
  },
};

const rootReducer = combineReducers(baseReducers);

const k8sModelsInitialState: Partial<RootState> = {
  k8s: fromJS({
    RESOURCES: {
      models: ImmutableMap<string, unknown>().set(
        getReferenceForModel(ConsoleOperatorConfigModel),
        ConsoleOperatorConfigModel,
      ),
      inFlight: false,
      loaded: true,
    },
  }),
};

/** K8s watch hooks dispatch thunks; default renderWithProviders store does not include thunk middleware. */
const setupStoreWithThunk = (initialState?: Partial<RootState>) => {
  const store = createStore(rootReducer, initialState, applyMiddleware(thunk));
  storeHandler.setStore(store);
  return store;
};

const wsMock = {
  onclose: () => wsMock,
  ondestroy: () => wsMock,
  onbulkmessage: () => wsMock,
  destroy: () => wsMock,
};

describe('PerspectiveConfiguration', () => {
  const renderPerspectiveConfiguration = async (readonly = false) => {
    renderWithProviders(<PerspectiveConfiguration readonly={readonly} />, {
      store: setupStoreWithThunk(k8sModelsInitialState),
    });
    await waitFor(() => {
      expect(screen.getByText('Perspectives')).toBeVisible();
    });
    await waitFor(() => {
      expect(screen.getByText('Core platform')).toBeVisible();
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    k8sGetMock.mockResolvedValue(mockConsoleConfig);
    k8sWatchMock.mockReturnValue(wsMock);
    coFetchJSONMock.mockResolvedValue(mockConsoleConfig);
    mockFireTelemetryEvent.mockClear();
  });

  it('should render the Perspectives form section with all perspective extensions', async () => {
    await renderPerspectiveConfiguration();

    expect(screen.getByText('Developer')).toBeVisible();
  });

  it('should render visibility select dropdowns for each perspective', async () => {
    await renderPerspectiveConfiguration();

    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('should disable dropdowns when readonly prop is true', async () => {
    await renderPerspectiveConfiguration(true);

    screen.getAllByRole('button').forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('should disable dropdowns when console config has error', async () => {
    k8sGetMock.mockRejectedValue(new Error('Config load failed'));

    renderWithProviders(<PerspectiveConfiguration readonly={false} />, {
      store: setupStoreWithThunk(k8sModelsInitialState),
    });

    await waitFor(() => {
      screen.getAllByRole('button').forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  it('should display load error when console config fails to load', async () => {
    k8sGetMock.mockRejectedValue(new Error('Failed to load configuration'));

    renderWithProviders(<PerspectiveConfiguration readonly={false} />, {
      store: setupStoreWithThunk(k8sModelsInitialState),
    });

    expect(
      await screen.findByText('Failed to load configuration', {}, { timeout: 3000 }),
    ).toBeVisible();
  });

  it('should open dropdown and show visibility options when clicked', async () => {
    const user = userEvent.setup();
    await renderPerspectiveConfiguration();

    await user.click(screen.getAllByRole('button')[0]);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeVisible();
    });

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(screen.getByRole('option', { name: /Enabled/i })).toBeVisible();
    expect(screen.getByRole('option', { name: /Disabled/i })).toBeVisible();
    expect(
      screen.getByRole('option', { name: /Only visible for privileged users/i }),
    ).toBeVisible();
    expect(
      screen.getByRole('option', { name: /Only visible for unprivileged users/i }),
    ).toBeVisible();
  });

  it('should fire telemetry event when perspective visibility is changed', async () => {
    const user = userEvent.setup();
    await renderPerspectiveConfiguration();

    await user.click(screen.getAllByRole('button')[0]);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeVisible();
    });

    await user.click(screen.getByRole('option', { name: /Disabled/i }));

    await waitFor(() => {
      expect(mockFireTelemetryEvent).toHaveBeenCalledWith(
        'Console cluster perspective configuration changed',
        expect.objectContaining({
          customize: 'Perspective',
          id: 'admin',
          name: 'Core platform',
          visibility: 'Disabled',
        }),
      );
    });
  });

  it('should call patchConsoleOperatorConfig when visibility is changed', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderPerspectiveConfiguration();

    await user.click(screen.getAllByRole('button')[0]);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeVisible();
    });

    await user.click(screen.getByRole('option', { name: /Disabled/i }));

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(coFetchJSONMock).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });

  it('should display save status after patch operation completes', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderPerspectiveConfiguration();

    await user.click(screen.getAllByRole('button')[0]);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeVisible();
    });

    await user.click(screen.getByRole('option', { name: /Disabled/i }));

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('success-alert')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});
