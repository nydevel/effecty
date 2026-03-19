import { useCallback } from 'react';
import { encrypt, decrypt, getEncryptionPassphrase } from '../crypto';
import type { UserProfile } from '../api/profile';

export function useEncryption(profile: UserProfile | null) {
  const encryptField = useCallback(
    async (section: 'notes' | 'thoughts', text: string): Promise<string> => {
      if (!text) return text;
      if (!profile) return text;
      const enabled =
        section === 'notes' ? profile.encrypt_notes : profile.encrypt_thoughts;
      if (!enabled || !getEncryptionPassphrase()) return text;
      return encrypt(text);
    },
    [profile],
  );

  const decryptField = useCallback(
    async (text: string): Promise<string> => {
      if (!text) return text;
      return decrypt(text);
    },
    [],
  );

  return { encryptField, decryptField };
}
