# Dashboard Viewer Application

A Next.js application for viewing and interacting with business intelligence dashboards.

## Technologies

- **Framework**: Next.js 15
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **UI Components**: Shadcn/UI
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Typescript**: For type safety

## Project Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/dashboard-viewer.git
cd dashboard-viewer
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
Copy the `.env.local.example` file to `.env.local` and fill in your Firebase configuration values:
```bash
cp .env.local.example .env.local
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

## Firebase Configuration

This application uses Firebase for authentication and database services:

1. **Authentication**: Email/password login, password reset
2. **Firestore Database**: Storing user data, client information, and dashboard configurations
3. **Security Rules**: Protecting user data with proper access control

### Database Structure

The Firestore database has the following collections:

- **users**: User accounts with roles and metadata
  - Fields: email, role, created_at, updated_at

- **clients**: Client information
  - Fields: name, email, document, phone, address details, user_id, etc.

- **dashboards**: Dashboard configurations
  - Fields: name, iframe_url, user_id

- **usage_data**: Records of dashboard usage
  - Fields: user_id, dashboard_id, event_type, event_data, event_time

- **access_logs**: Dashboard access records
  - Fields: user_id, dashboard_id, duration, accessed_at

## Features

- User authentication with email/password
- Password reset functionality
- Dashboard selection and viewing
- Usage tracking and analytics
- Dark/light theme toggle
- Responsive design

## Project Structure

```
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── _components/     # Shared components for pages
│   │   ├── actions/         # Server actions
│   │   ├── auth/            # Auth-related routes
│   │   ├── dashboard/       # Dashboard routes
│   │   └── ...              # Other page routes
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Shadcn UI components
│   │   └── ...
│   ├── context/             # React context providers
│   ├── lib/                 # Utility functions and config
│   │   ├── firebase/        # Firebase configuration
│   │   └── ...
│   └── ...
├── public/                  # Static assets
└── ...
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request