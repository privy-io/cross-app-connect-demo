import {decryptResult, encryptRequest} from '../crypto';
import {getPopupOptions} from './popupFlow';

type Request = {method: string; params: any};

export async function sendRequestToPopup({
  request,
  apiUrl,
  publicKey,
  sharedSecret,
  providerAppId,
}: {
  request: Request;
  apiUrl: string;
  publicKey: string;
  sharedSecret: string;
  providerAppId: string;
}) {
  const popup = window.open(undefined, undefined, getPopupOptions({w: 400, h: 680}));

  if (!popup) {
    throw new Error('Failed to initialize request');
  }

  const popupUrl = new URL(`${apiUrl}/cross-app/transact`);

  const {encryptedRequest, iv} = await encryptRequest(request, sharedSecret);

  popupUrl.searchParams.set('requester_public_key', publicKey);
  popupUrl.searchParams.set('encrypted_request', encryptedRequest);
  popupUrl.searchParams.set('requester_origin', window.location.origin);
  popupUrl.searchParams.set('iv', iv);
  popupUrl.searchParams.set('provider_app_id', providerAppId);

  popup.location = popupUrl.href;

  return new Promise<string>((resolve, reject) => {
    const twoMinutesInMs = 2 * 60 * 1000;
    const timeout = setTimeout(() => {
      cleanUp();
      reject(new Error('Request timeout'));
    }, twoMinutesInMs);

    const interval = setInterval(() => {
      if (popup.closed) {
        cleanUp();
        reject(new Error('User rejected request'));
      }
    }, 300);

    const listener = async (event: MessageEvent<any>) => {
      if (!event.data) {
        return;
      }

      if (event.data.type === 'PRIVY_CROSS_APP_ACTION_RESPONSE' && event.data.encryptedResult) {
        cleanUp();

        // decrypt
        const decryptedResult = await decryptResult({
          encryptedResult: event.data.encryptedResult,
          iv: event.data.iv,
          sharedSecret,
        });

        resolve(decryptedResult);
      }

      if (event.data.type === 'PRIVY_CROSS_APP_ACTION_ERROR' && event.data.error) {
        cleanUp();
        reject(event.data.error);
      }
    };

    window.addEventListener('message', listener);

    const cleanUp = () => {
      popup.close();
      clearInterval(interval);
      clearTimeout(timeout);

      window.removeEventListener('message', listener);
    };
  });
}
