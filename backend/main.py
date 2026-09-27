from fastapi import FastAPI, HTTPException, Header, status
from pydantic import BaseModel, EmailStr
from typing import Optional

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
    requested_role: str = "client"  # Only 'client' allowed for self-service

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
    # Guardrail: Only 'client' is self-assignable via join code
    if payload.requested_role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Self-service role assignment is restricted to 'client'."
        )

    # Validate auth header present
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token."
        )

    # Placeholder for gym join code validation & tenant resolution
    if payload.join_code != "GYM123":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid gym join code."
        )

    return {
        "status": "success",
        "role": "client",
        "tenant_id": "tenant_gym_001",
        "message": "Role claimed successfully. Metadata updated."
    }
