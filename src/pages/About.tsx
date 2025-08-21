import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';
import { useEffect } from "react";
import { Users, Target, Heart, Sparkles, Globe2, Rocket, Award, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SEO } from '@/components/SEO';
import useStructuredData from '@/hooks/useStructuredData';

const LOCALE_MAP = { en: 'en_US', fr: 'fr_FR', es: 'es_ES' };

export default function About() {
  const { t, i18n } = useTranslation('about');
  const locale = LOCALE_MAP[i18n.language] || 'en_US';
  const language = i18n.language;
  const { organizationSchema } = useStructuredData();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const enhancedStructuredData = {
    ...organizationSchema,
    "@type": "AboutPage",
    "mainContentOfPage": {
      "@type": "WebPageElement",
      "description": t('subtitle')
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": `https://zaparound.com/${language}`
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "About",
          "item": `https://zaparound.com/${language}/about`
        }
      ]
    }
  };

  return (
    <>
      <SEO
        title={t('title')}
        description={t('subtitle')}
        keywords="ZapAround, travel company, about us, travel mission, travel vision, travel values, smart travel, AI travel planning"
        url={`/${language}/about`}
        locale={locale}
        structuredData={enhancedStructuredData}
      />

      <div className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-[#030303] mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-[#62626a] max-w-3xl mx-auto">
              {t('subtitle')}
            </p>
          </motion.div>
        </div>

        {/* Our Story Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-[#1d1d1e]/5 to-[#61936f]/5 rounded-2xl p-8 md:p-12 shadow-lg mb-16 border border-[#1d1d1e]/10"
        >
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-[#61936f]/10 rounded-full flex items-center justify-center mb-6">
              <Heart className="h-10 w-10 text-[#61936f]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#030303] mb-4">
              {t('ourStory.title')}
            </h2>
            <div className="space-y-6 text-[#62626a] max-w-3xl">
              <p className="text-lg">{t('ourStory.paragraph1')}</p>
              <p className="text-lg">{t('ourStory.paragraph2')}</p>
              <p className="text-lg">{t('ourStory.paragraph3')}</p>
            </div>
          </div>
        </motion.div>

        {/* Mission & Vision Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {[
            {
              icon: <Target className="h-8 w-8 text-[#1d1d1e]" />,
              title: t('mission.title'),
              description: t('mission.description'),
            },
            {
              icon: <Rocket className="h-8 w-8 text-[#61936f]" />,
              title: t('vision.title'),
              description: t('vision.description'),
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
              className="bg-white p-8 rounded-xl shadow-sm border border-[#1d1d1e]/10 hover:shadow-md transition-shadow"
            >
              <div className="mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-[#030303]">{item.title}</h3>
              <p className="text-[#62626a]">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Values Grid */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="h-20 w-20 bg-[#1d1d1e]/10 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Award className="h-10 w-10 text-[#1d1d1e]" />
            </div>
            <h2 className="text-3xl font-bold text-[#030303] mb-4">{t('values.title')}</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Globe2 className="h-8 w-8 text-[#61936f]" />, title: 'values.value1.title', desc: 'values.value1.description' },
              { icon: <Users className="h-8 w-8 text-[#1d1d1e]" />, title: 'values.value2.title', desc: 'values.value2.description' },
              { icon: <Sparkles className="h-8 w-8 text-[#61936f]" />, title: 'values.value3.title', desc: 'values.value3.description' },
              { icon: <Zap className="h-8 w-8 text-[#1d1d1e]" />, title: 'values.value4.title', desc: 'values.value4.description' }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                className="bg-white p-6 rounded-xl shadow-sm border border-[#1d1d1e]/10 hover:shadow-md transition-shadow"
              >
                <div className="mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-[#030303]">{t(value.title)}</h3>
                <p className="text-[#62626a]">{t(value.desc)}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'whyChoose.feature1.title', desc: 'whyChoose.feature1.description' },
            { title: 'whyChoose.feature2.title', desc: 'whyChoose.feature2.description' },
            { title: 'whyChoose.feature3.title', desc: 'whyChoose.feature3.description' }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
              className="bg-white p-6 rounded-xl shadow-sm border border-[#1d1d1e]/10 hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2 text-[#030303]">{t(feature.title)}</h3>
              <p className="text-[#62626a]">{t(feature.desc)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
