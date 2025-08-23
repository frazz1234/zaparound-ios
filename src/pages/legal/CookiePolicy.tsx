import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { useTranslation } from 'react-i18next';
import { CookieSettingsButton } from "@/components/cookie/CookieSettingsButton";
import { CookieStats } from "@/components/cookie/CookieStats";

export default function CookiePolicy() {
  const { t: tCommon } = useTranslation('common');
  const { t: tFooter } = useTranslation('footer');
  const { t: tLegal } = useTranslation('legal');
  const { t: tCookies } = useTranslation('cookies');
  
  return (
    <LegalPageLayout title={tFooter('cookiePolicy')} lastUpdated="July 15, 2024">
      <div className="space-y-8">
        <section>
          <h2>What Are Cookies</h2>
          <p>
            Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners.
          </p>
        </section>
        
        <section>
          <h2>Cookie Usage Statistics</h2>
          <p className="mb-4">
            Below you can see the current statistics of cookies used on our website:
          </p>
          <CookieStats />
        </section>
        
        <section>
          <h2>How We Use Cookies</h2>
          <p>We use cookies for several reasons:</p>
          <ul>
            <li><strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly. They enable core functionalities such as security, account management, and remembering your preferences.</li>
            <li><strong>Performance Cookies:</strong> These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. They help us improve the performance of our website.</li>
            <li><strong>Functional Cookies:</strong> These cookies enable the website to provide enhanced functionality and personalization, such as remembering your language preferences or the region you are in.</li>
            <li><strong>Targeting Cookies:</strong> These cookies are used to deliver advertisements that are more relevant to you and your interests. They are also used to limit the number of times you see an advertisement and help measure the effectiveness of advertising campaigns.</li>
          </ul>
        </section>
        
        <section>
          <h2>Types of Cookies We Use</h2>
          
          <h3>1. Session Cookies</h3>
          <p>
            Session cookies are temporary cookies that are erased when you close your browser. They are used to keep track of your activities during a single browsing session.
          </p>
          
          <h3>2. Persistent Cookies</h3>
          <p>
            Persistent cookies remain on your device for a specified period or until you delete them manually. They help us remember your preferences and settings when you visit our website again.
          </p>
          
          <h3>3. First-Party Cookies</h3>
          <p>
            First-party cookies are set by our website directly. They are used to enhance your user experience and provide basic website functionalities.
          </p>
          
          <h3>4. Third-Party Cookies</h3>
          <p>
            Third-party cookies are set by our partners and service providers. They help us analyze website traffic, understand user behavior, and deliver targeted advertisements.
          </p>
        </section>
        
        <section>
          <h2>Specific Cookies We Use</h2>
          
          <table className="min-w-full border border-gray-300 my-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Cookie Name</th>
                <th className="border border-gray-300 p-2">Purpose</th>
                <th className="border border-gray-300 p-2">Type</th>
                <th className="border border-gray-300 p-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">app-language</td>
                <td className="border border-gray-300 p-2">Remembers your language preference</td>
                <td className="border border-gray-300 p-2">Essential</td>
                <td className="border border-gray-300 p-2">1 year</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">supabase-auth-token</td>
                <td className="border border-gray-300 p-2">Manages user authentication</td>
                <td className="border border-gray-300 p-2">Essential</td>
                <td className="border border-gray-300 p-2">Session</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">_ga (Google Analytics)</td>
                <td className="border border-gray-300 p-2">Tracks user interaction</td>
                <td className="border border-gray-300 p-2">Performance</td>
                <td className="border border-gray-300 p-2">2 years</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">_gid (Google Analytics)</td>
                <td className="border border-gray-300 p-2">Stores information about how users use our site</td>
                <td className="border border-gray-300 p-2">Performance</td>
                <td className="border border-gray-300 p-2">24 hours</td>
              </tr>
            </tbody>
          </table>
        </section>
        
        <section>
          <h2>Managing Cookies</h2>
          <p>
            Most web browsers allow you to control cookies through their settings. You can typically find these settings in the "Options" or "Preferences" menu of your browser. You can:
          </p>
          <ul>
            <li>Delete all cookies from your browser</li>
            <li>Block all cookies from being set</li>
            <li>Block specific cookies from being set</li>
            <li>Allow only certain cookies to be set</li>
          </ul>
          
          <p>
            Here's how to manage cookies in common browsers:
          </p>
          <ul>
            <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
            <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
            <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
          </ul>
          
          <p>
            Please note that blocking some types of cookies may impact your experience on our website and the services we offer.
          </p>
        </section>
        
        <section>
          <h2>Consent to Use Cookies</h2>
          <p>
            When you first visit our website, you will be presented with a cookie banner that allows you to accept or reject cookies. You can change your cookie preferences at any time by clicking on the Cookie Settings link in the footer of our website.
          </p>
          
          <div className="my-6 flex flex-col items-center space-y-4">
            <p className="text-center text-muted-foreground">
              {tCookies('managingDesc')}
            </p>
            <CookieSettingsButton 
              variant="default" 
              size="lg"
              className="min-w-[200px]"
              showIcon={true}
            />
          </div>
        </section>
        
        <section>
          <h2>Changes to This Cookie Policy</h2>
          <p>
            We may update our Cookie Policy from time to time to reflect changes in technology, regulation, or our business practices. Any changes will be posted on this page with an updated revision date.
          </p>
        </section>
        
        <section>
          <h2>Contact Us</h2>
          <p>
            If you have any questions about our Cookie Policy or how we handle cookies, please contact us at support@zaparound.com.
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
}
