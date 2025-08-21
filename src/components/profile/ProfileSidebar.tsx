import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { 
  User, 
  Lock, 
  Mail, 
  CreditCard, 
  Trash2,
  Settings,
  FileText
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";

interface ProfileSidebarProps {
  className?: string;
}

export function ProfileSidebar({ className }: ProfileSidebarProps) {
  const { t, i18n } = useTranslation('profile');
  const location = useLocation();
  const { isAdmin } = useUserRole();
  
  // Extract current language from URL path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentLang = pathSegments[0] || i18n.language;
  
  const menuItems = [
    {
      label: t('sidebar.personalInfo'),
      icon: User,
      href: `/${currentLang}/profile`,
    },
    // Only show passport for admin users
    ...(isAdmin ? [{
      label: t('sidebar.passport'),
      icon: FileText,
      href: `/${currentLang}/profile/passport`,
    }] : []),
    {
      label: t('sidebar.security'),
      icon: Lock,
      href: `/${currentLang}/profile/security`,
    },
    {
      label: t('sidebar.email'),
      icon: Mail,
      href: `/${currentLang}/profile/email`,
    },
    {
      label: t('sidebar.subscription'),
      icon: CreditCard,
      href: `/${currentLang}/profile/subscription`,
    },
    {
      label: t('sidebar.preferences'),
      icon: Settings,
      href: `/${currentLang}/profile/preferences`,
    },
    {
      label: t('sidebar.account'),
      icon: Trash2,
      href: `/${currentLang}/profile/account`,
      variant: 'destructive' as const,
    },
  ];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="mb-4 border-b pb-2">
          <h2 className="text-lg font-semibold">
            {t('sidebar.title')}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t('sidebar.subtitle')}
          </p>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Button
                key={item.href}
                variant={item.variant || (isActive ? "secondary" : "ghost")}
                className={cn(
                  "w-full justify-start gap-2",
                  isActive && "bg-accent",
                  item.variant === "destructive" && "mt-8"
                )}
                asChild
              >
                <Link to={item.href}>
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
} 