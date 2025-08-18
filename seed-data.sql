-- Sample data for ClientTrust Dashboard
-- Run this in your Supabase SQL Editor after creating the schema

-- Insert sample clients 
INSERT INTO public.clients (user_id, name, email, company, phone, status, health_score, total_revenue, last_contact_date, next_follow_up, notes, tags) VALUES
('03def521-b04f-4c64-bac9-d9b984d6b742', 'John Smith', 'john@techcorp.com', 'TechCorp Inc', '+1-555-0101', 'active', 85, 25000.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days', 'Great client, always pays on time', ARRAY['enterprise', 'tech']),
('03def521-b04f-4c64-bac9-d9b984d6b742', 'Sarah Johnson', 'sarah@designstudio.com', 'Design Studio LLC', '+1-555-0102', 'active', 92, 18000.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '5 days', 'Creative agency, multiple ongoing projects', ARRAY['design', 'recurring']),
('03def521-b04f-4c64-bac9-d9b984d6b742', 'Mike Chen', 'mike@startup.io', 'StartupXYZ', '+1-555-0103', 'at_risk', 45, 8500.00, NOW() - INTERVAL '14 days', NOW() + INTERVAL '1 day', 'Haven''t heard from them in 2 weeks, need to follow up', ARRAY['startup', 'small-business']),
('03def521-b04f-4c64-bac9-d9b984d6b742', 'Lisa Rodriguez', 'lisa@consulting.biz', 'Rodriguez Consulting', '+1-555-0104', 'active', 78, 32000.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '7 days', 'Long-term retainer client', ARRAY['consulting', 'retainer']),
('03def521-b04f-4c64-bac9-d9b984d6b742', 'David Kim', 'david@ecommerce.store', 'E-Commerce Solutions', '+1-555-0105', 'inactive', 30, 5000.00, NOW() - INTERVAL '30 days', NULL, 'Project completed, may have future work', ARRAY['e-commerce', 'completed']);

-- Insert sample communications
INSERT INTO public.communications (client_id, user_id, type, subject, content, direction, sentiment_score, sentiment_label, communication_date) VALUES
((SELECT id FROM public.clients WHERE email = 'john@techcorp.com' LIMIT 1), '03def521-b04f-4c64-bac9-d9b984d6b742', 'email', 'Project Update', 'Thanks for the latest update on the project. Everything looks great!', 'inbound', 0.8, 'positive', NOW() - INTERVAL '2 days'),
((SELECT id FROM public.clients WHERE email = 'sarah@designstudio.com' LIMIT 1), '03def521-b04f-4c64-bac9-d9b984d6b742', 'meeting', 'Weekly Check-in', 'Discussed progress on the new website design. Client is very happy with direction.', 'outbound', 0.9, 'positive', NOW() - INTERVAL '1 day'),
((SELECT id FROM public.clients WHERE email = 'mike@startup.io' LIMIT 1), '03def521-b04f-4c64-bac9-d9b984d6b742', 'email', 'Following up', 'Hi Mike, just checking in on the project status. Let me know if you need anything.', 'outbound', 0.1, 'neutral', NOW() - INTERVAL '7 days'),
((SELECT id FROM public.clients WHERE email = 'lisa@consulting.biz' LIMIT 1), '03def521-b04f-4c64-bac9-d9b984d6b742', 'call', 'Monthly Review', 'Reviewed performance metrics and discussed next quarter planning.', 'outbound', 0.7, 'positive', NOW() - INTERVAL '5 days');

-- Insert sample alerts
INSERT INTO public.alerts (user_id, client_id, type, title, description, priority, status) VALUES
('03def521-b04f-4c64-bac9-d9b984d6b742', (SELECT id FROM public.clients WHERE email = 'mike@startup.io' LIMIT 1), 'low_engagement', 'Client Not Responding', 'Mike Chen hasn''t responded to emails in 2 weeks', 'high', 'active'),
('03def521-b04f-4c64-bac9-d9b984d6b742', (SELECT id FROM public.clients WHERE email = 'lisa@consulting.biz' LIMIT 1), 'contract_renewal', 'Contract Renewal Due', 'Rodriguez Consulting contract expires in 30 days', 'medium', 'active'),
('03def521-b04f-4c64-bac9-d9b984d6b742', (SELECT id FROM public.clients WHERE email = 'john@techcorp.com' LIMIT 1), 'opportunity', 'Upsell Opportunity', 'Client expressed interest in additional services during last call', 'medium', 'active'),
('03def521-b04f-4c64-bac9-d9b984d6b742', NULL, 'follow_up_needed', 'Weekly Client Reviews', 'Time to conduct weekly reviews with top 3 clients', 'low', 'active');

-- Insert sample integrations
INSERT INTO public.integrations (user_id, type, name, status, config, last_sync) VALUES
('03def521-b04f-4c64-bac9-d9b984d6b742', 'gmail', 'Gmail Integration', 'active', '{"email": "your-email@gmail.com", "connected": true}', NOW() - INTERVAL '1 hour'),
('03def521-b04f-4c64-bac9-d9b984d6b742', 'slack', 'Slack Workspace', 'active', '{"workspace": "your-workspace", "channel": "#client-updates"}', NOW() - INTERVAL '2 hours'),
('03def521-b04f-4c64-bac9-d9b984d6b742', 'zoom', 'Zoom Meetings', 'inactive', '{"account": "your-zoom-account"}', NULL),
('03def521-b04f-4c64-bac9-d9b984d6b742', 'stripe', 'Payment Tracking', 'error', '{"webhook_url": "https://yourapp.com/webhook"}', NOW() - INTERVAL '1 day');