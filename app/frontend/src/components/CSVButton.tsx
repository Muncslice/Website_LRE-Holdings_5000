import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface CSVButtonProps {
  data: any[];
  filename: string;
  headers: string[];
  className?: string;
}

export default function CSVButton({ data, filename, headers, className }: CSVButtonProps) {
  const downloadCSV = () => {
    if (data.length === 0) return;

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Handle dates
          if (value instanceof Date) {
            return format(value, 'yyyy-MM-dd HH:mm:ss');
          }
          // Handle strings with commas
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value ?? '';
        }).join(',')
      ),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      onClick={downloadCSV}
      variant="outline"
      className={className}
      disabled={data.length === 0}
    >
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </Button>
  );
}