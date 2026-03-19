const ENC_PREFIX = 'ENC:';
const PBKDF2_ITERATIONS = 600_000;
const AES_GCM_IV_BYTES = 12; // AES-GCM standard nonce size
const STORAGE_KEY = 'encryption_passphrase';

function base64Encode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64Decode(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function getCryptoKey(): Promise<CryptoKey | null> {
  const passphrase = getEncryptionPassphrase();
  if (!passphrase) return null;
  const userId = localStorage.getItem('user_id') ?? 'default';
  const salt = new TextEncoder().encode(userId);
  return deriveKey(passphrase, salt);
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getCryptoKey();
  if (!key) return plaintext;
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return ENC_PREFIX + base64Encode(combined.buffer);
}

export async function decrypt(ciphertext: string): Promise<string> {
  if (!ciphertext.startsWith(ENC_PREFIX)) return ciphertext;
  const key = await getCryptoKey();
  if (!key) return ciphertext;
  try {
    const data = base64Decode(ciphertext.slice(ENC_PREFIX.length));
    const iv = data.slice(0, AES_GCM_IV_BYTES);
    const encrypted = data.slice(AES_GCM_IV_BYTES);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted,
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return ciphertext;
  }
}

export function isEncrypted(text: string): boolean {
  return text.startsWith(ENC_PREFIX);
}

export function setEncryptionPassphrase(passphrase: string): void {
  localStorage.setItem(STORAGE_KEY, passphrase);
}

export function getEncryptionPassphrase(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function clearEncryptionPassphrase(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function setUserId(userId: string): void {
  localStorage.setItem('user_id', userId);
}
