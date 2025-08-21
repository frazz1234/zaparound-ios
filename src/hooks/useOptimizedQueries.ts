import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types
type QueryOptions<TData> = Omit<UseQueryOptions<TData, Error, TData, string[]>, 'queryKey' | 'queryFn'>;

interface ZapOutData {
  id: string;
  title: string;
  description?: string;
  activity_times?: string[];
  activity_types?: string[];
  location?: string;
  coordinates?: string;
  additional_needs?: string;
  budget_per_person?: string;
  requested_activities?: string[];
  group_composition?: string;
  special_requirements?: string;
  accessibility_needs?: string;
  adults?: number;
  kids?: number;
  date?: string;
  user_id: string;
}

interface PaginatedTripsResponse {
  data: Array<{
    id: string;
    title: string;
    description: string;
    location: string;
    start_date: string;
    end_date: string;
    trip_type: string;
  }>;
  nextPage?: number;
  totalCount: number;
}

export const useOptimizedQueries = () => {
  const queryClient = useQueryClient();

  const fetchZapOutData = async (tripId: string): Promise<ZapOutData> => {
    console.log('Fetching ZapOut data for tripId:', tripId);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No session found');
      throw new Error('Not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('zapout_data')
        .select('*')
        .eq('trip_id', tripId)
        .single();

      if (error) {
        console.error('Supabase error fetching ZapOut data:', error);
        throw error;
      }
      
      if (!data) {
        console.error('No data found for tripId:', tripId);
        throw new Error('No data found');
      }
      
      if (data.user_id !== session.user.id) {
        console.error('Unauthorized access attempt');
        throw new Error('Unauthorized');
      }

      console.log('Successfully fetched ZapOut data:', data);
      return data;
    } catch (error) {
      console.error('Error in fetchZapOutData:', error);
      throw error;
    }
  };

  const useZapOutData = (tripId: string | undefined, options: QueryOptions<ZapOutData> = {}) => {
    return useQuery<ZapOutData, Error>({
      queryKey: ['zapout', tripId],
      queryFn: () => fetchZapOutData(tripId!),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
      enabled: !!tripId && options.enabled !== false,
      ...options
    });
  };

  const updateZapOutData = async ({ tripId, data }: { tripId: string; data: Partial<ZapOutData> }) => {
    console.log('Updating ZapOut data for tripId:', tripId, 'with data:', data);
    
    try {
      const { error } = await supabase
        .from('zapout_data')
        .update(data)
        .eq('id', tripId);

      if (error) {
        console.error('Error updating ZapOut data:', error);
        throw error;
      }
      
      console.log('Successfully updated ZapOut data');
      return true;
    } catch (error) {
      console.error('Error in updateZapOutData:', error);
      throw error;
    }
  };

  const useUpdateZapOut = () => {
    return useMutation({
      mutationFn: updateZapOutData,
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['zapout', variables.tripId] });
      }
    });
  };

  const fetchPaginatedTrips = async ({ pageParam = 0, limit = 10 }): Promise<PaginatedTripsResponse> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error, count } = await supabase
      .from('trips')
      .select('id, title, description, location, start_date, end_date, trip_type', { count: 'exact' })
      .eq('user_id', session.user.id)
      .range(pageParam * limit, (pageParam + 1) * limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return {
      data: data || [],
      nextPage: data?.length === limit ? pageParam + 1 : undefined,
      totalCount: count || 0
    };
  };

  const usePaginatedTrips = (options: QueryOptions<PaginatedTripsResponse> = {}) => {
    return useQuery<PaginatedTripsResponse, Error>({
      queryKey: ['trips', 'paginated'],
      queryFn: () => fetchPaginatedTrips({}),
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      enabled: options.enabled !== false,
      ...options
    });
  };

  return {
    useZapOutData,
    useUpdateZapOut,
    usePaginatedTrips
  };
}; 