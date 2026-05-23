import jwt
import time

secret = "demo_secret"

tokens = {
    "admin": jwt.encode({
        "user_id": "1",
        "role": "admin",
        "tenant_id": "tenant_A",
        "exp": int(time.time()) + 3600
    }, secret, algorithm="HS256"),

    "user_a": jwt.encode({
        "user_id": "2",
        "role": "user",
        "tenant_id": "tenant_A",
        "exp": int(time.time()) + 3600
    }, secret, algorithm="HS256"),

    "user_b": jwt.encode({
        "user_id": "3",
        "role": "user",
        "tenant_id": "tenant_B",
        "exp": int(time.time()) + 3600
    }, secret, algorithm="HS256")
}

for name, token in tokens.items():
    print(name, ":", token)