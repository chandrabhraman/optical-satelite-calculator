
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const Header: React.FC = () => {
  const location = useLocation();
  
  return (
    <header className="w-full py-4 backdrop-blur-lg bg-background/80 border-b border-border/40 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Satellite Optical Sensor Calculator</Link>
        
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link to="/">
                <NavigationMenuLink className={cn(
                  navigationMenuTriggerStyle(),
                  location.pathname === "/" && "bg-primary/20"
                )}>
                  Home
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link to="/revisit-analysis">
                <NavigationMenuLink className={cn(
                  navigationMenuTriggerStyle(),
                  location.pathname === "/revisit-analysis" && "bg-primary/20"
                )}>
                  Revisit Analysis
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link to="/modeling">
                <NavigationMenuLink className={cn(
                  navigationMenuTriggerStyle(),
                  location.pathname === "/modeling" && "bg-primary/20"
                )}>
                  Modeling
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
};

export default Header;
