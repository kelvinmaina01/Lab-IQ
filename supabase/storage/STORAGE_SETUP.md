# Supabase Storage Setup for Lab IQ Collaboration

## Buckets to Create in Supabase Dashboard

Go to **Storage** in your Supabase Dashboard and create these buckets:

### 1. `collaboration-files` bucket
**Purpose**: Store all collaboration files (chat attachments, shared documents)
**Settings**:
```
- Public: No (private bucket with RLS)
- File size limit: 50MB
- Allowed MIME types: All
```

**RLS Policies** (run in SQL Editor):
```sql
-- Allow authenticated users to upload files to channels they're members of
CREATE POLICY "Users can upload files to their channels"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'collaboration-files' AND
  (storage.foldername(name))[1] IN (
    SELECT channel_id::text FROM channel_members WHERE user_id = auth.uid()
  )
);

-- Allow users to view files from their channels
CREATE POLICY "Users can view files from their channels"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'collaboration-files' AND
  (storage.foldername(name))[1] IN (
    SELECT channel_id::text FROM channel_members WHERE user_id = auth.uid()
  )
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'collaboration-files' AND
  owner = auth.uid()
);
```

---

### 2. `avatars` bucket
**Purpose**: Store user profile avatars
**Settings**:
```
- Public: Yes (public bucket for avatars)
- File size limit: 2MB
- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
```

**RLS Policies**:
```sql
-- Anyone can view avatars
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

### 3. `project-attachments` bucket
**Purpose**: Store project-specific files and experiment results
**Settings**:
```
- Public: No (private bucket with RLS)
- File size limit: 100MB (for large datasets)
- Allowed MIME types: All
```

**RLS Policies**:
```sql
-- Project members can upload files
CREATE POLICY "Project members can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT project_id::text FROM project_members WHERE user_id = auth.uid()
  )
);

-- Project members can view files
CREATE POLICY "Project members can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT project_id::text FROM project_members WHERE user_id = auth.uid()
  )
);
```

---

## File Organization Structure

### For collaboration-files:
```
collaboration-files/
  {channel_id}/
    {year}/
      {month}/
        {file_id}_{original_filename}
```

### For avatars:
```
avatars/
  {user_id}/
    avatar.jpg
```

### For project-attachments:
```
project-attachments/
  {project_id}/
    experiments/
      {experiment_id}/
        {file_name}
    results/
      {date}/
        {file_name}
    protocols/
      {file_name}
```

---

## Setup Instructions

### Step 1: Create Buckets
1. Go to Supabase Dashboard > Storage
2. Click "New Bucket"
3. Create each bucket with settings above

### Step 2: Apply RLS Policies
1. Go to Supabase Dashboard > SQL Editor
2. Copy and paste all RLS policies from above
3. Execute the SQL

### Step 3: Test Upload
Use the storage service (will be created next) to test uploads.

---

## Storage Quotas (Supabase Free Tier)

- **Storage**: 1GB total
- **Bandwidth**: 2GB/month
- **File uploads**: Unlimited

When to upgrade:
- Pro ($25/mo): 100GB storage, 200GB bandwidth
- Team ($599/mo): Unlimited storage and bandwidth
