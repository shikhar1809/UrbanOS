# Supabase Database Setup

## Running Migrations

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the migration files in order:
   - `20240101000000_initial_schema.sql` - Creates tables and indexes
   - `20240101000001_rls_policies.sql` - Sets up Row Level Security
   - `20240101000002_seed_data.sql` - Inserts sample data

## Database Schema

### Tables

- **users**: User profiles (extends auth.users)
- **agencies**: Government agencies responsible for handling reports
- **reports**: Citizen-submitted issue reports
- **community_officials**: Community leaders and their roles
- **historical_incidents**: Past incidents for prediction model
- **notifications**: User notifications
- **report_comments**: Comments on reports by users and agencies

### Storage

- **report-images**: Bucket for storing report photos

## Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Allow users to view/edit their own data
- Allow agencies to view/edit assigned reports
- Allow admins to manage all data
- Protect anonymous reports

## Automatic Triggers

- **Auto-assign reports** to agencies based on region
- **Calculate response time** when reports are resolved
- **Send notifications** when report status changes
- **Update agency stats** automatically

## User Roles

- **citizen**: Can create and view their own reports
- **agency**: Can view and update assigned reports
- **admin**: Full access to all data

