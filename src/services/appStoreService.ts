import { supabase } from '../integrations/supabase/client';
import { Purchases, PurchasesOffering, PurchasesPackage, CustomerInfo } from '@revenuecat/purchases-capacitor';

export interface AppStoreProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  period: 'month' | 'year';
  features: string[];
}

export interface AppStoreSubscription {
  id: string;
  status: 'active' | 'cancelled' | 'expired' | 'in_grace_period';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  productId: string;
}

export interface AppStoreReceipt {
  transactionId: string;
  productId: string;
  purchaseDate: Date;
  expirationDate?: Date;
  isTrialPeriod: boolean;
  isIntroductoryPricePeriod: boolean;
}

// Define the product mapping based on your App Store Connect setup
const PRODUCT_IDS = {
  zaptrip: {
    monthly: 'com.zaparound.zaptrip.monthly',
    yearly: 'com.zaparound.zaptrip.yearly'
  },
  zapout: {
    monthly: 'com.zaparound.zapout.monthly',
    yearly: 'com.zaparound.zapout.yearly'
  },
  zaproad: {
    monthly: 'com.zaparound.zaproad.monthly',
    yearly: 'com.zaparound.zaproad.yearly'
  },
  zappro: {
    monthly: 'com.zaparound.zappro.monthly',
    yearly: 'com.zaparound.zappro.yearly'
  }
};

const PRICING = {
  zaptrip: { monthly: 4.99, yearly: 53.99 },
  zapout: { monthly: 4.99, yearly: 53.99 },
  zaproad: { monthly: 4.99, yearly: 53.99 },
  zappro: { monthly: 9.99, yearly: 107.99 }
};

export class AppStoreService {
  private static instance: AppStoreService;
  private isInitialized = false;

  public static getInstance(): AppStoreService {
    if (!AppStoreService.instance) {
      AppStoreService.instance = new AppStoreService();
    }
    return AppStoreService.instance;
  }

  async initialize(apiKey: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Purchases.configure({
        apiKey,
        appUserID: undefined, // Will be set when user logs in
        useAmazon: false
      });
      
      this.isInitialized = true;
      console.log('App Store service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize App Store service:', error);
      throw error;
    }
  }

  async setUser(userId: string): Promise<void> {
    try {
      await Purchases.logIn({ appUserID: userId });
      console.log('App Store user set:', userId);
    } catch (error) {
      console.error('Failed to set App Store user:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOffering[]> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.all ? Object.values(offerings.all) : [];
    } catch (error) {
      console.error('Failed to get App Store offerings:', error);
      throw error;
    }
  }

  async getProducts(): Promise<AppStoreProduct[]> {
    try {
      const offerings = await this.getOfferings();
      const products: AppStoreProduct[] = [];

      for (const offering of offerings) {
        if (offering.availablePackages) {
          for (const pkg of offering.availablePackages) {
            const product = await this.packageToProduct(pkg);
            if (product) {
              products.push(product);
            }
          }
        }
      }

      return products;
    } catch (error) {
      console.error('Failed to get App Store products:', error);
      throw error;
    }
  }

  private async packageToProduct(pkg: PurchasesPackage): Promise<AppStoreProduct | null> {
    try {
      // Map the package identifier to our product structure
      const productInfo = this.getProductInfo(pkg.identifier);
      if (!productInfo) return null;

      return {
        id: pkg.identifier,
        title: productInfo.title,
        description: productInfo.description,
        price: productInfo.price,
        currency: '$',
        period: productInfo.period,
        features: productInfo.features
      };
    } catch (error) {
      console.error('Failed to convert package to product:', error);
      return null;
    }
  }

  private getProductInfo(productId: string): { title: string; description: string; price: number; period: 'month' | 'year'; features: string[] } | null {
    // Extract plan and period from product ID
    const match = productId.match(/com\.zaparound\.(\w+)\.(monthly|yearly)/);
    if (!match) return null;

    const [, plan, period] = match;
    const isYearly = period === 'yearly';
    const price = PRICING[plan as keyof typeof PRICING]?.[period as 'monthly' | 'yearly'] || 0;

    const titles = {
      zaptrip: 'ZapTrip',
      zapout: 'ZapOut',
      zaproad: 'ZapRoad',
      zappro: 'ZapPro'
    };

    const descriptions = {
      zaptrip: 'Perfect for solo travelers and small groups',
      zapout: 'Ideal for adventure seekers and outdoor enthusiasts',
      zaproad: 'Great for road trips and car travel',
      zappro: 'Ultimate travel planning with all features included'
    };

    const features = {
      zaptrip: [
        'Basic trip planning',
        'Route optimization',
        'Basic maps integration',
        'Trip sharing'
      ],
      zapout: [
        'Advanced trip planning',
        'Outdoor activity suggestions',
        'Weather integration',
        'Emergency contacts'
      ],
      zaproad: [
        'Road trip planning',
        'Gas station finder',
        'Rest stop recommendations',
        'Traffic updates'
      ],
      zappro: [
        'All ZapTrip features',
        'All ZapOut features',
        'All ZapRoad features',
        'Priority support',
        'Advanced analytics',
        'Custom branding'
      ]
    };

    return {
      title: titles[plan as keyof typeof titles] || 'Unknown Plan',
      description: descriptions[plan as keyof typeof descriptions] || 'Travel planning solution',
      price,
      period: isYearly ? 'year' : 'month',
      features: features[plan as keyof typeof features] || ['Basic features']
    };
  }

  async purchaseProduct(packageId: string): Promise<AppStoreReceipt> {
    try {
      const offerings = await this.getOfferings();
      let targetPackage: PurchasesPackage | null = null;

      // Find the package by ID
      for (const offering of offerings) {
        if (offering.availablePackages) {
          targetPackage = offering.availablePackages.find(pkg => pkg.identifier === packageId) || null;
          if (targetPackage) break;
        }
      }

      if (!targetPackage) {
        throw new Error(`Package ${packageId} not found`);
      }

      const purchaseResult = await Purchases.purchasePackage({ aPackage: targetPackage });
      
      // Check if purchase was successful by looking at customer info
      const customerInfo = await this.getCustomerInfo();
      const hasActiveEntitlement = Object.keys(customerInfo.entitlements.active).length > 0;
      
      if (hasActiveEntitlement) {
        // Store transaction in Supabase
        await this.storeTransaction(purchaseResult, customerInfo);
        
        return this.createReceipt(purchaseResult, customerInfo);
      } else {
        throw new Error('Purchase completed but entitlement not granted');
      }
    } catch (error) {
      console.error('Failed to purchase product:', error);
      throw error;
    }
  }

  private async storeTransaction(purchaseResult: any, customerInfo: CustomerInfo): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('appstore-store-transaction', {
        body: {
          transactionId: purchaseResult.transactionId || '',
          productId: purchaseResult.productId || '',
          purchaseDate: purchaseResult.purchaseDate || new Date(),
          userId: customerInfo.originalAppUserId || ''
        }
      });

      if (error) {
        console.error('Failed to store transaction:', error);
      }
    } catch (error) {
      console.error('Failed to store transaction:', error);
    }
  }

  private createReceipt(purchaseResult: any, customerInfo: CustomerInfo): AppStoreReceipt {
    return {
      transactionId: purchaseResult.transactionId || '',
      productId: purchaseResult.productId || '',
      purchaseDate: new Date(purchaseResult.purchaseDate || Date.now()),
      expirationDate: purchaseResult.expirationDate ? new Date(purchaseResult.expirationDate) : undefined,
      isTrialPeriod: purchaseResult.isTrialPeriod || false,
      isIntroductoryPricePeriod: purchaseResult.isIntroductoryPricePeriod || false
    };
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const result = await Purchases.getCustomerInfo();
      return result;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  async getSubscriptionStatus(): Promise<AppStoreSubscription | null> {
    try {
      const customerInfo = await this.getCustomerInfo();
      
      // Check for active entitlements
      const activeEntitlements = Object.entries(customerInfo.entitlements.active);
      
      if (activeEntitlements.length === 0) {
        return null;
      }

      // Get the first active entitlement
      const [entitlementId, entitlement] = activeEntitlements[0];
      
      return {
        id: entitlementId,
        status: 'active',
        currentPeriodStart: new Date(entitlement.latestPurchaseDate || Date.now()),
        currentPeriodEnd: new Date(entitlement.expirationDate || Date.now()),
        cancelAtPeriodEnd: entitlement.willRenew === false,
        productId: entitlement.productIdentifier || ''
      };
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<void> {
    try {
      await Purchases.restorePurchases();
      console.log('Purchases restored successfully');
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  async cancelSubscription(): Promise<void> {
    try {
      // Note: App Store subscriptions can only be cancelled through App Store settings
      // This method will redirect users to the appropriate settings
      console.log('Subscription cancellation must be done through App Store settings');
      
      // You might want to show a dialog explaining this to the user
      throw new Error('Subscriptions must be cancelled through App Store settings');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  async changePlan(newPackageId: string): Promise<void> {
    try {
      // For App Store, changing plans involves purchasing the new plan
      // The old subscription will be automatically cancelled
      await this.purchaseProduct(newPackageId);
      console.log('Plan changed successfully');
    } catch (error) {
      console.error('Failed to change plan:', error);
      throw error;
    }
  }

  // Helper method to get product ID for a specific plan and billing cycle
  getProductId(plan: string, isYearly: boolean): string | null {
    const planProducts = PRODUCT_IDS[plan as keyof typeof PRODUCT_IDS];
    if (!planProducts) return null;
    
    return isYearly ? planProducts.yearly : planProducts.monthly;
  }

  // Helper method to get price for a specific plan and billing cycle
  getPrice(plan: string, isYearly: boolean): number {
    const planPricing = PRICING[plan as keyof typeof PRICING];
    if (!planPricing) return 0;
    
    return isYearly ? planPricing.yearly : planPricing.monthly;
  }
}

export const appStoreService = AppStoreService.getInstance();
