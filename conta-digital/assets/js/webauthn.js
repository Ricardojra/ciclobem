/**
 * CicloBem Conta Digital — WebAuthn/Passkey client
 * PASSKEY-WEBAUTHN-01
 *
 * The browser talks to a platform authenticator via navigator.credentials.
 * CicloBem only ever sees cryptographic WebAuthn credentials/assertions —
 * biometric verification happens locally on the user's device and no
 * biometric data is transmitted. Session creation remains the canonical
 * HttpOnly-cookie flow; nothing passkey-related is stored in web storage.
 */
(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  const CicloBem = window.CicloBem;

  const b64urlToBuf = (str) => {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  };

  const bufToB64url = (buf) => {
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  /** Feature detection (§37): password stays the fallback when absent. */
  const isSupported = () =>
    typeof window.PublicKeyCredential === 'function' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials?.create === 'function' &&
    typeof navigator.credentials?.get === 'function' &&
    window.isSecureContext !== false;

  const toRegistrationJSON = (cred) => ({
    id: cred.id,
    rawId: bufToB64url(cred.rawId),
    type: cred.type,
    response: {
      attestationObject: bufToB64url(cred.response.attestationObject),
      clientDataJSON: bufToB64url(cred.response.clientDataJSON),
      transports: typeof cred.response.getTransports === 'function'
        ? cred.response.getTransports()
        : undefined
    },
    authenticatorAttachment: cred.authenticatorAttachment || undefined,
    clientExtensionResults: cred.getClientExtensionResults()
  });

  const toAssertionJSON = (cred) => ({
    id: cred.id,
    rawId: bufToB64url(cred.rawId),
    type: cred.type,
    response: {
      authenticatorData: bufToB64url(cred.response.authenticatorData),
      clientDataJSON: bufToB64url(cred.response.clientDataJSON),
      signature: bufToB64url(cred.response.signature),
      userHandle: cred.response.userHandle ? bufToB64url(cred.response.userHandle) : undefined
    },
    authenticatorAttachment: cred.authenticatorAttachment || undefined,
    clientExtensionResults: cred.getClientExtensionResults()
  });

  /**
   * Register a passkey for the currently authenticated user (§23).
   * @returns {Promise<{ok:boolean, error?:Object}>}
   */
  const registerPasskey = async (label) => {
    const optRes = await CicloBem.api.post('/auth/passkeys/register/options', {});
    if (!optRes.ok) return optRes;

    const options = optRes.data.options;
    const publicKey = {
      ...options,
      challenge: b64urlToBuf(options.challenge),
      user: { ...options.user, id: b64urlToBuf(options.user.id) },
      excludeCredentials: (options.excludeCredentials || []).map((c) => ({
        ...c, id: b64urlToBuf(c.id)
      }))
    };

    let credential;
    try {
      credential = await navigator.credentials.create({ publicKey });
    } catch (e) {
      return { ok: false, error: { code: 'PASSKEY_CANCELLED', message: 'Registro cancelado ou não suportado.' } };
    }
    if (!credential) {
      return { ok: false, error: { code: 'PASSKEY_CANCELLED', message: 'Nenhuma credencial criada.' } };
    }

    return CicloBem.api.post('/auth/passkeys/register/verify', {
      credential: toRegistrationJSON(credential),
      label: label || undefined
    });
  };

  /**
   * Username-less passkey login (§24-25): discoverable credential →
   * server verification → canonical HttpOnly session cookie.
   */
  const loginWithPasskey = async () => {
    const optRes = await CicloBem.api.post('/auth/passkeys/login/options', {});
    if (!optRes.ok) return optRes;

    const options = optRes.data.options;
    const publicKey = {
      ...options,
      challenge: b64urlToBuf(options.challenge),
      allowCredentials: (options.allowCredentials || []).map((c) => ({
        ...c, id: b64urlToBuf(c.id)
      }))
    };

    let assertion;
    try {
      assertion = await navigator.credentials.get({ publicKey });
    } catch (e) {
      return { ok: false, error: { code: 'PASSKEY_CANCELLED', message: 'Autenticação cancelada.' } };
    }
    if (!assertion) {
      return { ok: false, error: { code: 'PASSKEY_CANCELLED', message: 'Nenhuma credencial selecionada.' } };
    }

    return CicloBem.api.post('/auth/passkeys/login/verify', {
      credential: toAssertionJSON(assertion)
    });
  };

  const listPasskeys = () => CicloBem.api.get('/auth/passkeys');
  const revokePasskey = (id) => CicloBem.api.del(`/auth/passkeys/${id}`);

  CicloBem.webauthn = {
    isSupported,
    registerPasskey,
    loginWithPasskey,
    listPasskeys,
    revokePasskey
  };
})();
