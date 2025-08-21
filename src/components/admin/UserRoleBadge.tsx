import { Database } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';

type UserRole = Database["public"]["Enums"]["user_role"];

interface UserRoleBadgeProps {
  role: UserRole;
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const { t } = useTranslation('common');
  
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
  
  switch (role) {
    case "admin":
      variant = "destructive";
      break;
    case "tier4":
    case "tier3":
    case "tier2":
    case "tier1":
      variant = "default";
      break;
    case "enterprise":
      variant = "outline";
      break;
    default:
      variant = "secondary";
  }
  
  return (
    <Badge variant={variant} className="capitalize">
      {t(`common.roles.${role}`)}
    </Badge>
  );
}
