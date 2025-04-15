
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen space-gradient text-foreground">
      <Helmet>
        <title>Privacy Policy | Satellite Optical Sensor Calculator</title>
        <meta name="description" content="Privacy policy for the Satellite Optical Sensor Calculator. Learn how we protect your data and ensure your privacy while using our professional satellite engineering tool." />
        <meta name="keywords" content="privacy policy, satellite tool privacy, data protection, satellite sensor calculator terms" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3334194678637115" crossorigin="anonymous"></script>
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
          <h1 className="text-4xl font-bold mb-4 text-primary">Privacy Policy</h1>
          
          <p className="text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to the Satellite Optical Sensor Calculator ("we," "our," or "us"). We are committed to protecting 
              your privacy and providing a safe online experience. This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you use our online satellite optical sensor calculator 
              tool and website.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <p>
              We collect information in the following ways:
            </p>
            
            <h3 className="text-xl font-medium mt-6 mb-3">2.1 Information You Provide</h3>
            <p>
              When using our calculator, you may input technical specifications related to satellite optical sensors. 
              This data is processed locally in your browser and is only stored if you explicitly use the sharing feature.
            </p>
            
            <h3 className="text-xl font-medium mt-6 mb-3">2.2 Usage Data</h3>
            <p>
              We collect information on how you interact with our website, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access times and dates</li>
              <li>Pages viewed</li>
              <li>Calculation parameters used (in aggregate form)</li>
              <li>Browser type and version</li>
              <li>Device type and operating system</li>
            </ul>
            
            <h3 className="text-xl font-medium mt-6 mb-3">2.3 Cookies and Tracking Technologies</h3>
            <p>
              We use cookies and similar tracking technologies to improve your experience with our website:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Essential cookies to enable basic functionality</li>
              <li>Analytics cookies to understand site usage</li>
              <li>Advertising cookies for relevant, meaningful ads (when applicable)</li>
            </ul>
            <p className="mt-4">
              Third-party vendors, including Google, use cookies to serve ads based on your prior visits to our website 
              or other websites. Google's use of advertising cookies enables it and its partners to serve ads to you 
              based on your visit to our site and/or other sites on the Internet.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p>
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our calculator tool</li>
              <li>To improve our website and user experience</li>
              <li>To analyze usage patterns and trends</li>
              <li>To communicate with you, if you contact us</li>
              <li>To display relevant advertising content (when applicable)</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
            <p>
              We may use third-party services that collect, monitor, and analyze data to help us improve our service:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Google Analytics - To track and report website traffic</li>
              <li>Google AdSense - To display advertisements (when implemented)</li>
            </ul>
            <p className="mt-4">
              These third parties have their own privacy policies addressing how they use such information.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Your Choices</h2>
            
            <h3 className="text-xl font-medium mt-6 mb-3">5.1 Opt-Out of Personalized Advertising</h3>
            <p>
              You can opt out of personalized advertising by visiting:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ads Settings</a></li>
              <li><a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Digital Advertising Alliance</a></li>
              <li><a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Network Advertising Initiative</a></li>
            </ul>
            
            <h3 className="text-xl font-medium mt-6 mb-3">5.2 Managing Cookies</h3>
            <p>
              Most web browsers allow you to manage cookie preferences. You can set your browser to refuse cookies, 
              or to alert you when cookies are being sent. Please note that some parts of our website may not function 
              properly if you disable cookies.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p>
              We implement reasonable security measures to protect your information. However, no method of transmission 
              over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your data.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Changes to this Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
              Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-4">
              <a href="mailto:chandrabhraman@gmail.com" className="text-primary hover:underline">chandrabhraman@gmail.com</a>
            </p>
          </section>
          
          <Separator className="my-8" />
          
          <div className="mb-10">
            <h3 className="text-xl font-medium mb-4">Additional Privacy Resources</h3>
            <p>
              For more information on Google's privacy practices, please visit the 
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline"> Google Privacy & Terms</a> page.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
