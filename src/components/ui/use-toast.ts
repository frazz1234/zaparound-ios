// This file re-exports the toast functionality from the hooks directory
// It exists for backward compatibility - all new code should import directly from @/hooks/use-toast
import { useToast, toast } from "@/hooks/use-toast";

export { useToast, toast };
