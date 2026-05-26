import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { PodDisruptionBudgetsPage } from '../PDBPage';

jest.mock('@console/internal/components/factory/ListPage/ListPageCreate', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

describe('PodDisruptionBudgetsPage', () => {
  it('should render the page heading when showTitle is true', () => {
    renderWithProviders(<PodDisruptionBudgetsPage namespace="default" showTitle mock />);

    expect(screen.getByRole('heading', { name: 'PodDisruptionBudgets' })).toBeVisible();
  });

  it('should not render a page heading when showTitle is false', () => {
    renderWithProviders(<PodDisruptionBudgetsPage namespace="default" showTitle={false} mock />);

    expect(screen.queryByRole('heading', { name: 'PodDisruptionBudgets' })).not.toBeInTheDocument();
  });

  it('should render Create PodDisruptionBudget button when not in mock mode', () => {
    renderWithProviders(<PodDisruptionBudgetsPage namespace="default" />);

    expect(screen.getByRole('button', { name: 'Create PodDisruptionBudget' })).toBeVisible();
  });

  it('should not render Create button when mock is true', () => {
    renderWithProviders(<PodDisruptionBudgetsPage namespace="default" mock />);

    expect(
      screen.queryByRole('button', { name: 'Create PodDisruptionBudget' }),
    ).not.toBeInTheDocument();
  });

  it('should show empty list message when mock mode returns no resources', () => {
    renderWithProviders(<PodDisruptionBudgetsPage namespace="default" mock />);

    expect(screen.getByText(/No PodDisruptionBudgets found/i)).toBeVisible();
  });
});
