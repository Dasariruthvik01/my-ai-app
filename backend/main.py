from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional

app = FastAPI(title="Gym Point API", version="1.0.0")

# Request / Response Models
class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    code: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@app.get("/")
def read_root():
    return {"status": "online", "app": "Gym Point API"}

@app.post("/api/v1/auth/request-otp", status_code=status.HTTP_200_OK)
def request_otp(payload: OTPRequest):
    # Placeholder for Email-OTP dispatch service
    return {"message": f"OTP sent to {payload.email}"}

@app.post("/api/v1/auth/verify-otp", response_model=TokenResponse)
def verify_otp(payload: OTPVerify):
    # Placeholder for OTP verification check
    if payload.code == "123456":  # Dev placeholder
        return TokenResponse(access_token="pretenant_jwt_sample_token")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, 
        detail="Invalid verification code"
    )
