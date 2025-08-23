import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface SecurePassportData {
  passport_number: string | null;
  passport_country: string | null;
  passport_expiry_date: string | null;
}

interface UseSecurePassportReturn {
  passportData: SecurePassportData | null;
  loading: boolean;
  error: string | null;
  storePassportData: (data: SecurePassportData) => Promise<boolean>;
  retrievePassportData: () => Promise<boolean>;
  deletePassportData: () => Promise<boolean>;
  clearError: () => void;
}

export function useSecurePassport(): UseSecurePassportReturn {
  const [passportData, setPassportData] = useState<SecurePassportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate a unique encryption key for this session
  const generateEncryptionKey = (): string => {
    // Use a combination of user session and timestamp for uniqueness
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return `passport_${timestamp}_${random}`;
  };

  const clearError = () => setError(null);

  const storePassportData = async (data: SecurePassportData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const encryptionKey = generateEncryptionKey();

      const { data: result, error } = await supabase.functions.invoke('secure-passport', {
        body: {
          action: 'store',
          passportData: data,
          encryptionKey
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to store passport data');
      }

      // Store the encryption key in session storage (temporary, will be cleared on logout)
      sessionStorage.setItem('passport_encryption_key', encryptionKey);
      
      setPassportData(data);
      
      toast({
        title: "Passport Data Stored",
        description: "Your passport information has been stored securely.",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to store passport data';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });

      return false;
    } finally {
      setLoading(false);
    }
  };

  const retrievePassportData = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Get the encryption key from session storage
      const encryptionKey = sessionStorage.getItem('passport_encryption_key');
      if (!encryptionKey) {
        throw new Error('No encryption key found. Please store passport data first.');
      }

      const { data: result, error } = await supabase.functions.invoke('secure-passport', {
        body: {
          action: 'retrieve',
          encryptionKey
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to retrieve passport data');
      }

      if (result.passport_data) {
        setPassportData(result.passport_data);
      } else {
        setPassportData(null);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retrieve passport data';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });

      return false;
    } finally {
      setLoading(false);
    }
  };

  const deletePassportData = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data: result, error } = await supabase.functions.invoke('secure-passport', {
        body: {
          action: 'delete'
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete passport data');
      }

      // Clear the encryption key from session storage
      sessionStorage.removeItem('passport_encryption_key');
      
      setPassportData(null);
      
      toast({
        title: "Passport Data Deleted",
        description: "Your passport information has been deleted securely.",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete passport data';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });

      return false;
    } finally {
      setLoading(false);
    }
  };

  // Clear encryption key on logout
  useEffect(() => {
    const { data: { authListener } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('passport_encryption_key');
        setPassportData(null);
        setError(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return {
    passportData,
    loading,
    error,
    storePassportData,
    retrievePassportData,
    deletePassportData,
    clearError
  };
} 