interface StatusBadgeProps {
  status: string;
  type?: 'inventory' | 'delivery' | 'payment' | 'issue' | 'consignment';
}

export default function StatusBadge({ status, type = 'inventory' }: StatusBadgeProps) {
  const getStatusColor = () => {
    const upperStatus = status.toUpperCase();
    
    switch (type) {
      case 'inventory':
        switch (upperStatus) {
          case 'WAREHOUSE': return 'bg-blue-500';
          case 'TRANSIT': return 'bg-yellow-500';
          case 'CONSIGNED': return 'bg-purple-500';
          case 'SOLD': return 'bg-green-500';
          case 'RETURNED': return 'bg-red-500';
          default: return 'bg-slate-500';
        }
      
      case 'delivery':
        switch (upperStatus) {
          case 'PENDING': return 'bg-yellow-500';
          case 'IN_PROGRESS': return 'bg-blue-500';
          case 'COMPLETED': return 'bg-green-500';
          case 'FAILED': return 'bg-red-500';
          default: return 'bg-slate-500';
        }
      
      case 'payment':
        switch (upperStatus) {
          case 'PENDING': return 'bg-yellow-500';
          case 'COMPLETED': return 'bg-green-500';
          case 'CANCELLED': return 'bg-red-500';
          default: return 'bg-slate-500';
        }
      
      case 'issue':
        switch (upperStatus) {
          case 'OPEN': return 'bg-red-500';
          case 'IN_PROGRESS': return 'bg-yellow-500';
          case 'RESOLVED': return 'bg-green-500';
          case 'CLOSED': return 'bg-slate-500';
          default: return 'bg-slate-500';
        }
      
      case 'consignment':
        switch (upperStatus) {
          case 'PENDING': return 'bg-yellow-500';
          case 'CONFIRMED': return 'bg-green-500';
          case 'PARTIAL': return 'bg-orange-500';
          case 'RETURNED': return 'bg-red-500';
          default: return 'bg-slate-500';
        }
      
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${getStatusColor()}`}>
      {status.replace('_', ' ')}
    </span>
  );
}