import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from 'react-i18next';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from '@/components/SEO';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    phone: "",
    category: "general",
    preferredTime: "any"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t, i18n } = useTranslation('contact');
  const language = i18n.language;
  const locale = language === 'en' ? 'en_US' : language === 'fr' ? 'fr_FR' : 'es_ES';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": t("title"),
    "description": t("subtitle"),
    "url": `https://zaparound.com/${language}/contact`,
    "mainEntity": {
      "@type": "Organization",
      "name": "ZapAround",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": "hello@zaparound.com",
        "url": `https://zaparound.com/${language}/contact`
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await supabase.functions.invoke('send-contact-email', {
        body: formData
      });
      
      if (response.error) {
        throw new Error(response.error.message || t("error.description"));
      }
      
      toast({
        title: t("success.title"),
        description: t("success.description"),
      });
      
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        phone: "",
        category: "general",
        preferredTime: "any"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: t("error.title"),
        description: t("error.description"),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title={t("title")}
        description={t("subtitle")}
        keywords="ZapAround contact, customer support, travel help, contact us, travel assistance, customer service"
        url={`/${language}/contact`}
        locale={locale}
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("title")}</h1>
            <p className="text-xl text-gray-600">
              {t("subtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-lg shadow-md"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">{t("form.name")}</Label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t("form.placeholders.name")}
                    required
                    spellCheck={false}
                    autoCapitalize="words"
                    autoCorrect="off"
                  />
                </div>

                <div>
                  <Label htmlFor="email">{t("form.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t("form.placeholders.email")}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">{t("form.phone")}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t("form.placeholders.phone")}
                  />
                </div>

                <div>
                  <Label>{t("categories.title")}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">{t("categories.general")}</SelectItem>
                      <SelectItem value="support">{t("categories.support")}</SelectItem>
                      <SelectItem value="booking">{t("categories.booking")}</SelectItem>
                      <SelectItem value="feedback">{t("categories.feedback")}</SelectItem>
                      <SelectItem value="partnership">{t("categories.partnership")}</SelectItem>
                      <SelectItem value="other">{t("categories.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject">{t("form.subject")}</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder={t("form.placeholders.subject")}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message">{t("form.message")}</Label>
                  <Textarea
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={t("form.placeholders.message")}
                    required
                  />
                </div>

                <div>
                  <Label>{t("preferences.timeframe")}</Label>
                  <Select
                    value={formData.preferredTime}
                    onValueChange={(value) => setFormData({ ...formData, preferredTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">{t("preferences.times.morning")}</SelectItem>
                      <SelectItem value="afternoon">{t("preferences.times.afternoon")}</SelectItem>
                      <SelectItem value="evening">{t("preferences.times.evening")}</SelectItem>
                      <SelectItem value="any">{t("preferences.times.any")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting} style={{ backgroundColor: '#72ba87', color: 'white', border: '1px solid #72ba87' }}>
                  {isSubmitting ? t("actions.sending") : t("actions.submit")}
                </Button>
              </form>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle>{t("info.title")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">{t("info.response")}</p>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">{t("info.office.title")}</h3>
                      <div className="space-y-2 text-gray-600">
                        <p>{t("info.office.weekdays")}</p>
                        <p>{t("info.office.weekend")}</p>
                        <p className="text-sm italic">{t("info.office.timezone")}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <a href="mailto:hello@zaparound.com" className="text-blue-600 hover:text-blue-800">
                        hello@zaparound.com
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
