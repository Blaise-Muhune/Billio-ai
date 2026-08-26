import { auth } from '../config/firebase';

/**
 * Upload an image to Azure Blob via a short-lived server SAS (no account key in the browser).
 * @param {File|Blob} file
 * @param {'profile-images'|'custom-icons'} container
 * @returns {Promise<string>} Public blob URL
 */
export async function uploadImageToAzure(file, container) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to upload images');
  }
  if (!file) {
    throw new Error('No file selected');
  }
  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  const idToken = await user.getIdToken();
  const sasRes = await fetch('/api/uploads/sas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({
      container,
      fileName: file.name || 'image.jpg',
      contentType: file.type
    })
  });

  const sasPayload = await sasRes.json().catch(() => ({}));
  if (!sasRes.ok) {
    throw new Error(sasPayload.error || 'Failed to prepare Azure upload');
  }

  const putRes = await fetch(sasPayload.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
      'x-ms-blob-type': 'BlockBlob'
    },
    body: file
  });

  if (!putRes.ok) {
    const detail = await putRes.text().catch(() => '');
    throw new Error(detail || `Azure upload failed (${putRes.status})`);
  }

  return sasPayload.blobUrl;
}

/**
 * Convert a File/Blob to a data URL for one-shot AI vision (no cloud storage).
 * @param {File|Blob} file
 * @returns {Promise<string>}
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
