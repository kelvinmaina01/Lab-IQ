-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create bottleneck comments table
CREATE TABLE public.bottleneck_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bottleneck_id UUID NOT NULL REFERENCES public.bottlenecks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bottleneck_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view comments on their bottlenecks"
ON public.bottleneck_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bottlenecks
    WHERE bottlenecks.id = bottleneck_comments.bottleneck_id
    AND bottlenecks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create comments on their bottlenecks"
ON public.bottleneck_comments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bottlenecks
    WHERE bottlenecks.id = bottleneck_comments.bottleneck_id
    AND bottlenecks.user_id = auth.uid()
  )
);

-- Create action assignments table
CREATE TABLE public.action_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id UUID NOT NULL REFERENCES public.next_actions(id) ON DELETE CASCADE,
  assigned_to_email TEXT NOT NULL,
  assigned_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.action_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view assignments for their actions"
ON public.action_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.next_actions
    WHERE next_actions.id = action_assignments.action_id
    AND next_actions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create assignments for their actions"
ON public.action_assignments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.next_actions
    WHERE next_actions.id = action_assignments.action_id
    AND next_actions.user_id = auth.uid()
  )
  AND auth.uid() = assigned_by
);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;