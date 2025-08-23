import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useNavigate } from 'react-router-dom';

type EventType = 'hotel' | 'restaurant' | 'bar' | 'event' | 'activity' | 'other';

interface EventSuggestion {
  id: string;
  title: string;
  content: string;
  type: EventType;
  location: string;
  business_name: string;
  url_link?: string | null;
  url_placeholder_image: string;
  priority: number;
  expiration_date?: string | null;
}

// Define the required fields for creating/updating an event
type EventFormData = Omit<EventSuggestion, 'id'>;

interface EventFormProps {
  event?: EventSuggestion;
  onSuccess?: () => void;
}

export function EventForm({ event, onSuccess }: EventFormProps) {
  const { t } = useTranslation(['admin', 'common']);
  const { isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: event?.title || '',
    content: event?.content || '',
    type: (event?.type as EventType) || 'restaurant',
    location: event?.location || '',
    business_name: event?.business_name || '',
    url_link: event?.url_link || '',
    url_placeholder_image: event?.url_placeholder_image || '',
    priority: event?.priority || 1,
    expiration_date: event?.expiration_date || null,
  });

  useEffect(() => {
    // Redirect non-admin users
    if (!isAdmin) {
      toast.error(t('common.accessDenied'));
      navigate('/admin');
    }
  }, [isAdmin, navigate, t]);

  const eventTypes: { value: EventType; label: string }[] = [
    { value: 'hotel', label: 'Hotel' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'bar', label: 'Bar' },
    { value: 'event', label: 'Event' },
    { value: 'activity', label: 'Activity' },
    { value: 'other', label: 'Other' },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let processedValue: string | number = value;
    
    // Handle number inputs
    if (name === 'priority') {
      processedValue = value === '' ? 1 : parseInt(value, 10);
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error(t('common.accessDenied'));
      return;
    }

    // Validate image URL
    if (formData.url_placeholder_image) {
      try {
        new URL(formData.url_placeholder_image);
      } catch (error) {
        toast.error(t('admin.invalidImageUrl'));
        return;
      }
    }

    setLoading(true);

    try {
      // Prepare the data
      const dataToSend = {
        ...formData,
        url_link: formData.url_link || null, // Convert empty string to null
        priority: Number(formData.priority), // Ensure priority is a number
      };

      if (event?.id) {
        // Update existing event
        const { data, error } = await supabase
          .from('event_suggestion')
          .update(dataToSend)
          .eq('id', event.id)
          .select();

        if (error) {
          throw error;
        }
        
        toast.success(t('admin.eventUpdated'));
      } else {
        // Create new event
        const { data, error } = await supabase
          .from('event_suggestion')
          .insert([dataToSend])
          .select();

        if (error) {
          throw error;
        }

        toast.success(t('admin.eventCreated'));
      }

      onSuccess?.();
      if (!event?.id) {
        // Reset form for new events
        setFormData({
          title: '',
          content: '',
          type: 'restaurant',
          location: '',
          business_name: '',
          url_link: '',
          url_placeholder_image: '',
          priority: 1,
          expiration_date: null,
        });
      }
    } catch (error: any) {
      toast.error(
        error.message || error.details || error.hint || t('admin.failedToSaveEvent')
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {event?.id ? t('admin.editEvent') : t('admin.createEvent')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t('admin.eventTitle')} *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder={t('admin.enterEventTitle')}
              />
            </div>

            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="business_name">{t('admin.businessName')} *</Label>
              <Input
                id="business_name"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                required
                placeholder={t('admin.enterBusinessName')}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">{t('admin.eventType')} *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleSelectChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {t(`admin.eventTypes.${type.value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">{t('admin.location')} *</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder={t('admin.enterLocation')}
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">{t('admin.priority')}</Label>
              <Input
                id="priority"
                name="priority"
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={handleChange}
                placeholder={t('admin.enterPriority')}
              />
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <Label htmlFor="expiration_date">{t('admin.expirationDate')}</Label>
              <Input
                id="expiration_date"
                name="expiration_date"
                type="datetime-local"
                value={formData.expiration_date ? formData.expiration_date.slice(0, 16) : ''}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 16)}
                placeholder={t('admin.selectExpirationDate')}
              />
              <p className="text-sm text-gray-500">{t('admin.expirationDateHelp')}</p>
            </div>

            {/* URL Link */}
            <div className="space-y-2">
              <Label htmlFor="url_link">{t('admin.urlLink')}</Label>
              <Input
                id="url_link"
                name="url_link"
                value={formData.url_link || ''}
                onChange={handleChange}
                placeholder={t('admin.enterUrlLink')}
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="url_placeholder_image">{t('admin.imageUrl')} *</Label>
              <Input
                id="url_placeholder_image"
                name="url_placeholder_image"
                value={formData.url_placeholder_image}
                onChange={handleChange}
                required
                placeholder={t('admin.enterImageUrl')}
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">{t('admin.content')} *</Label>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              placeholder={t('admin.enterContent')}
              className="min-h-[100px]"
            />
          </div>

          {/* Preview Image */}
          {formData.url_placeholder_image && (
            <div className="space-y-2">
              <Label>{t('admin.imagePreview')}</Label>
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
                <img
                  src={formData.url_placeholder_image}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/placeholder-image.jpg';
                  }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="mr-2">{t('common.loading')}</span>
                <span className="animate-spin">⏳</span>
              </>
            ) : event?.id ? (
              t('admin.updateEvent')
            ) : (
              t('admin.createEvent')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 