import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { 
  Mail, 
  MailX, 
  CheckCircle, 
  ArrowLeft, 
  Heart, 
  Globe, 
  Users, 
  Settings,
  ExternalLink,
  Sparkles,
  Shield
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t, i18n } = useTranslation('unsubscribe');
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const unsubscribeReasons = [
    { id: 'too_frequent', label: t('reasons.too_frequent'), emoji: '📮' },
    { id: 'not_relevant', label: t('reasons.not_relevant'), emoji: '🎯' },
    { id: 'never_signed_up', label: t('reasons.never_signed_up'), emoji: '❓' },
    { id: 'poor_content', label: t('reasons.poor_content'), emoji: '📝' },
    { id: 'changed_interests', label: t('reasons.changed_interests'), emoji: '🔄' },
    { id: 'other', label: t('reasons.other'), emoji: '💭' }
  ];

  useEffect(() => {
    // Get email from URL params if provided
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleUnsubscribe = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address to unsubscribe',
        variant: 'destructive'
      });
      return;
    }

    setIsUnsubscribing(true);
    try {
      // Use the edge function to handle unsubscription securely
      const { error } = await supabase.functions.invoke('unsubscribe-newsletter', {
        body: {
          email,
          reason: selectedReason,
          feedback,
          language: i18n.language || 'en'
        }
      });

      if (error) {
        console.error('Error unsubscribing:', error);
        toast({
          title: 'Error',
          description: 'Failed to unsubscribe. Please try again or contact support.',
          variant: 'destructive'
        });
        return;
      }

      setIsUnsubscribed(true);
      toast({
        title: 'Successfully Unsubscribed',
        description: 'You have been removed from our newsletter list.',
      });
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUnsubscribing(false);
    }
  };

  const goToMainWebsite = () => {
    window.open('https://zaparound.com', '_blank');
  };



  if (isUnsubscribed) {
    return (
      <>
        <Helmet>
          <title>Unsubscribe from Newsletter - ZapAround</title>
          <meta name="description" content="Unsubscribe from ZapAround newsletter. Help us improve by sharing your feedback." />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
          <div className="container mx-auto px-4 py-16">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('success.title')}</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t('success.subtitle')}
              </p>
            </div>

            {/* Success Card */}
            <div className="max-w-2xl mx-auto">
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <div className="p-4 bg-green-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                      <MailX className="h-8 w-8 text-green-600" />
                    </div>
                    
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('success.allDone')}</h2>
                      <p className="text-gray-600">
                        <strong>{email}</strong> {t('success.removedMessage')}
                      </p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Heart className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-left">
                          <h3 className="font-semibold text-blue-900">{t('success.thankYou')}</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            {t('success.feedbackMessage')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Alternative Ways to Stay Connected */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">{t('success.otherWays')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <Globe className="h-6 w-6 text-blue-600" />
                            <div>
                              <h4 className="font-medium">{t('success.visitWebsite')}</h4>
                              <p className="text-sm text-gray-600">{t('success.visitWebsiteDesc')}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <Users className="h-6 w-6 text-green-600" />
                            <div>
                              <h4 className="font-medium">{t('success.followSocial')}</h4>
                              <p className="text-sm text-gray-600">{t('success.followSocialDesc')}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        onClick={goToMainWebsite}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {t('visitWebsite')}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setIsUnsubscribed(false)}
                        className="border-gray-300"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('goBack')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Unsubscribe from Newsletter - ZapAround</title>
        <meta name="description" content="Unsubscribe from ZapAround newsletter. Help us improve by sharing your feedback." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6">
              <MailX className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* Main Card */}
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  <Mail className="h-6 w-6 text-blue-600" />
                  {t('unsubscribeButton')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">
                    {t('emailLabel')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-lg"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    {t('emailHelp')}
                  </p>
                </div>

                <Separator />

                {/* Feedback Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t('feedbackTitle')}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Required
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {t('feedbackSubtitle')}
                  </p>

                  {/* Reason Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {unsubscribeReasons.map((reason) => (
                      <div
                        key={reason.id}
                        onClick={() => {
                          setSelectedReason(reason.id);
                          setShowFeedback(reason.id === 'other');
                        }}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedReason === reason.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{reason.emoji}</span>
                          <span className="text-sm font-medium">{reason.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!selectedReason && (
                    <p className="text-sm text-red-600 mt-2">
                      {t('reasonRequired')}
                    </p>
                  )}
                  
                  {/* Feedback Notification */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <div className="flex items-start gap-2">
                      <div className="text-blue-600 mt-0.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm text-blue-800">
                        {t('feedbackNotification')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Goodbye Email Notification */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                    <div className="flex items-start gap-2">
                      <div className="text-green-600 mt-0.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm text-green-800">
                        {t('goodbyeEmailNotification')}
                      </p>
                    </div>
                  </div>

                  {/* Additional Feedback */}
                  {(showFeedback || selectedReason) && (
                    <div className="space-y-2">
                      <Label htmlFor="feedback" className="text-sm font-medium">
                        {t('additionalFeedback')} <span className="text-gray-500 text-xs">(Optional)</span>
                      </Label>
                      <Textarea
                        id="feedback"
                        placeholder={t('additionalFeedbackPlaceholder')}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="min-h-20"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Privacy Notice */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{t('privacyNotice.title')}</h4>
                      <p className="text-sm text-gray-600">
                        {t('privacyNotice.description')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleUnsubscribe}
                    disabled={!email || !selectedReason || isUnsubscribing}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    {isUnsubscribing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('unsubscribing')}
                      </>
                    ) : (
                      <>
                        <MailX className="h-4 w-4 mr-2" />
                        {t('unsubscribeButton')}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={goToMainWebsite}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('visitWebsite')}
                  </Button>
                </div>

                {/* Alternative Options */}
                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-500">
                    {t('preferencesNote')}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={goToMainWebsite}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {t('updatePreferences')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-gray-500 text-sm">
              {t('contactSupport')}{' '}
              <a 
                href="mailto:support@zaparound.com" 
                className="text-blue-600 hover:underline"
              >
                support@zaparound.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Unsubscribe; 