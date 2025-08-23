import { hydrateRoot } from 'react-dom/client';
import { BlogContent } from '../components/blog/BlogContent';
import { BlogMetaTags } from '../components/blog/BlogMetaTags';

// Hydrate dynamic components if needed
if (window.BLOG_DATA) {
  const { blog, language } = window.BLOG_DATA;
  
  // Hydrate meta tags for dynamic updates
  const metaContainer = document.getElementById('meta-container');
  if (metaContainer) {
    hydrateRoot(
      metaContainer,
      <BlogMetaTags blog={blog} blogSlug={blog.slug || blog.id} language={language} />
    );
  }

  // Hydrate blog content for dynamic features
  const contentContainer = document.getElementById('blog-content');
  if (contentContainer) {
    hydrateRoot(
      contentContainer,
      <BlogContent blog={blog} language={language} />
    );
  }
} 