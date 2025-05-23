
# Satellite Optical Sensor Calculator

Website: [opticalsatellitetools.space](https://opticalsatellitetools.space/?forceHideBadge=true)

![Alt Text](flow.gif)

## Overview

A comprehensive tool designed specifically for satellite engineers and mission planners to calculate critical optical sensor parameters. This calculator helps optimize sensor configurations for earth observation satellites, remote sensing platforms, and other orbital imaging systems.

The calculator addresses key challenges in satellite optical system design:
- Computing optimal Ground Sample Distance (GSD) based on orbital parameters
- Determining field of view coverage for different sensor configurations
- Calculating swath width and imaging footprint dimensions
- Optimizing sensor resolution based on mission altitude and objectives
- Analysis of geo-position errors due to attitude knowledge errors and position errors

## Features

- Interactive 3D visualization of satellite sensor field coverage
- Real-time calculation of optical parameters
- Georeferencing error analysis
- Customizable satellite model upload
- Location-based visualization
- Shareable calculation results

## Getting Started

### Prerequisites

- Node.js 18+ & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

Follow these steps:

```sh
# Step 1: Clone the repository
git clone https://github.com/chandrabhraman/optical-satelite-calculator.git

# Step 2: Navigate to the project directory
cd optical-satelite-calculator

# Step 3: Install the necessary dependencies
npm install

# Step 4: Start the development server
npm run dev
```

The application will be available at `http://localhost:5173` by default.

## Usage Guide

1. Enter your satellite sensor specifications in the form
2. Click "Calculate" to generate results
3. View the interactive 3D visualization to understand sensor coverage
4. Use the "Share Results" button to generate a shareable link

## Keywords

satellite optical sensor, GSD calculator, ground sample distance, satellite imaging, earth observation, remote sensing, sensor field coverage, satellite engineering, orbital parameters, sensor footprint, satellite visualization
