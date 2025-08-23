import { useTranslation } from 'react-i18next';
import { EmailChangeCard } from "@/components/profile/EmailChangeCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfileEmail() {
  const { t } = useTranslation('profile');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t('sidebar.email')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            {t('email.description', 'Update your email address and notification preferences.')}
          </p>
          
          <EmailChangeCard />
        </CardContent>
      </Card>
    </div>
  );
} 