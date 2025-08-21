import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

// Define role type based on the database enum
type UserRole = Database["public"]["Enums"]["user_role"];

interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string | null;
  username?: string;
  zap_trip_count: number;
  zap_out_count: number;
  zap_road_count: number;
  post_count?: number;
  created_at?: string;
}

interface UserTableProps {
  users: User[];
  onRoleUpdated: () => void;
  onDeleteUser: (userId: string) => void;
}

export function UserTable({ users, onRoleUpdated, onDeleteUser }: UserTableProps) {
  const { t } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingUserId(userId);
      
      const { error } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role: newRole 
        }, { 
          onConflict: 'user_id' 
        });
      
      if (error) throw error;
      
      toast({
        title: t('common:success'),
        description: t('admin:roleUpdated')
      });
      
      onRoleUpdated();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: t('common:error'),
        description: t('admin:failedToUpdateRole'),
        variant: "destructive"
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Format date to a more readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        {t('admin:displayingUsers', { count: users.length })}
      </p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>{t('admin:role')}</TableHead>
              <TableHead>{t('admin:zapTrips')}</TableHead>
              <TableHead>{t('admin:zapOuts')}</TableHead>
              <TableHead>{t('admin:zapRoads')}</TableHead>
              <TableHead>{t('admin:createdAt')}</TableHead>
              <TableHead className="text-right">{t('admin:actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                      user.role === 'tier4' ? 'bg-indigo-100 text-indigo-800' :
                      user.role === 'tier3' ? 'bg-green-100 text-green-800' : 
                      user.role === 'tier2' ? 'bg-blue-100 text-blue-800' : 
                      user.role === 'tier1' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'}`
                  }>
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>{user.zap_trip_count || 0}</TableCell>
                <TableCell>{user.zap_out_count || 0}</TableCell>
                <TableCell>{user.zap_road_count || 0}</TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">{t('admin:openMenu')}</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('admin:actions')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={updatingUserId === user.id}
                        onClick={() => handleRoleChange(user.id, 'nosubs')}
                      >
                        {updatingUserId === user.id && user.role === 'nosubs' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        {t('admin:setAsNoSubscription')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={updatingUserId === user.id}
                        onClick={() => handleRoleChange(user.id, 'tier1')}
                      >
                        {updatingUserId === user.id && user.role === 'tier1' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        {t('admin:setAsTier1')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={updatingUserId === user.id}
                        onClick={() => handleRoleChange(user.id, 'tier2')}
                      >
                        {updatingUserId === user.id && user.role === 'tier2' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        {t('admin:setAsTier2')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={updatingUserId === user.id}
                        onClick={() => handleRoleChange(user.id, 'tier3')}
                      >
                        {updatingUserId === user.id && user.role === 'tier3' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        {t('admin:setAsTier3')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={updatingUserId === user.id}
                        onClick={() => handleRoleChange(user.id, 'tier4')}
                      >
                        {updatingUserId === user.id && user.role === 'tier4' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        {t('admin:setAsTier4')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={updatingUserId === user.id}
                        onClick={() => handleRoleChange(user.id, 'admin')}
                      >
                        {updatingUserId === user.id && user.role === 'admin' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        {t('admin:setAsAdmin')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('admin:deleteUser')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
