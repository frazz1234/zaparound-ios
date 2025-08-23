
import { Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface TripDeleteButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

export const TripDeleteButton = ({ onClick }: TripDeleteButtonProps) => {
  return (
    <Button
      variant="destructive"
      size="icon"
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
      onClick={onClick}
      aria-label="Delete trip"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
};
