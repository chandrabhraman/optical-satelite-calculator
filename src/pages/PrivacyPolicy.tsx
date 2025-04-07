
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen space-gradient text-foreground">
      <Helmet>
        <title>Privacy Policy | Satellite Optical Sensor Calculator</title>
        <meta name="description" content="Privacy Policy for the Satellite Optical Sensor Calculator tool" />
      </Helmet>
      
      <div className="container mx-auto py-8 pb-24">
        <div className="mb-10">
          <Button variant="ghost" className="flex items-center gap-2" asChild>
            <Link to="/">
              <ChevronLeft className="w-4 h-4" />
              Back to Calculator
            </Link>
          </Button>
        </div>
        
        <div className="prose prose-invert max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-primary">Privacy Policy</h1>
          
          <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <h2>1. Introduction</h2>
          <p>
            Welcome to the Satellite Optical Sensor Calculator ("we," "our," or "us"). We are committed to protecting 
            your privacy and providing a safe online experience. This Privacy Policy explains how we collect, use, 
            disclose, and safeguard your information when you use our online satellite optical sensor calculator 
            tool and website.
          </p>
          
          <h2>2. Information We Collect</h2>
          <p>
            We collect information in the following ways:
          </p>
          <h3>2.1 Information You Provide</h3>
          <p>
            When using our calculator, you may input technical specifications related to satellite optical sensors. 
            This data is processed locally in your browser and is only stored if you explicitly use the sharing feature.
          </p>
          <h3>2.2 Usage Data</h3>
          <p>
            We collect information on how you interact with our website, including:
          </p>
          <ul>
            <li>Access times and dates</li>
            <li>Pages viewed</li>
            <li>Calculation parameters used (in aggregate form)</li>
            <li>Browser type and version</li>
            <li>Device type and operating system</li>
          </ul>
          <h3>2.3 Cookies and Tracking Technologies</h3>
          <p>
            We use cookies and similar tracking technologies to improve your experience with our website:
          </p>
          <ul>
            <li>Essential cookies to enable basic functionality</li>
            <li>Analytics cookies to understand site usage</li>
            <li>Advertising cookies for relevant, meaningful ads (when applicable)</li>
          </ul>
          <p>
            Third-party vendors, including Google, use cookies to serve ads based on your prior visits to our website 
            or other websites. Google's use of advertising cookies enables it and its partners to serve ads to you 
            based on your visit to our site and/or other sites on the Internet.
          </p>
          
          <h2>3. How We Use Your Information</h2>
          <p>
            We use the information we collect for the following purposes:
          </p>
          <ul>
            <li>To provide and maintain our calculator tool</li>
            <li>To improve our website and user experience</li>
            <li>To analyze usage patterns and trends</li>
            <li>To communicate with you, if you contact us</li>
            <li>To display relevant advertising content (when applicable)</li>
          </ul>
          
          <h2>4. Third-Party Services</h2>
          <p>
            We may use third-party services that collect, monitor, and analyze data to help us improve our service:
          </p>
          <ul>
            <li>Google Analytics - To track and report website traffic</li>
            <li>Google AdSense - To display advertisements (when implemented)</li>
          </ul>
          <p>
            These third parties have their own privacy policies addressing how they use such information.
          </p>
          
          <h2>5. Your Choices</h2>
          <h3>5.1 Opt-Out of Personalized Advertising</h3>
          <p>
            You can opt out of personalized advertising by visiting:
          </p>
          <ul>
            <li><a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a></li>
            <li><a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance</a></li>
            <li><a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer">Network Advertising Initiative</a></li>
          </ul>
          <h3>5.2 Managing Cookies</h3>
          <p>
            Most web browsers allow you to manage cookie preferences. You can set your browser to refuse cookies, 
            or to alert you when cookies are being sent. Please note that some parts of our website may not function 
            properly if you disable cookies.
          </p>
          
          <h2>6. Data Security</h2>
          <p>
            We implement reasonable security measures to protect your information. However, no method of transmission 
            over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your data.
          </p>
          
          <h2>7. Changes to this Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
            Privacy Policy on this page and updating the "Last Updated" date.
          </p>
          
          <h2>8. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="mb-10">
            <a href="mailto:contact@satellitecalculator.com">contact@satellitecalculator.com</a>
          </p>
          
          <Separator className="my-8" />
          
          <h3>Additional Privacy Resources</h3>
          <p>
            For more information on Google's privacy practices, please visit the 
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"> Google Privacy & Terms</a> page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
