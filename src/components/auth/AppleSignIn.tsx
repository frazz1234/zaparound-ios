import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

export function AppleSignIn() {
  const { toast } = useToast();
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `https://zaparound.com/dashboard`,
          queryParams: {
            isNewSignUp: 'true'
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Apple sign-in error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred during Apple authentication",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      type="button" 
      variant="outline" 
      className="w-full flex items-center justify-center"
      onClick={handleAppleSignIn}
      disabled={loading}
    >
      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.285 2.86001C16.9908 2.07408 17.4849 1.02893 17.6922 0C16.7045 0.0449159 15.545 0.563218 14.7925 1.38792C14.0989 2.13594 13.4807 3.20888 13.3117 4.18985C14.4143 4.26747 15.5242 3.70637 16.285 2.86001Z" />
        <path d="M20.9686 8.15504C20.8732 8.19275 18.4399 9.42193 18.4399 12.3207C18.4399 15.7179 21.5078 16.7949 21.541 16.8075C21.5315 16.8703 21.0798 18.4777 19.9728 20.1439C18.9987 21.6196 17.9853 23.0936 16.392 23.126C15.6494 23.1497 15.1578 22.882 14.6301 22.5984C14.0707 22.2965 13.4739 21.9743 12.569 21.9743C11.6128 21.9743 10.9897 22.3046 10.4068 22.6149C9.90331 22.8801 9.4312 23.1276 8.75807 23.1587C7.22395 23.222 6.07637 21.5715 5.07886 20.1086C3.02841 17.0902 1.42541 11.6368 3.57359 8.08798C4.6357 6.32994 6.52035 5.19385 8.5526 5.16075C9.40908 5.14303 10.2275 5.45087 10.9678 5.7258C11.5448 5.94358 12.074 6.14574 12.5334 6.14574C12.9502 6.14574 13.4635 5.95013 14.0576 5.71865C14.9192 5.39435 15.93 5.01182 17.0074 5.08374C18.0877 5.11917 19.9063 5.56414 21.0002 7.15153C20.9915 7.15622 20.9792 7.16327 20.9686 7.17266V8.15504Z" />
      </svg>
      {t('auth.signInWithApple') || "Sign In with Apple"}
    </Button>
  );
}
