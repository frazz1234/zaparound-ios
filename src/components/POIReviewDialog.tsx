import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, X } from 'lucide-react';
import { POI } from '@/hooks/usePOIs';
import { useToast } from '@/hooks/use-toast';

interface POIReviewDialogProps {
  poi: POI | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (poiId: string, rating: number, notes?: string) => Promise<void>;
}

export const POIReviewDialog: React.FC<POIReviewDialogProps> = ({
  poi,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!poi || rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a rating before submitting.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(poi.id, rating, notes.trim() || undefined);
      
      toast({
        title: 'Review Submitted',
        description: 'Thank you for your review!',
      });
      
      // Reset form
      setRating(0);
      setNotes('');
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>Review {poi?.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* POI Info */}
          {poi && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">{poi.name}</h3>
              <p className="text-sm text-gray-600">{poi.address}</p>
              {poi.description && (
                <p className="text-sm text-gray-600 mt-1">{poi.description}</p>
              )}
            </div>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Rating (1-10)
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {rating > 0 ? `${rating}/10 stars` : 'Select a rating'}
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share your experience with this place..."
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {notes.length}/500 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default POIReviewDialog; 