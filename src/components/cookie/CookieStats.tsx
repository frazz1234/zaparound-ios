import { useEffect, useState } from 'react';
import { cookieMonitor } from '@/utils/cookieMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';

interface CookieStats {
  totalSize: number;
  cookieCount: number;
  categoryCount: {
    necessary: number;
    functional: number;
    analytics: number;
    marketing: number;
  };
}

export function CookieStats() {
  const { t } = useTranslation('cookies');
  const [stats, setStats] = useState<CookieStats>({
    totalSize: 0,
    cookieCount: 0,
    categoryCount: {
      necessary: 0,
      functional: 0,
      analytics: 0,
      marketing: 0
    }
  });

  useEffect(() => {
    // Update stats every minute
    const updateStats = () => {
      const inventory = cookieMonitor.getInventory();
      const categoryCount = cookieMonitor.getCookieCountByCategory();
      
      setStats({
        totalSize: cookieMonitor.getTotalSize(),
        cookieCount: inventory.size,
        categoryCount
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 60000);

    return () => clearInterval(interval);
  }, []);

  const maxSize = 4096 * 50; // 200KB total domain limit
  const sizePercentage = (stats.totalSize / maxSize) * 100;
  const maxCookies = 50;
  const cookiePercentage = (stats.cookieCount / maxCookies) * 100;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('statsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Total Size */}
            <div>
              <div className="flex justify-between mb-2">
                <span>{t('stats.totalSize')}</span>
                <span>{(stats.totalSize / 1024).toFixed(2)} KB / {(maxSize / 1024).toFixed(2)} KB</span>
              </div>
              <Progress value={sizePercentage} className="h-2" />
            </div>

            {/* Cookie Count */}
            <div>
              <div className="flex justify-between mb-2">
                <span>{t('stats.cookieCount')}</span>
                <span>{stats.cookieCount} / {maxCookies}</span>
              </div>
              <Progress value={cookiePercentage} className="h-2" />
            </div>

            {/* Category Distribution */}
            <div>
              <h4 className="font-medium mb-4">{t('stats.categories')}</h4>
              <div className="grid gap-3">
                {Object.entries(stats.categoryCount).map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="capitalize">{t(`stats.category.${category}`)}</span>
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 