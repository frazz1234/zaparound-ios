import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";
import { useState } from "react";

// Define role type based on the database enum
type UserRole = Database["public"]["Enums"]["user_role"];

interface UserRoleSelectProps {
  userId: string;
  currentRole: UserRole;
  onRoleUpdated: () => void;
}

export function UserRoleSelect({ userId, currentRole, onRoleUpdated }: UserRoleSelectProps) {
  const { toast } = useToast();
  const { t } = useTranslation('common');
  const [isUpdating, setIsUpdating] = useState(false);

  const updateUserRole = async (newRole: UserRole) => {
    if (isUpdating || newRole === currentRole) return;
    
    try {
      setIsUpdating(true);
      console.log(`Updating user ${userId} to role: ${newRole}`);
      
      // First, check if we're an admin to avoid permission issues
      const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin');
      
      if (isAdminError) {
        console.error('Error checking admin status:', isAdminError);
        throw isAdminError;
      }
      
      if (!isAdminData) {
        console.error('User is not an admin');
        toast({
          title: t('common.error'),
          description: t('common.accessDenied'),
          variant: "destructive",
        });
        return;
      }
      
      // Let's call a specific RPC function to update the role
      // This will avoid RLS recursion issues
      const { data, error } = await supabase.rpc('update_user_role', {
        p_user_id: userId,
        p_role: newRole
      });
      
      if (error) {
        console.error('Error updating user role:', error);
        toast({
          title: t('common.error'),
          description: t('common.errorUpdatingData'),
          variant: "destructive",
        });
      } else {
        toast({
          title: t('common.success'),
          description: t('common.dataUpdatedSuccessfully'),
        });
        onRoleUpdated();
      }
    } catch (error) {
      console.error('Exception when updating user role:', error);
      toast({
        title: t('common.error'),
        description: t('common.errorUpdatingData'),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select 
      defaultValue={currentRole} 
      onValueChange={(value) => updateUserRole(value as UserRole)}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t('common.selectRole')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">{t('common.roles.admin')}</SelectItem>
        <SelectItem value="nosubs">{t('common.roles.nosubs')}</SelectItem>
        <SelectItem value="tier1">{t('common.roles.tier1')}</SelectItem>
        <SelectItem value="tier2">{t('common.roles.tier2')}</SelectItem>
        <SelectItem value="tier3">{t('common.roles.tier3')}</SelectItem>
        <SelectItem value="tier4">{t('common.roles.tier4')}</SelectItem>
        <SelectItem value="enterprise">{t('common.roles.enterprise')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
