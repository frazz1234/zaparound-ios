import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';

const Testimonials: React.FC = () => {
  const { t } = useTranslation('home');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const isMobile = useIsMobile();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || isMobile) {
      setReduceMotion(true);
    }
  }, [isMobile]);

  const testimonials = [
    {
      text: t('testimonials.testimonial1.text'),
      author: t('testimonials.testimonial1.author'),
      location: t('testimonials.testimonial1.location')
    },
    {
      text: t('testimonials.testimonial2.text'),
      author: t('testimonials.testimonial2.author'),
      location: t('testimonials.testimonial2.location')
    },
    {
      text: t('testimonials.testimonial3.text'),
      author: t('testimonials.testimonial3.author'),
      location: t('testimonials.testimonial3.location')
    }
  ];

  return (
    <div className="min-h-[400px] md:min-h-[500px]">
      <section ref={ref} className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <motion.h2 
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={reduceMotion ? { opacity: 1, y: 0 } : (isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 })}
              {...(!reduceMotion && { transition: { delay: 0 } })}
              className="text-4xl font-bold mb-4"
            >
              {t('testimonials.title')}
            </motion.h2>
            <motion.p 
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={reduceMotion ? { opacity: 1, y: 0 } : (isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 })}
              {...(!reduceMotion && { transition: { delay: 0.2 } })}
              className="text-gray-600 text-lg"
            >
              {t('testimonials.subtitle')}
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                animate={reduceMotion ? { opacity: 1, y: 0 } : (isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 })}
                {...(!reduceMotion && { transition: { delay: 0.2 + (index * 0.1) } })}
                className="bg-gray-50 p-6 rounded-xl shadow-sm"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-gray-500 text-sm">{testimonial.location}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Testimonials;
