import {generateKeyPair, recoverSharedSecret} from '../crypto';
import {triggerPopup} from './popupFlow';

export default async function sendConnectionRequestToPopup({
  appId,
  providerUrl,
}: {
  appId: string;
  providerUrl: string;
}) {
  const url = new URL(`${providerUrl}/cross-app/connect`);

  // generate requester keys
  const {privateKey, publicKey} = generateKeyPair();

  // Append params to url
  url.searchParams.set('requester_public_key', publicKey);
  url.searchParams.set('connect', 'true');
  url.searchParams.set('provider_app_id', appId);
  url.searchParams.set('requester_origin', window.location.origin);

  const {address, providerPublicKey} = await triggerPopup(url);

  const sharedSecret = recoverSharedSecret({privateKey, publicKey: providerPublicKey});

  return {address, sharedSecret, publicKey, privateKey};
}

/**
 * Generates a code challenge and state code and fetch the corresponding
 * authorization URL from cross-app auth from the Privy API.
 *
 * @param param.appId {string} provider app's Privy app ID
 * @returns
 */
export async function getCrossAppProviderDetails({appId}: {appId: string}) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PRIVY_AUTH_URL}/api/v1/apps/${appId}/cross-app/details`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'privy-app-id': process.env.NEXT_PUBLIC_PRIVY_REQUESTER_APP_ID ?? '',
      },
    },
  );

  const {
    custom_api_url: url,
    icon_url,
    name,
  } = (await response.json()) as {
    name: string;
    icon_url: string | null;
    custom_api_url: string;
  };

  return {url, name, iconUrl: icon_url};
}
