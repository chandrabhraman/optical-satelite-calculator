
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-6 mt-12">
      <Separator className="mb-6" />
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} Satellite Optical Sensor Calculator. All rights reserved.
            </p>
          </div>
          
          <nav className="flex space-x-6">
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
