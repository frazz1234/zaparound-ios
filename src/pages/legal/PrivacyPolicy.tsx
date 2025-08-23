import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { useTranslation } from 'react-i18next';


export default function PrivacyPolicy() {
  const { t: tCommon } = useTranslation('common');
  const { t: tFooter } = useTranslation('footer');
  const { t: tLegal } = useTranslation('legal');
  
  return (
    <LegalPageLayout title={tFooter('privacyPolicy')} lastUpdated="July 15, 2024">
      <h2>Introduction</h2>
      <p>
        ZapAround ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our travel assistant services.
      </p>
      
      <h2>Information We Collect</h2>
      <p>We collect several types of information from and about users of our website, including:</p>
      <ul>
        <li><strong>Personal Data:</strong> Name, email address, telephone number, address, and other identifiers by which you may be contacted online or offline.</li>
        <li><strong>Account Information:</strong> Login credentials, profile information, and preferences.</li>
        <li><strong>Travel Information:</strong> Trip details, dates, destinations, preferences, and other information needed to provide our travel assistant services.</li>
        <li><strong>Usage Data:</strong> Information about how you use our website, including browsing patterns, features used, and interactions with our platform.</li>
        <li><strong>Device Information:</strong> Information about your device, including IP address, browser type, operating system, and other technical identifiers.</li>
      </ul>
      
      <h2>How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, maintain, and improve our services</li>
        <li>Process and fulfill your travel planning requests</li>
        <li>Communicate with you about your account, our services, and promotional offers</li>
        <li>Personalize your experience and deliver tailored content and recommendations</li>
        <li>Analyze usage patterns and improve our website functionality</li>
        <li>Protect the security and integrity of our platform</li>
        <li>Comply with legal obligations and enforce our terms</li>
      </ul>
      
      <h2>Data Sharing and Disclosure</h2>
      <p>We may share your information with:</p>
      <ul>
        <li><strong>Service Providers:</strong> Third parties that help us deliver our services, such as hosting providers, payment processors, and analytics services.</li>
        <li><strong>Travel Partners:</strong> Hotels, transportation services, and other travel-related providers necessary to fulfill your trip requests.</li>
        <li><strong>Legal Authorities:</strong> When required by law, court order, or governmental regulation.</li>
        <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
      </ul>
      
      <h2>International Data Transfers</h2>
      <p>
        Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We implement appropriate safeguards to protect your information when transferred internationally.
      </p>
      
      <h2>Data Security</h2>
      <p>
        We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, accidental loss, alteration, disclosure, or destruction.
      </p>
      
      <h2>Your Rights</h2>
      <p>Depending on your location, you may have the following rights regarding your personal data:</p>
      <ul>
        <li>Access and receive a copy of your personal data</li>
        <li>Correct inaccurate personal data</li>
        <li>Request deletion of your personal data</li>
        <li>Object to or restrict the processing of your personal data</li>
        <li>Data portability (receiving your data in a structured, machine-readable format)</li>
        <li>Withdraw consent at any time (where processing is based on consent)</li>
      </ul>
      
      <h2>Children's Privacy</h2>
      <p>
        Our services are not intended for individuals under the age of 16. We do not knowingly collect personal information from children under 16. If we learn we have collected personal information from a child under 16, we will delete that information.
      </p>
      
      <h2>Cookies and Tracking Technologies</h2>
      <p>
        We use cookies and similar tracking technologies to collect information about your browsing activities. You can manage your cookie preferences through your browser settings. For more details, please see our <a href="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</a>.
      </p>
      

      
      <h2>Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. The updated version will be indicated by an updated "Last Updated" date at the top of this Privacy Policy. We encourage you to review this Privacy Policy frequently to stay informed about how we are protecting your information.
      </p>
      
      <h2>Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy or our data practices, please contact us at:
      </p>
      <p>
        Email: <a href="mailto:privacy@zaparound.com" className="text-blue-600 hover:underline">privacy@zaparound.com</a><br />
        Address: 420 Rue des Rocheuses, Québec, QC G1C 4N2 Canada
      </p>
      
      <h2>Data Protection Authority</h2>
      <p>
        If you are located in the European Economic Area (EEA) and believe we are processing your personal data unlawfully, you have the right to lodge a complaint with your local data protection authority.
      </p>
    </LegalPageLayout>
  );
}
