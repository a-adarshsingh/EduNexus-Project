import hashlib, hmac, os
from datetime import datetime, timedelta, timezone
import jwt
from . import config

_N, _R, _P = 2 ** 14, 8, 1

def hash_password(p: str) -> str:
    salt = os.urandom(16)
    h = hashlib.scrypt(p.encode(), salt=salt, n=_N, r=_R, p=_P)
    return f"scrypt${_N}${_R}${_P}${salt.hex()}${h.hex()}"

def verify_password(p: str, stored: str) -> bool:
    try:
        _, n, r, pp, salt, h = stored.split("$")
        calc = hashlib.scrypt(p.encode(), salt=bytes.fromhex(salt), n=int(n), r=int(r), p=int(pp))
        return hmac.compare_digest(calc, bytes.fromhex(h))
    except (ValueError, TypeError):
        return False

def make_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=config.TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": exp}, config.SECRET_KEY, algorithm="HS256")

def read_token(token: str) -> int | None:
    try:
        return int(jwt.decode(token, config.SECRET_KEY, algorithms=["HS256"])["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
