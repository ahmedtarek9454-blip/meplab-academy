-- =====================================================================
-- MEP LAB Academy - Supabase schema
-- شغّل الملف ده مرة واحدة من: Supabase > SQL Editor > New query > Run
-- =====================================================================

-- ---------- Profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email,
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- Courses ----------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_ar text not null,
  title_en text not null,
  desc_ar text,
  desc_en text,
  curriculum_ar text,          -- سطر لكل درس
  curriculum_en text,
  price_egp integer not null default 0,
  access_days integer,         -- null = مدى الحياة
  cover_url text,
  preview_url text,            -- لينك يوتيوب للفيديو التعريفي
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Orders ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  method text not null check (method in ('instapay','vodafone_cash')),
  amount integer not null,
  sender_ref text,             -- رقم/اسم المحوِّل
  receipt_path text not null,
  machine_code text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  activation_code text,
  expires_at date,
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.courses  enable row level security;
alter table public.orders   enable row level security;

drop policy if exists "profiles_read_own_or_admin" on public.profiles;
create policy "profiles_read_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "courses_public_read" on public.courses;
create policy "courses_public_read" on public.courses
  for select using (published or public.is_admin());

drop policy if exists "courses_admin_write" on public.courses;
create policy "courses_admin_write" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders_read_own_or_admin" on public.orders;
create policy "orders_read_own_or_admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_insert_own_pending" on public.orders;
create policy "orders_insert_own_pending" on public.orders
  for insert with check (
    user_id = auth.uid() and status = 'pending'
    and activation_code is null and reviewed_at is null
  );

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- Storage: payment receipts (private) ----------
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "receipts_upload_own" on storage.objects;
create policy "receipts_upload_own" on storage.objects
  for insert with check (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipts_read_own_or_admin" on storage.objects;
create policy "receipts_read_own_or_admin" on storage.objects
  for select using (
    bucket_id = 'receipts'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ---------- كورس مثال (عدّله أو امسحه من لوحة الأدمن) ----------
insert into public.courses (slug, title_ar, title_en, desc_ar, desc_en, curriculum_ar, curriculum_en, price_egp, access_days, published, sort_order)
values (
  'hvac-design-fundamentals',
  'أساسيات تصميم أنظمة التكييف HVAC',
  'HVAC Design Fundamentals',
  'كورس عملي من الصفر لحساب الأحمال وتصميم مجاري الهواء واختيار المعدات، بأمثلة من مشاريع حقيقية.',
  'A practical course from scratch: load calculation, duct design and equipment selection, with real project examples.',
  E'مقدمة في أنظمة التكييف\nحساب الأحمال الحرارية\nتصميم مجاري الهواء\nاختيار المعدات (FCU / AHU / Chillers)\nمشروع تطبيقي كامل',
  E'Introduction to HVAC systems\nCooling load calculation\nDuct design\nEquipment selection (FCU / AHU / Chillers)\nFull applied project',
  1500, 365, true, 1
) on conflict (slug) do nothing;

-- =====================================================================
-- بعد ما تعمل حسابك على الموقع، خلّي نفسك أدمن:
--   update public.profiles set role = 'admin' where email = 'YOUR@EMAIL.com';
-- =====================================================================

-- =====================================================================
-- Jobs (قسم الوظايف) — شغّل الجزء ده لو كنت شغّلت الملف قبل كده
-- =====================================================================
create table if not exists public.jobs (
  id text primary key,                 -- source:external_id
  source text not null,                -- jooble / jsearch / manual
  title text not null,
  company text,
  location text,
  market text not null check (market in ('eg','sa','ae')),
  role_id text,
  snippet text,
  salary text,
  url text not null,
  posted_at timestamptz,
  fetched_at timestamptz not null default now(),
  active boolean not null default true
);
create index if not exists jobs_market_role_idx on public.jobs(market, role_id, active);
create index if not exists jobs_posted_idx on public.jobs(posted_at desc);

alter table public.jobs enable row level security;

drop policy if exists "jobs_public_read" on public.jobs;
create policy "jobs_public_read" on public.jobs
  for select using (active or public.is_admin());

drop policy if exists "jobs_admin_write" on public.jobs;
create policy "jobs_admin_write" on public.jobs
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- AI CV reviews (لعدّ الاستخدام اليومي بس — نص الـ CV مش بيتخزن)
-- =====================================================================
create table if not exists public.cv_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id text,
  ats_score integer,
  created_at timestamptz not null default now()
);
create index if not exists cv_reviews_user_idx on public.cv_reviews(user_id, created_at desc);
alter table public.cv_reviews enable row level security;
drop policy if exists "cv_reviews_own" on public.cv_reviews;
create policy "cv_reviews_own" on public.cv_reviews
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "cv_reviews_insert_own" on public.cv_reviews;
create policy "cv_reviews_insert_own" on public.cv_reviews
  for insert with check (user_id = auth.uid());

-- =====================================================================
-- Online activation for MEP LAB Player (شغّل الجزء ده لو الملف اتشغّل قبل كده)
-- =====================================================================
alter table public.courses add column if not exists download_url text;   -- لينك تحميل ملفات الكورس المشفّرة (.vdrm)
alter table public.courses add column if not exists product_key text;    -- معرّف الكورس اللي الـ Player/Publisher بيستخدمه في الرخصة
alter table public.orders  add column if not exists device_changes integer not null default 0;

create table if not exists public.device_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  old_machine text,
  new_machine text not null,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create unique index if not exists device_requests_one_pending on public.device_requests(order_id) where status = 'pending';
alter table public.device_requests enable row level security;
drop policy if exists "devreq_read_own_or_admin" on public.device_requests;
create policy "devreq_read_own_or_admin" on public.device_requests
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "devreq_insert_own" on public.device_requests;
create policy "devreq_insert_own" on public.device_requests
  for insert with check (user_id = auth.uid() and status = 'pending');
drop policy if exists "devreq_admin_update" on public.device_requests;
create policy "devreq_admin_update" on public.device_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- MEP LAB ATS models (الموديل اللي بيتدرّب من إعلانات الوظايف)
-- =====================================================================
create table if not exists public.ats_models (
  id bigint generated always as identity primary key,
  version text not null,
  jobs_used integer not null default 0,
  model jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.ats_models enable row level security;
drop policy if exists "ats_models_public_read" on public.ats_models;
create policy "ats_models_public_read" on public.ats_models for select using (true);
-- writes happen only with the service-role key (training job)

-- =====================================================================
-- Leads — كل اللي استخدموا أداة الـ CV (بوابة التسجيل بالإيميل)
-- =====================================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  full_name text,
  role_id text,
  market text,
  ats_score integer,
  years numeric,
  level text,
  source text not null default 'cv-check',
  created_at timestamptz not null default now()
);
create index if not exists leads_created_idx on public.leads(created_at desc);
create index if not exists leads_email_idx on public.leads(email);
alter table public.leads enable row level security;
drop policy if exists "leads_insert_own" on public.leads;
create policy "leads_insert_own" on public.leads for insert with check (user_id = auth.uid());
drop policy if exists "leads_admin_read" on public.leads;
create policy "leads_admin_read" on public.leads for select using (public.is_admin());

-- =====================================================================
-- Member profile fields (بروفايل كامل من أداة الـ CV)
-- =====================================================================
alter table public.profiles add column if not exists role_id text;        -- التخصص
alter table public.profiles add column if not exists market text;         -- الدولة المستهدفة eg/sa/ae
alter table public.profiles add column if not exists years numeric;       -- سنين الخبرة (اللي كتبها)
alter table public.profiles add column if not exists job_title text;      -- المسمى الحالي
alter table public.profiles add column if not exists company text;
alter table public.profiles add column if not exists linkedin text;
alter table public.profiles add column if not exists last_ats integer;    -- آخر نتيجة ATS
alter table public.profiles add column if not exists detected_role text;  -- التخصص اللي المحرك اكتشفه
alter table public.profiles add column if not exists detected_years numeric;
alter table public.profiles add column if not exists cv_checks integer not null default 0;
alter table public.profiles add column if not exists last_check_at timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz;

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- =====================================================================
-- Course details (الكورسات مسجّلة) — شغّل الجزء ده لو الملف اتشغّل قبل كده
-- =====================================================================
alter table public.courses add column if not exists format text not null default 'recorded' check (format in ('recorded','live'));
alter table public.courses add column if not exists level text;          -- beginner / intermediate / advanced
alter table public.courses add column if not exists hours numeric;       -- عدد ساعات الفيديو التقريبي
alter table public.courses add column if not exists software text;       -- البرامج المستخدمة
alter table public.courses add column if not exists outcomes_ar text;    -- سطر لكل مخرج تعلّم
alter table public.courses add column if not exists outcomes_en text;
alter table public.courses add column if not exists audience_ar text;    -- الكورس لمين
alter table public.courses add column if not exists audience_en text;

-- الكورسات الأربعة اللي بنبدأ بيها (كلها مسجّلة). عدّل الأسعار من لوحة الأدمن.
insert into public.courses (slug, title_ar, title_en, desc_ar, desc_en, curriculum_ar, curriculum_en, outcomes_ar, outcomes_en, audience_ar, audience_en, level, hours, software, price_egp, access_days, published, sort_order, format)
values
(
  'revit-mechanical',
  'Revit Mechanical من الصفر للمشروع',
  'Revit Mechanical: From Zero to Project',
  E'كورس مسجّل بالكامل بيأخدك من أول فتح Revit لحد تسليم مشروع ميكانيكا كامل (تكييف + مواسير) بالشيتات والكميات. كل درس على مشروع حقيقي، ومع كل جزء تاسك بتسلّمه على الموقع وبنصحّحه لك.\n\nهتتعلم إعداد المشروع والـ Templates، رسم الدكت والمواسير بالـ Systems الصح، الـ Families والمعدات، التنسيق مع المعماري والإنشائي وحل التعارضات، وأخيرًا إخراج الشيتات والـ Schedules زي المكاتب الكبيرة.',
  E'A fully recorded course taking you from opening Revit for the first time to delivering a complete mechanical project (HVAC + piping) with sheets and quantities. Every lesson is on a real project, and each module has an assignment you submit on the site for review.\n\nYou will learn project setup and templates, ducts and pipes with proper systems, families and equipment, coordination with architecture/structure and clash resolution, and finally sheets and schedules the way large firms do it.',
  E'مقدمة: واجهة Revit وإعداد المشروع والـ Levels والـ Grids\nربط الملف المعماري والإنشائي (Link) والـ Copy/Monitor\nالـ Mechanical Settings والـ Templates والـ View Templates\nرسم مجاري الهواء Ducts والـ Fittings والـ Accessories\nرسم مواسير التكييف Pipes (Chilled Water / Drain / Refrigerant)\nالـ Systems والـ Spaces والـ Zones وحساب الأحمال داخل Revit\nالـ Families: تعديل وإنشاء معدات ومخارج هواء\nالتنسيق وحل التعارضات Clash Detection مع Navisworks\nالـ Annotation والـ Tags والـ Dimensions\nالـ Schedules وحصر الكميات\nالشيتات والطباعة والتصدير (PDF / DWG / IFC)\nمشروع تخرج: مبنى إداري كامل',
  E'Intro: Revit interface, project setup, levels and grids\nLinking architectural/structural models and Copy/Monitor\nMechanical settings, templates and view templates\nDucts, fittings and accessories\nHVAC pipes (chilled water / drain / refrigerant)\nSystems, spaces, zones and in-Revit load calculation\nFamilies: editing and creating equipment and air terminals\nCoordination and clash detection with Navisworks\nAnnotation, tags and dimensions\nSchedules and quantity take-off\nSheets, printing and export (PDF / DWG / IFC)\nFinal project: a complete office building',
  E'تعمل موديل ميكانيكا كامل LOD 300-350 من الصفر\nتطلّع شيتات وكميات جاهزة للتسليم\nتحل التعارضات مع باقي التخصصات\nتشتغل بـ Templates ومعايير المكاتب الكبيرة',
  E'Build a complete LOD 300-350 mechanical model from scratch\nProduce submission-ready sheets and quantities\nResolve clashes with other disciplines\nWork with templates and large-firm standards',
  E'مهندسين ميكانيكا حديثي التخرج أو شغالين AutoCAD وعايزين ينقلوا لـ BIM\nمهندسي مكتب فني وتصميم عايزين Revit عملي على مشاريع حقيقية',
  E'Fresh mechanical graduates or AutoCAD users moving to BIM\nTechnical office and design engineers who want practical Revit on real projects',
  'beginner', 24, 'Revit 2024, Navisworks', 2000, null, true, 1, 'recorded'
),
(
  'hvac-design-fundamentals',
  'تصميم أنظمة التكييف HVAC',
  'HVAC Systems Design',
  E'كورس مسجّل يعلّمك تصميم التكييف من أول حساب الأحمال لحد اختيار المعدات ورسم الدكت والمواسير، بأمثلة من مشاريع حقيقية (إداري، مستشفى، مول). بتطبّق كل خطوة على مشروع الكورس وتسلّم تاسكاتك على الموقع.',
  E'A recorded course teaching HVAC design from load calculation to equipment selection, duct and pipe sizing, with examples from real projects (office, hospital, mall). You apply each step on the course project and submit assignments on the site.',
  E'مقدمة في أنظمة التكييف وأنواعها (DX / VRF / Chilled Water)\nأساسيات الـ Psychrometrics وراحة الإنسان\nحساب الأحمال الحرارية يدويًا وعلى HAP\nتصميم مجاري الهواء وتوزيع الهواء (Equal Friction / Static Regain)\nاختيار مخارج الهواء والـ VAV\nحسابات ضغط المروحة واختيار الـ FCU / AHU\nتصميم شبكة الـ Chilled Water واختيار المضخات والـ Chillers\nالتهوية وضغط الهواء وعادم الجراجات والمطابخ\nأنظمة التحكم BMS الأساسية\nمراجعة الأكواد: ASHRAE 62.1 / 90.1 و SMACNA\nمشروع تطبيقي كامل بالرسومات والحسابات',
  E'Intro to HVAC systems and types (DX / VRF / chilled water)\nPsychrometrics and thermal comfort basics\nCooling load calculation by hand and on HAP\nDuct design and air distribution (equal friction / static regain)\nAir terminals and VAV selection\nFan static pressure and FCU / AHU selection\nChilled water network design, pumps and chillers\nVentilation, pressurization, garage and kitchen exhaust\nBasic BMS controls\nCodes review: ASHRAE 62.1 / 90.1 and SMACNA\nFull applied project with drawings and calculations',
  E'تحسب أحمال أي مبنى وتختار النظام المناسب\nتصمّم الدكت والمواسير وتختار المعدات من الكتالوجات\nتقرأ وتراجع رسومات التكييف بثقة\nتجهّز حسابات تصميمية مقبولة من الاستشاري',
  E'Calculate loads for any building and choose the right system\nSize ducts and pipes and select equipment from catalogues\nRead and review HVAC drawings with confidence\nPrepare design calculations consultants accept',
  E'مهندسين ميكانيكا حديثي التخرج\nمهندسي موقع وتنفيذ عايزين يفهموا التصميم',
  E'Fresh mechanical graduates\nSite and execution engineers who want to understand design',
  'beginner', 20, 'HAP, Excel, AutoCAD', 1500, null, true, 2, 'recorded'
),
(
  'fire-fighting-design',
  'تصميم أنظمة مكافحة الحريق',
  'Fire Fighting Systems Design',
  E'كورس مسجّل لتصميم أنظمة إطفاء الحريق بالمياه طبقًا لـ NFPA والكود المصري: الرشاشات، الـ Standpipe، غرف المضخات، والحسابات الهيدروليكية. مشروع كامل من التصنيف لحد رسومات الـ Shop Drawing.',
  E'A recorded course on water-based fire protection design per NFPA and the Egyptian code: sprinklers, standpipes, pump rooms and hydraulic calculations. A full project from hazard classification to shop drawings.',
  E'مقدمة في أنظمة الحريق والأكواد (NFPA 13 / 14 / 20 والكود المصري)\nتصنيف الخطورة Hazard Classification ومتطلبات كل منطقة\nتوزيع الرشاشات Sprinklers وأنواعها ومساحات التغطية\nأنظمة الـ Standpipe والـ Hose Reel والـ Fire Hose Cabinet\nالـ Fire Pumps: الاختيار والترتيب وغرفة المضخات (NFPA 20)\nخزانات الحريق وحساب السعة\nالحسابات الهيدروليكية يدويًا وعلى برنامج\nأنظمة الإطفاء الخاصة: FM-200 / CO2 / Foam (مقدمة)\nالـ Zoning والـ Riser Diagram\nمشروع كامل: مول تجاري بالرسومات والحسابات',
  E'Intro to fire systems and codes (NFPA 13 / 14 / 20 and the Egyptian code)\nHazard classification and area requirements\nSprinkler layout, types and coverage\nStandpipe, hose reel and fire hose cabinet systems\nFire pumps: selection, arrangement and pump room (NFPA 20)\nFire water tanks and capacity\nHydraulic calculations by hand and by software\nSpecial suppression: FM-200 / CO2 / foam (intro)\nZoning and riser diagrams\nFull project: a shopping mall with drawings and calculations',
  E'تصمّم شبكة رشاشات كاملة طبقًا لـ NFPA 13\nتختار مضخات الحريق وتصمّم غرفة المضخات\nتعمل الحسابات الهيدروليكية وتدافع عنها قدام الاستشاري\nتطلّع Riser Diagram ورسومات تنفيذية',
  E'Design a complete sprinkler network per NFPA 13\nSelect fire pumps and design the pump room\nPerform and defend hydraulic calculations with consultants\nProduce riser diagrams and shop drawings',
  E'مهندسين ميكانيكا عايزين يتخصصوا في الحريق\nمهندسي مكتب فني وتنفيذ',
  E'Mechanical engineers specialising in fire protection\nTechnical office and site engineers',
  'intermediate', 16, 'AutoCAD, Excel, Pipe Flow / Elite', 1200, null, true, 3, 'recorded'
),
(
  'plumbing-design',
  'تصميم أنظمة الصحي Plumbing',
  'Plumbing Systems Design',
  E'كورس مسجّل لتصميم أعمال الصحي: تغذية المياه الباردة والساخنة، الصرف والتهوية، مياه الأمطار، المضخات والخزانات، طبقًا للكود المصري و IPC / UPC. بمثال كامل لمبنى سكني وفندق.',
  E'A recorded course on plumbing design: cold and hot water supply, drainage and venting, storm water, pumps and tanks, per the Egyptian code and IPC / UPC. With a complete residential and hotel example.',
  E'مقدمة في أنظمة الصحي والأكواد (الكود المصري / IPC / UPC)\nحساب احتياجات المياه ووحدات الـ Fixture Units\nتصميم شبكة التغذية بالمياه الباردة والساخنة\nأنظمة السخانات المركزية والـ Recirculation\nتصميم الصرف الصحي والتهوية (Drainage & Vent)\nتصريف مياه الأمطار\nالخزانات ومضخات التغذية والـ Booster Sets\nمعالجة المياه والـ Grease Trap و Sump Pit\nالـ Riser Diagrams والـ Isometrics\nمشروع كامل: برج سكني',
  E'Intro to plumbing systems and codes (Egyptian code / IPC / UPC)\nWater demand and fixture-unit calculations\nCold and hot water supply network design\nCentral water heaters and recirculation\nDrainage and vent design\nStorm water drainage\nTanks, transfer pumps and booster sets\nWater treatment, grease traps and sump pits\nRiser diagrams and isometrics\nFull project: a residential tower',
  E'تحسب احتياجات المياه وتختار أقطار المواسير\nتصمّم الصرف والتهوية من غير مشاكل روائح أو ضغط\nتختار الخزانات والمضخات والـ Booster\nتطلّع Riser وIsometric جاهزين للتسليم',
  E'Calculate water demand and size pipes\nDesign drainage and venting without odour or pressure problems\nSelect tanks, pumps and boosters\nProduce submission-ready risers and isometrics',
  E'مهندسين ميكانيكا حديثي التخرج\nمهندسي موقع عايزين يفهموا تصميم الصحي',
  E'Fresh mechanical graduates\nSite engineers who want to understand plumbing design',
  'beginner', 14, 'AutoCAD, Excel', 1200, null, true, 4, 'recorded'
)
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en, desc_ar = excluded.desc_ar, desc_en = excluded.desc_en,
  curriculum_ar = excluded.curriculum_ar, curriculum_en = excluded.curriculum_en, outcomes_ar = excluded.outcomes_ar, outcomes_en = excluded.outcomes_en,
  audience_ar = excluded.audience_ar, audience_en = excluded.audience_en, level = excluded.level, hours = excluded.hours, software = excluded.software,
  sort_order = excluded.sort_order, format = excluded.format;

-- =====================================================================
-- Tasks (التاسكات): تاسك لكل كورس — ملف يرفعه العضو أو اختيارات تتصحّح أوتوماتيك
-- =====================================================================
create or replace function public.has_course(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.orders where user_id = auth.uid() and course_id = cid and status = 'approved');
$$;

create table if not exists public.course_tasks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title_ar text not null,
  title_en text,
  desc_ar text,
  desc_en text,
  kind text not null default 'file' check (kind in ('file','quiz')),
  quiz jsonb,                         -- [{q, options:[..], answer: index}]
  max_score integer not null default 10,
  due_at timestamptz,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists course_tasks_course_idx on public.course_tasks(course_id, sort_order);

create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.course_tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_path text,
  file_name text,
  answers jsonb,                      -- [index per question]
  note text,
  score numeric,
  status text not null default 'submitted' check (status in ('submitted','graded')),
  feedback text,
  attempt integer not null default 1,
  submitted_at timestamptz not null default now(),
  graded_at timestamptz,
  unique (task_id, user_id)
);
create index if not exists task_submissions_user_idx on public.task_submissions(user_id);
create index if not exists task_submissions_status_idx on public.task_submissions(status, submitted_at);

alter table public.course_tasks enable row level security;
alter table public.task_submissions enable row level security;

drop policy if exists "tasks_read_enrolled_or_admin" on public.course_tasks;
create policy "tasks_read_enrolled_or_admin" on public.course_tasks
  for select using ((published and public.has_course(course_id)) or public.is_admin());
drop policy if exists "tasks_admin_write" on public.course_tasks;
create policy "tasks_admin_write" on public.course_tasks
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "subs_read_own_or_admin" on public.task_submissions;
create policy "subs_read_own_or_admin" on public.task_submissions
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "subs_insert_own" on public.task_submissions;
create policy "subs_insert_own" on public.task_submissions
  for insert with check (user_id = auth.uid()
    and exists (select 1 from public.course_tasks t where t.id = task_id and t.published and public.has_course(t.course_id)));
drop policy if exists "subs_update_own_until_graded" on public.task_submissions;
create policy "subs_update_own_until_graded" on public.task_submissions
  for update using ((user_id = auth.uid() and status = 'submitted') or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Storage: task files (private)
insert into storage.buckets (id, name, public) values ('tasks', 'tasks', false) on conflict (id) do nothing;
drop policy if exists "tasks_upload_own" on storage.objects;
create policy "tasks_upload_own" on storage.objects
  for insert with check (bucket_id = 'tasks' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "tasks_update_own" on storage.objects;
create policy "tasks_update_own" on storage.objects
  for update using (bucket_id = 'tasks' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "tasks_read_own_or_admin" on storage.objects;
create policy "tasks_read_own_or_admin" on storage.objects
  for select using (bucket_id = 'tasks' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- =====================================================================
-- Last CV saved in the member account (بموافقته — زرار "احفظ الـ CV في حسابي")
-- =====================================================================
alter table public.profiles add column if not exists cv_path text;
alter table public.profiles add column if not exists cv_name text;
alter table public.profiles add column if not exists cv_updated_at timestamptz;

insert into storage.buckets (id, name, public) values ('cvs', 'cvs', false) on conflict (id) do nothing;
drop policy if exists "cvs_write_own" on storage.objects;
create policy "cvs_write_own" on storage.objects
  for insert with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "cvs_update_own" on storage.objects;
create policy "cvs_update_own" on storage.objects
  for update using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "cvs_delete_own" on storage.objects;
create policy "cvs_delete_own" on storage.objects
  for delete using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "cvs_read_own_or_admin" on storage.objects;
create policy "cvs_read_own_or_admin" on storage.objects
  for select using (bucket_id = 'cvs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- =====================================================================
-- CV learning — الأداة بتتعلم من كل CV بيتفحص (من غير الـ CV نفسه)
-- بنخزن بس: الوظيفة المكتشفة، التخصص، المهارات اللي اتعرفت، كلمات جديدة
-- من قسم المهارات، والدرجة. مفيش اسم ولا إيميل ولا تليفون ولا نص.
-- =====================================================================
create table if not exists public.cv_signals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  model_version text,
  role_id text not null,
  pct integer,
  discipline text,
  market text,
  years integer,
  score integer,
  skills text[] not null default '{}',
  terms text[] not null default '{}',
  failing text[] not null default '{}',
  confirmed_role text,
  feedback_at timestamptz,
  ip_hash text
);
create index if not exists cv_signals_created_idx on public.cv_signals (created_at desc);
create index if not exists cv_signals_ip_idx on public.cv_signals (ip_hash, created_at desc);
alter table public.cv_signals enable row level security;
-- no policies: only the server (service role) reads/writes

create table if not exists public.ats_term_blocks (
  term text primary key,
  created_at timestamptz not null default now()
);
alter table public.ats_term_blocks enable row level security;
drop policy if exists "term_blocks_admin" on public.ats_term_blocks;
create policy "term_blocks_admin" on public.ats_term_blocks for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Launch line-up: 2 courses available now, 3 "coming soon" with a waitlist
-- =====================================================================
alter table public.courses add column if not exists status text not null default 'available';
do $$ begin
  alter table public.courses add constraint courses_status_chk check (status in ('available','soon'));
exception when duplicate_object then null; end $$;

update public.courses set title_ar = 'دبلومة Revit Mechanical', title_en = 'Revit Mechanical Diploma' where slug = 'revit-mechanical' and title_ar like 'Revit Mechanical%';
update public.courses set status = 'soon' where slug in ('fire-fighting-design', 'plumbing-design') and status = 'available';

insert into public.courses (slug, title_ar, title_en, desc_ar, desc_en, curriculum_ar, curriculum_en, outcomes_ar, outcomes_en, audience_ar, audience_en, level, hours, software, price_egp, access_days, published, sort_order, format, status)
values (
  'electrical-design',
  'تصميم الكهرباء للمباني',
  'Building Electrical Design',
  E'كورس مسجّل لتصميم كهرباء المباني من الإنارة وتوزيع القوى لحد لوحات التوزيع وحسابات الكابلات والتأريض، على مشاريع سكنية وتجارية ومستشفيات.',
  E'A recorded course on building electrical design: lighting, power distribution, distribution boards, cable sizing and earthing, on residential, commercial and hospital projects.',
  E'مقدمة في أنظمة الكهرباء في المباني والمصطلحات\nتصميم الإنارة وحساباتها على DIALux\nتوزيع القوى والمخارج (Small Power)\nجداول الأحمال ولوحات التوزيع (DB / SMDB / MDB)\nحسابات الكابلات وهبوط الجهد والقصر\nالمولدات و UPS والمحولات\nالتأريض والحماية من الصواعق\nالـ Single Line Diagram\nالتنسيق مع أنظمة التيار الخفيف وإنذار الحريق\nمشروع تطبيقي كامل',
  E'Building electrical systems and terminology\nLighting design and calculations in DIALux\nPower distribution and small power\nLoad schedules and distribution boards (DB / SMDB / MDB)\nCable sizing, voltage drop and short circuit\nGenerators, UPS and transformers\nEarthing and lightning protection\nSingle line diagrams\nCoordination with ELV and fire alarm\nFull practical project',
  E'تصمّم الإنارة والقوى لأي مبنى\nتعمل جداول الأحمال وتختار اللوحات والكابلات\nتطلّع Single Line Diagram مظبوط',
  E'Design lighting and power for any building\nPrepare load schedules and select boards and cables\nProduce a correct single line diagram',
  E'مهندسين كهرباء حديثي التخرج\nمهندسي موقع عايزين يفهموا التصميم',
  E'Fresh electrical graduates\nSite engineers who want to understand design',
  'beginner', null, 'DIALux, ETAP, AutoCAD', 0, null, true, 5, 'recorded', 'soon'
) on conflict (slug) do nothing;

-- people who asked to be told when a "coming soon" course launches
create table if not exists public.course_waitlist (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  email text not null,
  user_id uuid references public.profiles(id) on delete set null,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (course_id, email)
);
alter table public.course_waitlist enable row level security;
drop policy if exists "waitlist_admin_read" on public.course_waitlist;
create policy "waitlist_admin_read" on public.course_waitlist for select using (public.is_admin());
drop policy if exists "waitlist_admin_update" on public.course_waitlist;
create policy "waitlist_admin_update" on public.course_waitlist for update using (public.is_admin());
-- inserts go through /api/waitlist (server, rate-limited)
