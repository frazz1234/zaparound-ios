import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import type { Profile } from "@/types/profile";

export default function ProfilePersonalInfo() {
  const { profile, setProfile, loading, date, setDate, updateProfile } = useProfile();
  const { t } = useTranslation('profile');
  const { toast } = useToast();

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>, updatedProfile: Profile) => {
    e.preventDefault();
    try {
      await updateProfile(updatedProfile);
      toast({
        title: t('toasts.updated'),
        description: t('toasts.profileUpdated'),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('toasts.error'),
        description: t('toasts.errorSaving'),
        variant: "destructive"
      });
      throw error; // Re-throw to be caught by the form's error handler
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t('sidebar.personalInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            {t('personalInfo.description', 'Update your personal information and profile details.')}
          </p>
          
          {profile && (
            <ProfileForm
              profile={profile}
              setProfile={setProfile}
              date={date}
              setDate={setDate}
              loading={loading}
              onSubmit={handleUpdateProfile}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 