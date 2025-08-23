import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

interface DashboardHeaderProps {
  fullName: string | null;
  onTripCreated: () => void;
  userRole: string | null;
  hasFreeTrip: boolean;
}

export const DashboardHeader = ({ fullName, userRole, hasFreeTrip }: DashboardHeaderProps) => {
  const { t } = useTranslation('dashboard');
  // Extract the first name (first part before the space)
  const firstName = fullName?.split(' ')[0];

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          {t('welcome')}{firstName ? ` ${firstName}` : ''}!
        </h1>
        <p className="text-gray-600">{t('planAdventure')}</p>
      </div>
    </div>
  );
};
