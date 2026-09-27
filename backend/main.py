from fastapi import FastAPI, HTTPException, Header, status
from pydantic import BaseModel, EmailStr
from typing import Optional
import secrets

app = FastAPI(title="Gym Point API", version="1.0.0")

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    code: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ClaimRoleRequest(BaseModel):
    join_code: str
    requested_role: str = "client"

class WorkerInviteRequest(BaseModel):
    worker_email: EmailStr

class WorkerInviteVerify(BaseModel):
    invite_token: str
    pin: str

@app.get("/")
def read_root():
    return {"status": "online", "app": "Gym Point API"}

@app.post("/api/v1/auth/request-otp", status_code=status.HTTP_200_OK)
def request_otp(payload: OTPRequest):
    return {"message": f"OTP sent to {payload.email}"}

@app.post("/api/v1/auth/verify-otp", response_model=TokenResponse)
def verify_otp(payload: OTPVerify):
    if payload.code == "123456":
        return TokenResponse(access_token="pretenant_jwt_sample_token")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, 
        detail="Invalid verification code"
    )

@app.post("/api/v1/auth/claim-role", status_code=status.HTTP_200_OK)
def claim_role(payload: ClaimRoleRequest, authorization: Optional[str] = Header(None)):
    if payload.requested_role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Self-service role assignment is restricted to 'client'."
        )

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token."
        )

    if payload.join_code != "GYM123":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid gym join code."
        )

    return {
        "status": "success",
        "role": "client",
        "tenant_id": "tenant_gym_001",
        "message": "Role claimed successfully."
    }

@app.post("/api/v1/invites/worker/create", status_code=status.HTTP_201_CREATED)
def create_worker_invite(payload: WorkerInviteRequest, authorization: Optional[str] = Header(None)):
    # Invite-only flow issued by Owner
    invite_token = secrets.token_urlsafe(16)
    return {
        "status": "success",
        "invite_token": invite_token,
        "assigned_role": "worker",
        "message": f"Invite token created for {payload.worker_email}"
    }

@app.post("/api/v1/invites/worker/accept", status_code=status.HTTP_200_OK)
def accept_worker_invite(payload: WorkerInviteVerify):
    if len(payload.pin) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN must be at least 4 digits."
        )
    return {
        "status": "success",
        "role": "worker",
        "message": "Worker invite accepted and PIN set."
    }
