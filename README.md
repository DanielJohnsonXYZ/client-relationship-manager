# ClientTrust Dashboard - Live SaaS Platform

A comprehensive client relationship management platform with real-time integrations and automated workflow tracking.

## Quick Start

1. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase and OAuth credentials
   ```

2. **Database Setup**
   - Run the SQL scripts in `supabase/` folder in your Supabase dashboard
   - Execute `spark-shipping-setup.sql` (replace YOUR_USER_ID_HERE with your actual user ID)

3. **Gmail Integration Setup**
   - Follow the detailed guide in `GOOGLE_OAUTH_SETUP.md`
   - Configure Google OAuth credentials
   - Enable Gmail API

4. **Run Development Server**
   ```bash
   npm install
   npm run dev
   ```

## Features

- **Client Management**: Track client health scores, revenue, and contact history
- **Gmail Integration**: Automatically sync email communications with client records  
- **Activity Timeline**: View all client interactions in chronological order
- **Smart Alerts**: Get notified of opportunities, risks, and follow-up needs
- **Analytics Dashboard**: Visualize client health trends and communication patterns
- **Real Client Example**: Spark Shipping client pre-configured with realistic data

## Sample Data

The platform includes Spark Shipping as a real client example with:
- Contact information and company details
- Communication history with positive sentiment
- High health score (88/100) 
- Revenue tracking ($45,000)
- Opportunity alerts for expansion

## Integrations

- ✅ **Gmail**: Full OAuth integration with email sync
- 🔄 **Loom**: Video recording tracking
- 🔄 **Fireflies**: Meeting transcript analysis  
- 🔄 **Slack**: Team notification integration
- 🔄 **Calendly**: Scheduling integration
