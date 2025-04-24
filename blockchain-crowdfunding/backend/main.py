from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import pandas as pd
import random
import firebase_admin
from firebase_admin import credentials, auth
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# Initialize Firebase
cred = credentials.Certificate("firebasecredentials.json")
firebase_admin.initialize_app(cred)

# FastAPI app
app = FastAPI()

# Proper CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add frontend domain here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load NGO CSV data
CSV_FILE = 'ngo.csv'
df = pd.read_csv(CSV_FILE)

# OTP settings
OTP_FILE = 'otp_storage.json'
OTP_EXPIRY_MINUTES = 10

# Helper functions
def load_otp_store():
    if os.path.exists(OTP_FILE):
        with open(OTP_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_otp_store(store):
    with open(OTP_FILE, 'w') as f:
        json.dump(store, f)

def clean_expired_otps():
    store = load_otp_store()
    now = datetime.now().timestamp()
    cleaned = {k: v for k, v in store.items() if v['expires_at'] > now}
    save_otp_store(cleaned)
    return cleaned

# Models
class NGOVerification(BaseModel):
    ngo_name: str
    ngo_email: str

class OTPVerification(BaseModel):
    ngo_email: str
    otp: str

class SignupModel(BaseModel):
    ngo_email: str
    password: str

class LoginModel(BaseModel):
    email: str
    password: str

def send_email(recipient, subject, body):
    try:
        sender = os.getenv("MAIL_USERNAME")
        password = os.getenv("MAIL_PASSWORD")
        msg = MIMEMultipart()
        msg["From"] = sender
        msg["To"] = recipient
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender, password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"[EMAIL ERROR]: {e}")
        return False

@app.post("/verify-ngo")
async def verify_ngo(data: NGOVerification):
    print(f"🔍 Verifying NGO: {data.ngo_name}, Email: {data.ngo_email}")

    # Check CSV
    match = df[
        (df['Ngo Name'].str.strip().str.lower() == data.ngo_name.strip().lower()) &
        (df['Email'].str.strip().str.lower() == data.ngo_email.strip().lower())
    ]
    if match.empty:
        raise HTTPException(status_code=401, detail="NGO not found")

    # Firebase check
    try:
        auth.get_user_by_email(data.ngo_email)
        raise HTTPException(status_code=400, detail="NGO already registered")
    except firebase_admin.auth.UserNotFoundError:
        pass

    clean_expired_otps()
    otp = random.randint(100000, 999999)
    expiry = (datetime.now() + timedelta(minutes=OTP_EXPIRY_MINUTES)).timestamp()
    store = load_otp_store()
    store[data.ngo_email] = {"otp": otp, "expires_at": expiry}
    save_otp_store(store)

    body = f"Your OTP is {otp}. It expires in {OTP_EXPIRY_MINUTES} minutes."
    if send_email(data.ngo_email, "NGO OTP Verification", body):
        return {"message": "OTP sent"}
    else:
        raise HTTPException(status_code=500, detail="Email sending failed")

@app.post("/verify-otp")
async def verify_otp(data: OTPVerification):
    store = clean_expired_otps()
    entry = store.get(data.ngo_email)
    if not entry:
        raise HTTPException(status_code=400, detail="OTP expired or not found")
    if int(data.otp) != entry["otp"]:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    del store[data.ngo_email]
    save_otp_store(store)
    return {"message": "OTP verified"}

@app.post("/complete-signup")
async def complete_signup(data: SignupModel):
    match = df[df['Email'].str.strip().str.lower() == data.ngo_email.strip().lower()]
    if match.empty:
        raise HTTPException(status_code=404, detail="NGO not found in CSV")
    name = match.iloc[0]["Ngo Name"]
    try:
        user = auth.create_user(
            email=data.ngo_email,
            password=data.password,
            display_name=name
        )
        return {"message": "Signup successful", "uid": user.uid}
    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail="Email already exists")
    except Exception as e:
        print(f"[SIGNUP ERROR]: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
async def login(data: LoginModel):
    try:
        user = auth.get_user_by_email(data.email)
        return {
            "message": "Login success",
            "uid": user.uid,
            "ngo_name": user.display_name,
            "email": user.email
        }
    except auth.UserNotFoundError:
        raise HTTPException(status_code=401, detail="Invalid email")
    except Exception as e:
        print(f"[LOGIN ERROR]: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.get("/")
def root():
    return {"message": "NGO Verification API is running"}

