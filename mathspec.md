# Mathematical Specification for Satellite Optical Sensor System

## Table of Contents
1. [Overview](#overview)
2. [Orbital Mechanics](#orbital-mechanics)
3. [Coordinate Transformations](#coordinate-transformations)
4. [TLE Parsing and Orbit Propagation](#tle-parsing-and-orbit-propagation)
5. [Optical System Calculations](#optical-system-calculations)
6. [MTF Analysis](#mtf-analysis)
7. [PSF Analysis](#psf-analysis)
8. [Revisit Analysis](#revisit-analysis)
9. [Constants and Reference Systems](#constants-and-reference-systems)

---

## Overview

This document provides a comprehensive mathematical specification for the satellite optical sensor calculator, covering orbital mechanics, coordinate transformations, optical modeling, and revisit analysis. Each equation is referenced to specific implementation locations in the codebase.

## Orbital Mechanics

### 1. Basic Constants and Conversions

**File Reference**: `src/utils/orbitalUtils.ts` (lines 5-14)

```javascript
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const EARTH_RADIUS = 6371.0; // km
const EARTH_MU = 3.986004418e14; // m³/s²
```

**Angle Conversion Functions** (`src/utils/orbitalUtils.ts`, lines 16-28):

- **Degrees to Radians**: `θ_rad = θ_deg × π/180`
- **Radians to Degrees**: `θ_deg = θ_rad × 180/π`
- **Angle Normalization**: `θ_norm = θ mod 2π`

### 2. Kepler's Laws and Orbital Elements

**Orbital Period Calculation** (`src/utils/orbitalUtils.ts`, lines 186-371):

```
T = 2π × √(a³/μ)
```

Where:
- `T` = orbital period (seconds)
- `a` = semi-major axis (m)
- `μ` = Earth's gravitational parameter (3.986004418×10¹⁴ m³/s²)

**Semi-major Axis from Mean Motion** (`src/utils/tleParser.ts`, lines 65-67):

```
a = (μ/n²)^(1/3)
```

Where:
- `n` = mean motion (rad/s)
- Converted from revolutions per day: `n_rad/s = n_rev/day × 2π / 86400`

### 3. Classical Orbital Elements

**Keplerian Element Set** (used throughout orbital calculations):

- `a` = semi-major axis
- `e` = eccentricity  
- `i` = inclination
- `Ω` = right ascension of ascending node (RAAN)
- `ω` = argument of perigee
- `ν` = true anomaly

## Coordinate Transformations

### 1. Geodetic to ECEF Conversion

**File Reference**: `src/utils/orbitalUtils.ts` (lines 30-184)

**WGS84 Ellipsoid Parameters**:
```
a = 6378137.0 m      // Semi-major axis
f = 1/298.257223563  // Flattening
e² = 2f - f²         // First eccentricity squared
```

**Geodetic to ECEF** (`src/utils/orbitalUtils.ts`, lines 30-49):

```
N = a / √(1 - e² sin²φ)
X = (N + h) cos φ cos λ
Y = (N + h) cos φ sin λ  
Z = (N(1 - e²) + h) sin φ
```

Where:
- `φ` = geodetic latitude (rad)
- `λ` = geodetic longitude (rad)
- `h` = ellipsoidal height (m)
- `N` = prime vertical radius of curvature

### 2. ECEF to Geodetic Conversion

**File Reference**: `src/utils/orbitalUtils.ts` (lines 51-84)

Iterative algorithm using Bowring's method:

```
p = √(X² + Y²)
θ = arctan(Z·a / (p·b))
φ = arctan((Z + e'²·b·sin³θ) / (p - e²·a·cos³θ))
λ = arctan2(Y, X)
h = p/cos φ - N
```

Where:
- `b = a(1-f)` = semi-minor axis
- `e'² = (a² - b²)/b²` = second eccentricity squared

### 3. Rotation Matrices

**File Reference**: `src/utils/orbitalUtils.ts` (lines 86-122)

**Rotation about X-axis**:
```
Rx(θ) = [1    0      0   ]
        [0  cos θ -sin θ]
        [0  sin θ  cos θ]
```

**Rotation about Y-axis**:
```
Ry(θ) = [ cos θ  0  sin θ]
        [   0    1    0  ]
        [-sin θ  0  cos θ]
```

**Rotation about Z-axis**:
```
Rz(θ) = [cos θ -sin θ  0]
        [sin θ  cos θ  0]
        [  0      0    1]
```

### 4. ECI to ECEF Transformation

**File Reference**: `src/utils/orbitalUtils.ts` (lines 124-184)

**Earth Rotation**:
```
θ_GMST = Greenwich Mean Sidereal Time
R_ECEF = Rz(-θ_GMST) × R_ECI
```

**Satellite Position in ECI** (`src/utils/orbitalUtils.ts`, lines 124-155):

```
R_orbital = Rz(-Ω) × Rx(-i) × Rz(-ω) × r_perifocal
```

Where the perifocal position vector is:
```
r_perifocal = [a(cos E - e)]
              [a√(1-e²) sin E]
              [0            ]
```

And `E` is the eccentric anomaly related to true anomaly `ν` by:
```
cos E = (e + cos ν)/(1 + e cos ν)
```

## TLE Parsing and Orbit Propagation

### 1. Two-Line Element Format

**File Reference**: `src/utils/tleParser.ts` (lines 23-94)

**TLE Line 1 Fields**:
- Satellite number: columns 3-7
- Epoch year: columns 19-20
- Epoch day: columns 21-32

**TLE Line 2 Fields**:
- Inclination: columns 9-16 (degrees)
- RAAN: columns 18-25 (degrees)
- Eccentricity: columns 27-33 (decimal point assumed)
- Argument of perigee: columns 35-42 (degrees)
- Mean anomaly: columns 44-51 (degrees)
- Mean motion: columns 53-63 (rev/day)

### 2. Simplified General Perturbations (SGP4-like) Propagation

**File Reference**: `src/hooks/usePropagator.ts` (lines 49-127)

**Mean Motion to Semi-major Axis**:
```
n = meanMotion × 2π / 86400  // Convert rev/day to rad/s
a = (μ/n²)^(1/3)              // Semi-major axis in meters
```

**Kepler's Equation** (simplified, assuming circular orbit):
```
M = M₀ + n × t
E = M  // For e ≈ 0
ν = E  // True anomaly ≈ eccentric anomaly
```

**Position Calculation** (`src/hooks/usePropagator.ts`, lines 70-80):
```
r = a
x = r × cos(ν)
y = r × sin(ν)
z = 0
```

### 3. Ground Track Calculation

**File Reference**: `src/hooks/usePropagator.ts` (lines 81-100)

**Earth Rotation Correction**:
```
θ_earth = ω_earth × t
λ_ground = λ_satellite - θ_earth
```

Where `ω_earth = 7.2921159e-5` rad/s (Earth's rotation rate)

**Latitude/Longitude from ECI**:
```
φ = arcsin(z / |r|)
λ = arctan2(y, x) - θ_earth
```

## Optical System Calculations

### 1. Instantaneous Field of View (IFOV)

**File Reference**: `src/utils/sensorCalculations.ts` (lines 38-46)

```
IFOV = 10⁻³ × pixel_size(μm) / focal_length(mm)
```

Result in radians.

### 2. Field of View Calculations

**File Reference**: `src/utils/calculationUtils.ts` (lines 21-28)

**Horizontal/Vertical FOV**:
```
FOV_H = 2 × arctan(sensor_width_H / (2 × focal_length))
FOV_V = 2 × arctan(sensor_width_V / (2 × focal_length))
```

Where:
```
sensor_width_H = pixel_size × pixel_count_H / 1000  // in mm
sensor_width_V = pixel_size × pixel_count_V / 1000  // in mm
```

### 3. Ground Sample Distance (GSD)

**File Reference**: `src/utils/sensorCalculations.ts` (lines 66-81)

**Center Pixel Size** (updated formula):
```
GSD = R_earth × 1000 × [(arcsin(sin(θ + IFOV) × (1 + h/R_earth)) - θ - IFOV) - 
                        (arcsin(sin(θ) × (1 + h/R_earth)) - θ)]
```

Where:
- `θ` = off-nadir angle (rad)
- `h` = altitude (km)
- `R_earth` = 6378 km

### 4. Footprint Calculations

**File Reference**: `src/utils/sensorCalculations.ts` (lines 94-152)

**Horizontal Footprint**:
```
Footprint_H = R_earth × [(arcsin(sin(θ + FOV_H/2) × (1 + h/R_earth)) - θ - FOV_H/2) -
                         (arcsin(sin(θ - FOV_H/2) × (1 + h/R_earth)) - θ + FOV_H/2)]
```

**Vertical Footprint**: Similar formula with `FOV_V`

### 5. Attitude Error Propagation

**File Reference**: `src/utils/calculationUtils.ts` (lines 74-82)

**Error Components**:
```
Roll_error = h × sec²(θ) × σ_attitude
Pitch_error = h × sec(θ) × σ_attitude  
Yaw_error = h × sec(θ) × σ_attitude
```

**Root Sum Square (RSS) Error**:
```
RSS_error = √(Roll_error² + Pitch_error² + Yaw_error²)
```

Where:
- `sec(θ) = 1/cos(θ)`
- `σ_attitude` = attitude accuracy (rad)

## MTF Analysis

### 1. Modulation Transfer Function Components

**File Reference**: `src/utils/mtfCalculations.ts`

**Overall MTF** (lines 26-29):
```
MTF_overall(f) = MTF_optics(f) × MTF_detector(f) × MTF_motion(f)
```

### 2. Optics MTF

**File Reference**: `src/utils/mtfCalculations.ts` (lines 67-100)

**Diffraction-Limited Cutoff Frequency** (lines 76-77):
```
f_cutoff = D / (λ × F) / 1000  // cycles/mm
```

Where:
- `D` = aperture diameter (m)
- `λ` = wavelength (m)  
- `F` = focal length (m)

**Diffraction MTF** (lines 83-89):
```
MTF_diff(f) = (2/π) × [arccos(f/f_cutoff) - (f/f_cutoff) × √(1-(f/f_cutoff)²)]
```

For `f ≤ f_cutoff`, otherwise 0.

**Defocus MTF** (lines 102-117):
```
MTF_defocus(f) = |sin(πδf/λF²) / (πδf/λF²)|
```

Where:
- `δ` = defocus amount (m)
- `F` = f-number

**Atmospheric MTF** (lines 119-138):
```
MTF_atm(f) = exp(-(f/f_break)^(5/3))
```

Where:
```
r₀ = 0.98 / (seeing × 4.85×10⁻⁶)  // Fried parameter
f_break = r₀ / (2π) × 1000         // cycles/mm
```

### 3. Detector MTF

**File Reference**: `src/utils/mtfCalculations.ts` (lines 140-155)

**Pixel Aperture MTF** (lines 149-150):
```
MTF_pixel(f) = |sin(πf/f_pixel) / (πf/f_pixel)|
```

Where:
```
f_pixel = 1000 / pixel_size  // cycles/mm
```

### 4. Motion MTF

**File Reference**: `src/utils/mtfCalculations.ts` (lines 157-183)

**Ground Sample Distance**:
```
GSD = (h × pixel_size × 10⁻⁶) / (focal_length × 10⁻³)
```

**Motion Blur Distance**:
```
blur_distance = v_ground × t_integration
blur_pixels = blur_distance / GSD
```

**Motion MTF**:
```
MTF_motion(f) = |sin(πf × blur_pixels / f_pixel) / (πf × blur_pixels / f_pixel)|
```

### 5. MTF Performance Metrics

**MTF50** (lines 185-194): Frequency where MTF = 0.5
**Nyquist Frequency** (line 35): `f_nyquist = 1000 / (2 × pixel_size)`
**Sampling Efficiency** (lines 196-207): MTF value at Nyquist frequency

## PSF Analysis

### 1. Point Spread Function Calculations

**File Reference**: `src/utils/psfCalculations.ts`

### 2. Airy Disk Diameter

**File Reference**: `src/utils/psfCalculations.ts` (lines 25-26)

```
D_airy = 2.44 × λ × F / D  // First zero of Airy function
```

### 3. Diffraction-Limited FWHM

**File Reference**: `src/utils/psfCalculations.ts` (lines 28-29)

```
FWHM_diff = 1.22 × λ × F / D
```

### 4. Combined PSF FWHM

**File Reference**: `src/utils/psfCalculations.ts` (lines 32-42)

**Quadrature Sum**:
```
FWHM_total = √(FWHM_diff² + FWHM_atm² + FWHM_defocus²)
```

### 5. Strehl Ratio

**File Reference**: `src/utils/psfCalculations.ts` (lines 44-46)

```
Strehl = exp(-((2π × σ_wf / λ)²))
```

Where `σ_wf` is the wavefront error RMS.

### 6. Encircled Energy

**File Reference**: `src/utils/psfCalculations.ts` (lines 141-172)

**Gaussian Approximation**:
```
EE(r) = 1 - exp(-r² / (2σ²)) × 100%
```

Where `σ = FWHM / (2√(2ln(2)))`

## Revisit Analysis

### 1. Constellation Coverage

**File Reference**: `src/hooks/usePropagator.ts` (lines 129-287)

### 2. Ground Track Generation

**Orbit Propagation** (lines 70-100):
```
For each time step t:
  M = M₀ + n × t
  lat = arcsin(sin(i) × sin(ν + ω))
  lon = arctan2(cos(i), cos(ν + ω)) + Ω - ω_earth × t
```

### 3. Coverage Grid Analysis

**Grid Cell Coverage** (lines 200-250):
```
For each grid cell (lat_grid, lon_grid):
  For each satellite ground track point:
    distance = great_circle_distance(lat_grid, lon_grid, lat_sat, lon_sat)
    if distance ≤ swath_width/2:
      mark as covered
```

**Great Circle Distance** (`src/utils/orbitalUtils.ts`, lines 218-233):
```
d = R_earth × arccos(sin φ₁ sin φ₂ + cos φ₁ cos φ₂ cos(Δλ))
```

### 4. Revisit Statistics

**File Reference**: `src/hooks/usePropagator.ts` (lines 251-287)

**Revisit Time Calculations**:
- **Mean Revisit Time**: Average time between successive visits
- **Max Revisit Gap**: Maximum time between visits  
- **Coverage Percentage**: Fraction of grid cells visited
- **Temporal Statistics**: Min, max, standard deviation of revisit times

## Constants and Reference Systems

### 1. Physical Constants

```javascript
// Earth Parameters
EARTH_RADIUS = 6371.0 km          // Mean radius
EARTH_MU = 3.986004418e14 m³/s²   // Standard gravitational parameter  
EARTH_ROTATION_RATE = 7.2921159e-5 rad/s

// WGS84 Ellipsoid
WGS84_A = 6378137.0 m             // Semi-major axis
WGS84_F = 1/298.257223563         // Flattening
WGS84_E2 = 0.0066943799901        // First eccentricity squared

// Mathematical Constants  
PI = 3.14159265359
DEG_TO_RAD = PI / 180
RAD_TO_DEG = 180 / PI
```

### 2. Coordinate Systems

- **ECI** (Earth Centered Inertial): X-axis towards vernal equinox, Z-axis towards north pole
- **ECEF** (Earth Centered Earth Fixed): Rotates with Earth, X-axis towards 0° longitude
- **Geodetic**: Latitude, longitude, height above WGS84 ellipsoid
- **Perifocal**: Orbital plane with X-axis towards perigee

### 3. Time Systems

- **UTC**: Coordinated Universal Time
- **GMST**: Greenwich Mean Sidereal Time for Earth rotation
- **Epoch**: TLE reference time for orbital elements

---

This mathematical specification provides the complete theoretical foundation for understanding the satellite optical sensor system calculations implemented in this codebase. Each formula corresponds to specific implementation details that can be found at the referenced file locations and line numbers.