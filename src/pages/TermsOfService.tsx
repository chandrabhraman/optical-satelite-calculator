
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const TermsOfService = () => {
  return (
    <div className="min-h-screen space-gradient text-foreground">
      <Helmet>
        <title>Terms of Service | Satellite Optical Sensor Calculator</title>
        <meta name="description" content="Terms of Service for the Satellite Optical Sensor Calculator tool" />
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
          <h1 className="text-4xl font-bold mb-8 text-primary">Terms of Service</h1>
          
          <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Satellite Optical Sensor Calculator ("Service"), you agree to be bound by these 
            Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, 
            you are prohibited from using or accessing this Service.
          </p>
          
          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily access and use the Service for personal, non-commercial, or educational 
            purposes only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul>
            <li>Modify or copy the materials except as necessary for personal use</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to decompile or reverse engineer any software contained on the Service</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
          <p>
            This license shall automatically terminate if you violate any of these restrictions and may be terminated 
            by us at any time. Upon terminating your viewing of these materials or upon the termination of this license, 
            you must destroy any downloaded materials in your possession.
          </p>
          
          <h2>3. Disclaimer</h2>
          <p>
            The materials on the Service are provided on an 'as is' basis. We make no warranties, expressed or implied, 
            and hereby disclaim and negate all other warranties including, without limitation, implied warranties or 
            conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property 
            or other violation of rights.
          </p>
          <p>
            Further, we do not warrant or make any representations concerning the accuracy, likely results, or reliability 
            of the use of the materials on the Service or otherwise relating to such materials or on any resources linked to the Service.
          </p>
          
          <h2>4. Limitations</h2>
          <p>
            In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for 
            loss of data or profit, or due to business interruption) arising out of the use or inability to use the 
            materials on the Service, even if we or an authorized representative has been notified orally or in writing 
            of the possibility of such damage.
          </p>
          <p>
            Some jurisdictions do not allow limitations on implied warranties or limitations of liability for incidental 
            or consequential damages, these limitations may not apply to you.
          </p>
          
          <h2>5. Accuracy of Materials</h2>
          <p>
            The materials appearing on the Service could include technical, typographical, or photographic errors. We do 
            not warrant that any of the materials on the Service are accurate, complete, or current. We may make changes 
            to the materials contained on the Service at any time without notice.
          </p>
          
          <h2>6. Links</h2>
          <p>
            We have not reviewed all of the sites linked to the Service and are not responsible for the contents of any 
            such linked site. The inclusion of any link does not imply endorsement by us of the site. Use of any such 
            linked website is at the user's own risk.
          </p>
          
          <h2>7. Modifications</h2>
          <p>
            We may revise these Terms of Service for the Service at any time without notice. By using the Service, you 
            are agreeing to be bound by the then current version of these Terms of Service.
          </p>
          
          <h2>8. Governing Law</h2>
          <p>
            These Terms of Service and any separate agreements whereby we provide you services shall be governed by and 
            construed in accordance with the laws of the applicable jurisdiction.
          </p>
          
          <h2>9. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property 
            of the Service operator. The Service is protected by copyright, trademark, and other laws of both the applicable 
            country and foreign countries. Our trademarks and trade dress may not be used in connection with any product or 
            service without the prior written consent of the operator.
          </p>

          <h2>10. Contact Information</h2>
          <p className="mb-10">
            If you have any questions about these Terms of Service, please contact us at:
            <br />
            <a href="mailto:contact@satellitecalculator.com">contact@satellitecalculator.com</a>
          </p>
          
          <Separator className="my-8" />
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
