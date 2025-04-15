
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ChevronLeft, Github, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";

const AboutContact = () => {
  return (
    <div className="min-h-screen space-gradient text-foreground">
      <Helmet>
        <title>About & Contact | Satellite Optical Sensor Calculator</title>
        <meta name="description" content="Learn about the Satellite Optical Sensor Calculator tool, our mission, and how to contact us for support and collaboration." />
        <meta name="keywords" content="satellite sensor calculator, earth observation, remote sensing, satellite engineering support, contact satellite tools" />
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3334194678637115" 
          crossOrigin="anonymous" 
        />
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
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-primary">About Us</h1>
          
          <div className="prose prose-invert max-w-none mb-16">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
              <p>
                The Satellite Optical Sensor Calculator was developed to provide a professional-grade tool for 
                satellite engineers, researchers, and students who need accurate optical sensor calculations for 
                Earth observation and remote sensing applications.
              </p>
              
              <p className="mt-4">
                Our team consists of aerospace engineers, remote sensing specialists, and software developers 
                who recognized the need for an accessible yet powerful tool to assist in the complex calculations 
                required for satellite optical system design.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">The Calculator</h2>
              <p>
                Our calculator helps you determine critical parameters for satellite optical systems including:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Ground Sample Distance (GSD) calculations</li>
                <li>Instantaneous Field of View (IFOV) calculations</li>
                <li>Geometric error analysis</li>
                <li>Field of View (FOV) determination</li>
                <li>Edge effects and distortion calculations</li>
                <li>Visualization of satellite sensor coverage</li>
              </ul>
              
              <p className="mt-4">
                Whether you're designing a new satellite optical system, analyzing existing capabilities, or 
                learning about remote sensing principles, our tool provides the mathematical foundation needed 
                for your work.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
              <p>
                We are committed to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Providing accurate calculations based on established scientific principles</li>
                <li>Continuously improving the functionality and usability of our tool</li>
                <li>Maintaining transparency about our formulas and methodologies</li>
                <li>Supporting the space science and remote sensing community</li>
              </ul>
              
              <p className="mt-4">
                We welcome feedback, suggestions, and questions from our users to help us improve and evolve this tool.
              </p>
            </section>
          </div>
          
          <Separator className="my-10" />
          
          <h1 className="text-4xl font-bold mb-8 text-primary">Contact Us</h1>
          
          <div className="prose prose-invert max-w-none">
            <p>
              Have questions, suggestions, or feedback about the Satellite Optical Sensor Calculator? We'd love to hear from you!
            </p>
            
            <section className="mt-8">
              <h3 className="text-xl font-medium mb-4">Get In Touch</h3>
              <p>
                You can reach us by email at:
                <br />
                <a href="mailto:chandrabhraman@gmail.com" className="text-primary hover:underline">chandrabhraman@gmail.com</a>
              </p>
            </section>
            
            <section className="mt-8">
              <h3 className="text-xl font-medium mb-4">Technical Support</h3>
              <p>
                For technical issues or questions about calculations, please include:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>A detailed description of your issue</li>
                <li>The parameters you were using</li>
                <li>Your browser and device information</li>
              </ul>
            </section>
            
            <section className="mt-8">
              <h3 className="text-xl font-medium mb-4">GitHub Issues</h3>
              <p>
                For bug reports, feature requests, or other technical issues, please open an issue on our GitHub repository:
              </p>
              <div className="flex items-center mt-4">
                <Github className="mr-2 h-5 w-5" />
                <a 
                  href="https://github.com/chandrabhraman/optical-satelite-calculator" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center"
                >
                  chandrabhraman/optical-satelite-calculator
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AboutContact;
