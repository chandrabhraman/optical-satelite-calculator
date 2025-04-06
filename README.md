
# Satellite Optical Sensor Calculator

![Satellite Optical Sensor Calculator](https://source.unsplash.com/photo-1531297484001-80022131f5a1)

## Overview

A comprehensive tool to calculate optical sensor parameters and visualize sensor field coverage for satellite applications. This calculator helps satellite engineers and designers optimize their optical sensor configurations based on mission requirements.

### Key Features

- Calculate Ground Sample Distance (GSD), field of view, and other critical sensor parameters
- Interactive 3D visualization of satellite coverage and sensor field of view
- Sharable calculation results via URL parameters
- Real-time parameter updates and calculations

![Calculator Interface](https://source.unsplash.com/photo-1488590528505-98d2b5aba04b)

## Getting Started

### Prerequisites

- Node.js 18+ & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

Clone the repository and install dependencies:

```sh
# Step 1: Clone the repository
git clone https://github.com/chandrabhraman/orb-eye-view-calc.git

# Step 2: Navigate to the project directory
cd orb-eye-view-calc

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

## Technologies Used

This project is built with modern web technologies:

- **[Vite](https://vitejs.dev/)** - Fast, modern frontend build tool
- **[React](https://reactjs.org/)** - UI component library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Three.js](https://threejs.org/)** - 3D visualization library
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautifully designed components
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React Query](https://tanstack.com/query/latest)** - Data fetching and state management

## Development

### Project Structure

```
satellite-optical-sensor-calculator/
├── public/                  # Static assets and 3D models
│   └── models/              # 3D satellite models
├── src/
│   ├── components/          # React components
│   │   └── ui/              # UI component library
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   ├── pages/               # Page components
│   └── utils/               # Helper functions
│       ├── calculationUtils.ts  # Calculation utilities
│       └── types.ts         # TypeScript type definitions
└── ...
```

### Customization

- Add custom satellite models by placing GLB files in `/public/models/`
- Modify calculation parameters in `src/utils/calculationUtils.ts`
- Customize visualization settings in `src/components/SatelliteVisualization.tsx`

![Code Example](https://source.unsplash.com/photo-1461749280684-dccba630e2f6)

## Deployment

### Publishing Your Site

This project can be deployed to any static site hosting service:

1. Build the production version:
   ```sh
   npm run build
   ```

2. The output files will be in the `dist` directory, ready to deploy to Netlify, Vercel, GitHub Pages, or any other hosting service.

### Custom Domain Setup

To connect a custom domain:

1. Configure DNS settings with your domain provider
2. Set up the domain in your hosting provider's dashboard
3. Update the `sitemap.xml` and `robots.txt` files with your domain

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Three.js community for 3D visualization examples
- Unsplash for stock photography
- shadcn/ui for beautiful UI components
