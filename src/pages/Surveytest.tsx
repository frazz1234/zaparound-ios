import { useEffect } from 'react';

const Survey = () => {
  useEffect(() => {
    window.location.href = 'https://forms.office.com/pages/responsepage.aspx?id=O_-2qygS70q4Ced1f8OFFSQ7tumU6HBPvNElgYBx24dUQjA5MjVNODFKWjNHOUxNV1NVMUhJM0dLQS4u&origin=lprLink&route=shorturl';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Redirecting to survey...</p>
    </div>
  );
};

export default SurveyTest; 