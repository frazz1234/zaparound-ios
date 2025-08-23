import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, FileText, Scale, Shield, Cookie } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CookieSettingsButton } from "@/components/cookie/CookieSettingsButton";

export default function LegalInformation() {
  const { t: tCommon } = useTranslation('common');
  const { t: tFooter } = useTranslation('footer');
  const { t: tLegal } = useTranslation('legal');
  const navigate = useNavigate();
  
  const legalDocuments = [
    {
      title: tFooter('privacyPolicy'),
      description: tLegal('privacyPolicyDesc'),
      path: "/privacy",
      icon: <Shield className="h-5 w-5" />,
      color: "bg-blue-100 text-blue-700"
    },
    {
      title: tFooter('termsOfService'),
      description: tLegal('termsOfServiceDesc'),
      path: "/terms",
      icon: <FileText className="h-5 w-5" />,
      color: "bg-purple-100 text-purple-700"
    },
    {
      title: tFooter('cookiePolicy'),
      description: tLegal('cookiePolicyDesc'),
      path: "/cookie-policy",
      icon: <FileText className="h-5 w-5" />,
      color: "bg-amber-100 text-amber-700"
    },
    {
      title: tFooter('gdprCompliance'),
      description: tLegal('gdprComplianceDesc'),
      path: "/gdpr",
      icon: <Scale className="h-5 w-5" />,
      color: "bg-green-100 text-green-700"
    }
  ];

  return (
    <div className="container max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {tCommon('back')}
      </Button>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{tFooter('legalTitle')}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {tLegal('legalInfoDesc')}
          </p>
          <div className="mt-4">
            <CookieSettingsButton 
              variant="outline" 
              size="sm"
              className="mx-auto"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {legalDocuments.map((doc, index) => (
            <motion.div
              key={doc.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-full ${doc.color} flex items-center justify-center mb-4`}>
                    {doc.icon}
                  </div>
                  <CardTitle>{doc.title}</CardTitle>
                  <CardDescription>{doc.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild>
                    <Link to={doc.path}>
                      {tLegal('readDocument')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold mb-4">{tLegal('aboutOurPolicies')}</h2>
            <p className="mb-4">
              {tLegal('policiesIntro')}
            </p>
            <p className="mb-4">
              {tLegal('updatesInfo')}
            </p>
            <p className="mb-4">
              {tLegal('contactInfo')}{" "}
              <a href="mailto:legal@zaparound.com" className="text-primary hover:underline">
                legal@zaparound.com
              </a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 