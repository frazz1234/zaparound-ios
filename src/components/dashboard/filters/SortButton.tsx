import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface SortButtonProps {
  sortOrder: 'newest' | 'oldest';
  setSortOrder: (order: 'newest' | 'oldest') => void;
}

export const SortButton = ({ sortOrder, setSortOrder }: SortButtonProps) => {
  const { t } = useTranslation('dashboard');

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
      className="flex items-center gap-1"
    >
      <ArrowUpDown className="h-4 w-4" />
      {sortOrder === 'newest' ? t('filter.newest') : t('filter.oldest')}
    </Button>
  );
};
