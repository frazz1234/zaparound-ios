import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronRight, MessageCircle, Lightbulb, Settings, Shield } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SEO } from '@/components/SEO';

const LOCALE_MAP = { en: 'en_US', fr: 'fr_FR', es: 'es_ES' };

export default function FAQ() {
  const { t, i18n } = useTranslation('faq');
  const language = i18n.language;
  const locale = LOCALE_MAP[language] || 'en_US';
  

  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const questions = t('questions', { returnObjects: true });
  const categories = t('categories', { returnObjects: true });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": Object.entries(questions).map(([key, question]: [string, any]) => ({
      "@type": "Question",
      "name": question.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": question.answer
      }
    }))
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general':
        return <MessageCircle className="h-5 w-5" />;
      case 'features':
        return <Lightbulb className="h-5 w-5" />;
      case 'technical':
        return <Settings className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const filteredQuestions = useMemo(() => {
    return Object.entries(questions).filter(([key, question]: [string, any]) => {
      const matchesSearch = question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          question.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || question.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [questions, searchQuery, selectedCategory]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <>
      <SEO
        title={t('title')}
        description={t('subtitle')}
        keywords="ZapAround FAQ, frequently asked questions, travel help, travel support, travel questions, travel assistance"
        url={`/${language}/faq`}
        locale={locale}
        structuredData={structuredData}
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen bg-gradient-to-b from-[#fcfcfc] to-white"
      >
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#1d1d1e] mb-4">{t('title')}</h1>
            <p className="text-lg text-[#62626a] max-w-2xl mx-auto">
             {t('subtitle')}
            </p>
          </motion.div>

          {/* Search and Categories */}
          <motion.div variants={itemVariants} className="mb-12">
            <Card className="bg-white shadow-lg border-none overflow-hidden">
              <CardContent className="p-6 space-y-6">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#62626a] h-5 w-5" />
                  <Input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full bg-gray-50 border-gray-200 focus:ring-2 focus:ring-[#61936f] focus:border-transparent"
                  />
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.entries(categories).map(([key, label]) => (
                    <Button
                      key={key}
                      variant={selectedCategory === key ? "default" : "outline"}
                      onClick={() => setSelectedCategory(key)}
                      className={`rounded-full px-6 ${
                        selectedCategory === key 
                          ? 'bg-[#1d1d1e] text-white hover:bg-[#62626a]' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {getCategoryIcon(key)}
                        {label}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* FAQ Accordion */}
          <motion.div variants={itemVariants} className="space-y-4">
            {filteredQuestions.map(([key, question]: [string, any], index) => (
              <motion.div
                key={key}
                variants={itemVariants}
                custom={index}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <Accordion
                  type="single"
                  collapsible
                  value={expandedItems.includes(key) ? key : undefined}
                  onValueChange={(value) => {
                    if (value) {
                      setExpandedItems([...expandedItems, key]);
                    } else {
                      setExpandedItems(expandedItems.filter(item => item !== key));
                    }
                  }}
                >
                  <AccordionItem value={key} className="border-none">
                    <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${
                          question.category === 'general' ? 'bg-blue-100 text-blue-700' :
                          question.category === 'features' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {getCategoryIcon(question.category)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-[#1d1d1e] pr-8">{question.question}</h3>
                          <p className="text-sm text-[#62626a] mt-1">
                            {t(`categories.${question.category}`)}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 pt-0">
                      <div className="ml-16">
                        <p
                          className="text-[#62626a] leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: question.answer }}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </motion.div>
            ))}
          </motion.div>

          {/* No Results Message */}
          {filteredQuestions.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#1d1d1e] mb-2">No questions found</h3>
                <p className="text-[#62626a]">
                  Try adjusting your search terms or browse all categories to find what you're looking for.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-4"
                >
                  Clear filters
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
} 