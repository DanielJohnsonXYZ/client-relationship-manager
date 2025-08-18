# ClientTrust Dashboard

A comprehensive SaaS platform to help freelancers and small agencies build stronger client relationships through AI-powered communication analysis and insights.

## Features

- 🔐 **Authentication System** - Secure user registration and login with Supabase Auth
- 📊 **Dashboard Overview** - Real-time metrics and client health monitoring
- 👥 **Client Management** - Complete CRUD operations for client data
- 📈 **Analytics** - Charts and trends for communication patterns and revenue
- 🚨 **Smart Alerts** - Proactive notifications for payment risks and opportunities
- 💡 **AI Insights** - Intelligent recommendations for improving client relationships
- ⚙️ **Settings** - Profile management, notifications, and integrations
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Chart.js with React Chart.js 2
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free)

### 1. Clone and Install

\`\`\`bash
git clone <your-repo-url>
cd clienttrust-dashboard
npm install
\`\`\`

### 2. Environment Setup

Copy the environment variables:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Update `.env.local` with your Supabase credentials:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_SECRET=your_generated_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the schema from \`supabase/schema.sql\`

### 4. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run test\` - Run tests
- \`npm run test:watch\` - Run tests in watch mode
- \`npm run type-check\` - Run TypeScript checks

## Project Structure

\`\`\`
clienttrust-dashboard/
├── src/
│   ├── app/                    # App router pages
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard page
│   │   ├── clients/           # Client management
│   │   ├── analytics/         # Analytics page
│   │   ├── alerts/            # Alerts page
│   │   ├── insights/          # AI insights page
│   │   ├── settings/          # Settings page
│   │   ├── login/            # Authentication pages
│   │   └── signup/
│   ├── components/            # Reusable components
│   │   ├── auth/             # Auth components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── clients/          # Client components
│   │   ├── analytics/        # Chart components
│   │   ├── alerts/           # Alert components
│   │   ├── insights/         # Insight components
│   │   ├── settings/         # Settings components
│   │   ├── layout/           # Layout components
│   │   └── ui/               # UI primitives
│   └── lib/                  # Utilities and configs
│       ├── supabase.ts       # Supabase client
│       ├── auth-context.tsx  # Auth context
│       └── utils.ts          # Utility functions
├── supabase/
│   └── schema.sql            # Database schema
└── ...config files
\`\`\`

## Deployment

### Deploy to Vercel (Recommended)

1. **Connect to Vercel**:
   \`\`\`bash
   npm install -g vercel
   vercel login
   vercel
   \`\`\`

2. **Set Environment Variables** in Vercel dashboard:
   - \`NEXT_PUBLIC_SUPABASE_URL\`
   - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
   - \`SUPABASE_SERVICE_ROLE_KEY\`
   - \`NEXTAUTH_SECRET\`
   - \`NEXT_PUBLIC_APP_URL\` (your production URL)

3. **Deploy**:
   \`\`\`bash
   vercel --prod
   \`\`\`

### Other Deployment Options

- **Netlify**: Works with build command \`npm run build\`
- **Railway**: Connect GitHub and deploy automatically
- **DigitalOcean App Platform**: Deploy with GitHub integration

## Development Features

### Mock Data & AI Simulation

This demo includes:
- **Mock AI Insights**: Simulated AI-generated insights and recommendations
- **Mock Integrations**: Placeholder integrations for Gmail, Slack, Zoom, etc.
- **Sample Data**: Pre-populated alerts, analytics, and client health scores

### Real Production Integration

To connect real services:

1. **Email Integration**: Connect Gmail API for email analysis
2. **Communication Platforms**: Slack, Microsoft Teams APIs
3. **Calendar Integration**: Google Calendar, Outlook APIs
4. **Payment Systems**: Stripe, PayPal webhooks
5. **AI Services**: OpenAI GPT-4, Claude API for sentiment analysis

## Testing

Run the test suite:

\`\`\`bash
npm test
\`\`\`

Coverage report:

\`\`\`bash
npm run test -- --coverage
\`\`\`

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@clienttrust.dev or join our [Discord community](https://discord.gg/clienttrust).

---

**Built with ❤️ for better client relationships**