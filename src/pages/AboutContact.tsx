
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ChevronLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import Footer from "@/components/Footer";

const AboutContact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message sent!",
        description: "Thank you for your message. We will get back to you soon.",
      });
      setName("");
      setEmail("");
      setMessage("");
      setIsSending(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen space-gradient text-foreground">
      <Helmet>
        <title>About & Contact | Satellite Optical Sensor Calculator</title>
        <meta name="description" content="Learn about the Satellite Optical Sensor Calculator tool and contact us with questions or feedback" />
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="prose prose-invert max-w-none">
              <p>
                Have questions, suggestions, or feedback about the Satellite Optical Sensor Calculator? We'd love to hear from you!
              </p>
              
              <section className="mt-8">
                <h3 className="text-xl font-medium mb-4">Get In Touch</h3>
                <p>
                  You can reach us by email at:
                  <br />
                  <a href="mailto:contact@satellitecalculator.com" className="text-primary hover:underline">contact@satellitecalculator.com</a>
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
                <h3 className="text-xl font-medium mb-4">Research Collaboration</h3>
                <p>
                  We're open to collaboration with academic and research institutions. Please contact us with your proposal or research needs.
                </p>
              </section>
            </div>
            
            <Card className="glassmorphism">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Your message or question"
                      rows={5}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSending}
                  >
                    {isSending ? "Sending..." : "Send Message"}
                    {!isSending && <Send className="ml-2 h-4 w-4" />}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AboutContact;
