
# Satellite Optical Sensor Calculator

![Satellite Optical Sensor Calculator](https://source.unsplash.com/photo-1531297484001-80022131f5a1)

## Overview

A comprehensive tool designed specifically for satellite engineers and mission planners to calculate critical optical sensor parameters. This calculator helps optimize sensor configurations for earth observation satellites, remote sensing platforms, and other orbital imaging systems.

The calculator addresses key challenges in satellite optical system design:
- Computing optimal Ground Sample Distance (GSD) based on orbital parameters
- Determining field of view coverage for different sensor configurations
- Calculating swath width and imaging footprint dimensions 
- Optimizing sensor resolution based on mission altitude and objectives

![Calculator Interface](https://source.unsplash.com/photo-1488590528505-98d2b5aba04b)

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

![Visualization Example](https://source.unsplash.com/photo-1486312338219-ce68d2c6f44d)

## Satellite Calculations Explained

The calculator performs several important satellite-specific calculations:

### Ground Sample Distance (GSD)
GSD defines the distance between pixel centers as measured on the ground. For satellites, this is a crucial parameter that determines the spatial resolution of images:

`GSD = (pixel size × height) ÷ focal length`

### Field of View (FOV)
The angular extent of the observable area:

`FOV = 2 × arctan((sensor size) ÷ (2 × focal length))`

### Swath Width
The width of the area on Earth's surface that a satellite sensor can image in a single pass:

`Swath Width = 2 × height × tan(FOV ÷ 2)`

### Imaging Footprint
The area covered by a single satellite image on Earth's surface.

For understanding differences between pushbroom and frame sensors, the calculator includes specialized parameters for each sensor type.

![Code Example](https://source.unsplash.com/photo-1461749280684-dccba630e2f6)

## Technologies Used

This project is built with modern web technologies:

- **[Vite](https://vitejs.dev/)** - Fast, modern frontend build tool
- **[React](https://reactjs.org/)** - UI component library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Three.js](https://threejs.org/)** - 3D visualization library
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautifully designed components
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React Query](https://tanstack.com/query/latest)** - Data fetching and state management

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Three.js community for 3D visualization examples
- Unsplash for stock photography
- shadcn/ui for beautiful UI components
