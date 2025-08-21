import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  PlusCircle,
  XCircle,
  ArrowRight,
  DollarSign,
  Check,
  FileText,
  ExternalLink,
  Users,
  PlaneTakeoff,
  CableCar,
  Car,
  Award,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useSubscriptionManager, SubscriptionDetails } from '@/hooks/useSubscriptionManager';
import { useAppStorePayment } from '@/hooks/useAppStorePayment';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

export function SubscriptionManager() {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const {
    subscription,
    getSubscriptionDetails,
    updatePaymentMethod,
    cancelSubscription,
    reactivateSubscription,
    changeSubscriptionPlan,
    getBillingHistory
  } = useSubscriptionManager();

  const { restorePurchases } = useAppStorePayment();

  // Define plan type to fix linter errors
  type Plan = {
    name: string;
    features: string[];
    monthlyPrice: number;
    yearlyPrice: number;
    color: string;
    recommended?: boolean;
  };

  // Pricing plans data - moved inside component to access t function
  const PLANS: Record<string, Plan> = {
    zaptrip: {
      name: t('zaptrip.title'),
      features: t('zaptrip.features').split('|'),
      monthlyPrice: 4.99,
      yearlyPrice: 53.99, // 10% discount for yearly
      color: 'bg-blue-100 text-blue-800',
      recommended: false
    },
    zapout: {
      name: t('zapout.title'),
      features: t('zapout.features').split('|'),
      monthlyPrice: 4.99,
      yearlyPrice: 53.99,
      color: 'bg-purple-100 text-purple-800',
      recommended: false
    },
    zaproad: {
      name: t('zaproad.title'),
      features: t('zaproad.features').split('|'),
      monthlyPrice: 4.99,
      yearlyPrice: 53.99,
      color: 'bg-pink-100 text-pink-800',
      recommended: false
    },
    zappro: {
      name: t('zappro.title'),
      features: t('zappro.features').split('|'),
      monthlyPrice: 9.99,
      yearlyPrice: 107.99,
      color: 'bg-yellow-100 text-yellow-800',
      recommended: true
    },
    explorer: {
      name: t('explorer.title'),
      features: t('explorer.features').split('|'),
      monthlyPrice: 0,
      yearlyPrice: 0,
      color: 'bg-gray-100 text-gray-800',
      recommended: false
    }
  };

  // Handle restore purchases
  const handleRestorePurchases = async () => {
    try {
      setIsLoading(true);
      const success = await restorePurchases();
      if (success) {
        // Refresh subscription details after restore
        await getSubscriptionDetails();
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch subscription details when component mounts
  useEffect(() => {
    async function loadSubscription() {
      setIsLoading(true);
      try {
        console.log('Loading subscription details...');
        const result = await getSubscriptionDetails();
        console.log('Subscription details loaded:', result);
        
        if (result.success && result.subscription) {
          // Don't set selectedPlan here, only set isYearly
          setIsYearly(result.subscription.interval === 'year');
        } else {
          console.warn('No subscription details found');
          // Set default values for new users for isYearly only
          setIsYearly(false);
        }
      } catch (error) {
        console.error('Error loading subscription:', error);
        // Set default value for isYearly in case of error
        setIsYearly(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSubscription();
    // Don't include getSubscriptionDetails in dependencies to prevent continuous refetching
  }, []);

  // This will run whenever the subscription state changes
  useEffect(() => {
    if (subscription) {
      console.log("Current subscription display state:", {
        plan: subscription.plan,
        status: subscription.status,
        interval: subscription.interval,
        showSubscribeButton: !subscription || !subscription.plan || subscription.status === 'none'
      });
    } else {
      console.log("No subscription state available");
    }
  }, [subscription]);

  const handleUpdatePayment = async () => {
    const result = await updatePaymentMethod();
    if (result.success && result.url) {
      window.open(result.url, '_blank');
    }
  };

  const handleCancelSubscription = async () => {
    try {
      console.log("Starting subscription cancellation process");
      const result = await cancelSubscription();
      console.log("Cancellation result:", result);
      setConfirmCancel(false);
      
      if (result.success) {
      }
    } catch (error) {
      console.error("Error in handleCancelSubscription:", error);
      // Show success message anyway and update UI state for better UX

      
      // Use the getSubscriptionDetails to refresh subscription state
      await getSubscriptionDetails();
      setConfirmCancel(false);
    }
  };

  const handleReactivateSubscription = async () => {
    await reactivateSubscription();
  };

  // Handle plan selection
  const handlePlanSelect = (plan: string) => {
    // Check if user is trying to select the current plan
    if (subscription && subscription.plan === plan) {
      console.log('Already on this plan, no need to change');
      toast({
        title: t('subscriptionManager.alreadyOnPlan'),
        description: t('subscriptionManager.alreadyOnPlanDescription'),
      });
      return;
    }
    
    // Set the selected plan
    console.log('Selected plan:', plan);
    setSelectedPlan(plan);
  };

  // Handle plan change confirmation
  const handleChangePlan = async () => {
    if (!selectedPlan) return;
    
    try {
      // Don't change to the same plan
      if (subscription && subscription.plan === selectedPlan) {
        console.log('Already on this plan, closing dialog');
        setSelectedPlan(null);
        return;
      }
      
      // Show loading state
      setIsLoading(true);
      
      // Log the plan being changed to
      console.log('Changing to plan:', selectedPlan);
      
      const result = await changeSubscriptionPlan(selectedPlan, isYearly);
      
      if (result.success) {
        // Update was successful
        setSelectedPlan(null);
        toast({
          title: t('subscriptionManager.changePlanSuccess'),
          description: t('subscriptionManager.changePlanDescription')
        });
        
        // Refresh subscription details
        await getSubscriptionDetails();
      } else {
        // On error, show error message
        setSelectedPlan(null);
        toast({
          title: t('toasts.error'),
          description: t('subscriptionManager.changePlanError'),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error in handleChangePlan:', error);
      // Always close the dialog on error
      setSelectedPlan(null);
      toast({
        title: t('toasts.error'),
        description: t('subscriptionManager.changePlanError'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'canceled':
      case 'cancelled':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'past_due':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'trialing':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'unpaid':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    const statusKey = `subscriptionManager.status.${status.toLowerCase()}`;
    return <Badge className={getStatusBadgeClass(status)}>{t(statusKey)}</Badge>;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const renderSubscriptionDetails = () => {
    if (!subscription || subscription.status === 'none' || subscription.status === 'canceled' || subscription.status === 'cancelled') {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">{t('subscriptionManager.noSubscription')}</p>
          <div className="flex flex-col gap-3 justify-center mt-4">
            <Button onClick={() => navigate(`/${i18n.language}/pricing`)}>
              {t('subscriptionManager.subscribe')}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRestorePurchases}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.processing')}
                </>
              ) : (
                t('subscriptionManager.restorePurchases')
              )}
            </Button>
          </div>
        </div>
      );
    }

    const planInfo = PLANS[subscription.plan as keyof typeof PLANS] || PLANS.explorer;

    return (
      <div className="space-y-5">
        {subscription.cancelAtPeriodEnd && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('subscriptionManager.canceledTitle')}</AlertTitle>
            <AlertDescription>
              {t('subscriptionManager.canceledDescription')}
            </AlertDescription>
          </Alert>
        )}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              {t('subscriptionManager.currentPlan')}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={planInfo.color}>
                {planInfo.name}
              </Badge>
              <span className="text-sm">
                {subscription.interval === 'year' ? t('subscriptionManager.yearlyBilling') : t('subscriptionManager.monthlyBilling')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              {t('subscriptionManager.statusLabel')}
            </h3>
            <div className="mt-1">
              {getStatusBadge(subscription.status)}
              {subscription.cancelAtPeriodEnd && (
                <span className="ml-2 text-sm text-gray-500">
                  {t('subscriptionManager.cancelsAtEnd')}
                </span>
              )}
            </div>
          </div>
          {subscription.cancelAtPeriodEnd ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleReactivateSubscription}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('subscriptionManager.reactivateSubscription')}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
              onClick={() => setConfirmCancel(true)}
            >
              <XCircle className="h-3.5 w-3.5" />
              {t('subscriptionManager.cancelSubscription')}
            </Button>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">
            {t('subscriptionManager.renewalDate')}
          </h3>
          <p className="mt-1 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-gray-400" />
            {formatDate(subscription.currentPeriodEnd)}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">
            {t('subscriptionManager.currentPrice')}
          </h3>
          <p className="mt-1 flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-gray-400" />
            {subscription.interval === 'year' 
              ? `$${(planInfo.yearlyPrice / 12).toFixed(2)} ${t('subscriptionManager.perMonthYearly')}`
              : `$${planInfo.monthlyPrice.toFixed(2)} ${t('subscriptionManager.perMonth')}`
            }
          </p>
        </div>

        {subscription.paymentMethod && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              {t('subscriptionManager.paymentMethod')}
            </h3>
            <div className="flex justify-between items-center">
              <p className="mt-1 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-gray-400" />
                {subscription.paymentMethod.brand.charAt(0).toUpperCase() + subscription.paymentMethod.brand.slice(1)} •••• {subscription.paymentMethod.last4}
                <span className="text-sm text-gray-500">
                  (Expires {subscription.paymentMethod.expiryMonth}/{subscription.paymentMethod.expiryYear})
                </span>
              </p>
              <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleUpdatePayment}>
                <CreditCard className="h-3.5 w-3.5 mr-1" />
                {t('subscriptionManager.updatePayment')}
              </Button>
            </div>
          </div>
        )}

        <div className="pt-4 mt-4 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {t('subscriptionManager.needHelp')}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRestorePurchases}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <Download className="h-3.5 w-3.5" />
              {isLoading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  {t('common.processing')}
                </>
              ) : (
                t('subscriptionManager.restorePurchases')
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderPlansTab = () => {
    if (!subscription) return null;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">{t('subscriptionManager.planOptions')}</h3>
          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-full shadow-sm">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 text-xs font-medium rounded-full transition-all ${
                !isYearly ? "bg-white shadow-sm text-blue-700" : "text-gray-600"
              }`}
            >
              {t('subscriptionManager.monthlyBilling')}
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 text-xs font-medium rounded-full transition-all ${
                isYearly ? "bg-white shadow-sm text-blue-700" : "text-gray-600"
              }`}
            >
              {t('subscriptionManager.yearlyBilling')}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Object.entries(PLANS)
            .sort(([a], [b]) => {
              // Put zappro first, then sort the rest alphabetically
              if (a === 'zappro') return -1;
              if (b === 'zappro') return 1;
              return a.localeCompare(b);
            })
            .map(([id, plan]) => {
              const isCurrentPlan = subscription.plan === id;
              const price = isYearly 
                ? (plan.yearlyPrice / 12).toFixed(2)
                : plan.monthlyPrice.toFixed(2);
              let icon = null;
              let iconColor = '';
              if (id === 'zaptrip') {
                icon = <PlaneTakeoff className="h-8 w-8 text-blue-500" />;
                iconColor = 'bg-blue-100 text-blue-800';
              } else if (id === 'zapout') {
                icon = <CableCar className="h-8 w-8 text-purple-500" />;
                iconColor = 'bg-purple-100 text-purple-800';
              } else if (id === 'zaproad') {
                icon = <Car className="h-8 w-8 text-pink-500" />;
                iconColor = 'bg-pink-100 text-pink-800';
              } else if (id === 'zappro') {
                icon = <Award className="h-8 w-8 text-yellow-500" />;
                iconColor = 'bg-yellow-100 text-yellow-800';
              }
              return (
                <Card key={id} className="relative flex flex-col h-full bg-white/80 backdrop-blur-sm border-0 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2">
                        {icon}
                        <span className={`text-sm font-semibold ${iconColor}`}>{plan.name}</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6">{t(`${id}.description`)}</p>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full ${plan.color} flex items-center justify-center`}>
                            <Check className={`w-3 h-3 ${iconColor.split(' ')[1]}`} />
                          </div>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {isCurrentPlan ? (
                      <Button 
                        variant="outline" 
                        className={`w-full border-2 font-medium border-green-500 text-green-700`}
                        disabled={true}
                      >
                        {t('subscriptionManager.currentPlanLabel')}
                      </Button>
                    ) : (
                      <Button 
                        className={`w-full font-medium shadow-sm ${plan.color}`}
                        onClick={() => handlePlanSelect(id)}
                      >
                        {t('subscriptionManager.selectPlan')}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
        </div>
      </div>
    );
  };

  // Fetch billing history
  const loadBillingHistory = async () => {
    if (!subscription) return;
    
    setLoadingInvoices(true);
    try {
      console.log('Loading billing history...');
      const result = await getBillingHistory(20); // Get up to 20 invoices
      
      if (result.success) {
        console.log('Billing history loaded:', result.invoices);
        setInvoices(result.invoices);
      } else {
        console.warn('Failed to load billing history:', result.error);
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error loading billing history:', error);
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Update the renderBillingHistoryTab function
  const renderBillingHistoryTab = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('subscriptionManager.billingHistory.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingInvoices ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              {t('subscriptionManager.billingHistory.noHistory')}
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                  <div>
                    <div className="font-medium">
                      {t('subscriptionManager.billingHistory.invoice.number')}{invoice.number} 
                      <Badge 
                        className={
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800 ml-2' : 
                          invoice.status === 'open' ? 'bg-blue-100 text-blue-800 ml-2' : 
                          'bg-gray-100 text-gray-800 ml-2'
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(invoice.created)} • ${invoice.amount_paid} {invoice.currency.toUpperCase()}
                    </div>
                  </div>
                  {invoice.hosted_invoice_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => window.open(invoice.hosted_invoice_url, '_blank')}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {t('subscriptionManager.viewInvoice')}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadBillingHistory}
            disabled={loadingInvoices}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingInvoices ? 'animate-spin' : ''}`} />
            {t('subscriptionManager.refreshBillingHistory')}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">{t('subscriptionManagement.title')}</CardTitle>
          <CardDescription>
            {t('subscriptionManagement.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderSubscriptionDetails()}
        </CardContent>
      </Card>

      {subscription && subscription.status !== 'none' && subscription.status !== 'canceled' && subscription.status !== 'cancelled' && (
        <Tabs defaultValue="plans" onValueChange={(value) => {
          if (value === 'history') {
            loadBillingHistory();
          }
        }}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="history">{t('subscriptionManager.billingHistory.title')}</TabsTrigger>
          </TabsList>
          <TabsContent value="plans" className="mt-4">
            {renderPlansTab()}
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            {renderBillingHistoryTab()}
          </TabsContent>
        </Tabs>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('subscriptionManager.confirmCancel.title')}</DialogTitle>
            <DialogDescription>
              {t('subscriptionManager.confirmCancel.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmCancel(false)}>
              {t('subscriptionManager.confirmCancel.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelSubscription}
              disabled={isLoading}
            >
              {isLoading ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> {t('common.processing')}</>
              ) : (
                t('subscriptionManager.confirmCancel.confirm')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('subscriptionManager.changePlanTitle')}</DialogTitle>
            <DialogDescription>
              {t('subscriptionManager.changePlanDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">{t('subscriptionManager.billingCycle')}</div>
            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-full">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                  !isYearly ? "bg-white shadow-sm" : "text-gray-600"
                }`}
              >
                {t('subscriptionManager.monthlyBilling')}
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                  isYearly ? "bg-white shadow-sm" : "text-gray-600"
                }`}
              >
                {t('subscriptionManager.yearlyBilling')}
                <span className="ml-1 text-xs bg-green-100 text-green-800 px-1 rounded-sm">
                  -10%
                </span>
              </button>
            </div>
          </div>
          {selectedPlan && PLANS[selectedPlan] && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">
                  {PLANS[selectedPlan]?.name || selectedPlan}
                </div>
                <Badge className={PLANS[selectedPlan]?.color || 'bg-gray-100'}>
                  {t('subscriptionManager.selected')}
                </Badge>
              </div>
              <div className="text-2xl font-bold mt-2">
                ${isYearly 
                  ? (PLANS[selectedPlan]?.yearlyPrice / 12).toFixed(2)
                  : PLANS[selectedPlan]?.monthlyPrice.toFixed(2)
                }
                <span className="text-sm text-gray-500 font-normal ml-1">
                  / {t('subscriptionManager.month')}
                </span>
              </div>
              <div className="text-sm text-gray-500 mb-4">
                {isYearly 
                  ? t('subscriptionManager.billedYearly', { 
                      amount: PLANS[selectedPlan]?.yearlyPrice.toFixed(2) 
                    })
                  : t('subscriptionManager.billedMonthly')
                }
              </div>
              <div className="text-sm mt-2">
                <span className="font-medium">{t('subscriptionManager.includes')}:</span>
                <ul className="mt-2 space-y-1">
                  {PLANS[selectedPlan]?.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSelectedPlan(null)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" onClick={handleChangePlan}>
              {t('subscriptionManager.confirmChangePlan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 