import {secp256k1} from '@noble/curves/secp256k1';
import {randomBytes} from '@noble/hashes/utils';

export function generateKeyPair() {
  // Generate private key
  const privateKeyRaw = randomBytes(32);

  // Generate public key
  const publicKeyRaw = secp256k1.getPublicKey(privateKeyRaw);

  // convert to hex strings
  const privateKey = Buffer.from(privateKeyRaw).toString('hex');
  const publicKey = Buffer.from(publicKeyRaw).toString('hex');
  return {privateKey, publicKey};
}

export function recoverSharedSecret({
  privateKey,
  publicKey,
}: {
  privateKey: string;
  publicKey: string;
}) {
  const sharedSecret = secp256k1.getSharedSecret(privateKey, publicKey);
  // TODO figure out why shared secret is 2 chars too long for an AES key so we dont have to slice
  return Buffer.from(sharedSecret).toString('hex').slice(2);
}

type Request = {method: string; params: any}; // TODO import this from somewhere

export async function encryptRequest(request: Request, sharedSecret: string) {
  // stringify request
  const requestString = JSON.stringify(request);

  // Convert message and key to ArrayBuffer
  const encodedRequest = Buffer.from(requestString);

  // Convert shared secret to buffer
  const keyBuffer = Buffer.from(sharedSecret, 'hex');

  const cryptoKey = await crypto.subtle.importKey('raw', keyBuffer, {name: 'AES-GCM'}, true, [
    'decrypt',
    'encrypt',
  ]);

  // get initialization vector
  const ivBuffer = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the message using AES-GCM
  const cipherTextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
    },
    cryptoKey,
    encodedRequest,
  );

  // convert values to string for transport over https
  const iv = Buffer.from(ivBuffer).toString('hex');
  const encryptedRequest = Buffer.from(cipherTextBuffer).toString('hex');

  return {iv, encryptedRequest};
}

export async function decryptResult({
  encryptedResult,
  iv,
  sharedSecret,
}: {
  encryptedResult: string;
  iv: string;
  sharedSecret: string;
}) {
  const keyBuffer = Buffer.from(sharedSecret, 'hex');
  const ivBuffer = new Uint8Array(Buffer.from(iv, 'hex'));

  // Derive an AES key from the string (normally you'd use a more secure method)
  const cryptoKey = await crypto.subtle.importKey('raw', keyBuffer, {name: 'AES-GCM'}, true, [
    'decrypt',
    'encrypt',
  ]);

  const cipherTextBuffer = new Uint8Array(Buffer.from(encryptedResult, 'hex'));

  // Decrypt the message using AES-GCM
  const responseAsBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
    },
    cryptoKey,
    cipherTextBuffer,
  );

  const responseAsString = Buffer.from(responseAsBuffer).toString();

  // TODO: figure out why this string is wrapped in quotes "stringified"
  return responseAsString;
}
