import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

export default function ProfilePreferences() {
  const { t } = useTranslation('profile');
  const { toast } = useToast();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [tripUpdates, setTripUpdates] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current preferences from profile when component mounts
  useEffect(() => {
    if (profile) {
      setMarketingEmails(profile.newsletter_subscribed ?? true);
      // You can add other preferences here when they're available in the profile
    }
  }, [profile]);

  const handleSavePreferences = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      // Update the profile with new preferences
      await updateProfile({
        ...profile,
        newsletter_subscribed: marketingEmails
      });

      toast({
        title: t('sidebar.preferences'),
        description: t('toasts.preferencesUpdated'),
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: t('errors.updateFailed'),
        description: t('errors.tryAgain'),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t('sidebar.preferences')}</CardTitle>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2 text-muted-foreground">{t('preferences.loading')}</span>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-6">
                {t('preferences.description')}
              </p>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('preferences.notificationSettings')}</h3>
              
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">{t('preferences.emailNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('preferences.emailNotificationsDescription')}
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing">{t('preferences.marketingEmails')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('preferences.marketingEmailsDescription')}
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={marketingEmails}
                  onCheckedChange={setMarketingEmails}
                  disabled={profileLoading}
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="trip-updates">{t('preferences.tripUpdates')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('preferences.tripUpdatesDescription')}
                  </p>
                </div>
                <Switch
                  id="trip-updates"
                  checked={tripUpdates}
                  onCheckedChange={setTripUpdates}
                />
              </div>
            </div>
            
            <Button onClick={handleSavePreferences} disabled={saving || profileLoading}>
              {saving ? t('preferences.saving') : t('preferences.saveButton')}
            </Button>
          </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 