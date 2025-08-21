import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DevSurvey = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('survey');
  const [showMessage, setShowMessage] = useState(true);

  useEffect(() => {
    if (showMessage) {
      // Show message for 3 seconds before redirecting
      const timer = setTimeout(() => {
        setShowMessage(false);
        window.location.href = 'https://forms.office.com/pages/responsepage.aspx?id=O_-2qygS70q4Ced1f8OFFSQ7tumU6HBPvNElgYBx24dUQjA5MjVNODFKWjNHOUxNV1NVMUhJM0dLQS4u&origin=lprLink&route=shorturl';
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showMessage]);

  if (showMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4 p-8">
          <Heart className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
          <h1 className="text-3xl font-bold text-gray-800">{t('thankYou')}</h1>
          <p className="text-lg text-gray-600 max-w-md">
            {t('feedback')}
          </p>
          <p className="text-sm text-gray-500">{t('redirecting')}</p>
        </div>
      </div>
    );
  }

  return null;
};

export default DevSurvey; 