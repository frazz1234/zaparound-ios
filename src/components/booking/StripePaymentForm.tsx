import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, CreditCard, AlertCircle } from 'lucide-react';

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

export function StripePaymentForm({ 
  clientSecret, 
  amount, 
  currency, 
  onSuccess, 
  onError 
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { t, i18n } = useTranslation('booking');
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe has not loaded');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (stripeError) {
        console.error('Payment failed:', stripeError);
        setError(stripeError.message || 'Payment failed');
        onError(stripeError.message || 'Payment failed');
        
        toast({
          title: "Payment Failed",
          description: stripeError.message || "Your payment could not be processed. Please try again.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent);
        
        toast({
          title: "Payment Successful!",
          description: "Your flight has been booked successfully. You will receive a confirmation email shortly.",
        });

        onSuccess();
        
        // Redirect to bookings page after a short delay
        setTimeout(() => {
          navigate(`/${i18n.language}/bookings`);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'An unexpected error occurred';
      setError(errorMessage);
      onError(errorMessage);
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {t('payment.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t('payment.cardDetails')}
            </label>
            <div className="border border-gray-300 rounded-md p-3 bg-white">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">{t('payment.total')}</span>
              <span className="text-lg font-bold">
                {currency} {amount.toFixed(2)}
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-[#61936f] hover:bg-[#4a7a5a] text-white"
          >
            {isProcessing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                {t('payment.processing')}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('payment.payNow')} ({currency} {amount.toFixed(2)})
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            {t('payment.securityNote')}
          </p>
        </form>
      </CardContent>
    </Card>
  );
} 