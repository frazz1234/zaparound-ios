import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { useTranslation } from 'react-i18next';

export default function GdprCompliance() {
  const { t: tCommon } = useTranslation('common');
  const { t: tFooter } = useTranslation('footer');
  const { t: tLegal } = useTranslation('legal');
  
  return (
    <LegalPageLayout title={tFooter('gdprCompliance')} lastUpdated="July 15, 2024">
      <h2>GDPR Compliance Statement</h2>
      <p>
        ZapAround is committed to ensuring the protection and security of personal data in compliance with the General Data Protection Regulation (GDPR). This policy outlines our approach to data protection and how we fulfill our obligations under the GDPR.
      </p>
      
      <h2>Data Controller Information</h2>
      <p>
        ZapAround acts as a data controller for the personal data we collect. Our contact details are:
      </p>
      <p>
        Email: <a href="mailto:privacy@zaparound.com" className="text-blue-600 hover:underline">privacy@zaparound.com</a><br />
        Address: 420 Rue des Rocheuses, Québec, QC G1C 4N2 Canada
      </p>
      
      <h2>Data Protection Officer</h2>
      <p>
        We have appointed a Data Protection Officer (DPO) who is responsible for overseeing questions regarding this privacy policy. If you have any questions about this policy, including any requests to exercise your legal rights, please contact the DPO at:
      </p>
      <p>
        Email: <a href="mailto:dpo@zaparound.com" className="text-blue-600 hover:underline">dpo@zaparound.com</a><br />
      </p>
      
      <h2>Lawful Basis for Processing</h2>
      <p>
        We only process personal data when we have a lawful basis to do so. We may process your personal data on the following lawful grounds:
      </p>
      <ul>
        <li><strong>Consent:</strong> You have given clear consent for us to process your personal data for a specific purpose.</li>
        <li><strong>Contract:</strong> The processing is necessary for a contract we have with you, or because you have asked us to take specific steps before entering into a contract.</li>
        <li><strong>Legal Obligation:</strong> The processing is necessary for us to comply with the law.</li>
        <li><strong>Legitimate Interests:</strong> The processing is necessary for our legitimate interests or the legitimate interests of a third party, unless there is a good reason to protect your personal data which overrides those legitimate interests.</li>
      </ul>
      
      <h2>Your GDPR Rights</h2>
      <p>
        Under the GDPR, you have the following rights:
      </p>
      
      <h3>1. Right to Be Informed</h3>
      <p>
        You have the right to be informed about the collection and use of your personal data, which we address in our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
      </p>
      
      <h3>2. Right of Access</h3>
      <p>
        You have the right to request a copy of the personal data we hold about you, as well as supplementary information about how we process it.
      </p>
      
      <h3>3. Right to Rectification</h3>
      <p>
        You have the right to have inaccurate personal data rectified, or completed if it is incomplete.
      </p>
      
      <h3>4. Right to Erasure (Right to be Forgotten)</h3>
      <p>
        You have the right to have your personal data erased in certain circumstances, such as when the data is no longer necessary for the purpose for which it was collected.
      </p>
      
      <h3>5. Right to Restrict Processing</h3>
      <p>
        You have the right to request the restriction or suppression of your personal data in certain circumstances.
      </p>
      
      <h3>6. Right to Data Portability</h3>
      <p>
        You have the right to receive the personal data you have provided to us in a structured, commonly used, and machine-readable format, and to transmit that data to another controller.
      </p>
      
      <h3>7. Right to Object</h3>
      <p>
        You have the right to object to the processing of your personal data in certain circumstances, including processing for direct marketing purposes.
      </p>
      
      <h3>8. Rights Related to Automated Decision Making and Profiling</h3>
      <p>
        You have the right not to be subject to a decision based solely on automated processing, including profiling, which produces legal effects concerning you or similarly significantly affects you.
      </p>
      
      <h2>How to Exercise Your Rights</h2>
      <p>
        To exercise any of these rights, please contact our Data Protection Officer at <a href="mailto:dpo@zaparound.com" className="text-blue-600 hover:underline">dpo@zaparound.com</a>. We will respond to your request within one month.
      </p>
      <p>
        There is no fee for exercising your rights. However, we may charge a reasonable fee or refuse to comply with your request if it is manifestly unfounded or excessive.
      </p>
      
      <h2>International Transfers</h2>
      <p>
        We may transfer your personal data outside the European Economic Area (EEA). When we do, we ensure a similar degree of protection is afforded to it by implementing at least one of the following safeguards:
      </p>
      <ul>
        <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
        <li>Binding Corporate Rules (BCRs)</li>
        <li>Transfers to countries deemed to provide adequate protection by the European Commission</li>
        <li>Transfers covered by an approved certification mechanism</li>
      </ul>
      
      <h2>Data Breach Procedures</h2>
      <p>
        In case of a personal data breach, we will notify the relevant supervisory authority within 72 hours of becoming aware of the breach, where feasible. If the breach is likely to result in a high risk to your rights and freedoms, we will also notify you without undue delay.
      </p>
      
      <h2>Data Protection Impact Assessments</h2>
      <p>
        We conduct Data Protection Impact Assessments (DPIAs) when using new technologies, or when the processing is likely to result in a high risk to the rights and freedoms of individuals.
      </p>
      
      <h2>Records of Processing Activities</h2>
      <p>
        We maintain records of our processing activities as required by Article 30 of the GDPR, including the purposes of processing, categories of data subjects and personal data, recipients of personal data, transfers to third countries, retention periods, and security measures.
      </p>
      
      <h2>Complaints</h2>
      <p>
        If you have a concern about our privacy practices, including the way we handle your personal data, you can contact our Data Protection Officer. You also have the right to lodge a complaint with the supervisory authority in your place of residence, place of work, or place of the alleged infringement.
      </p>
    </LegalPageLayout>
  );
}
