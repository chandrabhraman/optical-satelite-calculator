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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { parseTLE, calculateLTAN, calculateGEOLongitude } from "@/utils/tleParser";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Satellite, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CelestrakSatelliteSelector from "./CelestrakSatelliteSelector";
import { CelestrakSatellite } from "@/utils/celestrakApi";

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
      
      // TLE input
      tleInput: "",
      
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
      
      // Daytime filter defaults
      onlyDaytimeRevisit: false,
      localDaytimeStart: 1000,
      localDaytimeEnd: 1700,
    }
  });

  // Dynamic form state
  const [orbitType, setOrbitType] = useState("sso");
  const [constellationType, setConstellationType] = useState("single");
  const [tleError, setTleError] = useState<string | null>(null);
  const [tleParsedData, setTleParsedData] = useState<any>(null);
  const [useTLE, setUseTLE] = useState(false);
  
  // Celestrak workflow state
  const [workflowMode, setWorkflowMode] = useState<"manual" | "celestrak">("manual");
  const [selectedCelestrakSatellites, setSelectedCelestrakSatellites] = useState<CelestrakSatellite[]>([]);
  
  // Update inclination default when orbit type changes
  React.useEffect(() => {
    if (orbitType === "geo") {
      form.setValue("inclination", 0);
    } else if (orbitType === "sso") {
      form.setValue("inclination", 97.6);
    }
  }, [orbitType, form]);

  // Handle TLE parsing and auto-populate fields
  const handleTLEParse = (tleInput: string) => {
    setTleError(null);
    
    if (!tleInput.trim()) {
      return;
    }

    try {
      const tleData = parseTLE(tleInput);
      const { parsed } = tleData;

      // Store full precision values for calculations
      setTleParsedData(parsed);

      // Set display fields with rounded values
      form.setValue("altitude", Math.round(parsed.altitude));
      form.setValue("inclination", Number(parsed.inclination.toFixed(2)));
      form.setValue("argOfPerigee", Number(parsed.argOfPerigee.toFixed(2)));
      form.setValue("meanAnomaly", Number(parsed.meanAnomaly.toFixed(2)));

      // Set orbit-specific fields based on orbit type
      if (orbitType === "sso") {
        const ltan = calculateLTAN(parsed.raan, parsed.epochYear, parsed.epochDay);
        form.setValue("ltan", ltan);
      } else if (orbitType === "leo") {
        form.setValue("raan", Number(parsed.raan.toFixed(2)));
      } else if (orbitType === "geo") {
        const longitude = calculateGEOLongitude(parsed.raan, parsed.argOfPerigee, parsed.meanAnomaly, parsed.altitude, parsed.epochYear, parsed.epochDay, parsed.eccentricity, parsed.inclination);
        form.setValue("longitudeGEO", Number(longitude.toFixed(2)));
      }
    } catch (error) {
      setTleError(error.message);
      setTleParsedData(null);
    }
  };
  
  // Submit handler
  const onSubmit = (data: any) => {
    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Form submitted with data:", data);
    console.log("Workflow mode:", workflowMode);
    
    // Handle Celestrak workflow
    if (workflowMode === "celestrak") {
      if (selectedCelestrakSatellites.length === 0) {
        console.error("No satellites selected from Celestrak");
        return;
      }
      
      // Build TLE data for all selected satellites
      const tleData = selectedCelestrakSatellites.map(sat => ({
        name: sat.name,
        tle: `${sat.name}\n${sat.line1}\n${sat.line2}`,
        line1: sat.line1,
        line2: sat.line2,
        noradId: sat.noradId,
      }));
      
      data.celestrakSatellites = tleData;
      data.constellationType = "celestrak";
      data.totalSatellites = selectedCelestrakSatellites.length;
      data.hasTLE = true;
      
      console.log("Using Celestrak satellites:", tleData.length);
      onRunAnalysis(data);
      return;
    }
    
    // Use full precision TLE values for calculations if available (manual mode)
    if (tleParsedData) {
      data.altitude = tleParsedData.altitude;
      data.inclination = tleParsedData.inclination;
      data.argOfPerigee = tleParsedData.argOfPerigee;
      data.meanAnomaly = tleParsedData.meanAnomaly;
      data.raan = tleParsedData.raan;
      data.eccentricity = tleParsedData.eccentricity;
      data.hasTLE = true;
      console.log("Using full precision TLE values for calculations");
    } else {
      data.hasTLE = false;
      data.eccentricity = 0; // Default for manual entries
      console.log("Using manual orbital parameters");
    }
    
    console.log("Total satellites:", data.totalSatellites);
    console.log("Constellation type:", data.constellationType);
    console.log("Grid cell size:", data.gridCellSize);
    
    // Warn about performance for super high resolution
    if (data.gridCellSize === "0.01deg") {
      console.warn("Super high resolution grid selected - this may take longer to calculate");
    }
    
    console.log("Calling onRunAnalysis...");
    onRunAnalysis(data);
    console.log("onRunAnalysis called");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Workflow Mode Toggle */}
        <Tabs value={workflowMode} onValueChange={(v) => setWorkflowMode(v as "manual" | "celestrak")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manual Input
            </TabsTrigger>
            <TabsTrigger value="celestrak" className="flex items-center gap-2">
              <Satellite className="h-4 w-4" />
              Filter by Constellation
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="celestrak" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Search and select active satellites from Celestrak's database. Filter by constellation name (e.g., FLOCK, STARLINK, SENTINEL) to find satellites.
              </p>
              <CelestrakSatelliteSelector
                selectedSatellites={selectedCelestrakSatellites}
                onSatellitesSelected={setSelectedCelestrakSatellites}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="manual" className="mt-4">
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
              
              {/* TLE Input for Single Satellite */}
              {constellationType === "single" && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id="useTLE"
                      checked={useTLE}
                      onCheckedChange={(checked) => setUseTLE(checked === true)}
                    />
                    <label htmlFor="useTLE" className="text-sm font-medium">
                      Use TLE Input (Optional)
                    </label>
                  </div>
                  
                  <Collapsible open={useTLE}>
                    <CollapsibleContent>
                      <FormField
                    control={form.control}
                    name="tleInput"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="ISS (ZARYA)&#10;1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927&#10;2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537"
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              handleTLEParse(e.target.value);
                            }}
                            rows={4}
                            className="font-mono text-sm"
                          />
                        </FormControl>
                        <FormDescription>
                          Paste Three-line TLE data (satellite name + 2 data lines) to auto-populate orbital parameters
                        </FormDescription>
                        {tleError && (
                          <div className="text-sm text-red-600 mt-1">
                            Error: {tleError}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
          
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
                      <SelectItem value="0.01deg">0.01° × 0.01° (Super high resolution)</SelectItem>
                      <SelectItem value="0.5deg">0.5° × 0.5° (High resolution)</SelectItem>
                      <SelectItem value="1deg">1° × 1° (Standard)</SelectItem>
                      <SelectItem value="2deg">2° × 2° (Fast calculation)</SelectItem>
                      <SelectItem value="5deg">5° × 5° (Rough estimate)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Resolution of analysis grid. Super high resolution may take significantly longer.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Daytime Filter */}
          <div className="mt-4 p-4 border border-border rounded-lg">
            <FormField
              control={form.control}
              name="onlyDaytimeRevisit"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Only Daytime Revisit</FormLabel>
                    <FormDescription>
                      Filter revisits to only count observations during local daytime
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {form.watch("onlyDaytimeRevisit") && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="localDaytimeStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local Daytime Start</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          placeholder="1000"
                          min={0}
                          max={2359}
                        />
                      </FormControl>
                      <FormDescription>24h format (e.g., 1000 = 10:00 AM)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="localDaytimeEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local Daytime End</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          placeholder="1700"
                          min={0}
                          max={2359}
                        />
                      </FormControl>
                      <FormDescription>24h format (e.g., 1700 = 5:00 PM)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
          
        </div>
          </TabsContent>
        </Tabs>
        
        {/* Payload Parameters - shared between modes */}
        {workflowMode === "celestrak" && selectedCelestrakSatellites.length > 0 && (
          <>
            <Separator />
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
                          <SelectItem value="0.01deg">0.01° × 0.01° (Super high resolution)</SelectItem>
                          <SelectItem value="0.5deg">0.5° × 0.5° (High resolution)</SelectItem>
                          <SelectItem value="1deg">1° × 1° (Standard)</SelectItem>
                          <SelectItem value="2deg">2° × 2° (Fast calculation)</SelectItem>
                          <SelectItem value="5deg">5° × 5° (Rough estimate)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Resolution of analysis grid. Super high resolution may take significantly longer.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Daytime Filter for Celestrak mode */}
              <div className="mt-4 p-4 border border-border rounded-lg">
                <FormField
                  control={form.control}
                  name="onlyDaytimeRevisit"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Only Daytime Revisit</FormLabel>
                        <FormDescription>
                          Filter revisits to only count observations during local daytime
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                {form.watch("onlyDaytimeRevisit") && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="localDaytimeStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Local Daytime Start</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              placeholder="1000"
                              min={0}
                              max={2359}
                            />
                          </FormControl>
                          <FormDescription>24h format (e.g., 1000 = 10:00 AM)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="localDaytimeEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Local Daytime End</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              placeholder="1700"
                              min={0}
                              max={2359}
                            />
                          </FormControl>
                          <FormDescription>24h format (e.g., 1700 = 5:00 PM)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        
        {/* Submit Button */}
        <div className="mt-6">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isAnalysisRunning || (workflowMode === "celestrak" && selectedCelestrakSatellites.length === 0)}
          >
            {isAnalysisRunning 
              ? "Running Analysis..." 
              : workflowMode === "celestrak" 
                ? `Run Analysis (${selectedCelestrakSatellites.length} satellites)`
                : "Run Analysis"
            }
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
