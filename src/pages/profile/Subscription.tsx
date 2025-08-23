import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubscriptionManager } from "@/components/profile/SubscriptionManager";

export default function ProfileSubscription() {
  const { t } = useTranslation('profile');

  return (
    <div className="space-y-6">
      <SubscriptionManager />
    </div>
  );
} 