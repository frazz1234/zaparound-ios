import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PassportForm } from "@/components/profile/PassportForm";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, Shield } from "lucide-react";

export default function ProfilePassport() {
  const { t, i18n } = useTranslation('profile');
  const { isAdmin, loading } = useUserRole();
  const location = useLocation();
  
  // Extract current language from URL path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentLang = pathSegments[0] || i18n.language;

  // Show loading while checking admin status
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect non-admin users to profile page with current language
  if (!isAdmin) {
    return <Navigate to={`/${currentLang}/profile`} replace />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#61936f]" />
            {t('passport.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            {t('passport.description', 'Manage your passport information for travel bookings. Your data is encrypted and stored securely.')}
          </p>
          
          <PassportForm />
        </CardContent>
      </Card>
    </div>
  );
} 