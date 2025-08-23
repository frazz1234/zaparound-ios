import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { useTranslation } from 'react-i18next';

export default function TermsOfService() {
  const { t: tCommon } = useTranslation('common');
  const { t: tFooter } = useTranslation('footer');
  const { t: tLegal } = useTranslation('legal');
  
  return (
    <LegalPageLayout title={tFooter('termsOfService')} lastUpdated="July 15, 2024">
      <h2>Agreement to Terms</h2>
      <p>
        These Terms of Service ("Terms") govern your access to and use of the ZapAround website and services ("Services"). By accessing or using our Services, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access the Services.
      </p>
      
      <h2>Eligibility</h2>
      <p>
        The Services are intended for users who are at least 16 years of age. By using the Services, you represent and warrant that you are at least 16 years old and that you have the right, authority, and capacity to agree to and abide by these Terms.
      </p>
      
      <h2>Account Registration</h2>
      <p>
        When you create an account with us, you must provide accurate, complete, and up-to-date information. You are responsible for safeguarding the password that you use to access the Services and for any activities or actions under your password. We encourage you to use strong passwords (e.g., passwords that use a combination of upper and lower case letters, numbers, and symbols).
      </p>
      
      <h2>User Content</h2>
      <p>
        Our Services allow you to create, upload, store, and share content, including text, photos, and trip information ("User Content"). You retain all rights in, and are solely responsible for, the User Content you post to our Services.
      </p>
      <p>
        By providing User Content to the Services, you grant us a worldwide, non-exclusive, royalty-free license (with the right to sublicense) to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute such content in any and all media or distribution methods.
      </p>
      
      <h2>Prohibited Uses</h2>
      <p>You agree not to use the Services:</p>
      <ul>
        <li>In any way that violates any applicable law or regulation</li>
        <li>To impersonate any person or entity or misrepresent your affiliation with a person or entity</li>
        <li>To engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Services</li>
        <li>To attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Services</li>
        <li>To upload or transmit viruses, malware, or other malicious code</li>
        <li>To collect or track the personal information of others</li>
      </ul>
      
      <h2>Intellectual Property</h2>
      <p>
        The Services and their original content (excluding User Content), features, and functionality are and will remain the exclusive property of ZapAround and its licensors. The Services are protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
      </p>
      
      <h2>Service Modification and Termination</h2>
      <p>
        We reserve the right to modify or discontinue, temporarily or permanently, the Services (or any part thereof) with or without notice. You agree that we shall not be liable to you or to any third party for any modification, suspension, or discontinuance of the Services.
      </p>
      <p>
        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including, without limitation, if you breach the Terms. Upon termination, your right to use the Services will immediately cease.
      </p>
      
      <h2>Limitation of Liability</h2>
      <p>
        In no event shall ZapAround, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
      </p>
      <ul>
        <li>Your access to or use of or inability to access or use the Services</li>
        <li>Any conduct or content of any third party on the Services</li>
        <li>Any content obtained from the Services</li>
        <li>Unauthorized access, use, or alteration of your transmissions or content</li>
      </ul>
      <p>
        Some jurisdictions do not allow the exclusion of certain warranties or the limitation or exclusion of liability for incidental or consequential damages. Accordingly, some of the above limitations may not apply to you.
      </p>
      
      <h2>Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless ZapAround and its licensees and licensors, and their employees, contractors, agents, officers, and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to attorney's fees), resulting from or arising out of:
      </p>
      <ul>
        <li>Your use and access of the Services</li>
        <li>Your violation of any term of these Terms</li>
        <li>Your violation of any third-party right, including without limitation any copyright, property, or privacy right</li>
        <li>Any claim that your User Content caused damage to a third party</li>
      </ul>
      
      <h2>Governing Law</h2>
      <p>
        These Terms shall be governed and construed in accordance with the laws of Canada, without regard to its conflict of law provisions. Any dispute arising from or relating to the subject matter of these Terms shall be finally settled in Quebec, Canada, by the courts of competent jurisdiction.
      </p>
      
      <h2>Changes to Terms</h2>
      <p>
        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
      </p>
      
      <h2>Contact Us</h2>
      <p>
        If you have any questions about these Terms, please contact us at:
      </p>
      <p>
        Email: <a href="mailto:legal@zaparound.com" className="text-blue-600 hover:underline">legal@zaparound.com</a><br />
        Address: 420 Rue des Rocheuses, Québec, QC G1C 4N2 Canada
      </p>
    </LegalPageLayout>
  );
}
