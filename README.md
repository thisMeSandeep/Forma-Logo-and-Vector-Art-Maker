# Forma Studio

A modern, web-based vector design studio built with React and TypeScript. Create, edit, and export vector graphics with an intuitive interface and powerful design tools.

![Forma Studio Screenshot](./public/screenshot.png)

## Features

- **Drawing Tools** - Draw freehand shapes, cut/subtract paths, and add text
- **Grid System** - Snap to grid for precise alignment and design consistency
- **Rich Styling** - Customize fill colors, stroke styles, width, and border radius
- **SVG & PNG Export** - Export your designs in multiple formats
- **History Management** - Undo/redo support for non-destructive editing
- **Responsive UI** - Beautiful, intuitive interface with light/dark mode support
- **Keyboard Shortcuts** - Quick access to tools and common actions
- **Sidebar Properties** - Real-time property editing with live preview

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd gridmark
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:prod` - Production-optimized build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix linting issues
- `npm run preview` - Preview production build
- `npm run preview:prod` - Preview production build with public access
- `npm run type-check` - Type checking without build
- `npm run analyze` - Analyze bundle size

## Deployment

Forma is optimized for professional deployment with comprehensive SEO and security configurations.

### Quick Start

1. **Build for production:**

   ```bash
   npm run build:prod
   ```

2. **Preview production build locally:**

   ```bash
   npm run preview:prod
   ```

3. **Deploy to your platform:**
   - **Netlify**: Push to Git - automatic deployment via `netlify.toml`
   - **Vercel**: Push to Git - automatic deployment via `vercel.json`
   - **Other platforms**: Upload `dist/` folder generated from build

### Deployment Platforms

#### Netlify

```bash
# Push to Netlify-connected repository
git push origin main
```

- Automatic builds and deploys
- Free SSL/TLS certificates
- CDN included
- See `netlify.toml` for configuration

#### Vercel

```bash
# Push to Vercel-connected repository
git push origin main
```

- Automatic builds and deploys
- Free SSL/TLS certificates
- Edge network included
- See `vercel.json` for configuration

#### Self-Hosted

```bash
npm run build:prod
# Upload dist/ folder to your server
# Configure web server for SPA routing
```

### SEO & Performance

The application includes:

- ✅ Comprehensive meta tags (keywords, description, OpenGraph)
- ✅ JSON-LD structured data for rich snippets
- ✅ XML sitemap at `/sitemap.xml`
- ✅ robots.txt for search engine crawling
- ✅ PWA manifest for installation
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ Optimized caching strategies
- ✅ Code splitting and lazy loading
- ✅ Minified production builds

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment guide.
See [SECURITY.md](./SECURITY.md) for security headers and best practices.

### Environment Variables

Create `.env.production` (not committed to Git):

```
VITE_APP_ENV=production
VITE_APP_URL=https://forma.app
VITE_ENABLE_ANALYTICS=true
```

See `.env.example` for all available variables.

## Tech Stack

- **Frontend Framework** - React 19 with TypeScript
- **Styling** - Tailwind CSS 4 with custom animations
- **Build Tool** - Vite
- **UI Components** - Base UI, Radix UI, Shadcn
- **State Management** - Zustand
- **Vector Operations** - Polygon Clipping
- **Icons** - Lucide React
- **Color Picker** - React Colorful
- **Charting** - Recharts
- **Notifications** - Sonner

## Project Structure

```
src/
├── components/
│   ├── canvas/       # Drawing canvas and overlay
│   ├── toolbar/      # Top bar, tools, and history
│   └── sidebar/      # Properties and settings panel
├── hooks/            # Custom React hooks
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## Development

This project uses:

- **TypeScript** for type safety
- **ESLint** for code quality
- **Tailwind CSS** for responsive styling
- **Vite** for fast development and builds

### Performance Targets

- Lighthouse Performance: > 90
- Lighthouse SEO: 100
- Lighthouse Accessibility: > 90
- Lighthouse Best Practices: > 90

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ by Sandeep Singh
