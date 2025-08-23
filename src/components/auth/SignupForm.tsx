import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { Checkbox } from "@/components/ui/checkbox";
import ReCAPTCHA from "react-google-recaptcha";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { LocationSearch } from "@/components/trips/LocationSearch";
import { FunctionsHttpError } from '@supabase/supabase-js';

interface SignupFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  errorMessage: string;
  setErrorMessage: (message: string) => void;
  onSuccess?: () => void;
}

export function SignupForm({
  email,
  setEmail,
  password,
  setPassword,
  errorMessage,
  setErrorMessage,
  onSuccess
}: SignupFormProps) {
  const { toast } = useToast();
  const { t } = useTranslation('auth');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  
  // New form fields
  const [step, setStep] = useState(1);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [locationCoordinates, setLocationCoordinates] = useState<[number, number]>([0, 0]);
  const [language, setLanguage] = useState('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [touchedFields, setTouchedFields] = useState<{[key: string]: boolean}>({});

  // Ensure reCAPTCHA is clickable in modal context
  useEffect(() => {
    const handleRecaptchaClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if click is on reCAPTCHA element
      if (target.closest('iframe[src*="recaptcha"]') || 
          target.closest('div[style*="z-index: 2000000000"]')) {
        e.stopPropagation();
      }
    };

    // Add capturing phase listener to intercept clicks before they bubble
    document.addEventListener('click', handleRecaptchaClick, true);

    return () => {
      document.removeEventListener('click', handleRecaptchaClick, true);
    };
  }, []);

  const markFieldAsTouched = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const shouldShowError = (fieldName: string) => {
    return touchedFields[fieldName] && formErrors[fieldName];
  };

  const validateStep = (currentStep: number) => {
    const errors: {[key: string]: string} = {};
    
    if (currentStep === 1) {
      if (!email) errors.email = t('validation.emailRequired');
      else if (!/\S+@\S+\.\S+/.test(email)) errors.email = t('validation.emailInvalid');
      
      if (!confirmEmail) errors.confirmEmail = t('validation.emailRequired');
      else if (confirmEmail !== email) errors.confirmEmail = t('validation.emailMatch');
      
      if (!password) errors.password = t('validation.passwordRequired');
      else if (password.length < 8) errors.password = t('validation.passwordMinLength');
      
      if (!confirmPassword) errors.confirmPassword = t('validation.passwordRequired');
      else if (confirmPassword !== password) errors.confirmPassword = t('validation.passwordMatch');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    // Mark all fields in current step as touched
    if (step === 1) {
      setTouchedFields(prev => ({
        ...prev,
        email: true,
        confirmEmail: true,
        password: true,
        confirmPassword: true
      }));
    }

    if (validateStep(step)) {
      setFormErrors({});
      setTouchedFields({}); // Reset touched fields when moving to next step
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setFormErrors({});
    setTouchedFields({}); // Reset touched fields when moving back
    setStep(step - 1);
  };

  const verifyRecaptcha = async (token: string): Promise<boolean> => {
    try {
      console.log('Verifying reCAPTCHA token...');
      const response = await supabase.functions.invoke('verify-recaptcha', {
        body: { token }
      });

      if (response.error) {
        console.error('reCAPTCHA verification error:', response.error);
        return false;
      }

      const { data } = response;
      console.log('reCAPTCHA verification response:', data);

      if (!data.success) {
        console.error('reCAPTCHA verification failed:', data.message, data.errors);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying reCAPTCHA:', error);
      return false;
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched when submitting
    setTouchedFields({
      email: true,
      password: true,
      confirmPassword: true,
      fullName: true,
      location: true,
      language: true
    });

    // Validate all fields before submission
    const errors: {[key: string]: string} = {};
    
    // Validate step 1 fields
    if (!email) errors.email = t('validation.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = t('validation.emailInvalid');
    
    if (!password) errors.password = t('validation.passwordRequired');
    else if (password.length < 8) errors.password = t('validation.passwordMinLength');
    
    if (!confirmPassword) errors.confirmPassword = t('validation.passwordRequired');
    else if (confirmPassword !== password) errors.confirmPassword = t('validation.passwordMatch');
    
    // Validate step 2 fields
    if (!firstName) errors.firstName = t('validation.firstNameRequired');
    if (!lastName) errors.lastName = t('validation.lastNameRequired');
    if (!location) errors.location = t('validation.locationRequired');
    if (!language) errors.language = t('validation.languageRequired');
    if (!captchaToken) errors.captcha = t('validation.captchaRequired');
    
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (errors.email || errors.password || errors.confirmPassword) {
        setStep(1);
      }
      return;
    }
    
    setLoading(true);
    setErrorMessage('');
    setEmailSent(false);

    try {
      // Call the server-side signup function
      console.log('Sending signup request with data:', {
        email,
        password: '***',
        first_name: firstName,
        last_name: lastName,
        location,
        language,
        newsletter_subscribed: subscribeNewsletter,
        captchaToken: captchaToken ? '***' : null
      });

      const response = await supabase.functions.invoke('signup', {
        body: {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          location,
          language,
          newsletter_subscribed: subscribeNewsletter,
          captchaToken
        }
      });

      console.log('Signup response:', response);

      if (response.error) {
        // Throw to be caught by catch block for proper error parsing
        throw response.error;
      }

      // Automatically sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error('Auto-login error:', signInError);
        toast({
          title: t('success.signUp'),
          description: t('signUp.loginManually')
        });
        return;
      }

      // Show success message and call onSuccess
      toast({
        title: t('success.signUp'),
        description: t('signUp.welcome')
      });

      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      // Robust error handling for Supabase Edge Functions
      if (error instanceof FunctionsHttpError) {
        try {
          const errorBody = await error.context.json();
          if (errorBody.error && errorBody.error.includes('captcha')) {
            setShowCaptcha(true);
            setErrorMessage(t('errors.captchaFailed'));
            setCaptchaToken(null);
          } else if (errorBody.error && errorBody.error.includes('already exists')) {
            setErrorMessage(t('errors.emailExists'));
          } else {
            setErrorMessage(errorBody.error || t('errors.default'));
          }
        } catch (parseErr) {
          setErrorMessage(t('errors.default'));
        }
      } else {
        setErrorMessage(error.message || t('errors.default'));
      }
      console.error('Signup error:', error);
      if (!errorMessage) {
        toast({
          title: t('errors.default'),
          description: error.message || t('errors.default'),
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
    if (!token) {
      setFormErrors(prev => ({ ...prev, captcha: t('validation.captchaRequired') }));
    } else {
      setFormErrors(prev => {
        const { captcha, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleLocationChange = (newLocation: string, coordinates: [number, number]) => {
    setLocation(newLocation);
    setLocationCoordinates(coordinates);
    markFieldAsTouched('location');
  };

  const renderStep = () => {
    const slideAnimation = {
      initial: { x: 20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -20, opacity: 0 },
      transition: { duration: 0.3 }
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          {...slideAnimation}
        >
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('signUp.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  name="username"
                  autoComplete="username"
                  placeholder={t('signUp.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => markFieldAsTouched('email')}
                  required
                  className={shouldShowError('email') ? 'border-red-500' : ''}
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                {shouldShowError('email') && (
                  <p className="text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmEmail">{t('signUp.confirmEmail')}</Label>
                <Input
                  id="confirmEmail"
                  type="email"
                  name="confirm-email"
                  autoComplete="email"
                  placeholder={t('signUp.confirmEmailPlaceholder')}
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  onBlur={() => markFieldAsTouched('confirmEmail')}
                  required
                  className={shouldShowError('confirmEmail') ? 'border-red-500' : ''}
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                {shouldShowError('confirmEmail') && (
                  <p className="text-sm text-red-500">{formErrors.confirmEmail}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t('signUp.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  name="new-password"
                  autoComplete="new-password"
                  placeholder={t('signUp.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => markFieldAsTouched('password')}
                  required
                  className={shouldShowError('password') ? 'border-red-500' : ''}
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                {shouldShowError('password') && (
                  <p className="text-sm text-red-500">{formErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('signUp.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  name="confirm-password"
                  autoComplete="new-password"
                  placeholder={t('signUp.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => markFieldAsTouched('confirmPassword')}
                  required
                  className={shouldShowError('confirmPassword') ? 'border-red-500' : ''}
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                {shouldShowError('confirmPassword') && (
                  <p className="text-sm text-red-500">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('signUp.firstName')}</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder={t('signUp.firstNamePlaceholder')}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => markFieldAsTouched('firstName')}
                    required
                    className={shouldShowError('firstName') ? 'border-red-500' : ''}
                  />
                  {shouldShowError('firstName') && (
                    <p className="text-sm text-red-500">{formErrors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('signUp.lastName')}</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder={t('signUp.lastNamePlaceholder')}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => markFieldAsTouched('lastName')}
                    required
                    className={shouldShowError('lastName') ? 'border-red-500' : ''}
                  />
                  {shouldShowError('lastName') && (
                    <p className="text-sm text-red-500">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">{t('signUp.location')}</Label>
                <LocationSearch
                  value={location}
                  onChange={handleLocationChange}
                  className={shouldShowError('location') ? 'border-red-500' : ''}
                />
                {shouldShowError('location') && (
                  <p className="text-sm text-red-500">{formErrors.location}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">{t('signUp.language')}</Label>
                <Select
                  value={language}
                  onValueChange={(value) => {
                    setLanguage(value);
                    markFieldAsTouched('language');
                  }}
                >
                  <SelectTrigger
                    id="language"
                    className={shouldShowError('language') ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder={t('signUp.languagePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
                {shouldShowError('language') && (
                  <p className="text-sm text-red-500">{formErrors.language}</p>
                )}
              </div>

              {/* Newsletter subscription checkbox hidden - automatically set to true on profile creation */}
              {/* <div className="flex items-center space-x-2">
                <Checkbox
                  id="newsletter"
                  checked={subscribeNewsletter}
                  onCheckedChange={(checked) => setSubscribeNewsletter(checked as boolean)}
                />
                <label
                  htmlFor="newsletter"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('signUp.subscribeNewsletter')}
                </label>
              </div> */}

              <div className="flex justify-center my-4">
                <div className="relative z-[9999]">
                  <ReCAPTCHA
                    sitekey="6LelQh0rAAAAAMLk0Mf99W7DKHkPhSDue0yghdF7"
                    onChange={handleCaptchaChange}
                    className="transform scale-100"
                  />
                </div>
              </div>
              {formErrors.captcha && (
                <p className="text-sm text-red-500 text-center">{formErrors.captcha}</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6 py-8">
              <div className="flex justify-center">
                <img 
                  src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2N4dm16MHV5NWh0emF0NDJpNHEwYWU2OGRucXlyamdpMjNjbDI0cSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3orieOSehVQs29STDi/giphy.gif"
                  alt="Success animation"
                  className="w-48 h-48 rounded-full shadow-lg mb-4"
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-green-100 text-green-700 rounded-full p-3">
                    <CheckCircle className="h-12 w-12" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {t('signUp.thankYouTitle')}
                </h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  {t('signUp.thankYouMessage')}
                </p>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-6 text-sm text-blue-700">
                  {t('signUp.checkEmailMessage')}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <div className="text-sm">
            <p>{errorMessage}</p>
            {errorMessage === t('errors.emailExists') && (
              <p className="mt-1">
                {t('signUp.hasAccount')} <a href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('signin-tab')?.click();
                  }}
                  className="text-blue-600 hover:underline"
                >
                  {t('signUp.signIn')}
                </a>
              </p>
            )}
          </div>
        </div>
      )}
      
      {emailSent && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700">
          <div className="text-sm">
            <p>{t('signUp.checkEmail')}</p>
          </div>
        </div>
      )}

      {renderStep()}
      
      <div className="flex justify-between gap-4 mt-6">
        {step > 1 && step < 3 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={loading}
          >
            {t('common.back')}
          </Button>
        )}
        
        {step < 2 ? (
          <Button
            type="button"
            className="w-full relative px-6 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide"
            onClick={handleNext}
            disabled={loading}
          >
            {t('common.next')}
          </Button>
        ) : step === 2 ? (
          <Button 
            type="submit" 
            className="w-full relative px-6 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide"
            disabled={loading}
            variant="default"
          >
            {loading ? t('loading') : t('signUp.button')}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
