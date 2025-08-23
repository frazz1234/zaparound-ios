import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { userCache, tripCache, blogCache } from '@/utils/cache';

export const DeleteAccountCard = () => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation('profile');
  const navigate = useNavigate();

  const deleteAccount = async () => {
    try {
      setIsDeleting(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!user || !session) {
        throw new Error("No authenticated user found");
      }
      
      const userId = user.id;
      const userEmail = user.email;
      const token = session.access_token;
      
      // Clear all user-related caches
      userCache.delete(`profile-${userId}`);
      tripCache.delete(`trips-${userId}`);
      blogCache.delete(`blogs-${userId}`);
      
      // Send confirmation email using the Resend API through our edge function
      if (userEmail) {
        try {
          await supabase.functions.invoke('send-account-deletion-email', {
            body: { 
              email: userEmail,
              name: user.user_metadata?.first_name || user.user_metadata?.last_name || 'Traveler'
            }
          });
          console.log("Account deletion email sent");
        } catch (emailError) {
          console.error("Error sending confirmation email:", emailError);
          // Continue with account deletion even if email fails
        }
      }
      
      // Call the edge function to delete the user account with proper error handling
      console.log("Calling delete-user edge function");
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (error) {
        console.error("Error from delete-user function:", error);
        throw new Error(error.message || "Failed to delete account");
      }
      
      if (!data || !data.success) {
        console.error("Unexpected response from delete-user function:", data);
        throw new Error(data?.error || "Failed to delete account: Unexpected response");
      }
      
      console.log("Delete user response:", data);
      

      
      // Sign out and navigate to homepage
      await supabase.auth.signOut();
      navigate("/");
      
    } catch (error: any) {
      console.error("Error deleting account:", error);
      
      // Show a more detailed error message
      toast({
        title: t('deleteAccount.error'),
        description: error.message || t('deleteAccount.errorMessage'),
        variant: "destructive",
      });
      
      setIsConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t('deleteAccount.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-gray-600">{t('deleteAccount.description')}</p>
          <Button 
            variant="destructive" 
            onClick={() => setIsConfirmOpen(true)}
            disabled={isDeleting}
          >
            {t('deleteAccount.button')}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteAccount.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteAccount.confirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteAccount();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? t('deleteAccount.deleting') : t('deleteAccount.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
