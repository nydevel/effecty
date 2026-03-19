import { useCallback } from 'react';
import { encrypt, decrypt, getEncryptionPassphrase } from '../crypto';
import type { UserProfile } from '../api/profile';

type Section = 'notes' | 'memos' | 'thoughts' | 'thought_comments';
type Field = 'title' | 'content';

export function useEncryption(profile: UserProfile | null) {
  const shouldEncrypt = useCallback(
    (section: Section, field: Field): boolean => {
      if (!profile) return false;
      if (!getEncryptionPassphrase()) return false;
      const s = profile.encryption_settings?.[section];
      if (!s) return false;
      return (field in s) && (s as unknown as Record<string, boolean>)[field];
    },
    [profile],
  );

  const encryptField = useCallback(
    async (section: Section, field: Field, text: string): Promise<string> => {
      if (!text) return text;
      if (!shouldEncrypt(section, field)) return text;
      return encrypt(text);
    },
    [shouldEncrypt],
  );

  const decryptField = useCallback(
    async (text: string): Promise<string> => {
      if (!text) return text;
      return decrypt(text);
    },
    [],
  );

  return { encryptField, decryptField, shouldEncrypt };
}
