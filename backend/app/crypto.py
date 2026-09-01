"""Authenticated encryption for credentials persisted in the DB.

The long-lived Instagram token must be retrievable to call the API, so it is
stored as AES-GCM ciphertext under a key derived from the session secret —
never hashed, never plaintext.
"""

import base64
import os

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

_SALT = b"nathalie-lopez-credentials-v1"
_INFO = b"credential-encryption"


def _key(session_secret: str) -> bytes:
    return HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=_SALT,
        info=_INFO,
    ).derive(session_secret.encode())


def encrypt(session_secret: str, plaintext: str) -> str:
    nonce = os.urandom(12)
    ciphertext = AESGCM(_key(session_secret)).encrypt(nonce, plaintext.encode(), None)
    return "enc$" + base64.urlsafe_b64encode(nonce).decode() + "$" + base64.urlsafe_b64encode(ciphertext).decode()


def decrypt(session_secret: str, stored: str) -> str:
    """Decrypt an `enc$nonce$ciphertext` value. Legacy plaintext passes through."""
    if not stored.startswith("enc$"):
        return stored
    _, nonce_b64, ciphertext_b64 = stored.split("$", 2)
    nonce = base64.urlsafe_b64decode(nonce_b64)
    ciphertext = base64.urlsafe_b64decode(ciphertext_b64)
    return AESGCM(_key(session_secret)).decrypt(nonce, ciphertext, None).decode()
