import { Profile } from "@/types/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Edit, X } from "lucide-react";
import { LocationSearch } from "@/components/trips/LocationSearch";
import { BirthDatePicker } from "./BirthDatePicker";
import { LgbtqSelect } from "./LgbtqSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from 'react-i18next';
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ProfilePicture } from "./ProfilePicture";
import { useLocation, useNavigate } from "react-router-dom";
import { SUPPORTED_LANGUAGES } from "@/i18n";


interface ProfileFormProps {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>, profile: Profile) => void;
}

export function ProfileForm({ 
  profile, 
  setProfile, 
  date, 
  setDate, 
  loading, 
  onSubmit 
}: ProfileFormProps) {
  const { t, i18n } = useTranslation('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile>(profile);
  const [editedDate, setEditedDate] = useState<Date | undefined>(date);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Update birth_date in editedProfile when editedDate changes
  useEffect(() => {
    if (editedDate) {
      const birthDateString = `${editedDate.getFullYear()}-${String(editedDate.getMonth() + 1).padStart(2, '0')}-${String(editedDate.getDate()).padStart(2, '0')}`;
      setEditedProfile(prev => ({ ...prev, birth_date: birthDateString }));
    } else {
      setEditedProfile(prev => ({ ...prev, birth_date: null }));
    }
  }, [editedDate]);
  
  const handleLocationChange = (newLocation: string, coordinates: [number, number]) => {
    setEditedProfile({ ...editedProfile, residence_location: newLocation });
  };

  const handleLanguageChange = async (newLanguage: string) => {
    if (['en', 'fr', 'es'].includes(newLanguage)) {
      try {
        const loadingToast = toast({
          title: t('languageSelector.changing'),
          description: t('languageSelector.pleaseWait'),
          variant: "language-change",
          duration: 1000
        });
        
        setEditedProfile({ ...editedProfile, language: newLanguage });
        await i18n.changeLanguage(newLanguage);

        // Persist to DB immediately for profile edit
        try {
          const { id } = editedProfile as any;
          if (id) {
            const { error } = await (await import('@/integrations/supabase/client')).supabase
              .from('profiles')
              .update({ language: newLanguage })
              .eq('id', id);
            if (!error) {
              localStorage.setItem('user_language', newLanguage);
              localStorage.setItem('user_language_timestamp', Date.now().toString());
            }
          }
        } catch (dbErr) {
          console.error('Error updating profile language:', dbErr);
        }
        
        // Update URL with new language
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const isLanguageInPath = SUPPORTED_LANGUAGES.includes(pathSegments[0]);
        
        if (isLanguageInPath) {
          // Replace the language segment in the URL
          pathSegments[0] = newLanguage;
          const newPath = '/' + pathSegments.join('/');
          navigate(newPath, { replace: true });
        } else {
          // Add language to the URL
          const newPath = `/${newLanguage}${location.pathname}`;
          navigate(newPath, { replace: true });
        }
        
        toast({
          title: t('languageSelector.changed'),
          description: t('languageSelector.changedDescription'),
          variant: "success",
          duration: 1500
        });
      } catch (error) {
        console.error('Error changing language:', error);
        toast({
          title: t('languageSelector.error'),
          description: t('languageSelector.errorDescription'),
          variant: "destructive",
          duration: 5000
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await onSubmit(e, editedProfile);
      
      setProfile(editedProfile);
      setDate(editedDate);
      setIsEditing(false);
      
    } catch (error) {
      toast({
        title: t('toasts.error'),
        description: t('toasts.errorSaving'),
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setEditedDate(date);
    setIsEditing(false);
  };

  const handleAvatarUpload = (url: string) => {
    setEditedProfile({ ...editedProfile, avatar_url: url });
    // Submit the form automatically when avatar is updated
    onSubmit(new Event('submit') as any, { ...editedProfile, avatar_url: url });
  };

  const safeProfile = {
    ...editedProfile,
    medical_conditions: editedProfile.medical_conditions || [],
    disabilities: editedProfile.disabilities || [],
    allergies: editedProfile.allergies || [],
    lgbtq_status: editedProfile.lgbtq_status || [],
    dietary_preferences: editedProfile.dietary_preferences || [],
    language: editedProfile.language || 'en',
    newsletter_subscribed: editedProfile.newsletter_subscribed ?? true
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-end mb-4">
        {!isEditing ? (
          <Button
            type="button"
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            {t('actions.edit')}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleCancel}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              {t('actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t('actions.save')}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center mb-8">
        <ProfilePicture
          url={safeProfile.avatar_url}
          onUpload={handleAvatarUpload}
          disabled={!isEditing}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t('personal.firstName')}</Label>
          <Input
            id="firstName"
            type="text"
            name="given-name"
            autoComplete="given-name"
            value={safeProfile?.first_name || ''}
            onChange={(e) => setEditedProfile({ ...editedProfile, first_name: e.target.value })}
            readOnly={!isEditing}
            className={cn(!isEditing && "bg-gray-50 text-gray-700")}
            spellCheck={false}
            autoCapitalize="words"
            autoCorrect="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">{t('personal.lastName')}</Label>
          <Input
            id="lastName"
            type="text"
            name="family-name"
            autoComplete="family-name"
            value={safeProfile?.last_name || ''}
            onChange={(e) => setEditedProfile({ ...editedProfile, last_name: e.target.value })}
            readOnly={!isEditing}
            className={cn(!isEditing && "bg-gray-50 text-gray-700")}
            spellCheck={false}
            autoCapitalize="words"
            autoCorrect="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">{t('personal.username')}</Label>
          <Input
            id="username"
            value={safeProfile?.username || ''}
            onChange={(e) => setEditedProfile({ ...editedProfile, username: e.target.value })}
            readOnly={!isEditing}
            className={cn(!isEditing && "bg-gray-50 text-gray-700")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">{t('settings.language')}</Label>
          <Select 
            value={safeProfile.language} 
            onValueChange={handleLanguageChange}
            disabled={!isEditing}
          >
            <SelectTrigger className={cn(!isEditing && "bg-gray-50 text-gray-700")}>
              <SelectValue placeholder={t('settings.language')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t('languageSelector.english')}</SelectItem>
              <SelectItem value="fr">{t('languageSelector.french')}</SelectItem>
              <SelectItem value="es">{t('languageSelector.spanish')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="residence">{t('personal.address')}</Label>
          <LocationSearch
            value={safeProfile?.residence_location || ''}
            onChange={handleLocationChange}
            disabled={!isEditing}
            className={cn(!isEditing && "bg-gray-50 text-gray-700")}
          />
        </div>

        <BirthDatePicker 
          date={editedDate} 
          setDate={setEditedDate}
          disabled={!isEditing}
        />

        <div className="space-y-2">
          <Label htmlFor="medicalConditions">{t('personal.medicalConditions')}</Label>
          <Input
            id="medicalConditions"
            value={safeProfile.medical_conditions.join(', ')}
            onChange={(e) => setEditedProfile({
              ...editedProfile,
              medical_conditions: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')
            })}
            placeholder={t('personal.medicalConditionsPlaceholder')}
            readOnly={!isEditing}
            className={cn(!isEditing && "bg-gray-50 text-gray-700")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="disabilities">{t('personal.disabilities')}</Label>
          <Input
            id="disabilities"
            value={safeProfile.disabilities.join(', ')}
            onChange={(e) => setEditedProfile({
              ...editedProfile,
              disabilities: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')
            })}
            placeholder={t('personal.disabilitiesPlaceholder')}
            readOnly={!isEditing}
            className={cn(!isEditing && "bg-gray-50 text-gray-700")}
          />
        </div>

        <LgbtqSelect 
          value={safeProfile.lgbtq_status}
          onChange={(newValue) => setEditedProfile({ ...editedProfile, lgbtq_status: newValue })}
          disabled={!isEditing}
        />

        <div className="space-y-2">
          <Label htmlFor="allergies">{t('personal.allergies')}</Label>
          <Input
            id="allergies"
            value={safeProfile.allergies.join(', ')}
            onChange={(e) => setEditedProfile({
              ...editedProfile,
              allergies: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')
            })}
            placeholder={t('personal.allergiesPlaceholder')}
            readOnly={!isEditing}
            className={cn(!isEditing && "bg-gray-50 text-gray-700")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dietaryPreferences">{t('personal.dietaryPreferences')}</Label>
          <Input
            id="dietaryPreferences"
            value={safeProfile.dietary_preferences.join(', ')}
            onChange={(e) => setEditedProfile({
              ...editedProfile,
              dietary_preferences: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')
            })}
            placeholder={t('personal.dietaryPreferencesPlaceholder')}
            readOnly={!isEditing}
            className={cn(!isEditing && "bg-gray-50 text-gray-700")}
          />
        </div>
      </div>
    </form>
  );
}
