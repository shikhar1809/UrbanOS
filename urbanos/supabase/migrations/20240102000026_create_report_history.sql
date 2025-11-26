-- Create report_history table to track all actions and updates on reports
CREATE TABLE IF NOT EXISTS public.report_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL, -- 'status_change', 'assignment', 'comment', 'priority_change', 'agency_response'
  old_value TEXT,
  new_value TEXT,
  description TEXT NOT NULL, -- Human-readable description of the action
  performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL, -- User who performed the action (agency user or admin)
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL, -- Agency that performed the action
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_report_history_report_id ON public.report_history(report_id);
CREATE INDEX IF NOT EXISTS idx_report_history_created_at ON public.report_history(created_at DESC);

-- Add comment
COMMENT ON TABLE public.report_history IS 'Tracks all actions and updates performed on reports by agencies and admins';

-- Enable RLS
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for report_history
CREATE POLICY "Users can view history of their reports"
  ON public.report_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports
      WHERE id = report_history.report_id 
        AND (user_id = auth.uid() OR is_anonymous = false)
    ) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('agency', 'admin')
    )
  );

CREATE POLICY "Agencies and admins can create history entries"
  ON public.report_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('agency', 'admin')
    )
  );

-- Function to automatically log status changes
CREATE OR REPLACE FUNCTION log_report_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO public.report_history (
      report_id,
      action_type,
      old_value,
      new_value,
      description,
      performed_by,
      agency_id
    )
    VALUES (
      NEW.id,
      'status_change',
      OLD.status::TEXT,
      NEW.status::TEXT,
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      auth.uid(),
      NEW.agency_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log status changes
CREATE TRIGGER log_status_change_on_report_update
  AFTER UPDATE ON public.reports
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_report_status_change();

-- Function to log agency assignment
CREATE OR REPLACE FUNCTION log_agency_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.agency_id IS DISTINCT FROM NEW.agency_id AND NEW.agency_id IS NOT NULL THEN
    INSERT INTO public.report_history (
      report_id,
      action_type,
      old_value,
      new_value,
      description,
      agency_id
    )
    SELECT
      NEW.id,
      'assignment',
      COALESCE(OLD.agency_id::TEXT, 'Unassigned'),
      NEW.agency_id::TEXT,
      'Assigned to ' || a.name,
      NEW.agency_id
    FROM public.agencies a
    WHERE a.id = NEW.agency_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log agency assignments
CREATE TRIGGER log_assignment_on_report_update
  AFTER UPDATE ON public.reports
  FOR EACH ROW
  WHEN (OLD.agency_id IS DISTINCT FROM NEW.agency_id)
  EXECUTE FUNCTION log_agency_assignment();

-- Function to log priority changes
CREATE OR REPLACE FUNCTION log_priority_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.priority != NEW.priority THEN
    INSERT INTO public.report_history (
      report_id,
      action_type,
      old_value,
      new_value,
      description,
      performed_by,
      agency_id
    )
    VALUES (
      NEW.id,
      'priority_change',
      OLD.priority::TEXT,
      NEW.priority::TEXT,
      'Priority changed from ' || OLD.priority || ' to ' || NEW.priority,
      auth.uid(),
      NEW.agency_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log priority changes
CREATE TRIGGER log_priority_change_on_report_update
  AFTER UPDATE ON public.reports
  FOR EACH ROW
  WHEN (OLD.priority IS DISTINCT FROM NEW.priority)
  EXECUTE FUNCTION log_priority_change();

