import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';

export interface CameraOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: CameraResultType;
  source?: CameraSource;
  width?: number;
  height?: number;
  direction?: CameraDirection;
}

export interface CameraResult {
  webPath: string;
  format: string;
  saved?: boolean;
  path?: string;
  exif?: any;
}

export class CameraService {
  /**
   * Take a photo using the camera
   */
  static async takePhoto(options: CameraOptions = {}): Promise<CameraResult> {
    try {
      const defaultOptions: CameraOptions = {
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        ...options
      };

      const image = await Camera.getPhoto(defaultOptions);
      
      return {
        webPath: image.webPath || '',
        format: image.format || 'jpeg',
        saved: image.saved || false,
        path: image.path,
        exif: image.exif
      };
    } catch (error) {
      console.error('Error taking photo:', error);
      throw new Error(`Failed to take photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pick a photo from the photo library
   */
  static async pickPhoto(options: CameraOptions = {}): Promise<CameraResult> {
    try {
      const defaultOptions: CameraOptions = {
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        ...options
      };

      const image = await Camera.getPhoto(defaultOptions);
      
      return {
        webPath: image.webPath || '',
        format: image.format || 'jpeg',
        saved: image.saved || false,
        path: image.path,
        exif: image.exif
      };
    } catch (error) {
      console.error('Error picking photo:', error);
      throw new Error(`Failed to pick photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if camera is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      // Try to get camera info to check availability
      await Camera.checkPermissions();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Request camera permissions
   */
  static async requestPermissions(): Promise<{ camera: string; photos: string }> {
    try {
      const permissions = await Camera.requestPermissions();
      return permissions;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw new Error(`Failed to request permissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check current permissions
   */
  static async checkPermissions(): Promise<{ camera: string; photos: string }> {
    try {
      const permissions = await Camera.checkPermissions();
      return permissions;
    } catch (error) {
      console.error('Error checking permissions:', error);
      throw new Error(`Failed to check permissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default CameraService;
