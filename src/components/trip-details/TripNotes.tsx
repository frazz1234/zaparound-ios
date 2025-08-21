
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from 'react-i18next';
import { StickyNote } from "lucide-react";

interface TripNotesProps {
  notes: string | null;
  isEditing: boolean;
  onChange: (notes: string) => void;
  label?: string;
}

export function TripNotes({ notes, isEditing, onChange, label }: TripNotesProps) {
  const { t } = useTranslation('trip');
  const notesLabel = label || t('details.notes');

  return (
    <Card className="mt-8">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <StickyNote className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{notesLabel}</p>
            {isEditing ? (
              <Textarea
                value={notes || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t('details.notesPlaceholder')}
                className="min-h-[150px]"
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                {notes ? (
                  <p className="whitespace-pre-wrap">{notes}</p>
                ) : (
                  <p className="text-muted-foreground italic">{t('details.noNotes')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
