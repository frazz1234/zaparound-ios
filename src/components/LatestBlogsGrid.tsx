import React from 'react';
import { motion } from 'framer-motion';
import { useBlogs } from '@/hooks/useBlogs';
import { BlogCard } from '@/components/blog/BlogCard';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export const LatestBlogsGrid: React.FC = () => {
  const { t, i18n } = useTranslation(['home', 'blog']);
  const language = i18n.language || 'en';
  const { data, isLoading, error } = useBlogs(1, 4, language);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12" aria-busy="true" aria-live="polite">
        <span className="text-[#62626a] text-lg">{t('blog:loading.posts', 'Loading latest blogs...')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12" role="alert">
        <span className="text-[#e53e3e] text-lg font-semibold mb-2">{t('blog:error.title', 'Error loading blog posts')}</span>
        <span className="text-[#62626a]">{t('blog:error.description', 'Please try again later.')}</span>
      </div>
    );
  }

  const blogs = data?.blogs?.filter((blog: any) => blog.is_published) || [];

  if (blogs.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-lg text-[#62626a]">{t('blog:empty.noPosts', 'No blog posts found.')}</span>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8"
      aria-label={t('home:latestBlogsGrid', 'Latest blog posts grid')}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      viewport={{ once: true, amount: 0.2 }}
    >
      {blogs.map((blog: any, index: number) => (
        <motion.div
          key={blog.id}
          initial={{ opacity: 0, y: 28, rotateX: -6, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
          viewport={{ once: true, amount: 0.25 }}
          whileHover={{ y: -6 }}
          className="will-change-transform"
        >
          <BlogCard blog={blog} />
        </motion.div>
      ))}
    </motion.div>
  );
}; 