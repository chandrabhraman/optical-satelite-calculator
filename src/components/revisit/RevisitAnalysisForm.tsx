
import React, { useState } from "react";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormDescription 
} from "@/components/ui/form";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Progress } from "@/components/ui/progress";
import { playSound, SOUNDS } from "@/utils/soundEffects";

// Define form schema
const formSchema = z.object({
  // Orbit parameters
  orbitType: z.enum(["leo-general", "sso", "non-sso-leo", "meo", "geo"]),
  altitude: z.number().min(200).max(36000),
  inclination: z.number().min(0).max(180).optional(),
  raan: z.number().min(0).max(360).optional(),
  argOfPerigee: z.number().min(0).max(360).optional(),
  meanAnomaly: z.number().min(0).max(360).optional(),
  ltan: z.string().optional(),
  subsatelliteLongitude: z.number().min(-180).max(180).optional(),
  
  // Constellation parameters
  constellationType: z.enum(["single", "walker", "street"]),
  totalSatellites: z.number().min(1).max(1000).optional(),
  planes: z.number().min(1).max(100).optional(),
  phasing: z.number().min(0).max(100).optional(),
  trainSatellites: z.number().min(1).max(100).optional(),
  spacingDegrees: z.number().min(0).max(360).optional(),
  
  // Payload parameters
  swathWidth: z.number().min(1).optional(),
  fieldOfView: z.number().min(0.1).max(180).optional(),
  maxOffNadirAngle: z.number().min(0).max(90),
  
  // Analysis settings
  startDate: z.string(),
  endDate: z.string(),
  timeStep: z.number().min(1).max(3600),
  gridSize: z.number().min(0.1).max(10),
});

type FormValues = z.infer<typeof formSchema>;

interface RevisitAnalysisFormProps {
  onRunAnalysis: (values: FormValues) => void;
  isAnalysisRunning: boolean;
}

const RevisitAnalysisForm: React.FC<RevisitAnalysisFormProps> = ({ 
  onRunAnalysis,
  isAnalysisRunning 
}) => {
  // Default values
  const defaultValues: Partial<FormValues> = {
    orbitType: "sso",
    altitude: 500,
    inclination: 97.4,
    raan: 0,
    argOfPerigee: 90,
    meanAnomaly: 0,
    ltan: "10:30",
    constellationType: "single",
    totalSatellites: 1,
    planes: 1,
    phasing: 0,
    swathWidth: 120,
    maxOffNadirAngle: 30,
    timeStep: 60,
    gridSize: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  // Watch form values to dynamically show/hide fields
  const orbitType = form.watch("orbitType");
  const constellationType = form.watch("constellationType");
  
  const handleSubmit = (values: FormValues) => {
    playSound(SOUNDS.simulate, 0.5);
    onRunAnalysis(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Accordion type="single" collapsible defaultValue="orbit" className="w-full">
          <AccordionItem value="orbit">
            <AccordionTrigger>Orbit Configuration</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <FormField
                control={form.control}
                name="orbitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orbit Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isAnalysisRunning}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select orbit type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leo-general">LEO - General</SelectItem>
                        <SelectItem value="sso">Sun-Synchronous Orbit (SSO)</SelectItem>
                        <SelectItem value="non-sso-leo">Non-SSO LEO</SelectItem>
                        <SelectItem value="meo">Medium Earth Orbit (MEO)</SelectItem>
                        <SelectItem value="geo">Geostationary Orbit (GEO)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="altitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Altitude (km)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                        disabled={isAnalysisRunning}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {orbitType !== "geo" && (
                <FormField
                  control={form.control}
                  name="inclination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inclination (degrees)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          disabled={isAnalysisRunning || orbitType === "sso"}
                        />
                      </FormControl>
                      {orbitType === "sso" && (
                        <FormDescription>
                          Auto-calculated for SSO based on altitude
                        </FormDescription>
                      )}
                    </FormItem>
                  )}
                />
              )}
              
              {(orbitType === "sso") && (
                <FormField
                  control={form.control}
                  name="ltan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local Time of Ascending Node</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isAnalysisRunning}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select LTAN" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10:30">10:30 AM (Morning)</SelectItem>
                          <SelectItem value="13:30">1:30 PM (Afternoon)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}
              
              {orbitType !== "sso" && orbitType !== "geo" && (
                <FormField
                  control={form.control}
                  name="raan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RAAN (degrees)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          disabled={isAnalysisRunning}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              
              {orbitType !== "geo" && (
                <>
                  <FormField
                    control={form.control}
                    name="argOfPerigee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Argument of Perigee (degrees)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            disabled={isAnalysisRunning}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="meanAnomaly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Mean Anomaly (degrees)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            disabled={isAnalysisRunning}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              {orbitType === "geo" && (
                <FormField
                  control={form.control}
                  name="subsatelliteLongitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-satellite Longitude (degrees East)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                          disabled={isAnalysisRunning}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="constellation">
            <AccordionTrigger>Constellation Geometry</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <FormField
                control={form.control}
                name="constellationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Constellation Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isAnalysisRunning}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select constellation type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single Satellite</SelectItem>
                        <SelectItem value="walker">Walker Star/Delta</SelectItem>
                        <SelectItem value="street">Street of Coverage (Train)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {constellationType === "walker" && (
                <>
                  <FormField
                    control={form.control}
                    name="totalSatellites"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Satellites (T)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            disabled={isAnalysisRunning}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="planes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Planes (P)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            disabled={isAnalysisRunning}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phasing"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phasing Parameter (F)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            disabled={isAnalysisRunning}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              {constellationType === "street" && (
                <>
                  <FormField
                    control={form.control}
                    name="trainSatellites"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Satellites in Train</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            disabled={isAnalysisRunning}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="spacingDegrees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>In-plane Spacing (degrees)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            disabled={isAnalysisRunning}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="payload">
            <AccordionTrigger>Payload Characteristics</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <FormField
                control={form.control}
                name="swathWidth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sensor Swath Width (km at nadir)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                        disabled={isAnalysisRunning}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="maxOffNadirAngle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Maximum Off-Nadir Pointing Angle (degrees)
                    </FormLabel>
                    <FormControl>
                      <div className="pt-2">
                        <Slider
                          min={0}
                          max={60}
                          step={1}
                          defaultValue={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                          disabled={isAnalysisRunning}
                        />
                        <div className="text-center mt-2">{field.value}°</div>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="analysis">
            <AccordionTrigger>Analysis Settings</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          disabled={isAnalysisRunning}
                        />
                      </FormControl>
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
                        <Input 
                          type="date" 
                          {...field} 
                          disabled={isAnalysisRunning}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="timeStep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Step (seconds)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                        disabled={isAnalysisRunning}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gridSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Global Grid Cell Size (degrees)</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(parseFloat(val))} 
                      defaultValue={field.value.toString()}
                      disabled={isAnalysisRunning}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grid size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.5">0.5° (~55km at equator)</SelectItem>
                        <SelectItem value="1">1.0° (~110km at equator)</SelectItem>
                        <SelectItem value="2">2.0° (~220km at equator)</SelectItem>
                        <SelectItem value="5">5.0° (~550km at equator)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={isAnalysisRunning}
        >
          {isAnalysisRunning ? "Analysis running..." : "Run Analysis"}
        </Button>
        
        {isAnalysisRunning && (
          <div className="space-y-2">
            <Progress value={Math.round(100 * (analysisProgress / 100))} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {Math.round(analysisProgress)}% complete
            </p>
          </div>
        )}
      </form>
    </Form>
  );
};

export default RevisitAnalysisForm;
