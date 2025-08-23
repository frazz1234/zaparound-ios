import { useTranslation } from 'react-i18next';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  postsPerPage: number;
  onPageChange: (page: number) => void;
}

export function BlogPagination({
  currentPage,
  totalPages,
  totalPosts,
  postsPerPage,
  onPageChange,
}: BlogPaginationProps) {
  const { t } = useTranslation('blog');

  // Don't show pagination if there's only one page or no posts
  if (totalPages <= 1 || totalPosts === 0) {
    return null;
  }

  // Calculate the range of posts being shown
  const startPost = (currentPage - 1) * postsPerPage + 1;
  const endPost = Math.min(currentPage * postsPerPage, totalPosts);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, current page, and neighbors
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {/* Posts count info */}
      <div className="text-sm text-muted-foreground">
        {t('pagination.showing')} {startPost} {t('pagination.to')} {endPost} {t('pagination.ofTotal', { total: totalPosts })}
      </div>

      {/* Pagination controls */}
      <Pagination>
        <PaginationContent>
          {/* Previous button */}
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('pagination.previous')}
            </Button>
          </PaginationItem>

          {/* Page numbers */}
          {pageNumbers.map((page, index) => (
            <PaginationItem key={index}>
              {page === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className="min-w-[40px]"
                >
                  {page}
                </Button>
              )}
            </PaginationItem>
          ))}

          {/* Next button */}
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="gap-2"
            >
              {t('pagination.next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Page indicator */}
      <div className="text-sm text-muted-foreground">
                  {t('pagination.page')} {currentPage} {t('pagination.of')} {totalPages}
      </div>
    </div>
  );
} 