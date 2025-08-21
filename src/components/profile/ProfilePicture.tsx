import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface ProfilePictureProps {
  url: string | null;
  onUpload: (url: string) => void;
  size?: number;
  disabled?: boolean;
}

export function ProfilePicture({ url, onUpload, size = 150, disabled = false }: ProfilePictureProps) {
  const { t } = useTranslation('profile');
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (url) {
      try {
        console.log('Current avatar URL:', url);

        // Get the public URL directly
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(url);
        
        console.log('Generated public URL:', data.publicUrl);
        setImageUrl(data.publicUrl);
      } catch (error) {
        console.error('Error processing avatar URL:', error);
        setImageUrl(null);
      }
    } else {
      console.log('No avatar URL provided');
      setImageUrl(null);
    }
  }, [url]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      
      // Validate file type
      const allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
      if (!allowedTypes.includes(fileExt)) {
        throw new Error(`File type not supported. Please upload ${allowedTypes.join(', ')} files.`);
      }
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');
      
      console.log('Current user ID:', user.id);
      
      // Create a structured filename with user ID and timestamp
      const timestamp = Date.now();
      const fileName = `${user.id}_${timestamp}.${fileExt}`;
      
      console.log('New file name:', fileName);

      // Delete old avatar if exists
      if (url) {
        console.log('Deleting old avatar:', url);
        await supabase.storage
          .from('avatars')
          .remove([url]);
      }

      // Upload the file to Supabase storage
      console.log('Uploading new avatar...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('New public URL:', publicUrl);
      
      // Store the path in the database
      console.log('Storing path in database:', fileName);
      onUpload(fileName);
      setImageUrl(publicUrl);

      toast({
        title: t('toasts.success'),
        description: t('toasts.avatarUpdated'),
      });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: t('toasts.error'),
        description: error.message || t('toasts.errorUploadingAvatar'),
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className={cn(
          "relative rounded-full overflow-hidden bg-gray-100",
          disabled && "opacity-70"
        )}
        style={{ width: size, height: size }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Error loading image:', imageUrl);
              setImageUrl(null);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        {!disabled && (
          <label
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-200"
            htmlFor="single"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Camera className="h-6 w-6" />
            )}
          </label>
        )}
      </div>
      
      {!disabled && (
        <input
          style={{
            visibility: 'hidden',
            position: 'absolute',
          }}
          type="file"
          id="single"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading || disabled}
        />
      )}
    </div>
  );
} 