import os
import re
import traceback
import logging
from typing import List, Dict, Any
import torch.nn as nn
import torchvision.transforms as transforms

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import pytesseract
from PIL import Image
import io
import torch
import torchvision.models as models

# Initialize FastAPI
app = FastAPI(title="NGO Invoice Analysis API")
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load PyTorch model (assuming model.pth is in the same directory)
def load_model():
    model = models.efficientnet_b0(pretrained=False)
    model.classifier[1] = nn.Linear(1280, 2)
    try:
        state_dict = torch.load("model.pth", map_location=torch.device('cpu'))
        model.load_state_dict(state_dict)
    except Exception as e:
        print(f"Error loading model: {e}")
    model.eval()
    return model

MODEL = load_model()

def extract_text_from_image(file):
    """Extract text from uploaded image file"""
    try:
        file.file.seek(0)  # Reset file pointer
        image = Image.open(io.BytesIO(file.file.read()))
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        logger.error(f"Error extracting text from image: {e}")
        return ""


def analyze_invoice_text(text):
    """Advanced invoice text analysis with multiple extraction strategies"""
    lines = text.split('\n')
    total_amount = 0
    invoice_details = {
        "raw_text": text,
        "lines": lines,
        "potential_amounts": [],
        "metadata": {}
    }
    
    # Regex patterns for extraction
    date_patterns = [
    r"(?:Date|Printed Date|Invoice Date)\s*[:=]?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})",
    r"\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b",
    r"\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\b",
    r"\b(\d{1,2}\s*[A-Za-z]{3,9}\s*\d{4})\b",  
    r"(?:Date|Printed\s*Date|Invoice\s*Date)\s*[=:]?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})",
    r"\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\b"
    ]
    amount_patterns = [
    r"TOTAL\s*INCL\.?\s*GST@?\s*\d*%?\s*RM\s*([\d,]+\.\d{2})",
    r"Net\s*Total\s*Rounded\s*\(MYR\)\s*[:=]?\s*-?\s*\$?([\d,]+\.\d{2})",
    r"Total\s*Incl\.?\s*GST@?\s*\d*%?\s*RM\s*([\d,]+\.\d{2})",
    r"TOTAL\s*\(?INCL\.?\s*GST\)?\s*[:=]?\s*-?\s*\$?([\d,]+\.\d{2})",
    r"TOTAL\s*[:=]?\s*-?\s*\$?([\d,]+\.\d{2})",
    r"Grand\s*Total\s*[:=]?\s*-?\s*\$?([\d,]+\.\d{2})",
    r"Nett\s*Total\s*[:=]?\s*-?\s*\$?([\d,]+\.\d{2})",
    r"Total\s*Payable\s*[:=]?\s*-?\s*\$?([\d,]+\.\d{2})",
    r"Total\s*Amount\s*[:=]?\s*-?\s*\$?([\d,]+\.\d{2})",
    r"Amount\s*Due\s*[:=]?\s*-?\s*\$?([\d,]+\.\d{2})",
    r"Invoice\s*Total\s*[:=]?\s*-?\s*\$?([\d,]+\.\d{2})",
    r"Balance\s*Due\s*[:=]?\s*-?\s*\$?([\d,]+\.\d{2})",
    r"Net\s*Amount\s*[:=]?\s*-?\s*\$?([\d,]+\.\d{2})",
    r"Final\s*Amount\s*[:=]?\s*-?\s*\$?([\d,]+\.\d{2})",
    r"Sub\s*Total\s*\(?\s*RM\s*\)?\s*[:=]?\s*-?\s*\$?([\d,]+\.\d{2})",
    r"Total\s*\(?\s*RM\s*\)?\s*[:=]?\s*-?\s*\$?([\d,]+\.\d{2})",
    r"Rounding\s*\(?\s*RM\s*\)?\s*[:=]?\s*-?\s*\$?([\d,]+\.\d{2})",
    r"Change\s*\(?\s*RM\s*\)?\s*[:=]?\s*-?\s*\$?([\d,]+\.\d{2})"
    ]

    
    invoice_no_patterns = [
        r'Invoice\s*[#No.]?\s*(\w+)',
        r'Receipt\s*[#No.]?\s*(\w+)',
    ]

    # Extract amounts
    for pattern in amount_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            try:
                amount = float(match.replace(',', ''))
                if amount > 0:
                    invoice_details['potential_amounts'].append(amount)
                    total_amount += amount
            except ValueError:
                continue
    
    # Extract date
    date_matches = re.findall(date_patterns[0], text)
    invoice_details['metadata']['date'] = date_matches[0] if date_matches else "Unknown"
    
    # Extract invoice number
    invoice_no_matches = re.findall(invoice_no_patterns[0], text)
    invoice_details['metadata']['invoice_no'] = invoice_no_matches[0] if invoice_no_matches else "Unknown"
    
    invoice_details['total_amount'] = total_amount
    return invoice_details





# @app.post("/analyze-campaign-invoices")
# async def analyze_campaign_invoices(
#     campaign_id: str = Query(..., description="Campaign ID to analyze"),
#     goal_amount: float = Query(..., description="Target amount for the campaign"),
#     files: List[UploadFile] = File(...)
# ):
#     """
#     Analyze invoices for a specific campaign and check if:
#     - Total extracted amount > Goal amount
#     - At least 75% of invoices are authentic

#     Args:
#         campaign_id (str): Unique identifier for the campaign
#         goal_amount (float): The minimum amount required
#         files (List[UploadFile]): List of invoice files to analyze
#     """
#     logger.info(f"Processing campaign {campaign_id} with {len(files)} files")

#     try:
#         invoice_analyses = []
#         total_extracted_amount = 0
#         authentic_count = 0  # Count of invoices marked as "Authentic"

#         for file in files:
#             file.file.seek(0)  # Reset file pointer
#             image = Image.open(io.BytesIO(file.file.read()))

#             # Extract text from image
#             extracted_text = pytesseract.image_to_string(image)

#             # Analyze extracted text
#             invoice_analysis = analyze_invoice_text(extracted_text)
#             invoice_amount = invoice_analysis.get('total_amount', 0)
#             total_extracted_amount += invoice_amount

#             # Run tampering detection
#             tampering_result = predict_tampering(image)

#             # Count authentic invoices
#             if tampering_result == "Authentic":
#                 authentic_count += 1

#             invoice_analyses.append({
#                 "amount": invoice_amount,
#                 "tampering_result": tampering_result
#             })

#         # ✅ Check conditions
#         total_files = len(files)
#         authentic_count = sum(1 for analysis in invoice_analyses if analysis['tampering_result'] == "✅ Authentic")
#         authenticity_percentage = (authentic_count / total_files) * 100 if total_files > 0 else 0
#         meets_conditions = total_extracted_amount > goal_amount and authenticity_percentage >= 75

#         return {
#             "campaign_id": campaign_id,
#             "total_files": total_files,
#             "invoice_analyses": invoice_analyses,
#             "total_extracted_amount": total_extracted_amount,
#             "authentic_percentage": authenticity_percentage,
#             "meets_conditions": meets_conditions  # ✅ True if conditions met, False otherwise
#         }
        

#     except Exception as e:
#         logger.error(f"Error in campaign invoice analysis: {e}")
#         logger.error(traceback.format_exc())
#         raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-campaign-invoices")
async def analyze_campaign_invoices(
    campaign_id: str = Query(..., description="Campaign ID to analyze"),
    goal_amount: float = Query(..., description="Target amount for the campaign"),
    files: List[UploadFile] = File(...)
):
    """
    Analyze invoices for a specific campaign and check if:
    - Total extracted amount > Goal amount
    - At least 75% of invoices are authentic

    Args:
        campaign_id (str): Unique identifier for the campaign
        goal_amount (float): The minimum amount required
        files (List[UploadFile]): List of invoice files to analyze
    """
    logger.info(f"Processing campaign {campaign_id} with {len(files)} files")

    try:
        total_extracted_amount = 0
        authentic_count = 0  # Count of invoices marked as "Authentic"
        total_files = len(files)

        for file in files:
            file.file.seek(0)  # Reset file pointer
            image = Image.open(io.BytesIO(file.file.read()))

            # Extract text from image
            extracted_text = pytesseract.image_to_string(image)

            # Analyze extracted text
            invoice_analysis = analyze_invoice_text(extracted_text)
            invoice_amount = invoice_analysis.get('total_amount', 0)
            total_extracted_amount += invoice_amount

            # Run tampering detection
            tampering_result = predict_tampering(image)

            # Count authentic invoices
            if tampering_result in ["Authentic", "✅ Authentic"]:
                authentic_count += 1

        # ✅ Calculate authenticity percentage
        authenticity_percentage = (authentic_count / total_files) * 100 if total_files > 0 else 0
        meets_conditions =  authenticity_percentage >= 75

        return {
            "campaign_id": campaign_id,
            "total_files": total_files,
            "authentic_percentage": authenticity_percentage,
            "meets_conditions": meets_conditions  # ✅ True if conditions met, False otherwise
        }

    except Exception as e:
        logger.error(f"Error in campaign invoice analysis: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))



    
def predict_tampering(image):
    image_tensor = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])(image.convert("RGB")).unsqueeze(0)

    with torch.no_grad():
        output = MODEL(image_tensor) 
        tampering_score = torch.softmax(output, dim=1)[0][1].item()

    return "❌ Tampered" if tampering_score > 0.6 else "✅ Authentic"
# Startup message and configuration
@app.on_event("startup")
async def startup_event():
    logger.info("NGO Invoice Analysis API started successfully!")

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)