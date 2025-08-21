import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

export function UpdateNotification() {
  const { toast } = useToast();

  useEffect(() => {
    const handleAppUpdate = () => {
      toast({
        variant: 'update',
        title: 'App Update Available',
        description: 'A new version of ZapAround is available.',
        action: (
          <Button 
            variant="outline" 
            className="bg-white text-blue-500 border-white hover:bg-blue-50"
            onClick={() => window.location.reload()}
          >
            Update Now
          </Button>
        ),
        duration: 0, // Don't auto-dismiss
      });
    };

    window.addEventListener('appUpdateAvailable', handleAppUpdate);
    
    return () => {
      window.removeEventListener('appUpdateAvailable', handleAppUpdate);
    };
  }, [toast]);

  return null;
} 