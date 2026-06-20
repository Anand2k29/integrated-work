import jwt
from datetime import datetime

def decode_token(token):
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})

        exp = decoded.get("exp")
        expired = False

        if exp:
            expired = datetime.fromtimestamp(exp) < datetime.now()

        return {
            "user_id": decoded.get("user_id") or decoded.get("sub"),
            "role": decoded.get("role"),
            "tenant_id": decoded.get("tenant_id"),
            "permissions": decoded.get("permissions", []),
            "expired": expired,
            "raw_claims": decoded
        }

    except Exception as e:
        return {"error": str(e)}