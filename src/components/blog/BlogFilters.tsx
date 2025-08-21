import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, X, Calendar, Tag, MapPin, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';

export interface BlogFiltersState {
  search: string;
  category: string;
  dateRange: string;
  sortBy: 'newest' | 'oldest' | 'popular' | 'trending';
  tags: string[];
  location?: string;
}

interface BlogFiltersProps {
  filters: BlogFiltersState;
  onFiltersChange: (filters: BlogFiltersState) => void;
  availableCategories: string[];
  availableTags: string[];
  availableLocations: string[];
  isLoading?: boolean;
  totalResults?: number;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'filters.newest', icon: Calendar },
  { value: 'oldest', label: 'filters.oldest', icon: Calendar },
  { value: 'popular', label: 'filters.popular', icon: TrendingUp },
  { value: 'trending', label: 'filters.trending', icon: TrendingUp }
] as const;

const DATE_RANGE_OPTIONS = [
  { value: '', label: 'blog.dateRange.all' },
  { value: 'week', label: 'blog.dateRange.week' },
  { value: 'month', label: 'blog.dateRange.month' },
  { value: 'quarter', label: 'blog.dateRange.quarter' },
  { value: 'year', label: 'blog.dateRange.year' }
] as const;

export function BlogFilters({
  filters,
  onFiltersChange,
  availableCategories,
  availableTags,
  availableLocations,
  isLoading = false,
  totalResults = 0
}: BlogFiltersProps) {
  const { t } = useTranslation('blog');
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounced search handler
  const debouncedSearchChange = useCallback(
    debounce((value: string) => {
      onFiltersChange({ ...filters, search: value });
    }, 300),
    [filters, onFiltersChange]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearchChange(value);
  }, [debouncedSearchChange]);

  const handleFilterChange = useCallback((key: keyof BlogFiltersState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const handleTagToggle = useCallback((tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    handleFilterChange('tags', newTags);
  }, [filters.tags, handleFilterChange]);

  const clearFilters = useCallback(() => {
    const clearedFilters: BlogFiltersState = {
      search: '',
      category: '',
      dateRange: '',
      sortBy: 'newest',
      tags: [],
      location: ''
    };
    setSearchInput('');
    onFiltersChange(clearedFilters);
  }, [onFiltersChange]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.dateRange) count++;
    if (filters.tags.length > 0) count++;
    if (filters.location) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <Card className="mb-6 border-0 shadow-sm bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
      <CardContent className="p-4">
        {/* Main Filter Row */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('filters.searchPlaceholder')}
              value={searchInput}
              onChange={handleSearchChange}
              className="pl-10 pr-4 h-10 bg-white/80 backdrop-blur-sm border-white/20 focus:bg-white"
              disabled={isLoading}
            />
          </div>

          {/* Category Filter */}
          <div className="min-w-[140px]">
            <Select 
              value={filters.category} 
              onValueChange={(value) => handleFilterChange('category', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-10 bg-white/80 backdrop-blur-sm border-white/20 focus:bg-white">
                <SelectValue placeholder={t('filters.allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('filters.allCategories')}</SelectItem>
                {availableCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    <div className="flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      {category}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="min-w-[120px]">
            <Select 
              value={filters.sortBy} 
              onValueChange={(value: any) => handleFilterChange('sortBy', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-10 bg-white/80 backdrop-blur-sm border-white/20 focus:bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-3 w-3" />
                        {t(option.label)}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-10 bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white"
              disabled={isLoading}
            >
              <Filter className="h-4 w-4 mr-2" />
              {t('filters.advanced')}
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] p-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-10 text-muted-foreground hover:text-destructive"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-white/20 mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Date Range */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      {t('filters.dateRange')}
                    </label>
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) => handleFilterChange('dateRange', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-white/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_RANGE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {t(option.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Filter */}
                  {availableLocations.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t('filters.location')}
                      </label>
                      <Select
                        value={filters.location || ''}
                        onValueChange={(value) => handleFilterChange('location', value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="bg-white/80">
                          <SelectValue placeholder={t('filters.allLocations')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">{t('filters.allLocations')}</SelectItem>
                          {availableLocations.map(location => (
                            <SelectItem key={location} value={location}>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                {location}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {availableTags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      {t('filters.tags')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => (
                        <Badge
                          key={tag}
                          variant={filters.tags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary/80 transition-colors"
                          onClick={() => handleTagToggle(tag)}
                        >
                          {tag}
                          {filters.tags.includes(tag) && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Summary */}
        {totalResults > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {t('filters.resultsFound', { count: totalResults })}
              </span>
              {hasActiveFilters && (
                <span>{t('filters.filtered')}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
