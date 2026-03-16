
-- Recreate projects policies with TO authenticated
DROP POLICY IF EXISTS "Users insert own projects" ON projects;
DROP POLICY IF EXISTS "Users read own projects" ON projects;
DROP POLICY IF EXISTS "Users update own projects" ON projects;
DROP POLICY IF EXISTS "Users delete own projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

CREATE POLICY "Users insert own projects" ON projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own projects" ON projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own projects" ON projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own projects" ON projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Recreate project_slides policies with TO authenticated
DROP POLICY IF EXISTS "Users insert own slides" ON project_slides;
DROP POLICY IF EXISTS "Users read own slides" ON project_slides;
DROP POLICY IF EXISTS "Users update own slides" ON project_slides;
DROP POLICY IF EXISTS "Users delete own slides" ON project_slides;

CREATE POLICY "Users insert own slides" ON project_slides FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_slides.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users read own slides" ON project_slides FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_slides.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users update own slides" ON project_slides FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_slides.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users delete own slides" ON project_slides FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_slides.project_id AND projects.user_id = auth.uid()));

-- Recreate assets policies with TO authenticated
DROP POLICY IF EXISTS "Users insert own assets" ON assets;
DROP POLICY IF EXISTS "Users read own assets" ON assets;
DROP POLICY IF EXISTS "Users update own assets" ON assets;
DROP POLICY IF EXISTS "Users delete own assets" ON assets;

CREATE POLICY "Users insert own assets" ON assets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own assets" ON assets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own assets" ON assets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own assets" ON assets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Recreate profiles policies with TO authenticated
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;

CREATE POLICY "Users insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
