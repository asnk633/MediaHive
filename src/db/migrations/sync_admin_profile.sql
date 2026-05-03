INSERT INTO profiles (id, email, full_name, role, tenant_id, institution_id) 
VALUES ('e0a0d64a-3ed8-472c-8d9a-baad3ffb01f0', 'admin@thaiba.com', 'Super Admin', 'admin', '0f8e65be-3600-48a9-9793-04a78e524257', '02d1a3b0-a6f0-4444-b8df-97888b47f751') 
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email, 
    full_name = EXCLUDED.full_name, 
    role = EXCLUDED.role, 
    tenant_id = EXCLUDED.tenant_id, 
    institution_id = EXCLUDED.institution_id;
