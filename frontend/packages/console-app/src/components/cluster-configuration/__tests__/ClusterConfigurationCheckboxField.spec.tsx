import { render, screen } from '@testing-library/react';
import { ClusterConfigurationFieldType } from '@console/dynamic-plugin-sdk/src';
import ClusterConfigurationCheckboxField from '../ClusterConfigurationCheckboxField';
import type { ResolvedClusterConfigurationItem } from '../types';

jest.mock('@console/shared/src/components/cluster-configuration/FormLayout', () => ({
  FormLayout: ({ children }: { children: React.ReactNode }) => children,
}));

describe('ClusterConfigurationCheckboxField', () => {
  const createMockItem = (
    overrides?: Partial<ResolvedClusterConfigurationItem>,
  ): ResolvedClusterConfigurationItem => ({
    id: 'test-checkbox-field',
    groupId: 'test-group',
    label: 'Test Checkbox Label',
    description: 'Test checkbox description',
    field: {
      type: ClusterConfigurationFieldType.checkbox,
    },
    readonly: false,
    ...overrides,
  });

  const mockCheckboxField = {
    type: ClusterConfigurationFieldType.checkbox,
  };

  it('should render the checkbox field with label', () => {
    const item = createMockItem();
    render(<ClusterConfigurationCheckboxField item={item} field={mockCheckboxField} />);

    expect(screen.getByText('Test Checkbox Label')).toBeVisible();
    expect(screen.getByRole('checkbox')).toBeVisible();
  });

  it('should render the description as helper text', () => {
    const item = createMockItem({
      description: 'Enable this feature to improve performance',
    });
    render(<ClusterConfigurationCheckboxField item={item} field={mockCheckboxField} />);

    expect(screen.getByText('Enable this feature to improve performance')).toBeVisible();
  });

  it('should render custom label and description', () => {
    const item = createMockItem({
      id: 'custom-feature-toggle',
      label: 'Custom Feature Toggle',
      description: 'Toggle this to enable the custom feature',
    });
    render(<ClusterConfigurationCheckboxField item={item} field={mockCheckboxField} />);

    expect(screen.getByText('Custom Feature Toggle')).toBeVisible();
    expect(screen.getByText('Toggle this to enable the custom feature')).toBeVisible();
    expect(screen.getByRole('checkbox')).toBeVisible();
  });
});
