import React, { useState } from 'react';
import { CameraCapture, CameraResult } from '@/components/ui/CameraCapture';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CameraIcon, ImageIcon, TrashIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const CameraDemo: React.FC = () => {
  const { t } = useTranslation();
  const [capturedImage, setCapturedImage] = useState<CameraResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageCaptured = (result: CameraResult) => {
    setCapturedImage(result);
    setError(null);
    console.log('Image captured:', result);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    console.error('Camera error:', errorMessage);
  };

  const clearImage = () => {
    setCapturedImage(null);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CameraIcon className="w-5 h-5" />
            {t('camera.demo.title', 'Camera Demo')}
          </CardTitle>
          <CardDescription>
            {t('camera.demo.description', 'Test the camera functionality by taking photos or selecting from your photo library.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CameraCapture
            onImageCaptured={handleImageCaptured}
            onError={handleError}
            quality={90}
            allowEditing={true}
          >
            <Button variant="default" size="lg" className="w-full">
              <CameraIcon className="w-5 h-5 mr-2" />
              {t('camera.demo.startCapture', 'Start Camera Capture')}
            </Button>
          </CameraCapture>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {capturedImage && (
            <Card className="border-2 border-dashed border-accent-3">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    {t('camera.demo.capturedImage', 'Captured Image')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearImage}
                    className="text-destructive hover:text-destructive"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <img
                    src={capturedImage.webPath}
                    alt="Captured"
                    className="w-full h-64 object-cover rounded-md border"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {t('camera.demo.format', 'Format')}
                    </Badge>
                    <p className="font-mono">{capturedImage.format}</p>
                  </div>
                  
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {t('camera.demo.saved', 'Saved')}
                    </Badge>
                    <p>{capturedImage.saved ? '✅ Yes' : '❌ No'}</p>
                  </div>
                  
                  {capturedImage.path && (
                    <div className="col-span-2">
                      <Badge variant="secondary" className="mb-2">
                        {t('camera.demo.path', 'Path')}
                      </Badge>
                      <p className="font-mono text-xs break-all">{capturedImage.path}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // You can implement additional actions here
                      console.log('Processing image:', capturedImage);
                    }}
                    className="flex-1"
                  >
                    {t('camera.demo.process', 'Process Image')}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      // You can implement sharing functionality here
                      console.log('Sharing image:', capturedImage);
                    }}
                    className="flex-1"
                  >
                    {t('camera.demo.share', 'Share')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t('camera.demo.features', 'Features')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-accent-3">
                {t('camera.demo.cameraFeatures', 'Camera Features')}
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• {t('camera.demo.highQuality', 'High quality photo capture')}</li>
                <li>• {t('camera.demo.photoLibrary', 'Photo library selection')}</li>
                <li>• {t('camera.demo.permissionHandling', 'Smart permission handling')}</li>
                <li>• {t('camera.demo.errorHandling', 'Comprehensive error handling')}</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-accent-3">
                {t('camera.demo.technicalFeatures', 'Technical Features')}
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• {t('camera.demo.capacitor', 'Built with Capacitor')}</li>
                <li>• {t('camera.demo.typescript', 'Full TypeScript support')}</li>
                <li>• {t('camera.demo.responsive', 'Responsive design')}</li>
                <li>• {t('camera.demo.accessibility', 'Accessibility compliant')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CameraDemo;
