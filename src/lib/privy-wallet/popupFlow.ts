export type PopupCrossAppConnectResult = {
  type: "PRIVY_CROSS_APP_CONNECT_RESPONSE";
  // TODO: Convert to the full MWP handshake spec response
  address: `0x${string}`;
  providerPublicKey: string;
};

export type PopupCrossAppConnectError = {
  type: "PRIVY_OAUTH_ERROR";
  error: string;
};

/**
 * @param param.url {string} authorization URL to open in the pop-up window
 * @returns a Promise for the wallet address and provider public key
 */
export async function triggerPopup(
  url: URL
): Promise<PopupCrossAppConnectResult> {
  const popup = window.open(
    undefined,
    undefined,
    getPopupOptions({ w: 440, h: 680 })
  );

  if (!popup) {
    throw new Error("");
  }

  popup.location = url.href;
  console.log("somewhere in popup flow");
  // Listen to message from child window
  const promise = new Promise<PopupCrossAppConnectResult>((resolve, reject) => {
    // This promise should time out after two minutes and reject with an error if not resolved
    const twoMinutesInMs = 2 * 60 * 1000;
    const timeoutId = setTimeout(() => {
      reject(new Error("Authorization request timed out after 2 minutes."));
      cleanUp();
    }, twoMinutesInMs);

    function cleanUp() {
      popup?.close();
      window.removeEventListener("message", messageHandler);
    }

    let popupBroadcastChannel: BroadcastChannel;
    const interval = setInterval(() => {
      // Only execute if we are not using a broadcast channel
      // Broadcast channels are used during the Twitter auth flow since it window.opener to null
      // TODO: for detecting user closing during the broadcast channel approach, try using Beacon API
      // https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API
      // currently, if we are executing the broadcast channel approach, the modal will not self close if
      // the user closes the popup, however it is an improvement over the flow not working.
      if (popup?.closed && !popupBroadcastChannel) {
        cleanUp();
        clearInterval(interval);
        clearTimeout(timeoutId);
        reject(new Error("User rejected request"));
      }
    }, 300);

    function messageHandler(event: MessageEvent) {
      console.log("got message back");
      if (!event.data) return;

      if (event.data.type === "PRIVY_CROSS_APP_CONNECT_RESPONSE") {
        resolve(event.data);
        popup?.close();
      }

      // TODO: If we can merge this with react-auth or dupe to js-sdk-core, we should, but for
      // now we're doing one-off. Either way, will have to move to a standalone library

      if (event.data.type === "PRIVY_OAUTH_ERROR") {
        clearTimeout(timeoutId);
        reject(new Error(event.data.error));
        cleanUp();
      }

      if (event.data.type === "PRIVY_OAUTH_USE_BROADCAST_CHANNEL") {
        popupBroadcastChannel = new BroadcastChannel("popup-privy-oauth");
        popupBroadcastChannel.onmessage = messageHandler;
        // Note that the same messageHandler is used, so things will be cleaned up
        // once we receive a response or error
      }
    }
    console.log("added listner");
    window.addEventListener("message", messageHandler);
  });

  return promise;
}

// Copied from react-auth
export function getPopupOptions({ w, h }: { w: number; h: number }) {
  const dualScreenLeft =
    window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop =
    window.screenTop !== undefined ? window.screenTop : window.screenY;

  const width = window.innerWidth
    ? window.innerWidth
    : document.documentElement.clientWidth
    ? document.documentElement.clientWidth
    : screen.width;
  const height = window.innerHeight
    ? window.innerHeight
    : document.documentElement.clientHeight
    ? document.documentElement.clientHeight
    : screen.height;

  const zoomW = width / window.screen.availWidth;
  const zoomH = height / window.screen.availHeight;
  const left = (width - w) / 2 / zoomW + dualScreenLeft;
  const top = (height - h) / 2 / zoomH + dualScreenTop;

  return `toolbar=0,location=0,menubar=0,height=${h},width=${w},popup=1,left=${left},top=${top}`;
}
