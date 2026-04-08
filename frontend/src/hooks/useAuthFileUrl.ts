import { useEffect, useState } from 'react';

export function useAuthFileUrl(filePath?: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) {
      setUrl(null);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;
    const token = localStorage.getItem('token');

    fetch(`/uploads/${filePath}`, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (active) {
          setUrl(objectUrl);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch auth file:', err);
        if (active) {
          setUrl(null);
        }
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [filePath]);

  return url;
}
