import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  
  return (
    <div className="container max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('back')}
      </Button>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-sm text-gray-500 mb-6">
              Last Updated: {lastUpdated}
            </p>
            
            <div className="prose max-w-none">
              {children}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
