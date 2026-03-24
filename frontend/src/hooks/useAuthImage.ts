import { useEffect, useState } from 'react';

/**
 * Fetches an image from an auth-protected URL using the Bearer token,
 * returns an object URL that can be used in <img> src and lightbox.
 */
export function useAuthImage(path: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }

    let revoked = false;
    let objectUrl: string | null = null;

    const token = localStorage.getItem('token');
    fetch(`/uploads/${path}`, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((err) => {
        console.error('Failed to load image:', err);
        if (!revoked) setUrl(null);
      });

    return () => {
      revoked = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [path]);

  return url;
}
