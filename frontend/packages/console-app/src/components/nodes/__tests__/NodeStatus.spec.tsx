import { render, screen } from '@testing-library/react';
import type { NodeKind } from '@console/internal/module/k8s';
import NodeStatus, { NodeStatusWithExtensions } from '../NodeStatus';
import type { GetNodeStatusExtensions } from '../useNodeStatusExtensions';

jest.mock('../useNodeStatusExtensions', () => ({
  useNodeStatusExtensions: jest.fn(() => () => ({
    popoverContent: [],
    secondaryStatuses: [],
  })),
}));

jest.mock('@console/shared/src/components/status/Status', () => ({
  Status: ({ status }: { status: string }) => <span role="status">{status}</span>,
}));

jest.mock('@console/shared/src/components/status/SecondaryStatus', () => ({
  SecondaryStatus: ({ status }: { status: string[] }) => <span>{status?.join(', ')}</span>,
}));

jest.mock('@console/dynamic-plugin-sdk/src/app/components/status/PopoverStatus', () => ({
  __esModule: true,
  default: ({
    statusBody,
    children,
  }: {
    statusBody: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div>
      {statusBody}
      {children}
    </div>
  ),
}));

jest.mock('@console/shared/src/components/error/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover', () => ({
  __esModule: true,
  default: ({ title, description }: { title: string; description: string }) => (
    <div aria-label={title}>{description}</div>
  ),
}));

jest.mock('../../../status/node', () => ({
  nodeStatus: jest.fn((node: NodeKind) =>
    node.status?.conditions?.some((c) => c.type === 'Ready' && c.status === 'True')
      ? 'Ready'
      : 'Not Ready',
  ),
}));

describe('NodeStatus', () => {
  const createMockNode = (overrides?: Partial<NodeKind>): NodeKind => ({
    apiVersion: 'v1',
    kind: 'Node',
    metadata: {
      name: 'test-node',
      uid: 'test-uid',
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          lastHeartbeatTime: '2024-01-01T00:00:00Z',
          lastTransitionTime: '2024-01-01T00:00:00Z',
          reason: 'KubeletReady',
          message: 'kubelet is posting ready status',
        },
      ],
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the node status as Ready when node is ready', () => {
    const node = createMockNode();
    render(<NodeStatus node={node} />);

    expect(screen.getByText('Ready')).toBeVisible();
  });

  it('should render the node status as Not Ready when node is not ready', () => {
    const node = createMockNode({
      status: {
        conditions: [
          {
            type: 'Ready',
            status: 'False',
            lastHeartbeatTime: '2024-01-01T00:00:00Z',
            lastTransitionTime: '2024-01-01T00:00:00Z',
            reason: 'KubeletNotReady',
            message: 'kubelet is not ready',
          },
        ],
      },
    });
    render(<NodeStatus node={node} />);

    expect(screen.getByText('Not Ready')).toBeVisible();
  });

  it('should render secondary status when provided by extensions', () => {
    const mockStatusExtensions: GetNodeStatusExtensions = () => ({
      popoverContent: [],
      secondaryStatuses: ['Updating', 'Draining'],
    });

    const node = createMockNode();
    render(<NodeStatusWithExtensions node={node} statusExtensions={mockStatusExtensions} />);

    expect(screen.getByText('Updating, Draining')).toBeVisible();
  });

  it('should render popover status when popover content is provided', () => {
    const mockStatusExtensions: GetNodeStatusExtensions = () => ({
      popoverContent: [
        { content: <div>Extension content 1</div>, uid: 'ext-1' },
        { content: <div>Extension content 2</div>, uid: 'ext-2' },
      ],
      secondaryStatuses: [],
    });

    const node = createMockNode();
    render(<NodeStatusWithExtensions node={node} statusExtensions={mockStatusExtensions} />);

    expect(screen.getByText('Extension content 1')).toBeVisible();
    expect(screen.getByText('Extension content 2')).toBeVisible();
  });

  it('should render consumer popover for disk pressure condition', () => {
    const node = createMockNode({
      status: {
        conditions: [
          {
            type: 'Ready',
            status: 'True',
            lastHeartbeatTime: '2024-01-01T00:00:00Z',
            lastTransitionTime: '2024-01-01T00:00:00Z',
            reason: 'KubeletReady',
            message: 'kubelet is posting ready status',
          },
          {
            type: 'DiskPressure',
            status: 'True',
            lastHeartbeatTime: '2024-01-01T00:00:00Z',
            lastTransitionTime: '2024-01-01T00:00:00Z',
            reason: 'LowDisk',
            message: 'disk is low',
          },
        ],
      },
    });

    const mockStatusExtensions: GetNodeStatusExtensions = () => ({
      popoverContent: [],
      secondaryStatuses: [],
    });

    render(<NodeStatusWithExtensions node={node} statusExtensions={mockStatusExtensions} />);

    expect(screen.getByLabelText('Disk Pressure')).toBeVisible();
  });

  it('should render consumer popover for memory pressure condition', () => {
    const node = createMockNode({
      status: {
        conditions: [
          {
            type: 'Ready',
            status: 'True',
            lastHeartbeatTime: '2024-01-01T00:00:00Z',
            lastTransitionTime: '2024-01-01T00:00:00Z',
            reason: 'KubeletReady',
            message: 'kubelet is posting ready status',
          },
          {
            type: 'MemoryPressure',
            status: 'True',
            lastHeartbeatTime: '2024-01-01T00:00:00Z',
            lastTransitionTime: '2024-01-01T00:00:00Z',
            reason: 'LowMemory',
            message: 'memory is low',
          },
        ],
      },
    });

    const mockStatusExtensions: GetNodeStatusExtensions = () => ({
      popoverContent: [],
      secondaryStatuses: [],
    });

    render(<NodeStatusWithExtensions node={node} statusExtensions={mockStatusExtensions} />);

    expect(screen.getByLabelText('Memory Pressure')).toBeVisible();
  });

  it('should render NodeStatusWithExtensions with className prop', () => {
    const mockStatusExtensions: GetNodeStatusExtensions = () => ({
      popoverContent: [],
      secondaryStatuses: [],
    });

    const node = createMockNode();
    render(
      <NodeStatusWithExtensions
        node={node}
        statusExtensions={mockStatusExtensions}
        className="custom-class"
      />,
    );

    expect(screen.getByText('Ready')).toBeVisible();
  });
});
