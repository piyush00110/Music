'use client';

export async function downloadFile(url: string, filename: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(120000) });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let msg = 'Download failed';
      try { msg = JSON.parse(text).error || msg; } catch {}
      showToast(msg, 'error');
      return false;
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') || contentType.includes('application/json')) {
      showToast('Download unavailable for this track.', 'error');
      return false;
    }

    const blob = await res.blob();

    if (blob.size < 5000) {
      showToast('Track unavailable.', 'error');
      return false;
    }

    const ext = filename.split('.').pop()?.toLowerCase() || 'mp3';
    const mime = blob.type || (ext === 'm4a' ? 'audio/mp4' : 'audio/mpeg');

    // PC: File System Access API ("Save As" dialog)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'Audio', accept: { [mime]: [`.${ext}`] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(new File([blob], filename, { type: mime }));
        await writable.close();
        showToast('Downloaded!', 'success');
        return true;
      } catch (e: any) {
        if (e?.name === 'AbortError') return false;
      }
    }

    // Phone / fallback: blob URL download
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 1000);
    showToast('Download started!', 'success');
    return true;
  } catch (err) {
    console.error('Download error:', err);
    // Last resort: try opening the API URL directly in a new tab
    // The browser will handle the download natively
    window.open(url, '_blank');
    return false;
  }
}

export function getTrackDownloadUrl(track: { youtubeId?: string; preview?: string; title: string }): string | null {
  if (track.youtubeId) {
    return `/api/download?id=${track.youtubeId}&title=${encodeURIComponent(track.title)}`;
  }
  if (track.preview) {
    return track.preview;
  }
  return null;
}

export function getSafeFilename(title: string, ext: string = 'm4a'): string {
  const safe = title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, ' ');
  return `${safe || 'song'}.${ext}`;
}

function showToast(msg: string, type: 'success' | 'error') {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('dl-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'dl-toast';
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; bottom: 140px; left: 50%; transform: translateX(-50%);
    padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 500;
    z-index: 99999; pointer-events: none; opacity: 0;
    transition: opacity 0.3s ease;
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    ${type === 'success'
      ? 'background: rgba(34,197,94,0.9); color: white;'
      : 'background: rgba(239,68,68,0.9); color: white;'}
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
