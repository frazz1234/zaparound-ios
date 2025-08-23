import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface PasswordVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function PasswordVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  description
}: PasswordVerificationModalProps) {
  const { t } = useTranslation('profile');
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(t('passwordVerification.passwordRequired'));
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error(t('passwordVerification.userNotFound'));
      }

      // Call the Edge Function to verify password
      const { data, error } = await supabase.functions.invoke('verify-password', {
        body: { password },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Password verification failed:', error);
        setError(t('passwordVerification.incorrectPassword'));
        return; // Don't proceed with success
      }

      if (!data || !data.success) {
        setError(t('passwordVerification.incorrectPassword'));
        return; // Don't proceed with success
      }

      // If we reach here, password is correct
      // Call onSuccess only if verification was successful
      console.log('Password verification successful, calling onSuccess callback');
      onSuccess();
      setPassword("");
      setError("");
      
      toast({
        title: t('passwordVerification.success'),
        description: t('passwordVerification.verified'),
      });

    } catch (error) {
      console.error('Password verification error:', error);
      setError(error instanceof Error ? error.message : t('passwordVerification.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#61936f]" />
            {title || t('passwordVerification.title')}
          </DialogTitle>
          <DialogDescription>
            {description || t('passwordVerification.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t('passwordVerification.password')}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                name="current-password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordVerification.passwordPlaceholder')}
                className={cn(error && "border-red-500")}
                disabled={loading}
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#61936f] hover:bg-[#4a7a5a] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('passwordVerification.verifying')}
                </>
              ) : (
                t('passwordVerification.verify')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 