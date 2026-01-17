interface StatusBadgeProps {
  status: string;
  type: 'inventory' | 'consignment' | 'delivery' | 'payment' | 'issue' | 'user';
}

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  const getStatusColor = () => {
    if (type === 'inventory') {
      switch (status) {
        case 'WAREHOUSE':
          return 'bg-blue-500/20 text-blue-400';
        case 'TRANSIT':
          return 'bg-yellow-500/20 text-yellow-400';
        case 'CONSIGNED':
          return 'bg-purple-500/20 text-purple-400';
        case 'SOLD':
          return 'bg-green-500/20 text-green-400';
        case 'RETURNED':
          return 'bg-red-500/20 text-red-400';
        default:
          return 'bg-slate-500/20 text-slate-400';
      }
    }

    if (type === 'consignment') {
      switch (status) {
        case 'PENDING':
          return 'bg-yellow-500/20 text-yellow-400';
        case 'CONFIRMED':
          return 'bg-green-500/20 text-green-400';
        case 'PARTIAL':
          return 'bg-orange-500/20 text-orange-400';
        case 'RETURNED':
          return 'bg-red-500/20 text-red-400';
        default:
          return 'bg-slate-500/20 text-slate-400';
      }
    }

    if (type === 'delivery') {
      switch (status) {
        case 'PENDING':
          return 'bg-yellow-500/20 text-yellow-400';
        case 'IN_PROGRESS':
          return 'bg-blue-500/20 text-blue-400';
        case 'COMPLETED':
          return 'bg-green-500/20 text-green-400';
        case 'FAILED':
          return 'bg-red-500/20 text-red-400';
        default:
          return 'bg-slate-500/20 text-slate-400';
      }
    }

    if (type === 'payment') {
      switch (status) {
        case 'PENDING':
          return 'bg-yellow-500/20 text-yellow-400';
        case 'COMPLETED':
          return 'bg-green-500/20 text-green-400';
        case 'CANCELLED':
          return 'bg-red-500/20 text-red-400';
        default:
          return 'bg-slate-500/20 text-slate-400';
      }
    }

    if (type === 'issue') {
      switch (status) {
        case 'OPEN':
          return 'bg-red-500/20 text-red-400';
        case 'IN_PROGRESS':
          return 'bg-yellow-500/20 text-yellow-400';
        case 'RESOLVED':
          return 'bg-green-500/20 text-green-400';
        case 'CLOSED':
          return 'bg-slate-500/20 text-slate-400';
        default:
          return 'bg-slate-500/20 text-slate-400';
      }
    }

    if (type === 'user') {
      switch (status) {
        case 'active':
          return 'bg-green-500/20 text-green-400';
        case 'suspended':
          return 'bg-red-500/20 text-red-400';
        default:
          return 'bg-slate-500/20 text-slate-400';
      }
    }

    return 'bg-slate-500/20 text-slate-400';
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor()}`}>
      {status}
    </span>
  );
}