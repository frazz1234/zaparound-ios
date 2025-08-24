import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, HardDrive, Clock, AlertTriangle } from 'lucide-react';
import { getImageCacheStats, clearImageCache } from '@/utils/imageCache';
import { toast } from '@/components/ui/use-toast';

interface CacheStats {
  totalImages: number;
  totalSize: number;
  oldestImage: number;
  newestImage: number;
}

export function ImageCacheManager() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const cacheStats = await getImageCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
      toast({
        title: "Error",
        description: "Failed to load cache statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      setIsClearing(true);
      await clearImageCache();
      await loadStats();
      toast({
        title: "Success",
        description: "Image cache cleared successfully",
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear image cache",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp).toLocaleDateString();
  };

  const getCacheHealth = (): { status: 'healthy' | 'warning' | 'critical'; message: string } => {
    if (!stats) return { status: 'healthy', message: 'No data' };
    
    const sizeMB = stats.totalSize / (1024 * 1024);
    const ageDays = (Date.now() - stats.oldestImage) / (1000 * 60 * 60 * 24);
    
    if (sizeMB > 40) {
      return { status: 'critical', message: 'Cache is very large' };
    } else if (sizeMB > 25) {
      return { status: 'warning', message: 'Cache is getting large' };
    } else if (ageDays > 30) {
      return { status: 'warning', message: 'Cache contains old images' };
    }
    
    return { status: 'healthy', message: 'Cache is healthy' };
  };

  useEffect(() => {
    loadStats();
  }, []);

  const health = getCacheHealth();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Image Cache
        </CardTitle>
        <CardDescription>
          Manage cached images for better performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : stats ? (
          <>
            {/* Cache Health */}
            <div className="flex items-center gap-2">
              <Badge 
                variant={health.status === 'healthy' ? 'default' : health.status === 'warning' ? 'secondary' : 'destructive'}
              >
                {health.status === 'healthy' ? 'Healthy' : health.status === 'warning' ? 'Warning' : 'Critical'}
              </Badge>
              <span className="text-sm text-muted-foreground">{health.message}</span>
            </div>

            {/* Cache Size Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cache Size</span>
                <span>{formatBytes(stats.totalSize)} / 50 MB</span>
              </div>
              <Progress 
                value={(stats.totalSize / (50 * 1024 * 1024)) * 100} 
                className="h-2"
              />
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Images</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalImages}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Oldest</span>
                </div>
                <p className="text-sm text-muted-foreground">{formatDate(stats.oldestImage)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                onClick={loadStats} 
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                Refresh
              </Button>
              <Button 
                onClick={handleClearCache} 
                variant="destructive" 
                size="sm"
                disabled={isClearing || stats.totalImages === 0}
                className="flex-1"
              >
                {isClearing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p>Failed to load cache statistics</p>
            <Button onClick={loadStats} variant="outline" size="sm" className="mt-2">
              Retry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
