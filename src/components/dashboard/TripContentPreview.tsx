import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

interface TripContentPreviewProps {
  content: string;
}

// Helper to extract [PREVIEW]...[/PREVIEW] section
function extractPreview(content: string): string | null {
  const match = content.match(/\[PREVIEW\]([\s\S]*?)\[\/PREVIEW\]/i);
  return match ? match[1].trim() : null;
}

export const TripContentPreview = ({ content }: TripContentPreviewProps) => {
  const { t } = useTranslation('trip');

  if (!content) return null;

  // Only show the [PREVIEW] section if present, else fallback to old logic
  const preview = extractPreview(content);
  const previewText = preview || content;

  const getContentPreview = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    // Show more lines on desktop (4 lines instead of 2)
    return lines.slice(0, 4).join('\n') + (lines.length > 4 ? '...' : '');
  };
  
  // Helper function to safely get translations with fallbacks
  const safeTranslate = (key: string, fallback: string): string => {
    const translation = t(key);
    // Check if the translation is the same as the key (indicating it wasn't found)
    return translation === key ? fallback : translation;
  };

  return (
    <div className="mt-4 p-5 bg-gradient-to-br from-gray-50 to-gray-100/80 rounded-xl border border-gray-200/50 shadow-sm min-h-[16rem]">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/70 mr-2"></span>
        {t('aiContent.travelTips')}
      </h3>
      <div className="text-sm text-gray-600 prose prose-sm max-w-none line-clamp-4 sm:line-clamp-4 md:line-clamp-6 lg:line-clamp-8 prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800 leading-relaxed">
        <ReactMarkdown>{getContentPreview(previewText)}</ReactMarkdown>
      </div>
    </div>
  );
};
