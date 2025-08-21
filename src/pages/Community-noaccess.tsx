import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Globe, MessageCircle, Users, CalendarClock, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { NewsletterDialog } from '@/components/community/NewsletterDialog';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';

const waitlistSchema = z.object({
  email: z.string().email(),
});

type WaitlistFormValues = z.infer<typeof waitlistSchema>;

const LOCALE_MAP = { en: 'en_US', fr: 'fr_FR', es: 'es_ES' };

const CommunityNoAccess: React.FC = () => {
  const { t, i18n } = useTranslation('community');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newsletterDialogOpen, setNewsletterDialogOpen] = useState(false);
  const { userRole } = useUserRole();
  const navigate = useNavigate();
  const language = i18n.language;
  const locale = LOCALE_MAP[language] || 'en_US';
  

  // Debug log
  useEffect(() => {
    console.log('Current user role:', userRole);
  }, [userRole]);

  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleJoinWaitlist = async (data: WaitlistFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert([{ email: data.email, source: 'community' }]);

      if (error) throw error;

      toast({
        title: tCommon('success'),
        description: tCommon('waitlistSuccess'),
      });

      form.reset();
    } catch (error) {
      console.error('Error joining waitlist:', error);
      toast({
        variant: 'destructive',
        title: tCommon('error'),
        description: tCommon('waitlistError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    navigate('/pricing');
  };

  const isTier1 = userRole === 'tier1';

  if (isTier1) {
    return (
      <div>
        <div className="fixed inset-0 z-50 backdrop-blur-md bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center shadow-2xl transform transition-all animate-fade-in">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <Lock className="h-16 w-16 text-blue-500" />
                <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-3 text-gray-800">
              {t('upgrade.oopsTitle', 'Oops! Explorer Territory Ahead! 🌟')}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {t('upgrade.funMessage', 'Hey there, Traveler! 🌍 Welcome to our Explorer-exclusive zone. While your Traveler plan is awesome, this area is reserved for our Explorer members. Ready to level up your adventure? 🚀')}
            </p>
            
            <Button 
              onClick={handleUpgradeClick}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              {t('upgrade.cta', 'Upgrade to Explorer 🌟')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      

      <div className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('subtitle')}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 md:p-12 shadow-lg mb-12 border border-blue-100"
        >
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {t('comingSoonTitle')}
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mb-8">
              {t('comingSoonDescription')}
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setNewsletterDialogOpen(true)}
            >
              {t('notifyMe')}
            </Button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            {
              icon: <Users className="h-8 w-8 text-blue-500" />,
              title: t('features.connect.title'),
              description: t('features.connect.description'),
            },
            {
              icon: <MessageCircle className="h-8 w-8 text-purple-500" />,
              title: t('features.share.title'),
              description: t('features.share.description'),
            },
            {
              icon: <Globe className="h-8 w-8 text-green-500" />,
              title: t('features.discover.title'),
              description: t('features.discover.description'),
            },
            {
              icon: <CalendarClock className="h-8 w-8 text-orange-500" />,
              title: t('features.events.title'),
              description: t('features.events.description'),
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold mb-4">{t('stayTuned')}</h2>
          <p className="text-gray-600 mb-6">{t('betaAccess')}</p>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleJoinWaitlist)} className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <input
                        {...field}
                        type="email"
                        placeholder={t('emailPlaceholder')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? tCommon('loading') : t('joinWaitlist')}
              </Button>
            </form>
          </Form>
        </motion.div>
      </div>
      
      <NewsletterDialog 
        open={newsletterDialogOpen} 
        onOpenChange={setNewsletterDialogOpen} 
      />
    </div>
  );
};

export default CommunityNoAccess;