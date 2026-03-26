import { useEffect, useState } from 'react';

/**
 * Fetches multiple images from auth-protected URLs using the Bearer token.
 * Returns an array of { id, objectUrl } pairs.
 */
export function useAuthImages(
  images: Array<{ id: string; file_path: string }>,
): Array<{ id: string; url: string }> {
  const [urls, setUrls] = useState<Array<{ id: string; url: string }>>([]);

  useEffect(() => {
    if (images.length === 0) {
      setUrls([]);
      return;
    }

    let revoked = false;
    const objectUrls: string[] = [];

    const token = localStorage.getItem('token');

    Promise.all(
      images.map(async (img) => {
        const res = await fetch(`/uploads/${img.file_path}`, {
          headers: { Authorization: `Bearer ${token ?? ''}` },
        });
        if (!res.ok) return null;
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        objectUrls.push(objectUrl);
        return { id: img.id, url: objectUrl };
      }),
    ).then((results) => {
      if (revoked) return;
      setUrls(results.filter((r): r is { id: string; url: string } => r !== null));
    });

    return () => {
      revoked = true;
      for (const u of objectUrls) {
        URL.revokeObjectURL(u);
      }
    };
  }, [images]);

  return urls;
}
