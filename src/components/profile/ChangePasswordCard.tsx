import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from 'react-i18next';
import { Loader2, Save } from "lucide-react";
import { userCache } from '@/utils/cache';
import { useNavigate } from "react-router-dom";

export function ChangePasswordCard() {
  const { toast } = useToast();
  const { t } = useTranslation('profile');
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError(t('passwordChange.passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('passwordChange.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Send notification email using the edge function
      if (user.email) {
        try {
          await supabase.functions.invoke('send-password-change-email', {
            body: { 
              email: user.email,
              name: user.user_metadata?.first_name || user.user_metadata?.last_name || 'Traveler',
              language: t('common.currentLanguage') // Pass current language
            }
          });
          console.log("Password change notification email sent");
        } catch (emailError) {
          console.error("Error sending password change email:", emailError);
          // Continue with password change even if email fails
        }
      }

      // Clear the user cache
      userCache.delete(`profile-${user.id}`);

      // Clear the form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast({
        title: t('passwordChange.passwordUpdated'),
        description: t('passwordChange.passwordUpdateSuccess'),
      });

      // Sign out the user
      await supabase.auth.signOut();
      
      // Show sign out toast
      // Redirect to auth page
      navigate("/auth");
      
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: t('toasts.error'),
        description: error.message || t('passwordChange.updateError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {t('passwordChange.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">{t('passwordChange.currentPassword')}</Label>
            <Input
              id="current-password"
              type="password"
              name="current-password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">{t('passwordChange.newPassword')}</Label>
            <Input
              id="new-password"
              type="password"
              name="new-password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t('passwordChange.confirmPassword')}</Label>
            <Input
              id="confirm-password"
              type="password"
              name="confirm-new-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('passwordChange.updating')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('passwordChange.updatePassword')}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
