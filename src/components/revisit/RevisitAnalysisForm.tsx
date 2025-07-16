import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

// Define prop types
interface RevisitAnalysisFormProps {
  onRunAnalysis: (formData: any) => void;
  isAnalysisRunning: boolean;
  analysisProgress: number;
}

const RevisitAnalysisForm: React.FC<RevisitAnalysisFormProps> = ({
  onRunAnalysis,
  isAnalysisRunning,
  analysisProgress
}) => {
  // Form setup with react-hook-form
  const form = useForm({
    defaultValues: {
      // Orbit defaults
      orbitType: "sso",
      altitude: 550,
      inclination: 97.6,
      ltan: "10:30",
      raan: 0,
      argOfPerigee: 0,
      meanAnomaly: 0,
      
      // Add longitude field for GEO orbit type
      longitudeGEO: 0,
      
      // Constellation defaults
      constellationType: "single",
      totalSatellites: 1,
      planes: 1,
      phasing: 0,
      inPlaneSpacing: 30,
      
      // Payload defaults
      swathWidth: 120,
      fieldOfView: 10,
      maxOffNadirAngle: 30,
      
      // Analysis defaults
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      timeStep: 60,
      gridCellSize: "1deg",
      useJ2Perturbations: true,
    }
  });

  // Dynamic form state
  const [orbitType, setOrbitType] = useState("sso");
  const [constellationType, setConstellationType] = useState("single");
  
  // Update inclination default when orbit type changes
  React.useEffect(() => {
    if (orbitType === "geo") {
      form.setValue("inclination", 0);
    } else if (orbitType === "sso") {
      form.setValue("inclination", 97.6);
    }
  }, [orbitType, form]);
  
  // Submit handler
  const onSubmit = (data: any) => {
    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Form submitted with data:", data);
    console.log("Total satellites:", data.totalSatellites);
    console.log("Constellation type:", data.constellationType);
    console.log("Calling onRunAnalysis...");
    onRunAnalysis(data);
    console.log("onRunAnalysis called");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Orbit Parameters */}
        <div>
          <h3 className="text-lg font-medium mb-4">Orbit Configuration</h3>
          
          <FormField
            control={form.control}
            name="orbitType"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Orbit Type</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    setOrbitType(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select orbit type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="leo">LEO - General</SelectItem>
                    <SelectItem value="sso">Sun-Synchronous (SSO)</SelectItem>
                    <SelectItem value="meo">Medium Earth Orbit (MEO)</SelectItem>
                    <SelectItem value="geo">Geostationary Orbit (GEO)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the type of orbit for your satellite(s)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Dynamic fields based on orbit type */}
          {orbitType === "sso" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="altitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altitude (km)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ltan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LTAN</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select LTAN" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="06:00">06:00 (Dawn)</SelectItem>
                          <SelectItem value="09:30">09:30 (Morning)</SelectItem>
                          <SelectItem value="10:30">10:30 (Mid-Morning)</SelectItem>
                          <SelectItem value="13:30">13:30 (Afternoon)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Local Time of Ascending Node</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="argOfPerigee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Argument of Perigee (°)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="meanAnomaly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mean Anomaly (°)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}
          
          {orbitType === "leo" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="altitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altitude (km)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="inclination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inclination (°)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="raan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RAAN (°)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Right Ascension of Ascending Node</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="argOfPerigee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arg. of Perigee (°)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="meanAnomaly"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Mean Anomaly (°)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          
          {orbitType === "geo" && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="longitudeGEO"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude (°E)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Sub-satellite point longitude (East positive)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="inclination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inclination (°)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Orbital inclination (0° for equatorial)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Constellation Parameters */}
        <div>
          <h3 className="text-lg font-medium mb-4">Constellation Configuration</h3>
          
          <FormField
            control={form.control}
            name="constellationType"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Constellation Type</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    setConstellationType(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select constellation type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="single">Single Satellite</SelectItem>
                    <SelectItem value="walker">Walker Star/Delta</SelectItem>
                    <SelectItem value="train">Street of Coverage (Train)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the type of constellation pattern
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Dynamic fields based on constellation type */}
          {constellationType === "walker" && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalSatellites"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Satellites</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="planes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Planes</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phasing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phasing Parameter</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Relative phasing between planes (0 to P-1)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          
          {constellationType === "train" && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalSatellites"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Satellites in Train</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="inPlaneSpacing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>In-Plane Spacing (°)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Mean anomaly spacing between satellites</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Payload Parameters */}
        <div>
          <h3 className="text-lg font-medium mb-4">Payload Characteristics</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="swathWidth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Swath Width (km)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="maxOffNadirAngle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Off-Nadir (°)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>Maximum off-nadir pointing angle</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Separator />
        
        {/* Analysis Parameters */}
        <div>
          <h3 className="text-lg font-medium mb-4">Analysis Settings</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="timeStep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Step (sec)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>Simulation time step in seconds</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="gridCellSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grid Cell Size</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cell size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0.5deg">0.5° × 0.5° (High resolution)</SelectItem>
                      <SelectItem value="1deg">1° × 1° (Standard)</SelectItem>
                      <SelectItem value="2deg">2° × 2° (Fast calculation)</SelectItem>
                      <SelectItem value="5deg">5° × 5° (Rough estimate)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Resolution of analysis grid</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="useJ2Perturbations"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Enable J2 Perturbations</FormLabel>
                  <FormDescription>
                    Include Earth's oblateness effects in orbit propagation
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        {/* Submit Button */}
        <div className="mt-6">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isAnalysisRunning}
          >
            {isAnalysisRunning ? "Running Analysis..." : "Run Analysis"}
          </Button>
          
          {isAnalysisRunning && (
            <div className="mt-4">
              <Progress value={analysisProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground mt-1">
                {analysisProgress}% complete
              </p>
            </div>
          )}
        </div>
      </form>
    </Form>
  );
};

export default RevisitAnalysisForm;
