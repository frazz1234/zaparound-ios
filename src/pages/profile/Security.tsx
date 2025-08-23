import { useTranslation } from 'react-i18next';
import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfileSecurity() {
  const { t } = useTranslation('profile');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t('sidebar.security')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            {t('security.description', 'Manage your password and security settings to keep your account safe.')}
          </p>
          
          <ChangePasswordCard />
        </CardContent>
      </Card>
    </div>
  );
} 