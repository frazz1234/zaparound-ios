import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useTranslation } from 'react-i18next';
import { Loader2, Users, FileText, MapPin, Car, Trash2, Edit2, UserPlus, CalendarPlus, Building2 } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { UserSearchBar } from '@/components/admin/UserSearchBar';
import { UserTable } from '@/components/admin/UserTable';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogForm } from '@/components/admin/BlogForm';
import { EventForm } from '@/components/admin/EventForm';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type UserRole = 'admin' | 'user';
type EventType = 'hotel' | 'restaurant' | 'bar' | 'event' | 'activity' | 'other';

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
}

interface Blog {
  id: string;
  title_en: string;
  published_at: string;
  category: string;
}

interface EventSuggestion {
  id: string;
  title: string;
  content: string;
  business_name: string;
  location: string;
  type: EventType;
  url_placeholder_image: string;
  url_link?: string | null;
  priority: number;
  expiration_date?: string | null;
}

interface Business {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  status: 'active' | 'inactive' | 'pending';
  owner_id: string;
  created_at: string;
  team_member_count: number;
}

interface BusinessOwner {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

const Admin = () => {
  const { loading, isAdmin } = useAdminAuth();
  const { t } = useTranslation(['admin', 'common']);
  const { 
    users, 
    searchTerm, 
    setSearchTerm, 
    loading: isLoading, 
    refreshUsers,
    pagination: {
      currentPage,
      totalPages,
      setCurrentPage,
      hasNextPage,
      hasPreviousPage,
      startIndex,
      endIndex
    },
    allUsers,
    filteredCount
  } = useAdminUsers();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [events, setEvents] = useState<EventSuggestion[]>([]);
  const [editingEvent, setEditingEvent] = useState<EventSuggestion | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(false);
  const [deletingBusinessId, setDeletingBusinessId] = useState<string | null>(null);
  const [isDeletingBusiness, setIsDeletingBusiness] = useState(false);
  const [businessDeleteError, setBusinessDeleteError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<BusinessOwner | null>(null);
  const [isLoadingOwner, setIsLoadingOwner] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');

  const totalUsers = allUsers.length;
  
  const totalZapTrips = allUsers.reduce((sum, user) => {
    return sum + (user.zap_trip_count || 0);
  }, 0);
  
  const totalZapOuts = allUsers.reduce((sum, user) => {
    return sum + (user.zap_out_count || 0);
  }, 0);
  
  const totalZapRoads = allUsers.reduce((sum, user) => {
    return sum + (user.zap_road_count || 0);
  }, 0);

  // Group events by location
  const groupedEvents = events.reduce((acc, event) => {
    const location = event.location || 'Unknown';
    if (!acc[location]) {
      acc[location] = [];
    }
    acc[location].push(event);
    return acc;
  }, {} as Record<string, EventSuggestion[]>);

  // Get unique locations for the filter
  const locations = ['all', ...Object.keys(groupedEvents)].sort();

  // Filter events by selected location
  const filteredEvents = selectedLocation === 'all' 
    ? events 
    : events.filter(event => event.location === selectedLocation);

  const typeOptions = [
    { value: 'all', label: t('types.all') },
    { value: 'hotel', label: t('types.hotel') },
    { value: 'restaurant', label: t('types.restaurant') },
    { value: 'bar', label: t('types.bar') },
    { value: 'event', label: t('types.event') },
    { value: 'activity', label: t('types.activity') },
    { value: 'other', label: t('types.other') },
  ];

  const handleRoleUpdated = () => {
    window.location.reload();
    refreshUsers();
  };

  useEffect(() => {
    fetchBlogs();
    fetchEvents();
    fetchBusinesses();
  }, []);

  // Add debug effect for businesses
  useEffect(() => {
    console.log('Current businesses state:', businesses);
  }, [businesses]);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast({
        title: t('common.error'),
        description: t('admin.failedToFetchBlogs'),
        variant: "destructive",
      });
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('event_suggestion')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: t('common.error'),
        description: t('admin.failedToFetchEvents'),
        variant: "destructive",
      });
    }
  };

  const fetchBusinesses = async () => {
    try {
      setIsLoadingBusinesses(true);
      console.log('Starting to fetch businesses...');

      // First check if we can connect to the database
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      // Try to get the businesses table info first
      const { data: tableInfo, error: tableError } = await supabase
        .from('businesses')
        .select('count')
        .limit(1);

      console.log('Table info:', tableInfo);
      console.log('Table error:', tableError);

      // Now try to get all businesses
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Query result:', data);
      console.log('Query error:', error);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!data) {
        console.log('No data returned from query');
        setBusinesses([]);
        return;
      }

      console.log('Raw business data:', data);

      // Transform the data to include a default team member count
      const transformedData = data.map(business => ({
        ...business,
        team_member_count: 0 // We'll add the actual count later
      }));

      console.log('Setting businesses state with:', transformedData);
      setBusinesses(transformedData);

    } catch (error) {
      console.error('Error in fetchBusinesses:', error);
      toast({
        title: t('common.error'),
        description: t('admin.failedToFetchBusinesses'),
        variant: "destructive",
      });
      setBusinesses([]); // Set empty array on error
    } finally {
      setIsLoadingBusinesses(false);
    }
  };

  // Add a debug effect
  useEffect(() => {
    console.log('Businesses state updated:', businesses);
  }, [businesses]);

  // Add a debug effect for loading state
  useEffect(() => {
    console.log('Loading state:', isLoadingBusinesses);
  }, [isLoadingBusinesses]);

  const confirmDeleteUser = (userId: string) => {
    console.log('confirmDeleteUser called with userId:', userId);
    setDeletingUserId(userId);
    setDeleteError(null);
  };

  const handleDeleteUser = async () => {
    console.log('handleDeleteUser called, deletingUserId:', deletingUserId);
    if (!deletingUserId) {
      console.log('No deletingUserId found, returning');
      return;
    }
    
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      console.log('Getting session data...');
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Session data:', sessionData);
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        console.log('No token found in session');
        throw new Error(t('common.notAuthenticated'));
      }
      
      console.log('Calling delete-user function with user ID:', deletingUserId);
      
      const response = await supabase.functions.invoke('delete-user', {
        body: { userId: deletingUserId },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Delete user response:', response);
      
      if (response.error) {
        console.error('Edge function error:', response.error);
        throw new Error(response.error.message || t('admin.failedToDeleteUser'));
      }
      
      if (!response.data.success) {
        console.error('Delete user operation failed:', response.data);
        throw new Error(response.data.error || t('admin.failedToDeleteUser'));
      }
      
      // Check if auth user was deleted
      if (response.data.auth_deleted === false) {
        console.warn('User data deleted but auth user was not deleted:', response.data.message);
        toast({
          title: t('common.warning'),
          description: t('admin.userDataDeletedButAuthRemains'),
          variant: "warning"
        });
      } else {
        toast({
          title: t('common.success'),
          description: t('admin.userDeleted')
        });
      }
      
      refreshUsers();
      // Add page reload after successful deletion
      window.location.reload();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setDeleteError(error.message || t('admin.failedToDeleteUser'));
      toast({
        title: t('common.error'),
        description: error.message || t('admin.failedToDeleteUser'),
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteDialog = () => {
    setDeletingUserId(null);
    setDeleteError(null);
  };

  const handleDeleteBlog = async (blogId: string) => {
    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', blogId);

      if (error) throw error;

      setBlogs(blogs.filter(blog => blog.id !== blogId));
      toast({
        title: t('common.success'),
        description: t('admin.blogDeleted'),
      });
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast({
        title: t('common.error'),
        description: t('admin.failedToDeleteBlog'),
        variant: "destructive",
      });
    }
  };

  const handleEditBlog = (blogId: string) => {
    navigate(`/admin/blog/${blogId}`);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('event_suggestion')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.filter(event => event.id !== eventId));
      toast({
        title: t('common.success'),
        description: t('admin.eventDeleted'),
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: t('common.error'),
        description: t('admin.failedToDeleteEvent'),
        variant: "destructive",
      });
    }
  };

  const handleEditEvent = (event: EventSuggestion) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleCloseEventForm = () => {
    setShowEventForm(false);
    setEditingEvent(null);
  };

  const confirmDeleteBusiness = (businessId: string) => {
    setDeletingBusinessId(businessId);
    setBusinessDeleteError(null);
  };

  const handleDeleteBusiness = async () => {
    if (!deletingBusinessId) return;
    
    try {
      setIsDeletingBusiness(true);
      setBusinessDeleteError(null);
      
      // Delete all related records first
      const { error: membersError } = await supabase
        .from('business_members')
        .delete()
        .eq('business_id', deletingBusinessId);

      if (membersError) throw membersError;

      const { error: clientsError } = await supabase
        .from('business_clients')
        .delete()
        .eq('business_id', deletingBusinessId);

      if (clientsError) throw clientsError;

      const { error: activityError } = await supabase
        .from('business_activity')
        .delete()
        .eq('business_id', deletingBusinessId);

      if (activityError) throw activityError;

      // Finally delete the business
      const { error: businessError } = await supabase
        .from('businesses')
        .delete()
        .eq('id', deletingBusinessId);

      if (businessError) throw businessError;

      toast({
        title: t('common.success'),
        description: t('admin.businessDeleted')
      });

      fetchBusinesses();
    } catch (error: any) {
      console.error('Error deleting business:', error);
      setBusinessDeleteError(error.message || t('admin.failedToDeleteBusiness'));
      toast({
        title: t('common.error'),
        description: error.message || t('admin.failedToDeleteBusiness'),
        variant: "destructive"
      });
    } finally {
      setIsDeletingBusiness(false);
      setDeletingBusinessId(null);
    }
  };

  const closeDeleteBusinessDialog = () => {
    setDeletingBusinessId(null);
    setBusinessDeleteError(null);
  };

  const handleStatusChange = async (businessId: string, newStatus: 'active' | 'inactive' | 'pending') => {
    try {
      setUpdatingStatus(businessId);

      // First update the business status
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId);

      if (updateError) throw updateError;

      // Get business and owner details for the email
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select(`
          id,
          name,
          owner_id
        `)
        .eq('id', businessId)
        .single();

      if (businessError) throw businessError;

      if (!businessData) {
        throw new Error('Business not found');
      }

      // Get owner details from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', businessData.owner_id)
        .single();

      if (profileError) {
        console.error('Error fetching profile data:', profileError);
        // Don't throw here, we'll use default values
      }

      // Send status update email
      try {
        await supabase.functions.invoke('send-business-status-email', {
          body: {
            businessName: businessData.name,
            businessId: businessData.id,
            ownerEmail: profileData?.email || '',
            ownerName: profileData?.full_name || 'Business Owner',
            status: newStatus
          }
        });
      } catch (emailError) {
        console.error('Error sending status update email:', emailError);
        // Don't throw here, as the status was updated successfully
      }

      toast({
        title: t('businesses.status.success.title'),
        description: t('businesses.status.success.description'),
      });

      // Refresh the businesses list
      fetchBusinesses();
    } catch (error: any) {
      console.error('Error updating business status:', error);
      toast({
        title: t('businesses.status.error.title'),
        description: error.message || t('businesses.status.error.description'),
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleShowOwnerInfo = async (ownerId: string) => {
    try {
      setIsLoadingOwner(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .eq('id', ownerId)
        .single();

      if (error) throw error;

      setSelectedOwner(data);
    } catch (error: any) {
      console.error('Error fetching owner info:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('admin.failedToFetchOwnerInfo'),
        variant: "destructive"
      });
    } finally {
      setIsLoadingOwner(false);
    }
  };

  // Filter businesses based on status
  const filteredBusinesses = businesses.filter(business => 
    statusFilter === 'all' ? true : business.status === statusFilter
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 text-lg">
          {t('common.accessDenied')}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalZapTrips')}</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalZapTrips}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalZapOuts')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalZapOuts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalZapRoads')}</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalZapRoads}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">{t('users')}</TabsTrigger>
          <TabsTrigger value="blogs">{t('blogs')}</TabsTrigger>
          <TabsTrigger value="events">{t('events')}</TabsTrigger>
          <TabsTrigger value="businesses">{t('businesses')}</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('users')}</CardTitle>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                {t('addUser')}
              </Button>
            </CardHeader>
            <CardContent>
              <UserSearchBar 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                onRefresh={refreshUsers} 
                isLoading={isLoading}
              />
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <UserTable 
                    users={users as User[]} 
                    onRoleUpdated={handleRoleUpdated} 
                    onDeleteUser={confirmDeleteUser}
                  />
                  
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? (
                        t('showingFilteredUsers', { 
                          start: startIndex,
                          end: endIndex,
                          total: filteredCount,
                          query: searchTerm
                        })
                      ) : (
                        t('showingUsers', { 
                          start: startIndex,
                          end: endIndex,
                          total: totalUsers
                        })
                      )}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!hasPreviousPage}
                      >
                        {t('previous')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!hasNextPage}
                      >
                        {t('next')}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blogs" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('blogs')}</CardTitle>
              <Button onClick={() => setShowBlogForm(!showBlogForm)}>
                {showBlogForm ? t('cancel') : t('createBlog')}
              </Button>
            </CardHeader>
            <CardContent>
              {showBlogForm ? (
                <BlogForm />
              ) : (
                <div className="space-y-4">
                  {blogs.map((blog) => (
                    <div
                      key={blog.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{blog.title_en}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('category')}: {blog.category || t('noCategory')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('publishedOn')}: {new Date(blog.published_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditBlog(blog.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteBlog(blog.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {showEventForm ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{editingEvent ? t('edit') : t('addEvent')}</CardTitle>
                <Button onClick={handleCloseEventForm}>
                  {t('cancel')}
                </Button>
              </CardHeader>
              <CardContent>
                <EventForm 
                  event={editingEvent || undefined}
                  onSuccess={() => {
                    handleCloseEventForm();
                    fetchEvents();
                  }} 
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold">{t('events')}</h2>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location === 'all' ? t('allLocations') : location}
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={() => setShowEventForm(true)}>
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  {t('addEvent')}
                </Button>
              </div>

              <div className="grid gap-6">
                {selectedLocation === 'all' ? (
                  Object.entries(groupedEvents).sort().map(([location, locationEvents]) => (
                    <Card key={location}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          {location}
                          <span className="text-sm font-normal text-gray-500">
                            ({locationEvents.length} {locationEvents.length === 1 ? t('events') : t('events')})
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 mb-4">
                          {typeOptions.map((type) => (
                            <button
                              key={type.value}
                              onClick={() => setSelectedType(type.value)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                selectedType === type.value
                                  ? 'bg-[#1d1d1e] text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                        <div className="grid gap-3 grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
                          {locationEvents
                            .filter(event => selectedType === 'all' || event.type === selectedType)
                            .map((event) => (
                              <div
                                key={event.id}
                                className="relative group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                              >
                                <div className="aspect-[16/10] overflow-hidden">
                                  <img
                                    src={event.url_placeholder_image}
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement;
                                      img.src = '/placeholder-image.jpg';
                                    }}
                                  />
                                </div>
                                <div className="p-3">
                                  <div className="flex items-center gap-1 mb-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      event.type === 'hotel' ? 'bg-blue-100 text-blue-800' :
                                      event.type === 'restaurant' ? 'bg-orange-100 text-orange-800' :
                                      event.type === 'bar' ? 'bg-purple-100 text-purple-800' :
                                      event.type === 'event' ? 'bg-green-100 text-green-800' :
                                      event.type === 'activity' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {event.type}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {event.priority}
                                    </span>
                                  </div>
                                  <h3 className="font-semibold text-sm mb-1 truncate">{event.title}</h3>
                                  <p className="text-xs text-gray-600 mb-2 truncate">{event.business_name}</p>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2 text-xs"
                                      onClick={() => handleEditEvent(event)}
                                    >
                                      <Edit2 className="w-3 h-3 mr-1" />
                                      {t('edit')}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2 text-xs text-red-600 hover:text-red-700"
                                      onClick={() => handleDeleteEvent(event.id)}
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      {t('delete')}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex gap-2 mb-4">
                        {typeOptions.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setSelectedType(type.value)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              selectedType === type.value
                                ? 'bg-[#1d1d1e] text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                      <div className="grid gap-3 grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
                        {filteredEvents
                          .filter(event => selectedType === 'all' || event.type === selectedType)
                          .map((event) => (
                            <div
                              key={event.id}
                              className="relative group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="aspect-[16/10] overflow-hidden">
                                <img
                                  src={event.url_placeholder_image}
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.src = '/placeholder-image.jpg';
                                  }}
                                />
                              </div>
                              <div className="p-3">
                                <div className="flex items-center gap-1 mb-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    event.type === 'hotel' ? 'bg-blue-100 text-blue-800' :
                                    event.type === 'restaurant' ? 'bg-orange-100 text-orange-800' :
                                    event.type === 'bar' ? 'bg-purple-100 text-purple-800' :
                                    event.type === 'event' ? 'bg-green-100 text-green-800' :
                                    event.type === 'activity' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {event.type}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {event.priority}
                                  </span>
                                </div>
                                <h3 className="font-semibold text-sm mb-1 truncate">{event.title}</h3>
                                <p className="text-xs text-gray-600 mb-2 truncate">{event.business_name}</p>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 text-xs"
                                    onClick={() => handleEditEvent(event)}
                                  >
                                    <Edit2 className="w-3 h-3 mr-1" />
                                    {t('edit')}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 text-xs text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteEvent(event.id)}
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    {t('delete')}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="businesses" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('businesses')}</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  {t('allBusinesses')}
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                >
                  {t('activeBusinesses')}
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('pending')}
                >
                  {t('pendingBusinesses')}
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('inactive')}
                >
                  {t('inactiveBusinesses')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingBusinesses ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredBusinesses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {statusFilter === 'all' 
                    ? t('noBusinesses')
                    : t('noBusinessesWithStatus', { status: statusFilter })}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBusinesses.map((business) => (
                    <div
                      key={business.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {business.logo_url ? (
                          <img
                            src={business.logo_url}
                            alt={business.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{business.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {t('teamMembers')}: {business.team_member_count}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t('status')}: {business.status}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t('createdAt')}: {new Date(business.created_at).toLocaleDateString()}
                          </p>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-sm"
                            onClick={() => handleShowOwnerInfo(business.owner_id)}
                          >
                            {t('viewOwnerInfo')}
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={business.status}
                          onChange={(e) => handleStatusChange(business.id, e.target.value as 'active' | 'inactive' | 'pending')}
                          disabled={updatingStatus === business.id}
                          className="px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="pending">{t('statusPending')}</option>
                          <option value="active">{t('statusActive')}</option>
                          <option value="inactive">{t('statusInactive')}</option>
                        </select>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigate(`/admin/business/${business.id}`)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => confirmDeleteBusiness(business.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Owner Info Dialog */}
          <Dialog open={!!selectedOwner} onOpenChange={() => setSelectedOwner(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('ownerInformation')}</DialogTitle>
                <DialogDescription>
                  {t('ownerInformationDescription')}
                </DialogDescription>
              </DialogHeader>
              {isLoadingOwner ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : selectedOwner ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">{t('ownerName')}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOwner.full_name || t('noName')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t('ownerEmail')}</p>
                    <p className="text-sm text-muted-foreground">{selectedOwner.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t('ownerCreatedAt')}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedOwner.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
      
      {/* Move the user delete dialog here, outside of TabsContent */}
      <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDeleteUser')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteUserWarning')}
              {deleteError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
                  {deleteError}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.processing')}
                </>
              ) : (
                t('delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Keep the business delete dialog where it is */}
      <AlertDialog open={!!deletingBusinessId} onOpenChange={(open) => !open && closeDeleteBusinessDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDeleteBusiness')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteBusinessWarning')}
              {businessDeleteError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
                  {businessDeleteError}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingBusiness}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBusiness}
              disabled={isDeletingBusiness}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingBusiness ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.processing')}
                </>
              ) : (
                t('delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
