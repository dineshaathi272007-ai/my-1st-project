import { createClient } from '@supabase/supabase-js';
import { starterRecords } from '../data/portfolioDefaults';

const storageKey = 'dinesh-portfolio-records-v1';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (Boolean(supabaseUrl) !== Boolean(supabaseAnonKey)) {
  throw new Error(
    'Supabase configuration is incomplete. Set both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or leave both unset for local preview mode.'
  );
}

export const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
export const isCloudMode = Boolean(supabase);

function normalizeRecord(row) {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description ?? '',
    details: row.details ?? '',
    isPublic: Boolean(row.is_public ?? row.isPublic),
    filePath: row.file_path ?? row.filePath ?? '',
    fileBucket: row.file_bucket ?? row.fileBucket ?? '',
    fileName: row.file_name ?? row.fileName ?? '',
    fileType: row.file_type ?? row.fileType ?? '',
    fileData: row.file_data ?? row.fileData ?? '',
  };
}

function readLocalRecords() {
  const stored = localStorage.getItem(storageKey);
  if (stored === null) {
    localStorage.setItem(storageKey, JSON.stringify(starterRecords));
    return starterRecords;
  }

  const records = JSON.parse(stored);
  if (!Array.isArray(records)) {
    throw new Error('Saved local portfolio data is invalid. Clear the portfolio preview data to start over.');
  }

  const migratedRecords = records.map((record) => {
    const starter = starterRecords.find((item) => item.id === record.id);
    if (!starter) return record;

    let migrated = record;
    if (record.id === 'starter-about' && record.title === 'About Dinesh M') {
      migrated = { ...migrated, title: starter.title };
    }
    if (
      record.id === 'starter-about' &&
      record.description === 'Add a short introduction in Manage Portfolio.'
    ) {
      migrated = { ...migrated, description: starter.description };
    }
    if (
      record.id === 'starter-education' &&
      record.details === 'Add your course and study dates in Manage Portfolio.'
    ) {
      migrated = { ...migrated, details: starter.details };
    }
    if (
      record.id === 'starter-team' &&
      record.details === 'Team participant: Dinesh M.'
    ) {
      migrated = { ...migrated, details: starter.details };
    }
    if (
      record.id === 'starter-team' &&
      record.details === 'Your role in the team: add details in Manage Portfolio.'
    ) {
      migrated = { ...migrated, details: starter.details };
    }
    return migrated;
  });
  if (migratedRecords.some((record, index) => record !== records[index])) {
    saveLocalRecords(migratedRecords);
  }
  return migratedRecords;
}

export async function loadRecords() {
  if (!supabase) {
    return readLocalRecords().map(normalizeRecord);
  }

  const { data, error } = await supabase
    .from('portfolio_records')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Could not load portfolio records: ${error.message}`);
  return data.map(normalizeRecord);
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function saveLocalRecords(records) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(records));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('Browser storage is full. In local preview mode, use a smaller file or configure Supabase Storage.');
    }
    throw error;
  }
}

async function uploadCloudFile(file, isPublic, userId) {
  const bucket = isPublic ? 'portfolio-public' : 'portfolio-private';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw new Error(`Could not upload ${file.name}: ${error.message}`);
  return { bucket, path };
}

export async function saveRecord(input, file) {
  if (!supabase) {
    if (file && file.size > 1024 * 1024) {
      throw new Error('Local preview uploads are limited to 1 MB. Configure Supabase Storage for larger files.');
    }
    const records = readLocalRecords();
    const existing = records.find((record) => record.id === input.id);
    const uploadedFile = file
      ? {
          fileData: await readFile(file),
          fileName: file.name,
          fileType: file.type,
          filePath: '',
          fileBucket: '',
        }
      : {};
    const saved = {
      ...existing,
      ...input,
      id: input.id || crypto.randomUUID(),
      ...uploadedFile,
    };
    saveLocalRecords([
      ...records.filter((record) => record.id !== saved.id),
      saved,
    ]);
    return normalizeRecord(saved);
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('Sign in as the portfolio owner before saving records.');
  }

  let previous = null;
  if (input.id) {
    const { data, error } = await supabase
      .from('portfolio_records')
      .select('*')
      .eq('id', input.id)
      .maybeSingle();
    if (error) throw new Error(`Could not load the existing record: ${error.message}`);
    previous = data;
  }
  let fileForUpload = file;
  const targetBucket = input.isPublic ? 'portfolio-public' : 'portfolio-private';
  if (
    !fileForUpload &&
    previous?.file_path &&
    previous.file_bucket !== targetBucket
  ) {
    const { data: oldFile, error: downloadError } = await supabase.storage
      .from(previous.file_bucket)
      .download(previous.file_path);
    if (downloadError) {
      throw new Error(`Could not move the attachment to match its visibility: ${downloadError.message}`);
    }
    fileForUpload = new File([oldFile], previous.file_name || 'attachment', {
      type: previous.file_type || oldFile.type,
    });
  }

  const uploadedFile = fileForUpload
    ? await uploadCloudFile(fileForUpload, input.isPublic, userData.user.id)
    : null;
  const movingPublicFileToPrivate =
    uploadedFile &&
    previous?.file_path &&
    previous.file_bucket === 'portfolio-public' &&
    uploadedFile.bucket === 'portfolio-private';

  if (movingPublicFileToPrivate) {
    const { error: removalError } = await supabase.storage
      .from(previous.file_bucket)
      .remove([previous.file_path]);
    if (removalError) {
      const { error: cleanupError } = await supabase.storage
        .from(uploadedFile.bucket)
        .remove([uploadedFile.path]);
      const cleanupMessage = cleanupError
        ? ` The replacement upload also needs cleanup: ${cleanupError.message}`
        : '';
      throw new Error(
        `Could not remove the public attachment, so visibility was not changed: ${removalError.message}.${cleanupMessage}`
      );
    }
  }
  const row = {
    id: input.id || crypto.randomUUID(),
    category: input.category,
    title: input.title,
    description: input.description,
    details: input.details,
    is_public: input.isPublic,
    file_path: uploadedFile?.path ?? previous?.file_path ?? null,
    file_bucket: uploadedFile?.bucket ?? previous?.file_bucket ?? null,
    file_name: file?.name ?? previous?.file_name ?? null,
    file_type: file?.type ?? previous?.file_type ?? null,
  };
  const { data, error } = await supabase
    .from('portfolio_records')
    .upsert(row)
    .select('*')
    .single();

  if (error) {
    if (uploadedFile) {
      const { error: cleanupError } = await supabase.storage
        .from(uploadedFile.bucket)
        .remove([uploadedFile.path]);
      if (cleanupError) {
        throw new Error(
          `Could not save the record: ${error.message}. The new upload may need cleanup: ${cleanupError.message}`
        );
      }
    }
    const attachmentMessage = movingPublicFileToPrivate
      ? ' The old public attachment was removed to protect privacy; upload it again after correcting the issue.'
      : '';
    throw new Error(`Could not save the record: ${error.message}.${attachmentMessage}`);
  }

  if (
    uploadedFile &&
    previous?.file_path &&
    !movingPublicFileToPrivate &&
    (previous.file_bucket !== uploadedFile.bucket ||
      previous.file_path !== uploadedFile.path)
  ) {
    const { error: cleanupError } = await supabase.storage
      .from(previous.file_bucket)
      .remove([previous.file_path]);
    if (cleanupError) {
      throw new Error(`Record saved, but the old attachment could not be removed: ${cleanupError.message}`);
    }
  }
  return normalizeRecord(data);
}

export async function deleteRecord(record) {
  if (!supabase) {
    const records = readLocalRecords();
    saveLocalRecords(records.filter((item) => item.id !== record.id));
    return;
  }

  if (record.filePath && record.fileBucket) {
    const { error: storageError } = await supabase.storage
      .from(record.fileBucket)
      .remove([record.filePath]);
    if (storageError) {
      throw new Error(`Could not remove the attachment, so the record was not deleted: ${storageError.message}`);
    }
  }

  const { error } = await supabase
    .from('portfolio_records')
    .delete()
    .eq('id', record.id);
  if (error) {
    throw new Error(`Could not delete the record: ${error.message}. Its attachment has already been removed.`);
  }
}

export async function getRecordFileUrl(record) {
  if (record.fileData) return record.fileData;
  if (!supabase || !record.filePath || !record.fileBucket) return null;
  if (record.fileBucket === 'portfolio-public') {
    return supabase.storage
      .from(record.fileBucket)
      .getPublicUrl(record.filePath).data.publicUrl;
  }

  const { data, error } = await supabase.storage
    .from(record.fileBucket)
    .createSignedUrl(record.filePath, 60);
  if (error) throw new Error(`Could not open the private file: ${error.message}`);
  return data.signedUrl;
}

export function getPublicFileUrl(record) {
  if (!supabase || record.fileBucket !== 'portfolio-public' || !record.filePath) {
    return record.fileData || null;
  }
  return supabase.storage
    .from(record.fileBucket)
    .getPublicUrl(record.filePath).data.publicUrl;
}

export async function verifyPortfolioOwner() {
  if (!supabase) return false;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(`Could not verify owner access: ${userError.message}`);
  if (!userData.user) return false;
  const { data, error } = await supabase.rpc('is_portfolio_owner');
  if (error) throw new Error(`Could not verify owner access: ${error.message}`);
  return data === true;
}
