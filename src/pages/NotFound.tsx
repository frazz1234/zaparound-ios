import { useLocation, Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { SEO } from '@/components/SEO';

const NotFound = () => {
  const location = useLocation();
  const { lang } = useParams();
  const { t } = useTranslation('notFound');

  useEffect(() => {
    window.scrollTo(0, 0);
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Get the current language from URL or default to 'en'
  const currentLang = lang || 'en';
  const locale = currentLang === 'en' ? 'en_US' : currentLang === 'fr' ? 'fr_FR' : 'es_ES';

  return (
    <>
      <SEO
        title="Page Not Found - ZapAround"
        description="The page you're looking for doesn't exist. Navigate back to our homepage to continue your travel planning journey."
        noindex={true}
        nofollow={true}
        url={`/${currentLang}/404`}
        locale={locale}
      />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 relative overflow-hidden">
      {/* Background rotating circles */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-5"
        >
          <div className="absolute inset-0 border-[100px] border-gray-400 rounded-full" />
          <div className="absolute inset-[100px] border-[80px] border-gray-400 rounded-full" />
          <div className="absolute inset-[200px] border-[60px] border-gray-400 rounded-full" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2 
            }}
            className="relative w-64 h-64 mx-auto mb-8"
          >
            {/* Replace the src with your chosen roundabout GIF */}
            <img
              src="/roundabout.gif"
              alt="Lost in the roundabout"
              className="w-full h-full object-cover rounded-full shadow-xl"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-dashed border-blue-500 rounded-full"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
          >
            Oops! Wrong Turn!
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl text-gray-600 mb-8 space-y-2"
          >
            <p>{t('roundaboutJoke1')}</p>
            <p className="text-sm italic">{t('roundaboutJoke2')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
            >
              <Link to={`/${currentLang}`}>
                <Home className="mr-2" size={20} />
                {t('backToHome')}
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => window.location.reload()}
              className="group transition-all duration-300 transform hover:scale-105"
            >
              <RotateCcw className="mr-2 group-hover:animate-spin" size={20} />
              {t('refresh')}
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-gray-400 text-sm mt-8"
        >
          <p>Error 404: You've been going in circles at {location.pathname}</p>
        </motion.div>
      </motion.div>
    </div>
    </>
  );
};

export default NotFound;
