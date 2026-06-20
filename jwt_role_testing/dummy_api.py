from fastapi import FastAPI, Header, HTTPException
import jwt

app = FastAPI()
SECRET = "demo_secret"

def get_role_from_token(auth_header):
    try:
        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, SECRET, algorithms=["HS256"])
        return decoded.get("role")
    except Exception:
        return None

@app.get("/")
def home():
    return {"message": "NEW SECURE API IS RUNNING"}

@app.get("/api/admin/users")
def admin_users(authorization: str = Header(None)):
    role = get_role_from_token(authorization)

    if role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    return {"message": "Admin users data accessed"}

@app.get("/api/users/2/profile")
def user_profile(authorization: str = Header(None)):
    role = get_role_from_token(authorization)

    if role not in ["admin", "user"]:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return {"message": "User profile data accessed"}