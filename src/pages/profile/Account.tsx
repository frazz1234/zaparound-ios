import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteAccountCard } from "@/components/profile/DeleteAccountCard";

export default function ProfileAccount() {
  const { t } = useTranslation('profile');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-500">{t('sidebar.account')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            {t('account.description', 'Manage your account settings, including account deletion.')}
          </p>
          
          <div className="space-y-8">
            <DeleteAccountCard />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 