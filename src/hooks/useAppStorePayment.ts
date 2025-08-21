import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { appStoreService, AppStoreProduct, AppStoreReceipt } from '../services/appStoreService';
import { supabase } from '../integrations/supabase/client';
import { useTranslation } from 'react-i18next';

export function useAppStorePayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<AppStoreProduct[]>([]);
  const { toast } = useToast();
  const { t } = useTranslation();

  const initializeAppStore = useCallback(async () => {
    // Get current user from supabase auth
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      toast({
        title: t('error'),
        description: t('userNotLoggedIn'),
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Initialize App Store service with your API key
      // You should get this from your environment variables
      const apiKey = import.meta.env.VITE_REVENUECAT_API_KEY;
      if (!apiKey) {
        console.error('RevenueCat API key not found');
        toast({
          title: t('error'),
          description: t('appStoreNotConfigured'),
          variant: 'destructive',
        });
        return false;
      }

      await appStoreService.initialize(apiKey);
      await appStoreService.setUser(userId);
      
      toast({
        title: t('success'),
        description: t('appStoreInitialized'),
      });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize App Store:', error);
      toast({
        title: t('error'),
        description: t('appStoreInitFailed'),
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, t]);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const availableProducts = await appStoreService.getProducts();
      setProducts(availableProducts);
      
      if (availableProducts.length === 0) {
        toast({
          title: t('warning'),
          description: t('noProductsAvailable'),
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      toast({
        title: t('error'),
        description: t('failedToLoadProducts'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  const purchaseProduct = useCallback(async (productId: string): Promise<AppStoreReceipt | null> => {
    // Get current user from supabase auth
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      toast({
        title: t('error'),
        description: t('userNotLoggedIn'),
        variant: 'destructive',
      });
      return null;
    }

    try {
      setIsLoading(true);
      
      // Initialize App Store if not already done
      const isInitialized = await initializeAppStore();
      if (!isInitialized) {
        return null;
      }

      const receipt = await appStoreService.purchaseProduct(productId);
      
      toast({
        title: t('success'),
        description: t('purchaseSuccessful'),
      });

      return receipt;
    } catch (error: any) {
      console.error('Purchase failed:', error);
      
      let errorMessage = t('purchaseFailed');
      
      // Handle specific error cases
      if (error.message?.includes('cancelled')) {
        errorMessage = t('purchaseCancelled');
      } else if (error.message?.includes('network')) {
        errorMessage = t('networkError');
      } else if (error.message?.includes('not allowed')) {
        errorMessage = t('purchaseNotAllowed');
      }

      toast({
        title: t('error'),
        description: errorMessage,
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, t, initializeAppStore]);

  const restorePurchases = useCallback(async () => {
    // Get current user from supabase auth
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      toast({
        title: t('error'),
        description: t('userNotLoggedIn'),
        variant: 'destructive',
      });
      return false;
    }

    try {
      setIsLoading(true);
      
      // Initialize App Store if not already done
      const isInitialized = await initializeAppStore();
      if (!isInitialized) {
        return false;
      }

      await appStoreService.restorePurchases();
      
      toast({
        title: t('success'),
        description: t('purchasesRestored'),
      });
      
      return true;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      toast({
        title: t('error'),
        description: t('failedToRestorePurchases'),
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, t, initializeAppStore]);

  const getSubscriptionStatus = useCallback(async () => {
    // Get current user from supabase auth
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) return null;

    try {
      // Initialize App Store if not already done
      const isInitialized = await initializeAppStore();
      if (!isInitialized) {
        return null;
      }

      return await appStoreService.getSubscriptionStatus();
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return null;
    }
  }, [initializeAppStore]);

  const changePlan = useCallback(async (newProductId: string): Promise<boolean> => {
    // Get current user from supabase auth
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      toast({
        title: t('error'),
        description: t('userNotLoggedIn'),
        variant: 'destructive',
      });
      return false;
    }

    try {
      setIsLoading(true);
      
      // Initialize App Store if not already done
      const isInitialized = await initializeAppStore();
      if (!isInitialized) {
        return false;
      }

      await appStoreService.changePlan(newProductId);
      
      toast({
        title: t('success'),
        description: t('planChangedSuccessfully'),
      });
      
      return true;
    } catch (error) {
      console.error('Failed to change plan:', error);
      toast({
        title: t('error'),
        description: t('failedToChangePlan'),
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, t, initializeAppStore]);

  const cancelSubscription = useCallback(async () => {
    try {
      await appStoreService.cancelSubscription();
      
      toast({
        title: t('info'),
        description: t('subscriptionCancellationInfo'),
        variant: 'default',
      });
      
      return true;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast({
        title: t('error'),
        description: t('failedToCancelSubscription'),
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, t]);

  return {
    isLoading,
    products,
    initializeAppStore,
    loadProducts,
    purchaseProduct,
    restorePurchases,
    getSubscriptionStatus,
    changePlan,
    cancelSubscription,
  };
}
