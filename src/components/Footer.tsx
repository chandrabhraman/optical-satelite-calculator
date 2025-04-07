
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-8 mt-12 bg-muted/10 backdrop-blur-sm">
      <Separator className="mb-6" />
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} Satellite Optical Sensor Calculator. All rights reserved.
            </p>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link to="/about-contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              About & Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
