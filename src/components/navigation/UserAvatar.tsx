import React from 'react';
import { User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  url: string | null;
  size?: 'sm' | 'default';
  className?: string;
}

export function UserAvatar({ url, size = 'default', className }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10'
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={url || ''} alt="User avatar" />
      <AvatarFallback>
        <User className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  );
} 