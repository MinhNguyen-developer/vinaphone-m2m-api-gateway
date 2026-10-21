import { createCipheriv, createDecipheriv, randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const PASSWORD_KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export function encryptToken(token: string, keyValue: string) {
  const key = readEncryptionKey(keyValue);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(token, 'utf8'),
    cipher.final(),
  ]);
  return {
    vinaphoneTokenCiphertext: ciphertext.toString('base64url'),
    vinaphoneTokenIv: iv.toString('base64url'),
    vinaphoneTokenTag: cipher.getAuthTag().toString('base64url'),
  };
}

export function decryptToken(
  ciphertext: string,
  iv: string,
  tag: string,
  keyValue: string,
): string {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    readEncryptionKey(keyValue),
    Buffer.from(iv, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

function readEncryptionKey(value: string): Buffer {
  const key = /^[a-f0-9]{64}$/i.test(value)
    ? Buffer.from(value, 'hex')
    : Buffer.from(value, 'base64');
  if (key.length !== 32) {
    throw new Error(
      'VINAPHONE_TOKEN_ENCRYPTION_KEY must encode exactly 32 bytes',
    );
  }
  return key;
}
