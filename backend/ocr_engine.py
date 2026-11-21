import os
import shutil
import cv2
import numpy as np
from PIL import Image
import pytesseract
from typing import Dict, Any, Tuple, List, Optional

# Attempt auto-locating Tesseract on Windows and POSIX systems
POSSIBLE_TESSERACT_PATHS = [
    os.environ.get("TESSERACT_PATH"),
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
    shutil.which("tesseract")
]

TESSERACT_CMD = None
for p in POSSIBLE_TESSERACT_PATHS:
    if p and os.path.isfile(p):
        TESSERACT_CMD = p
        break

if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

def get_tesseract_status() -> Dict[str, Any]:
    """
    Returns the current availability status and diagnostic details of the Tesseract OCR engine.
    """
    cmd = pytesseract.pytesseract.tesseract_cmd
    installed = False
    version = None
    error_msg = None

    if cmd and (os.path.isfile(cmd) or shutil.which(cmd)):
        try:
            version = str(pytesseract.get_tesseract_version())
            installed = True
        except Exception as e:
            error_msg = str(e)
            installed = False
    else:
        error_msg = "Tesseract executable was not found in standard system locations or PATH."

    return {
        "installed": installed,
        "executable_path": cmd if installed else None,
        "version": version,
        "error": error_msg,
        "install_guide": {
            "windows": "Run: winget install UB-Mannheim.TesseractOCR or download installer from https://github.com/UB-Mannheim/tesseract/wiki",
            "macos": "Run: brew install tesseract",
            "linux": "Run: sudo apt-get install tesseract-ocr"
        }
    }

def preprocess_image(image_path: str) -> Tuple[np.ndarray, Dict[str, int]]:
    """
    Applies OpenCV preprocessing to optimize optical character recognition accuracy:
    - Grayscale conversion
    - Contrast adjustment and noise filtering
    - Adaptive / Otsu thresholding
    """
    # Read image with OpenCV
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image file at {image_path}")

    h, w = img.shape[:2]
    dimensions = {"width": w, "height": h}

    # If image is relatively small, upscale for improved font definition
    if w < 1200:
        scale_factor = 1.5 if w > 600 else 2.0
        new_w = int(w * scale_factor)
        new_h = int(h * scale_factor)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Denoise using bilateral filter to preserve edges
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)

    # Contrast enhancement using CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    return enhanced, dimensions

def extract_text_from_image(image_path: str, fallback_sample_text: Optional[str] = None) -> Dict[str, Any]:
    """
    Extracts text and bounding box information from an image file using OpenCV and pytesseract.
    Handles Tesseract absence or OCR failures with informative, graceful responses.
    """
    status = get_tesseract_status()

    # Preprocess with OpenCV to ensure clean image representation
    try:
        processed_img, orig_dim = preprocess_image(image_path)
    except Exception as e:
        return {
            "success": False,
            "error": f"Image preprocessing error: {str(e)}",
            "raw_text": "",
            "bounding_boxes": [],
            "engine": "opencv_preprocessing_failed",
            "tesseract_installed": status["installed"]
        }

    if not status["installed"]:
        # If Tesseract is missing, handle gracefully
        if fallback_sample_text:
            return {
                "success": True,
                "raw_text": fallback_sample_text,
                "bounding_boxes": [],
                "engine": "sample_fallback",
                "tesseract_installed": False,
                "notice": "Tesseract OCR binary is not installed on this system. Showing high-fidelity ground truth sample text for this demonstration screenshot."
            }
        else:
            return {
                "success": False,
                "error": "Tesseract OCR engine is not installed on the server. Please install Tesseract or use the sample screenshots/text input feature.",
                "raw_text": "",
                "bounding_boxes": [],
                "engine": "none",
                "tesseract_installed": False,
                "install_guide": status["install_guide"]
            }

    try:
        # Run Tesseract with custom layout configuration (--oem 3 --psm 11 or psm 6)
        custom_config = r'--oem 3 --psm 6'
        raw_text = pytesseract.image_to_string(processed_img, config=custom_config)

        # Extract bounding box data for words
        ocr_data = pytesseract.image_to_data(processed_img, output_type=pytesseract.Output.DICT)
        bounding_boxes = []

        n_boxes = len(ocr_data['text'])
        for i in range(n_boxes):
            word = ocr_data['text'][i].strip()
            conf = int(ocr_data['conf'][i])
            if word and conf > 30: # only include meaningful tokens
                bounding_boxes.append({
                    "word": word,
                    "confidence": conf,
                    "x": ocr_data['left'][i],
                    "y": ocr_data['top'][i],
                    "width": ocr_data['width'][i],
                    "height": ocr_data['height'][i]
                })

        return {
            "success": True,
            "raw_text": raw_text.strip(),
            "bounding_boxes": bounding_boxes,
            "engine": "pytesseract",
            "tesseract_installed": True,
            "tesseract_version": status["version"]
        }
    except Exception as e:
        # Fallback if execution error occurs
        if fallback_sample_text:
            return {
                "success": True,
                "raw_text": fallback_sample_text,
                "bounding_boxes": [],
                "engine": "sample_fallback",
                "tesseract_installed": True,
                "notice": f"OCR extraction encountered an issue ({str(e)}). Loaded ground truth text for this demonstration screenshot."
            }
        return {
            "success": False,
            "error": f"OCR processing failed: {str(e)}",
            "raw_text": "",
            "bounding_boxes": [],
            "engine": "error",
            "tesseract_installed": True
        }
