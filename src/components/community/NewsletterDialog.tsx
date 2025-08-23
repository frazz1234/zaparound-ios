import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';

const newsletterSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

interface NewsletterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewsletterDialog({ open, onOpenChange }: NewsletterDialogProps) {
  const { t: tCommon } = useTranslation('common');
  const { t } = useTranslation('community');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSubscribe = async (data: NewsletterFormValues) => {
    setLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('manage-newsletter', {
        body: { 
          email: data.email, 
          subscribed: true 
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: tCommon('footer.subscribeSuccess'),
        description: tCommon('footer.subscribeSuccessDesc'),
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error subscribing to newsletter:", error);
      toast({
        title: tCommon('error'),
        description: error.message || tCommon('footer.subscribeError'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            {t('notifyMe')}
          </DialogTitle>
          <DialogDescription>
            {t('comingSoonDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubscribe)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      placeholder={t('emailPlaceholder')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full"
              >
                {loading ? tCommon('loading') : t('joinWaitlist')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 