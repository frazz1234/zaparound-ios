import { type MouseEvent } from 'react';
import { Mail, Facebook, Instagram, ExternalLink, FileText, Settings, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "./LanguageSelector";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { CookieSettingsButton } from "./cookie/CookieSettingsButton";
import { useUserRole } from "@/hooks/useUserRole";
import { setupCrossDomainAuth } from '@/integrations/supabase/crossDomainAuth';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t, i18n } = useTranslation('footer');
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAdmin } = useUserRole();
  
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Error",
        description: t('invalidEmail'),
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('manage-newsletter', {
        body: { 
          email, 
          subscribed: true 
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: t('subscribeSuccess'),
        description: t('subscribeSuccessDesc'),
      });
      setEmail("");
    } catch (error: any) {
      console.error("Error subscribing to newsletter:", error);
      toast({
        title: "Error",
        description: error.message || t('subscribeError'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminClick = async (e: MouseEvent) => {
    e.preventDefault();
    await setupCrossDomainAuth();
  };
  
  return (
    <footer className="bg-[#f2f2f2] text-black footer-component">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
          <div className="space-y-4">
            <div className="flex items-center justify-start">
              <img 
                src="/zaparound-uploads/noir_logo_ZapAround.webp"
                srcSet="/zaparound-uploads/noir_logo_ZapAround.webp 1x, /zaparound-uploads/noir_logo_ZapAround.webp 2x"
                width="201"
                height="32"
                alt="ZapAround Logo"
                loading="lazy"
                className="h-8 w-auto"
              />
            </div>
            <p className="text-sm">
              {t('description')}
            </p>
            <div className="flex space-x-4">
              <motion.a
                href="https://www.facebook.com/byzaparound/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                className="hover:text-blue-400 transition-colors"
                aria-label={t('socialMedia.facebook')}
              >
                <Facebook className="h-5 w-5" />
              </motion.a>
              <motion.a
                href="https://x.com/By_ZapAround"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                className="hover:text-blue-400 transition-colors"
                aria-label={t('socialMedia.twitter')}
              >
                <svg 
                  className="h-5 w-5" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </motion.a>
              <motion.a
                href="https://www.instagram.com/by_zaparound/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                className="hover:text-pink-400 transition-colors"
                aria-label={t('socialMedia.instagram')}
              >
                <Instagram className="h-5 w-5" />
              </motion.a>
              <motion.a
                href="https://www.youtube.com/@ZapAround"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                className="hover:text-red-500 transition-colors"
                aria-label={t('socialMedia.youtube')}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.498 6.186a2.994 2.994 0 0 0-2.107-2.117C19.379 3.5 12 3.5 12 3.5s-7.379 0-9.391.569A2.994 2.994 0 0 0 .502 6.186C0 8.207 0 12 0 12s0 3.793.502 5.814a2.994 2.994 0 0 0 2.107 2.117C4.621 20.5 12 20.5 12 20.5s7.379 0 9.391-.569a2.994 2.994 0 0 0 2.107-2.117C24 15.793 24 12 24 12s0-3.793-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </motion.a>
              <motion.a
                href="https://www.tiktok.com/@zaparound"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                className="hover:text-black transition-colors"
                aria-label={t('socialMedia.tiktok')}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </motion.a>
            </div>
            
            {isAdmin && (
              <div className="flex items-center gap-4 mt-2">
                <a 
                  href="https://admin.zaparound.com" 
                  onClick={handleAdminClick}
                  className="inline-flex items-center text-xs text-gray-400 hover:text-black transition-colors"
                >
                  <Settings className="h-3 w-3 mr-1" /> Admin
                </a>
                <Link to="https://business.zaparound.com" className="inline-flex items-center text-xs text-gray-400 hover:text-black transition-colors">
                  <Building2 className="h-3 w-3 mr-1" /> Business
                </Link>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-black">{t('quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to={`/${i18n.language}/about`} className="hover:text-[#72ba87] transition-colors flex items-center gap-2">
                  {t('about')} <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link to={`/${i18n.language}/blog`} className="hover:text-[#72ba87]  transition-colors flex items-center gap-2">
                  Blog <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link to={`/${i18n.language}/contact`} className="hover:text-[#72ba87] transition-colors flex items-center gap-2">
                  {t('contact')} <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link to={`/${i18n.language}/pricing`} className="hover:text-[#72ba87] transition-colors flex items-center gap-2">
                  {t('pricing')} <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link to={`/${i18n.language}/legal`} className="hover:text-[#72ba87] transition-colors flex items-center gap-2">
                {t('legalTitle')} <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link to={`/${i18n.language}/faq`} className="hover:text-[#72ba87] transition-colors flex items-center gap-2">
                {t('faq')} <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link to={`/${i18n.language}/currency-converter`} className="hover:text-[#72ba87] transition-colors flex items-center gap-2">
                {t('currencyConverter')} <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-black">{t('subscribeTitle')}</h3>
            <p className="text-sm mb-4">{t('subscribeText')}</p>
            <form className="space-y-2" onSubmit={handleSubscribe}>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:hello@zaparound.com" className="hover:text-[#72ba87] transition-colors">
                  hello@zaparound.com
                </a>
              </div>
              <div className="mt-4">
                <input
                  type="email"
                  placeholder={t('enterEmail')}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#72ba87]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-full mt-2 px-4 py-2 bg-[#72ba87]  text-white rounded-md hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Loading..." : t('subscribe')}
                </button>
              </div>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-black">{t('contactTitle')}</h3>
            <p className="text-sm mb-4">{t('contactText')}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:support@zaparound.com" className="hover:text-[#72ba87]  transition-colors">
                  support@zaparound.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 py-6 text-sm text-center"><p>© {currentYear} ZapAround. {t('rights')} | A division of <a href="https://www.by2friends.com/products/zaparound" target="_blank" rel="noopener noreferrer" className="hover:text-[#72ba87] transition-colors underline">Distribution F.inc</a></p></div></div>
    </footer>
  );
}
