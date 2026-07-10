'use client';

/**
 * Robust file download that works on both PC and phone.
 * - PC: uses File System Access API (showSaveFilePicker) for "Save As" dialog
 * - Phone: fetches blob, creates object URL, triggers via hidden link
 */
export async function downloadFile(url: string, filename: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const ext = filename.split('.').pop()?.toLowerCase() || 'mp3';
    const mime = blob.type || (ext === 'm4a' ? 'audio/mp4' : 'audio/mpeg');
    const file = new File([blob], filename, { type: mime });

    // Strategy 1: File System Access API (PC Chrome/Edge - shows "Save As" dialog)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'Audio', accept: { [mime]: [`.${ext}`] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(file);
        await writable.close();
        return true;
      } catch (e: any) {
        // User cancelled the dialog
        if (e?.name === 'AbortError') return false;
        // Fall through to next strategy
      }
    }

    // Strategy 2: Blob URL with hidden link (works on phone + most browsers)
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    a.setAttribute('rel', 'noopener');
    document.body.appendChild(a);

    // For iOS Safari: need to trigger within user gesture
    a.click();

    // Cleanup after a short delay
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 1000);
    return true;
  } catch (err) {
    console.error('Download failed:', err);
    // Final fallback: open URL directly (phone browser will handle it)
    window.open(url, '_blank');
    return false;
  }
}

/**
 * Build download URL for a track
 */
export function getTrackDownloadUrl(track: { youtubeId?: string; preview?: string; title: string }): string | null {
  if (track.youtubeId) {
    return `/api/download?id=${track.youtubeId}&title=${encodeURIComponent(track.title)}`;
  }
  if (track.preview) {
    return track.preview;
  }
  return null;
}

/**
 * Get safe filename from track title
 */
export function getSafeFilename(title: string, ext: string = 'm4a'): string {
  const safe = title
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
  return `${safe || 'song'}.${ext}`;
}
