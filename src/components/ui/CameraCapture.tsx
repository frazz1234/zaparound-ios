import React, { useState, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CameraIcon, ImageIcon, XIcon } from 'lucide-react';
import CameraService, { CameraResult } from '@/services/cameraService';
import { useTranslation } from 'react-i18next';

interface CameraCaptureProps {
  onImageCaptured: (result: CameraResult) => void;
  onError?: (error: string) => void;
  quality?: number;
  allowEditing?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onImageCaptured,
  onError,
  quality = 90,
  allowEditing = false,
  className = '',
  children
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState<{ camera: string; photos: string } | null>(null);

  // Check permissions when component mounts
  React.useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = useCallback(async () => {
    try {
      const perms = await CameraService.checkPermissions();
      setPermissions(perms);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      const perms = await CameraService.requestPermissions();
      setPermissions(perms);
      return perms;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(`Failed to request permissions: ${errorMessage}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  const handleTakePhoto = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check permissions first
      if (!permissions || permissions.camera !== 'granted') {
        const newPerms = await requestPermissions();
        if (newPerms.camera !== 'granted') {
          onError?.(t('camera.permissionDenied', 'Camera permission denied'));
          return;
        }
      }

      const result = await CameraService.takePhoto({
        quality,
        allowEditing,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      onImageCaptured(result);
      setIsOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(`Failed to take photo: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [permissions, quality, allowEditing, onImageCaptured, onError, requestPermissions, t]);

  const handlePickPhoto = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check permissions first
      if (!permissions || permissions.photos !== 'granted') {
        const newPerms = await requestPermissions();
        if (newPerms.photos !== 'granted') {
          onError?.(t('camera.photoLibraryPermissionDenied', 'Photo library permission denied'));
          return;
        }
      }

      const result = await CameraService.pickPhoto({
        quality,
        allowEditing,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });

      onImageCaptured(result);
      setIsOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(`Failed to pick photo: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [permissions, quality, allowEditing, onImageCaptured, onError, requestPermissions, t]);

  const handleOpenDialog = useCallback(() => {
    setIsOpen(true);
    checkPermissions();
  }, [checkPermissions]);

  const handleCloseDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div onClick={handleOpenDialog} className={className}>
          {children || (
            <Button variant="outline" size="sm">
              <CameraIcon className="w-4 h-4 mr-2" />
              {t('camera.capture', 'Capture Photo')}
            </Button>
          )}
        </div>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t('camera.chooseOption', 'Choose Photo Option')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <Button
            onClick={handleTakePhoto}
            disabled={isLoading}
            className="w-full h-12 text-base"
            variant="default"
          >
            <CameraIcon className="w-5 h-5 mr-3" />
            {isLoading ? t('camera.takingPhoto', 'Taking Photo...') : t('camera.takePhoto', 'Take Photo')}
          </Button>
          
          <Button
            onClick={handlePickPhoto}
            disabled={isLoading}
            className="w-full h-12 text-base"
            variant="outline"
          >
            <ImageIcon className="w-5 h-5 mr-3" />
            {isLoading ? t('camera.selectingPhoto', 'Selecting Photo...') : t('camera.chooseFromLibrary', 'Choose from Library')}
          </Button>
        </div>
        
        {permissions && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div>
              Camera: {permissions.camera === 'granted' ? '✅ Granted' : '❌ Denied'}
            </div>
            <div>
              Photos: {permissions.photos === 'granted' ? '✅ Granted' : '❌ Denied'}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;
