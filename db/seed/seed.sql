-- Seed Data covering all UI states: verified, single_source, conflicting, stale, missing, reported
-- Includes Raebareli, Jaunpur, and Agra

-- Posts
insert into posts (code, name_en, name_hi, area_type) values
  ('bdo', 'Block Development Officer (BDO)', 'खंड विकास अधिकारी (BDO)', 'rural'),
  ('eo', 'Executive Officer, Nagar Palika / Panchayat', 'अधिशासी अधिकारी (EO)', 'town'),
  ('commissioner', 'Municipal Commissioner, Nagar Nigam', 'नगर आयुक्त (Municipal Commissioner)', 'city'),
  ('ee-pwd', 'Executive Engineer, PWD', 'अधिशासी अभियंता (लो०नि०वि०)', 'district'),
  ('ee-pmgsy', 'Executive Engineer, PMGSY', 'अधिशासी अभियंता (पीएमजीएसवाई)', 'district')
on conflict (code) do nothing;

-- Districts
insert into districts (id, slug, name_en, name_hi, lgd_code, division) values
  ('d1111111-1111-1111-1111-111111111111', 'raebareli', 'Raebareli', 'रायबरेली', '171', 'Lucknow'),
  ('d2222222-2222-2222-2222-222222222222', 'jaunpur', 'Jaunpur', 'जौनपुर', '172', 'Varanasi'),
  ('d3333333-3333-3333-3333-333333333333', 'agra', 'Agra', 'आगरा', '173', 'Agra')
on conflict (slug) do nothing;

-- Blocks for Raebareli
insert into blocks (id, district_id, slug, name_en, name_hi, lgd_code) values
  ('b1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'bachhrawan', 'Bachhrawan', 'बछरावां', '1501'),
  ('b1111111-1111-1111-1111-111111111112', 'd1111111-1111-1111-1111-111111111111', 'harchandpur', 'Harchandpur', 'हरचंदपुर', '1502'),
  ('b1111111-1111-1111-1111-111111111113', 'd1111111-1111-1111-1111-111111111111', 'maharajganj', 'Maharajganj', 'महराजगंज', '1503'),
  ('b1111111-1111-1111-1111-111111111114', 'd1111111-1111-1111-1111-111111111111', 'lalganj', 'Lalganj', 'लालगंज', '1504'),
  ('b1111111-1111-1111-1111-111111111115', 'd1111111-1111-1111-1111-111111111111', 'sareni', 'Sareni', 'सरेनी', '1505')
on conflict (district_id, slug) do nothing;

-- Blocks for Jaunpur
insert into blocks (id, district_id, slug, name_en, name_hi, lgd_code) values
  ('b2222222-2222-2222-2222-222222222221', 'd2222222-2222-2222-2222-222222222222', 'shahganj', 'Shahganj', 'शाहगंज', '1601'),
  ('b2222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', 'badlapur', 'Badlapur', 'बदलापुर', '1602'),
  ('b2222222-2222-2222-2222-222222222223', 'd2222222-2222-2222-2222-222222222222', 'kerakat', 'Kerakat', 'केराकत', '1603'),
  ('b2222222-2222-2222-2222-222222222224', 'd2222222-2222-2222-2222-222222222222', 'mariahu', 'Mariahu', 'मड़ियाहू', '1604'),
  ('b2222222-2222-2222-2222-222222222225', 'd2222222-2222-2222-2222-222222222222', 'machhlishahr', 'Machhlishahr', 'मछलीशहर', '1605')
on conflict (district_id, slug) do nothing;

-- Blocks for Agra
insert into blocks (id, district_id, slug, name_en, name_hi, lgd_code) values
  ('b3333333-3333-3333-3333-333333333331', 'd3333333-3333-3333-3333-333333333333', 'achhnera', 'Achhnera', 'अछनेरा', '1701'),
  ('b3333333-3333-3333-3333-333333333332', 'd3333333-3333-3333-3333-333333333333', 'akola', 'Akola', 'अकोला', '1702'),
  ('b3333333-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333', 'bah', 'Bah', 'बाह', '1703'),
  ('b3333333-3333-3333-3333-333333333334', 'd3333333-3333-3333-3333-333333333334', 'barauli-ahir', 'Barauli Ahir', 'बरौली अहीर', '1704'),
  ('b3333333-3333-3333-3333-333333333335', 'd3333333-3333-3333-3333-333333333335', 'fatehabad', 'Fatehabad', 'फतेहाबाद', '1705')
on conflict (district_id, slug) do nothing;

-- Offices
insert into offices (id, post_code, district_id, block_id, label) values
  -- Bachhrawan (owner-provided single_source with non_gov_email)
  ('o1111111-1111-1111-1111-111111111111', 'bdo', 'd1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'BDO Bachhrawan'),
  -- Shahganj (verified)
  ('o2222222-2222-2222-2222-222222222221', 'bdo', 'd2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222221', 'BDO Shahganj'),
  -- Badlapur (conflicting)
  ('o2222222-2222-2222-2222-222222222222', 'bdo', 'd2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'BDO Badlapur'),
  -- Kerakat (stale)
  ('o2222222-2222-2222-2222-222222222223', 'bdo', 'd2222222-2222-2222-2222-222222222223', 'b2222222-2222-2222-2222-222222222223', 'BDO Kerakat'),
  -- Achhnera (missing)
  ('o3333333-3333-3333-3333-333333333331', 'bdo', 'd3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333331', 'BDO Achhnera')
on conflict do nothing;

-- Contact Versions
insert into contact_versions (
  id, office_id, cug_mobile, office_phone, email, status, flags, checked_on, is_current, review_state
) values
  -- Bachhrawan: owner-provided single_source, non_gov_email flag
  (
    'c1111111-1111-1111-1111-111111111111',
    'o1111111-1111-1111-1111-111111111111',
    '9454465404',
    null,
    'nrega.bcn@gmail.com',
    'single_source',
    array['owner_provided', 'non_gov_email'],
    '2026-11-20',
    true,
    'approved'
  ),
  -- Shahganj: verified
  (
    'c2222222-2222-2222-2222-222222222221',
    'o2222222-2222-2222-2222-222222222221',
    '9454465263',
    '05453-222101',
    'bdo.shahganj.jnp@gmail.com',
    'verified',
    array['cug_verified'],
    '2026-11-20',
    true,
    'approved'
  ),
  -- Badlapur: conflicting
  (
    'c2222222-2222-2222-2222-222222222222',
    'o2222222-2222-2222-2222-222222222222',
    '9454465401',
    '9454465402',
    'bdo.badlapur@gmail.com',
    'conflicting',
    array['conflicting_directory_entries'],
    '2026-10-15',
    true,
    'approved'
  ),
  -- Kerakat: stale (> 24 months old)
  (
    'c2222222-2222-2222-2222-222222222223',
    'o2222222-2222-2222-2222-222222222223',
    '9454465300',
    null,
    'bdo.kerakat@gmail.com',
    'stale',
    array['older_than_24_months'],
    '2024-05-10',
    true,
    'approved'
  ),
  -- Achhnera: missing contact
  (
    'c3333333-3333-3333-3333-333333333331',
    'o3333333-3333-3333-3333-333333333331',
    null,
    null,
    null,
    'missing',
    array['no_contact_found'],
    '2026-11-20',
    true,
    'approved'
  )
on conflict do nothing;

-- Sources
insert into contact_sources (contact_version_id, url, source_type, role) values
  ('c1111111-1111-1111-1111-111111111111', 'https://raebareli.nic.in/whos-who/', 'owner_provided', 'primary'),
  ('c2222222-2222-2222-2222-222222222221', 'https://jaunpur.nic.in/whos-who/', 'official_district_website', 'primary'),
  ('c2222222-2222-2222-2222-222222222222', 'https://jaunpur.nic.in/telephone-directory/', 'official_district_website', 'primary'),
  ('c2222222-2222-2222-2222-222222222223', 'https://jaunpur.nic.in/telephone-directory-archive/', 'archive', 'primary'),
  ('c3333333-3333-3333-3333-333333333331', 'https://agra.nic.in/whos-who/', 'official_district_website', 'primary')
on conflict do nothing;

-- Admin profiles (Seed reviewer & admin for testing)
insert into admin_profiles (user_id, role, display_name) values
  ('00000000-0000-0000-0000-000000000001', 'reviewer', 'Lead Reviewer'),
  ('00000000-0000-0000-0000-000000000002', 'admin', 'System Administrator')
on conflict (user_id) do nothing;
