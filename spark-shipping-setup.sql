-- Add Spark Shipping as a real client
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from Supabase Auth

INSERT INTO public.clients (
    user_id, 
    name, 
    email, 
    company, 
    phone, 
    status, 
    health_score, 
    total_revenue, 
    last_contact_date, 
    next_follow_up, 
    notes, 
    tags,
    created_at,
    updated_at
) VALUES (
    'YOUR_USER_ID_HERE', -- Replace with your user ID
    'Charles', 
    'charles@sparkshipping.com', 
    'Spark Shipping Inc', 
    '+1-555-SPARK', 
    'active', 
    88, 
    45000.00, 
    NOW() - INTERVAL '1 day', 
    NOW() + INTERVAL '7 days', 
    'Leading logistics company, excellent communication, potential for expansion', 
    ARRAY['logistics', 'shipping', 'enterprise', 'high-value'],
    NOW(),
    NOW()
);

-- Add a communication record for Spark Shipping
INSERT INTO public.communications (
    client_id, 
    user_id, 
    type, 
    subject, 
    content, 
    direction, 
    sentiment_score, 
    sentiment_label, 
    communication_date,
    created_at
) VALUES (
    (SELECT id FROM public.clients WHERE email = 'charles@sparkshipping.com' AND user_id = 'YOUR_USER_ID_HERE' LIMIT 1),
    'YOUR_USER_ID_HERE', -- Replace with your user ID
    'email', 
    'Q1 Logistics Partnership Review', 
    'Thank you for the excellent service this quarter. Our shipping volumes have increased 25% and your team has handled everything perfectly. Looking forward to discussing expansion opportunities.', 
    'inbound', 
    0.9, 
    'positive', 
    NOW() - INTERVAL '1 day',
    NOW()
);

-- Add an opportunity alert for Spark Shipping
INSERT INTO public.alerts (
    user_id, 
    client_id, 
    type, 
    title, 
    description, 
    priority, 
    status,
    created_at
) VALUES (
    'YOUR_USER_ID_HERE', -- Replace with your user ID
    (SELECT id FROM public.clients WHERE email = 'charles@sparkshipping.com' AND user_id = 'YOUR_USER_ID_HERE' LIMIT 1),
    'opportunity', 
    'Expansion Opportunity - Spark Shipping', 
    'Client mentioned 25% volume increase and interest in discussing expansion. Schedule follow-up meeting.', 
    'high', 
    'active',
    NOW()
);