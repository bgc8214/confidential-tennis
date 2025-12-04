-- ============================================
-- 마이그레이션 6: RLS 정책 생성
-- ============================================

-- User Profiles 정책
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Clubs 정책
CREATE POLICY "Users can view clubs they belong to"
    ON clubs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = clubs.id
            AND club_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create clubs"
    ON clubs FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their clubs"
    ON clubs FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their clubs"
    ON clubs FOR DELETE
    USING (owner_id = auth.uid());

-- Club Members 정책
CREATE POLICY "Users can view club members of their clubs"
    ON club_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM club_members cm
            WHERE cm.club_id = club_members.club_id
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Club owners can add members"
    ON club_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM club_members cm
            WHERE cm.club_id = club_members.club_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Club owners and admins can update member roles"
    ON club_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM club_members cm
            WHERE cm.club_id = club_members.club_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Club owners can remove members"
    ON club_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM club_members cm
            WHERE cm.club_id = club_members.club_id
            AND cm.user_id = auth.uid()
            AND cm.role = 'owner'
        )
    );

-- Members 정책
CREATE POLICY "Club members can view members of their clubs"
    ON members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = members.club_id
            AND club_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Club admins can insert members"
    ON members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = members.club_id
            AND club_members.user_id = auth.uid()
            AND club_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Club admins can update members"
    ON members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = members.club_id
            AND club_members.user_id = auth.uid()
            AND club_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Club admins can delete members"
    ON members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = members.club_id
            AND club_members.user_id = auth.uid()
            AND club_members.role IN ('owner', 'admin')
        )
    );

-- Schedules 정책
CREATE POLICY "Club members can view schedules of their clubs"
    ON schedules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = schedules.club_id
            AND club_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Club admins can manage schedules"
    ON schedules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM club_members
            WHERE club_members.club_id = schedules.club_id
            AND club_members.user_id = auth.uid()
            AND club_members.role IN ('owner', 'admin')
        )
    );

-- Attendances 정책
CREATE POLICY "Club members can view attendances"
    ON attendances FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM schedules s
            JOIN club_members cm ON cm.club_id = s.club_id
            WHERE s.id = attendances.schedule_id
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Club admins can manage attendances"
    ON attendances FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM schedules s
            JOIN club_members cm ON cm.club_id = s.club_id
            WHERE s.id = attendances.schedule_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );

-- Matches 정책
CREATE POLICY "Club members can view matches"
    ON matches FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM schedules s
            JOIN club_members cm ON cm.club_id = s.club_id
            WHERE s.id = matches.schedule_id
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Club admins can manage matches"
    ON matches FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM schedules s
            JOIN club_members cm ON cm.club_id = s.club_id
            WHERE s.id = matches.schedule_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );

-- Constraints 정책
CREATE POLICY "Club members can view constraints"
    ON constraints FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM schedules s
            JOIN club_members cm ON cm.club_id = s.club_id
            WHERE s.id = constraints.schedule_id
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Club admins can manage constraints"
    ON constraints FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM schedules s
            JOIN club_members cm ON cm.club_id = s.club_id
            WHERE s.id = constraints.schedule_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );


