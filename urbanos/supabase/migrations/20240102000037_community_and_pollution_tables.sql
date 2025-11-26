-- Community and Pollution Module Tables

-- Local Chapters table
CREATE TABLE IF NOT EXISTS public.local_chapters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'sports', 'cultural', 'social', 'other'
  description TEXT,
  region TEXT NOT NULL,
  contact_info JSONB, -- {email, phone, address}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Athletes table (for Indian athlete recognition)
CREATE TABLE IF NOT EXISTS public.athletes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  achievements TEXT[] DEFAULT '{}',
  awards TEXT[] DEFAULT '{}',
  bio TEXT,
  photo_url TEXT,
  chapter_id UUID REFERENCES public.local_chapters(id) ON DELETE SET NULL,
  recognition_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high' - for under-recognized athletes
  region TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussion Rooms table
CREATE TABLE IF NOT EXISTS public.discussion_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'forum', -- 'chat' or 'forum'
  category TEXT, -- 'general', 'sports', 'politics', 'environment', etc.
  region TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussion Messages table (for both chat and forum)
CREATE TABLE IF NOT EXISTS public.discussion_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.discussion_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'post', -- 'chat' or 'post'
  parent_id UUID REFERENCES public.discussion_messages(id) ON DELETE CASCADE, -- for replies
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussion Reactions table (upvotes/likes)
CREATE TABLE IF NOT EXISTS public.discussion_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.discussion_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT DEFAULT 'upvote', -- 'upvote', 'like', 'dislike'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Community Service Opportunities table
CREATE TABLE IF NOT EXISTS public.community_service_opportunities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  organization TEXT,
  location JSONB, -- {lat, lng, address}
  date TIMESTAMPTZ,
  duration TEXT, -- e.g., "2 hours", "Full day"
  required_skills TEXT[] DEFAULT '{}',
  contact_info JSONB, -- {email, phone}
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pollution Data table
CREATE TABLE IF NOT EXISTS public.pollution_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location JSONB NOT NULL, -- {lat, lng, address, area_name}
  pollution_type TEXT NOT NULL, -- 'air', 'water', 'noise', 'soil'
  level NUMERIC NOT NULL, -- pollution level
  aqi_value INTEGER, -- Air Quality Index value
  pm25_aqi INTEGER,
  pm10_aqi INTEGER,
  o3_aqi INTEGER,
  no2_aqi INTEGER,
  so2_aqi INTEGER,
  co_aqi INTEGER,
  source TEXT NOT NULL, -- 'user_report' or 'api'
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL, -- if from user report
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_athletes_chapter_id ON public.athletes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_athletes_region ON public.athletes(region);
CREATE INDEX IF NOT EXISTS idx_athletes_recognition_level ON public.athletes(recognition_level);
CREATE INDEX IF NOT EXISTS idx_discussion_rooms_type ON public.discussion_rooms(type);
CREATE INDEX IF NOT EXISTS idx_discussion_rooms_category ON public.discussion_rooms(category);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_room_id ON public.discussion_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_parent_id ON public.discussion_messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_created_at ON public.discussion_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_reactions_message_id ON public.discussion_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_pollution_data_location ON public.pollution_data USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_pollution_data_timestamp ON public.pollution_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_pollution_data_source ON public.pollution_data(source);

-- Enable RLS
ALTER TABLE public.local_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_service_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pollution_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow public read for most tables
CREATE POLICY "Public can view local chapters" ON public.local_chapters FOR SELECT USING (true);
CREATE POLICY "Public can view athletes" ON public.athletes FOR SELECT USING (true);
CREATE POLICY "Public can view discussion rooms" ON public.discussion_rooms FOR SELECT USING (is_public = true OR created_by = auth.uid());
CREATE POLICY "Public can view discussion messages" ON public.discussion_messages FOR SELECT USING (true);
CREATE POLICY "Public can view discussion reactions" ON public.discussion_reactions FOR SELECT USING (true);
CREATE POLICY "Public can view community service opportunities" ON public.community_service_opportunities FOR SELECT USING (true);
CREATE POLICY "Public can view pollution data" ON public.pollution_data FOR SELECT USING (true);

-- RLS Policies: Authenticated users can insert
CREATE POLICY "Authenticated users can create local chapters" ON public.local_chapters FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create athletes" ON public.athletes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create discussion rooms" ON public.discussion_rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create discussion messages" ON public.discussion_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create reactions" ON public.discussion_reactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create service opportunities" ON public.community_service_opportunities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create pollution data" ON public.pollution_data FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies: Users can update/delete their own content
CREATE POLICY "Users can update own discussion rooms" ON public.discussion_rooms FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete own discussion rooms" ON public.discussion_rooms FOR DELETE USING (created_by = auth.uid());
CREATE POLICY "Users can update own messages" ON public.discussion_messages FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own messages" ON public.discussion_messages FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own reactions" ON public.discussion_reactions FOR DELETE USING (user_id = auth.uid());

