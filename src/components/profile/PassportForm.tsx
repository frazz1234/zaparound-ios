import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Edit, X, Shield, Lock, Unlock, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useSecurePassport } from "@/hooks/useSecurePassport";

interface SecurePassportData {
  passport_number: string | null;
  passport_country: string | null;
  passport_expiry_date: string | null;
}

export function PassportForm() {
  const { t } = useTranslation('profile');
  const { 
    passportData, 
    loading, 
    error, 
    storePassportData, 
    retrievePassportData, 
    deletePassportData,
    clearError 
  } = useSecurePassport();

  const [editedData, setEditedData] = useState<SecurePassportData>({
    passport_number: '',
    passport_country: '',
    passport_expiry_date: ''
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [hasData, setHasData] = useState(false);

  // Load passport data on component mount
  useEffect(() => {
    retrievePassportData();
  }, []);

  // Update hasData state when passportData changes
  useEffect(() => {
    if (passportData) {
      setHasData(true);
      setEditedData({
        passport_number: passportData.passport_number || '',
        passport_country: passportData.passport_country || '',
        passport_expiry_date: passportData.passport_expiry_date || ''
      });
    } else {
      setHasData(false);
      setEditedData({
        passport_number: '',
        passport_country: '',
        passport_expiry_date: ''
      });
    }
  }, [passportData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const success = await storePassportData(editedData);
    if (success) {
      setCanEdit(false);
      setHasData(true);
    }
  };

  const handleCancel = () => {
    setEditedData({
      passport_number: passportData?.passport_number || '',
      passport_country: passportData?.passport_country || '',
      passport_expiry_date: passportData?.passport_expiry_date || ''
    });
    setCanEdit(false);
    clearError();
  };

  const handleEditClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmEdit = () => {
    setCanEdit(true);
    setShowConfirmDialog(false);
    clearError();
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    const success = await deletePassportData();
    if (success) {
      setCanEdit(false);
      setHasData(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  // Helper function to mask sensitive data
  const maskSensitiveData = (value: string | null | undefined, type: 'passport' | 'date' | 'country' = 'passport') => {
    if (!value || canEdit) return value || '';
    
    switch (type) {
      case 'passport':
        if (value.length <= 4) return '*'.repeat(value.length);
        return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
      case 'date':
        return '****-**-**';
      case 'country':
        return value.substring(0, 1) + '*'.repeat(value.length - 1);
      default:
        return '*'.repeat(value.length);
    }
  };

  if (loading && !hasData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#61936f]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#61936f]" />
          <h3 className="text-lg font-semibold">{t('passport.title')}</h3>
          {hasData && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <Lock className="h-4 w-4" />
              <span>Secured</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {hasData && (
            <Button
              type="button"
              onClick={handleDeleteClick}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
          
          {!canEdit ? (
            <Button
              type="button"
              onClick={handleEditClick}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              {hasData ? t('actions.edit') : 'Add Passport'}
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
                form="passport-form"
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
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form id="passport-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="passportNumber">{t('personal.passportNumber')}</Label>
            <Input
              id="passportNumber"
              value={canEdit ? editedData.passport_number : maskSensitiveData(editedData.passport_number, 'passport')}
              onChange={(e) => setEditedData({ ...editedData, passport_number: e.target.value })}
              placeholder={t('personal.passportNumberPlaceholder')}
              readOnly={!canEdit}
              className={cn(!canEdit && "bg-gray-50 text-gray-700")}
              type={canEdit ? "text" : "password"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passportCountry">{t('personal.passportCountry')}</Label>
            {canEdit ? (
              <Select 
                value={editedData.passport_country} 
                onValueChange={(value) => setEditedData({ ...editedData, passport_country: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('personal.selectPassportCountry')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">{t('countries.unitedStates')}</SelectItem>
                  <SelectItem value="FR">{t('countries.france')}</SelectItem>
                  <SelectItem value="ES">{t('countries.spain')}</SelectItem>
                  <SelectItem value="GB">{t('countries.unitedKingdom')}</SelectItem>
                  <SelectItem value="CA">{t('countries.canada')}</SelectItem>
                  <SelectItem value="DE">{t('countries.germany')}</SelectItem>
                  <SelectItem value="IT">{t('countries.italy')}</SelectItem>
                  <SelectItem value="JP">{t('countries.japan')}</SelectItem>
                  <SelectItem value="AU">{t('countries.australia')}</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={maskSensitiveData(editedData.passport_country, 'country')}
                readOnly
                className="bg-gray-50 text-gray-700"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passportExpiry">{t('personal.passportExpiry')}</Label>
            {canEdit ? (
              <DatePicker
                date={editedData.passport_expiry_date ? (() => {
                  const [year, month, day] = editedData.passport_expiry_date.split('-').map(Number);
                  return new Date(year, month - 1, day);
                })() : undefined}
                setDate={(date) => setEditedData({ 
                  ...editedData, 
                  passport_expiry_date: date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : null 
                })}
                label={t('personal.passportExpiry')}
                placeholder={t('personal.selectPassportExpiry')}
                minYear={new Date().getFullYear()}
                maxYear={new Date().getFullYear() + 20}
                disabledDates={(date) => date < new Date()}
              />
            ) : (
              <Input
                value={maskSensitiveData(editedData.passport_expiry_date, 'date')}
                readOnly
                className="bg-gray-50 text-gray-700"
              />
            )}
          </div>
        </div>
      </form>

      {/* Security notice */}
      {!canEdit && hasData && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-blue-800 font-medium text-sm">Secure Storage</p>
              <p className="text-blue-700 text-sm mt-1">
                Your passport information is encrypted and stored securely. All access attempts are logged for security purposes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit confirmation dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-[#61936f]" />
              Access Secure Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to access your encrypted passport information. This action will be logged for security purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirm}>
              {t('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEdit} className="bg-[#61936f] hover:bg-[#4a7a5a] text-white">
              {t('actions.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Passport Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your encrypted passport information. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              {t('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 