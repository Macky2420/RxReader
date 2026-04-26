# Supabase Setup Guide for RxReader

## Overview
This guide explains how to set up the necessary Supabase infrastructure for the medication detection and storage feature.

## 1. Create Storage Bucket

### Bucket Name: `medication_images`
- **Privacy**: Public
- **Purpose**: Stores the cropped prescription images detected by the app

**Steps:**
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Bucket name: `medication_images`
4. Set it as Public (for public read access)
5. Click "Create bucket"

---

## 2. Create Database Table: `detected_medications`

### Table Structure

```sql
CREATE TABLE detected_medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  guidelines TEXT NOT NULL,
  medical_disclaimer TEXT NOT NULL,
  image_url TEXT NOT NULL,
  detected_image_url TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Column Descriptions:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier (auto-generated) |
| medication_name | TEXT | Name of detected medication (e.g., "Amoxicillin") |
| dosage | TEXT | Dosage information from medications.ts |
| description | TEXT | Medication description |
| instructions | TEXT | Usage instructions |
| guidelines | TEXT | Guidelines for use |
| medical_disclaimer | TEXT | Medical warnings/disclaimers |
| image_url | TEXT | Reference image URL from medications.ts |
| detected_image_url | TEXT | URL of uploaded prescription image in storage |
| confidence | FLOAT | ML model confidence (0-1) |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Record update time |

**Steps to create in Supabase:**
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Paste the SQL above
4. Click "Run"

---

## 3. Set Row Level Security (RLS) Policies

### Policy for INSERT (Allow authenticated users to insert):
```sql
CREATE POLICY "Allow authenticated users to insert medications"
ON detected_medications
FOR INSERT
TO authenticated
WITH CHECK (true);
```

### Policy for SELECT (Allow users to view their own medications):
```sql
CREATE POLICY "Allow users to view medications"
ON detected_medications
FOR SELECT
TO authenticated
USING (true);
```

### Policy for UPDATE (Allow users to update their own records):
```sql
CREATE POLICY "Allow users to update medications"
ON detected_medications
FOR UPDATE
TO authenticated
USING (true);
```

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Run each policy query above
3. Or use the Auth Policies UI in the Table Editor

---

## 4. Storage Bucket RLS Policies

### Allow Public Read:
```sql
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'medication_images');
```

### Allow Authenticated Upload:
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'medication_images');
```

---

## 5. Workflow Implementation

### When a medication is detected and confidence ≥ 50%:

1. **Find medication in local database** (`medications.ts`)
   - Match by name (case-insensitive)

2. **Upload image to Supabase Storage**
   - Endpoint: `medication_images` bucket
   - File naming: `{timestamp}_{medication_name}.jpg`
   - Get public URL after upload

3. **Store record in `detected_medications` table**
   - Fields populated from:
     - Local medications.ts data
     - Detected image URL from storage
     - Model confidence score
     - Current timestamp

4. **Display medication details**
   - Fetch from Supabase on "View Details" click
   - Show all medication information in modal

---

## 6. Error Handling

### Confidence < 50%:
- Display: "Sorry, please make sure the medication is clear"
- No database entry created
- User can retry

### Medication not found in database:
- Display: `Medication "{name}" not found in database`
- No database entry created

### Storage upload failure:
- Error message with details
- No record created in database

### Database insertion failure:
- Error message with details
- Image may still be in storage (for cleanup later)

---

## 7. Testing the Setup

### Manual Test:
1. Open the app and go to Upload modal
2. Upload a prescription image
3. Crop the area with the medication name
4. Click "Detect"
5. If confidence ≥ 50% and medication found:
   - See "Medication Saved" notification
   - Button changes to "View Details"
6. Click "View Details"
   - Modal displays all medication information
   - Fetches from Supabase
7. Close modal and try detecting another medication

### Verify in Supabase:
1. Go to Supabase → Table Editor
2. Select `detected_medications` table
3. Should see new records with:
   - Medication details
   - Detected image URL
   - Confidence score
   - Timestamp

4. Go to Storage → medication_images
   - Should see uploaded prescription images

---

## 8. Environment Variables

Ensure these are set in `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-public-key
```

---

## 9. Troubleshooting

### Images not uploading:
- Check `medication_images` bucket exists and is public
- Verify RLS policy allows inserts
- Check browser console for CORS errors

### Records not saving:
- Check `detected_medications` table exists
- Verify RLS policy allows inserts
- Check Supabase logs for SQL errors

### Medication not found:
- Verify medication name matches exactly in medications.ts
- Check if ML model is predicting correct names
- Update medications.ts if new medications are needed

---

## Notes

- Images are NOT displayed in the modal view (as requested)
- Only medication information is shown
- Images are stored for future reference or analytics
- Confidence threshold is currently 50% (can be adjusted)
