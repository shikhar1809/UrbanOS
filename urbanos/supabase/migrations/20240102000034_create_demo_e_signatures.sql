-- Create demo e-signatures for community reports that have PIL status
-- This will add signatures from demo users for community reports

DO $$
DECLARE
  community_report RECORD;
  demo_users RECORD;
  user_count INTEGER := 0;
  report_id_val UUID;
BEGIN
  -- Get community reports that are escalated to PIL
  FOR community_report IN 
    SELECT cr.id, cr.report_id, cr.status
    FROM public.community_reports cr
    WHERE cr.status = 'escalated_to_pil'
    LIMIT 5
  LOOP
    report_id_val := community_report.report_id;
    
    -- Get demo users (or any users) to sign
    FOR demo_users IN 
      SELECT id, full_name, email
      FROM public.users
      ORDER BY created_at
      LIMIT 5
    LOOP
      -- Insert e-signature for this user on this report
      INSERT INTO public.e_signatures (
        report_id,
        user_id,
        signature_data,
        signed_at,
        ip_address,
        user_agent
      )
      VALUES (
        report_id_val,
        demo_users.id,
        jsonb_build_object(
          'name', demo_users.full_name,
          'email', demo_users.email,
          'consent', true,
          'timestamp', NOW(),
          'verified', true
        ),
        NOW() - (random() * INTERVAL '7 days'),
        '192.168.1.' || (100 + user_count)::TEXT::INET,
        'Mozilla/5.0 (Demo Browser)'
      )
      ON CONFLICT (report_id, user_id) DO NOTHING;
      
      user_count := user_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Added e-signatures for report %', report_id_val;
  END LOOP;
  
  RAISE NOTICE 'Created % demo e-signatures', user_count;
END $$;

