import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClusterConfigurationFieldType } from '@console/dynamic-plugin-sdk/src';
import ClusterConfigurationTextField from '../ClusterConfigurationTextField';
import type { ResolvedClusterConfigurationItem } from '../types';

jest.mock('@console/shared/src/components/cluster-configuration/FormLayout', () => ({
  FormLayout: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../hooks', () => ({
  useDebounceCallback: (callback: () => void) => callback,
}));

describe('ClusterConfigurationTextField', () => {
  const createMockItem = (
    overrides?: Partial<ResolvedClusterConfigurationItem>,
  ): ResolvedClusterConfigurationItem => ({
    id: 'test-text-field',
    groupId: 'test-group',
    label: 'Test Text Field Label',
    description: 'Test text field description',
    field: {
      type: ClusterConfigurationFieldType.text,
    },
    readonly: false,
    ...overrides,
  });

  const mockTextField = {
    type: ClusterConfigurationFieldType.text,
    defaultValue: '',
  };

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the text field with label', () => {
    const item = createMockItem();
    render(<ClusterConfigurationTextField item={item} field={mockTextField} />);

    expect(screen.getByText('Test Text Field Label')).toBeVisible();
  });

  it('should render the description as helper text', () => {
    const item = createMockItem({
      description: 'Enter your cluster configuration value',
    });
    render(<ClusterConfigurationTextField item={item} field={mockTextField} />);

    expect(screen.getByText('Enter your cluster configuration value')).toBeVisible();
  });

  it('should render a text input element', () => {
    const item = createMockItem();
    render(<ClusterConfigurationTextField item={item} field={mockTextField} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render with default value from field prop', () => {
    const item = createMockItem();
    const fieldWithDefault = {
      ...mockTextField,
      defaultValue: 'initial value',
    };
    render(<ClusterConfigurationTextField item={item} field={fieldWithDefault} />);

    expect(screen.getByRole('textbox')).toHaveValue('initial value');
  });

  it('should update value when user types', async () => {
    const user = userEvent.setup();
    const item = createMockItem();
    render(<ClusterConfigurationTextField item={item} field={mockTextField} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'new value');

    await waitFor(() => {
      expect(input).toHaveValue('new value');
    });
  });

  it('should disable input when readonly is true', () => {
    const item = createMockItem({
      readonly: true,
    });
    render(<ClusterConfigurationTextField item={item} field={mockTextField} />);

    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
