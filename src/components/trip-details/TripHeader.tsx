
import { ArrowLeft, PencilLine } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface TripHeaderProps {
  title: string;
  description: string | null;
  isEditing: boolean;
  onBackClick: () => void;
  onEditClick: () => void;
}

export function TripHeader({ title, description, isEditing, onBackClick, onEditClick }: TripHeaderProps) {
  const navigate = useNavigate();
  
  const handleBackClick = () => {
    // Scroll to top before navigating back
    window.scrollTo(0, 0);
    onBackClick();
  };
  
  return (
    <>
      <Button
        variant="ghost"
        className="mb-6"
        onClick={handleBackClick}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        <Button
          variant="outline"
          onClick={onEditClick}
        >
          <PencilLine className="mr-2 h-4 w-4" />
          {isEditing ? 'Save Changes' : 'Edit Details'}
        </Button>
      </div>

      <p className="text-gray-600 text-lg mb-6">{description}</p>
    </>
  );
}
