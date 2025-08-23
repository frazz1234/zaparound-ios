import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

interface UserSearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function UserSearchBar({ 
  searchTerm, 
  setSearchTerm, 
  onRefresh = () => {}, 
  isLoading = false 
}: UserSearchBarProps) {
  const { t } = useTranslation(['admin', 'common']);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder={t('common:search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        {onRefresh && (
          <Button 
            onClick={onRefresh}
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="h-4 w-4 animate-spin mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {t('common:refresh')}
          </Button>
        )}
      </div>
    </div>
  );
}
