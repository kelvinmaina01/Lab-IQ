# Lab-IQ 🧪

> **AI-Powered Laboratory Research & Data Analysis Platform**

Lab-IQ is a comprehensive, full-stack SaaS platform designed to revolutionize laboratory research workflows through intelligent data analysis, real-time collaboration, and AI-powered insights. Built with modern web technologies and powered by Google Gemini AI.

![Lab-IQ Platform](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg?logo=supabase)

---

## 🌟 Features

### 🎨 **Comprehensive UI Component Library**
- **30+ Reusable Components** built on [Radix UI](https://www.radix-ui.com/) primitives
- Components include: Sidebar, Menubar, Dropdown, Context Menu, Carousel, Dialog, Toast, Tabs, and more
- Fully accessible (ARIA-compliant) and keyboard navigable
- Customizable with Tailwind CSS utility classes

### 🤖 **AI-Powered Intelligence**
- **Streaming Chat Assistant** powered by Google Gemini
- **Multiple Analysis Modes**:
  - 📊 **Analysis Mode**: Deep data insights and pattern recognition
  - 🤖 **AutoML Mode**: Automated machine learning model suggestions
  - 🎓 **Educator Mode**: Interactive learning and explanations
- **Workflow Bottleneck Detection**: Identifies inefficiencies in research processes
- Real-time AI responses with streaming support

### 📊 **Data Visualization & Analytics**
- Interactive charts using [Recharts](https://recharts.org/)
- Chart types: Line, Bar, Pie, Area, Composed
- Real-time performance metrics and analytics
- Customizable dashboards with drag-and-drop widgets

### 📁 **Data Ingestion Hub**
- **Multiple Upload Methods**:
  - 📤 File Upload (CSV, Excel, JSON, XML)
  - 📡 Live Device Streams (IoT integration)
  - ☁️ Cloud Data Sources (AWS, Google Cloud, Azure)
  - 📚 Dataset Registry with version control
- Drag-and-drop validation
- Automatic data type detection and schema inference

### 🔬 **Laboratory Management**
- **Experiments Tracking**: Organize and monitor research experiments
- **Automation Workflows**: Schedule and automate repetitive tasks
- **Reports Generation**: Automated report creation with AI insights
- **Insights Dashboard**: Centralized view of key metrics and findings

### 👥 **Team Collaboration**
- Real-time chat panels with threaded conversations
- Comments and annotations on datasets and experiments
- Action assignments and task tracking
- Email notifications for team updates
- Version history and change tracking (Pro tier)

### 💎 **Subscription-Based Feature Gating**
- **Free Tier**: Basic features and limited uploads
- **Pro Tier** unlocks:
  - 📱 Multiple device streams (up to 10 concurrent)
  - 📋 Experiment templates library
  - 💬 Real-time chat collaboration
  - 🕐 Version history and rollback
  - 🚀 Priority AI processing
  - 📊 Advanced analytics and custom reports

### 🎨 **Design System**
- **Light/Dark Mode** support with smooth transitions
- HSL color variables for consistent theming
- Responsive mobile-first design
- Modern typography with Inter font family
- Glassmorphism and gradient effects

---

## 🏗️ Architecture

### **Frontend Stack**
- **React 18.3** with TypeScript
- **Vite** for blazing-fast development
- **Tailwind CSS** for utility-first styling
- **Radix UI** for accessible component primitives
- **React Router** for client-side routing
- **Recharts** for data visualization
- **Lucide React** for beautiful icons

### **Backend Stack**
- **Supabase** for backend-as-a-service
  - PostgreSQL database
  - Auto-generated TypeScript types
  - Row-level security (RLS)
  - Real-time subscriptions
- **Supabase Edge Functions** (5+ serverless functions):
  - AI Analysis Function
  - Bottleneck Detection
  - Email Notifications
  - Data Processing Pipeline
  - Report Generation

### **AI Integration**
- **Google Gemini API** for natural language processing
- Streaming responses for real-time interaction
- Context-aware conversations
- Multi-modal analysis (text, data, images)

---

## 📂 Project Structure

```
Lab-IQ/
├── src/
│   ├── components/
│   │   ├── ui/              # 30+ reusable UI components
│   │   ├── layout/          # Layout components (Sidebar, Header)
│   │   ├── charts/          # Chart components (Recharts wrappers)
│   │   └── features/        # Feature-specific components
│   ├── pages/
│   │   ├── Landing.tsx      # Marketing landing page
│   │   ├── Dashboard.tsx    # Main analytics dashboard
│   │   ├── Upload.tsx       # Data ingestion hub
│   │   ├── Reports.tsx      # Reports management
│   │   ├── Insights.tsx     # AI-powered insights
│   │   ├── Experiments.tsx  # Experiment tracking
│   │   ├── Automation.tsx   # Workflow automation
│   │   ├── Collaboration.tsx # Team collaboration
│   │   └── Assistant.tsx    # AI chat assistant
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client setup
│   │   ├── gemini.ts        # Google Gemini integration
│   │   └── utils.ts         # Utility functions
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   ├── styles/              # Global styles and themes
│   └── App.tsx              # Main application component
├── supabase/
│   ├── functions/           # Edge functions
│   ├── migrations/          # Database migrations
│   └── schema.sql           # Database schema
├── public/                  # Static assets
└── package.json
```

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and npm/yarn/pnpm
- Supabase account ([sign up here](https://supabase.com))
- Google Gemini API key ([get one here](https://ai.google.dev))

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/kelvinmaina01/Lab-IQ.git
   cd Lab-IQ
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Set up Supabase**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Link to your project
   supabase link --project-ref your-project-ref
   
   # Run migrations
   supabase db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:5173`

---

## 📊 Database Schema

### **Core Tables**

- **users**: User profiles and authentication
- **experiments**: Research experiments tracking
- **datasets**: Uploaded data and metadata
- **reports**: Generated reports and insights
- **chat_messages**: AI assistant conversation history
- **collaborations**: Team collaboration records
- **subscriptions**: User subscription tiers
- **device_streams**: IoT device connections
- **notifications**: User notifications queue

### **Type Safety**

Auto-generated TypeScript types from Supabase schema:
```typescript
import { Database } from './types/supabase'

type Experiment = Database['public']['Tables']['experiments']['Row']
type Dataset = Database['public']['Tables']['datasets']['Row']
```

---

## 🎯 Key Pages

| Page | Route | Description |
|------|-------|-------------|
| **Landing** | `/` | Marketing page with features and pricing |
| **Dashboard** | `/dashboard` | Main analytics and metrics overview |
| **Upload** | `/upload` | Data ingestion hub with multiple sources |
| **Reports** | `/reports` | View and generate research reports |
| **Insights** | `/insights` | AI-powered data insights |
| **Experiments** | `/experiments` | Manage laboratory experiments |
| **Automation** | `/automation` | Workflow automation builder |
| **Collaboration** | `/collaboration` | Team chat and collaboration |
| **Assistant** | `/assistant` | AI chat assistant interface |

---

## 🔐 Authentication & Authorization

- **Supabase Auth** with email/password and OAuth providers
- **Row-Level Security (RLS)** for data protection
- **Role-Based Access Control (RBAC)**:
  - Admin: Full platform access
  - Researcher: Experiment and data management
  - Viewer: Read-only access
- **Subscription-based feature gating** with Pro tier checks

---

## 🎨 Theming & Customization

### **Color System**

HSL color variables defined in `src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  /* ... and more */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode variants */
}
```

### **Component Customization**

All components accept `className` prop for Tailwind utilities:

```tsx
<Button className="bg-gradient-to-r from-blue-500 to-purple-600">
  Custom Styled Button
</Button>
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**

- Follow the existing code style (ESLint + Prettier)
- Write TypeScript with strict type checking
- Add tests for new features
- Update documentation as needed
- Ensure all components are accessible (ARIA)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Radix UI](https://www.radix-ui.com/) for accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Supabase](https://supabase.com/) for backend infrastructure
- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [Recharts](https://recharts.org/) for data visualization
- [Lucide](https://lucide.dev/) for beautiful icons

---

## 📧 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/kelvinmaina01/Lab-IQ/issues)
- **Email**: support@labiq.com
- **Documentation**: [docs.labiq.com](https://docs.labiq.com)
- **Community Discord**: [Join our community](https://discord.gg/labiq)

---

## 🗺️ Roadmap

### **Q1 2026**
- [ ] Mobile app (React Native)
- [ ] Advanced ML model training interface
- [ ] Integration with popular lab equipment APIs
- [ ] Multi-language support (i18n)

### **Q2 2026**
- [ ] Jupyter Notebook integration
- [ ] Custom workflow builder (visual programming)
- [ ] Advanced team permissions and roles
- [ ] API marketplace for third-party integrations

### **Q3 2026**
- [ ] On-premise deployment option
- [ ] Advanced data governance and compliance tools
- [ ] White-label solution for enterprises
- [ ] Mobile-first redesign

---

<div align="center">

**Built by the Lab-IQ Team**

⭐ Star us on GitHub if you find this project useful!

[Website](https://labiq.com) • [Documentation](https://docs.labiq.com) • [Blog](https://blog.labiq.com)

</div>
