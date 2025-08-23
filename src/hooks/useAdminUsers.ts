import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { userCache, getOrSetCache } from '@/utils/cache';
import { UserData, UserRole } from '@/types/user';

// Define a type for the data returned from the RPC function
interface UserRoleData {
  user_id: string;
  role: string;
}

const USERS_PER_PAGE = 20;

export function useAdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { t } = useTranslation('common');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      return await getOrSetCache(
        userCache,
        'admin-users',
        async () => {
          // First, check if we're an admin to avoid permission issues
          const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin');
          
          if (isAdminError) {
            console.error('Error checking admin status:', isAdminError);
            throw isAdminError;
          }
          
          if (!isAdminData) {
            console.error('User is not an admin');
            throw new Error('Unauthorized: User is not an admin');
          }
          
          // Get all users from Auth system using the admin API
          const { data: authResponse, error: authError } = await supabase.functions.invoke('admin-get-users', {
            body: {}
          });
          
          if (authError) {
            console.error('Error fetching auth users:', authError);
            throw authError;
          }
          
          const authUsers = authResponse.users || [];
          
          if (authUsers.length === 0) {
            console.error('No auth users returned');
            return [];
          }
          
          // Get profile data to supplement auth data
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select(`
              id,
              username,
              full_name
            `);
          
          if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            // Continue anyway, we'll just have less profile data
          }
          
          // Create a map of profile data by user ID for easy lookup
          const profileMap: Record<string, { username?: string; full_name?: string | null }> = {};
          if (profilesData) {
            profilesData.forEach(profile => {
              profileMap[profile.id] = {
                username: profile.username,
                full_name: profile.full_name
              };
            });
          }
          
          // Get all user roles using our RPC function
          const { data: rolesData, error: rolesError } = await supabase
            .rpc('get_all_user_roles') as { data: UserRoleData[] | null, error: any };
          
          if (rolesError) {
            console.error('Error fetching user roles:', rolesError);
            throw rolesError;
          }
          
          // Get post counts (blogs) for each user
          const { data: blogData, error: blogError } = await supabase
            .from('blogs')
            .select('author_id');
          
          if (blogError) {
            console.error('Error fetching blog counts:', blogError);
            // We'll continue anyway, just with zero posts for everyone
          }
          
          // Transform blog data to get count by author
          const authorCounts: Record<string, number> = {};
          if (blogData) {
            blogData.forEach(blog => {
              authorCounts[blog.author_id] = (authorCounts[blog.author_id] || 0) + 1;
            });
          }

          // Get trip counts for each user
          const { data: tripsData, error: tripsError } = await supabase
            .from('trips')
            .select('user_id, trip_type')
            .eq('trip_type', 'ZapTrip');

          const { data: zapOutData, error: zapOutError } = await supabase
            .from('zapout_data')
            .select('user_id');

          const { data: zapRoadData, error: zapRoadError } = await supabase
            .from('zaproad_data')
            .select('user_id');

          // Calculate trip counts
          const tripCounts: Record<string, { zap_trip: number; zap_out: number; zap_road: number }> = {};
          
          if (tripsData) {
            tripsData.forEach(trip => {
              if (!tripCounts[trip.user_id]) {
                tripCounts[trip.user_id] = { zap_trip: 0, zap_out: 0, zap_road: 0 };
              }
              tripCounts[trip.user_id].zap_trip++;
            });
          }
          
          if (zapOutData) {
            zapOutData.forEach(trip => {
              if (!tripCounts[trip.user_id]) {
                tripCounts[trip.user_id] = { zap_trip: 0, zap_out: 0, zap_road: 0 };
              }
              tripCounts[trip.user_id].zap_out++;
            });
          }
          
          if (zapRoadData) {
            zapRoadData.forEach(trip => {
              if (!tripCounts[trip.user_id]) {
                tripCounts[trip.user_id] = { zap_trip: 0, zap_out: 0, zap_road: 0 };
              }
              tripCounts[trip.user_id].zap_road++;
            });
          }
          
          // Combine all data
          const combinedData: UserData[] = authUsers.map(authUser => {
            const userId = authUser.id;
            const profile = profileMap[userId] || {};
            const userRole = rolesData?.find((r) => r.user_id === userId);
            const postCount = authorCounts[userId] || 0;
            const tripCount = tripCounts[userId] || { zap_trip: 0, zap_out: 0, zap_road: 0 };
            
            // Make sure we're using a valid enum value for the role
            let role: UserRole = 'nosubs';
            if (userRole && (
              userRole.role === 'admin' || 
              userRole.role === 'nosubs' || 
              userRole.role === 'tier1' || 
              userRole.role === 'tier2' || 
              userRole.role === 'tier3' || 
              userRole.role === 'tier4' || 
              userRole.role === 'enterprise'
            )) {
              role = userRole.role as UserRole;
            }
            
            return {
              id: userId,
              email: authUser.email || userId,
              full_name: profile.full_name || null,
              username: profile.username || authUser.email?.split('@')[0] || 'user',
              role: role,
              post_count: postCount,
              zap_trip_count: tripCount.zap_trip,
              zap_out_count: tripCount.zap_out,
              zap_road_count: tripCount.zap_road,
              created_at: authUser.created_at
            };
          });
          
          return combinedData;
        },
        { ttl: 1000 * 60 * 5 } // 5 minutes TTL
      );
    } catch (error) {
      console.error('Exception when fetching data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUsers = async () => {
    try {
      const users = await getOrSetCache(
        userCache,
        'admin-users',
        () => fetchUsers(),
        { force: true }
      );
      setUsers(users);
    } catch (error) {
      console.error('Error refreshing users:', error);
      toast({
        title: t('toasts.error'),
        description: t('toasts.fetchError'),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers().then(setUsers).catch(error => {
      console.error('Error in useEffect:', error);
      toast({
        title: t('toasts.error'),
        description: t('toasts.fetchError'),
        variant: "destructive",
      });
    });
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return {
    users: paginatedUsers,
    allUsers: users,
    filteredCount: filteredUsers.length,
    loading: isLoading,
    searchTerm,
    setSearchTerm,
    refreshUsers,
    pagination: {
      currentPage,
      totalPages,
      setCurrentPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      startIndex: (currentPage - 1) * USERS_PER_PAGE + 1,
      endIndex: Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length)
    }
  };
}
