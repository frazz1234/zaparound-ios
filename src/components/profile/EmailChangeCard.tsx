import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { userCache, tripCache, blogCache } from '@/utils/cache';

export function EmailChangeCard() {
  const { t } = useTranslation('profile');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { emailChangeInProgress } = useProfile();
  const [loading, setLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmNewEmail, setConfirmNewEmail] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchCurrentEmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentEmail(user.email);
      }
    } catch (error) {
      console.error("Error fetching current email:", error);
    }
  };

  // Fetch current email when component mounts
  useEffect(() => {
    fetchCurrentEmail();
  }, []);

  const validateInputs = () => {
    try {
      // Validate that new email is a valid email address
      const emailSchema = z.string().email(t('profile.emailChange.invalidEmail'));
      emailSchema.parse(newEmail);

      // Validate that new email and confirmation match
      if (newEmail !== confirmNewEmail) {
        setValidationError(t('profile.emailChange.emailsDoNotMatch'));
        return false;
      }

      // Clear validation error if all checks pass
      setValidationError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0].message);
      } else {
        setValidationError(t('profile.emailChange.invalidEmail'));
      }
      return false;
    }
  };

  const handleChangeEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateInputs()) {
      return;
    }

    try {
      setLoading(true);

      // Get current user ID for syncing email change
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Clear all user-related caches before email change
      userCache.delete(`profile-${user.id}`);
      tripCache.delete(`trips-${user.id}`);
      blogCache.delete(`blogs-${user.id}`);

      // Sync email change in database tables first
      const syncResponse = await supabase.functions.invoke('sync-email-change', {
        body: { userId: user.id, newEmail }
      });

      if (!syncResponse.data?.success) {
        throw new Error(syncResponse.error?.message || "Failed to sync email change");
      }

      // Update email in Supabase auth
      const { error } = await supabase.auth.updateUser({ email: newEmail });

      if (error) {
        throw error;
      }

      // Success response
      toast({
        title: t('profile.emailChange.verificationSent'),
        description: t('profile.emailChange.verificationSentDescription'),
      });

      // Sign out the user immediately after requesting email change
      await supabase.auth.signOut();
      
      // Show sign out toast
      toast({
        title: t('auth.notice'),
        description: t('auth.emailChangeVerificationText'),
      });
      
      // Redirect to auth page
      navigate("/auth");
      
      // Reset form fields
      setNewEmail("");
      setConfirmNewEmail("");
      
    } catch (error: any) {
      console.error("Error updating email:", error);
      toast({
        title: t('profile.emailChange.updateError'),
        description: error.message || t('profile.emailChange.updateError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{t('emailChange.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangeEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentEmail">{t('emailChange.currentEmail')}</Label>
            <Input
              id="currentEmail"
              value={currentEmail}
              disabled
              readOnly
              className="bg-gray-100"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newEmail">{t('emailChange.newEmail')}</Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={t('personal.email')}
              required
              disabled={loading || emailChangeInProgress}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmNewEmail">{t('emailChange.confirmNewEmail')}</Label>
            <Input
              id="confirmNewEmail"
              type="email"
              value={confirmNewEmail}
              onChange={(e) => setConfirmNewEmail(e.target.value)}
              placeholder={t('personal.email')}
              required
              disabled={loading || emailChangeInProgress}
            />
          </div>
          
          {validationError && (
            <div className="text-red-500 text-sm">{validationError}</div>
          )}
          
          {emailChangeInProgress && (
            <div className="text-amber-500 text-sm">{t('emailChange.verificationText')}</div>
          )}
          
          <Button type="submit" disabled={loading || emailChangeInProgress} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('emailChange.updating')}
              </>
            ) : (
              t('emailChange.updateEmail')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
