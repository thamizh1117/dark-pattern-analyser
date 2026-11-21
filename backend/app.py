import os
import sys
import uuid

# Ensure backend directory is in sys.path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BACKEND_DIR)

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from detector import DarkPatternDetector
from ocr_engine import extract_text_from_image, get_tesseract_status
from database import (
    init_db,
    save_scan,
    get_all_scans,
    get_scan_by_id,
    delete_scan,
    get_analytics_summary,
)
from sample_generator import (
    SAMPLES_DIR,
    UPLOADS_DIR,
    SAMPLE_DEFINITIONS,
    get_sample_list,
    generate_sample_images,
)


# ==========================================
# APPLICATION CONFIGURATION
# ==========================================

app = Flask(__name__)

# Allow React development server to communicate with Flask
CORS(app)

# Server configuration
HOST = "127.0.0.1"
PORT = 5005

# Allowed screenshot formats
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

# Frontend production build directory
FRONTEND_DIST = os.path.abspath(
    os.path.join(BACKEND_DIR, "..", "frontend", "dist")
)


# ==========================================
# HELPER FUNCTIONS
# ==========================================

def allowed_file(filename: str) -> bool:
    """Check whether the uploaded file has an allowed extension."""
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


# ==========================================
# INITIALIZE DATABASE AND SAMPLE IMAGES
# ==========================================

init_db()
generate_sample_images()


# ==========================================
# HEALTH CHECK
# ==========================================

@app.route("/api/health", methods=["GET"])
def health():
    """Return application and dependency status."""
    tesseract_info = get_tesseract_status()

    return jsonify({
        "status": "healthy",
        "service": "Dark Pattern Visualizer API",
        "port": PORT,
        "tesseract": tesseract_info,
        "database": "SQLite connected",
        "supported_extensions": list(ALLOWED_EXTENSIONS),
    }), 200


# ==========================================
# DEMONSTRATION SAMPLES
# ==========================================

@app.route("/api/samples", methods=["GET"])
def list_samples():
    """Return the available demonstration screenshots."""
    return jsonify({
        "samples": get_sample_list()
    }), 200


@app.route("/api/samples/<filename>", methods=["GET"])
def serve_sample_image(filename: str):
    """Serve a bundled demonstration screenshot."""
    return send_from_directory(
        SAMPLES_DIR,
        secure_filename(filename)
    )


# ==========================================
# UPLOADED SCREENSHOTS
# ==========================================

@app.route("/api/uploads/<filename>", methods=["GET"])
def serve_upload_image(filename: str):
    """Serve a previously uploaded screenshot."""
    return send_from_directory(
        UPLOADS_DIR,
        secure_filename(filename)
    )


# ==========================================
# SCREENSHOT ANALYSIS
# ==========================================

@app.route("/api/analyze-image", methods=["POST"])
def analyze_image():
    """Extract text from a screenshot and detect dark patterns."""

    # Check whether a bundled sample was selected
    sample_id = request.form.get("sample_id")

    if not sample_id:
        json_data = request.get_json(silent=True) or {}
        sample_id = json_data.get("sample_id")

    saved_filepath = None
    stored_filename = None
    original_filename = None
    sample_ground_truth_text = None

    # --------------------------------------
    # MODE 1: DEMONSTRATION SAMPLE
    # --------------------------------------

    if sample_id:
        matched_sample = next(
            (
                sample
                for sample in SAMPLE_DEFINITIONS
                if sample["id"] == sample_id
                or sample["filename"] == sample_id
            ),
            None,
        )

        if not matched_sample:
            return jsonify({
                "error": f"Sample with ID '{sample_id}' not found."
            }), 404

        stored_filename = matched_sample["filename"]
        original_filename = matched_sample["filename"]

        saved_filepath = os.path.join(
            SAMPLES_DIR,
            stored_filename
        )

        sample_ground_truth_text = matched_sample["text"]

        image_url = f"/api/samples/{stored_filename}"

        if not os.path.isfile(saved_filepath):
            return jsonify({
                "error": "The selected demonstration image is missing."
            }), 404

        file_size_kb = round(
            os.path.getsize(saved_filepath) / 1024,
            2,
        )

    # --------------------------------------
    # MODE 2: USER UPLOAD
    # --------------------------------------

    else:
        if "file" not in request.files:
            return jsonify({
                "error": "No screenshot uploaded. Expected field: 'file'."
            }), 400

        uploaded_file = request.files["file"]

        if not uploaded_file.filename:
            return jsonify({
                "error": "No file selected."
            }), 400

        if not allowed_file(uploaded_file.filename):
            return jsonify({
                "error": (
                    "Invalid file format. "
                    "Only PNG, JPG, and JPEG are accepted."
                )
            }), 400

        original_filename = secure_filename(
            uploaded_file.filename
        )

        if not original_filename or "." not in original_filename:
            return jsonify({
                "error": "Invalid filename."
            }), 400

        extension = original_filename.rsplit(".", 1)[1].lower()

        stored_filename = f"scan_{uuid.uuid4().hex[:10]}.{extension}"

        saved_filepath = os.path.join(
            UPLOADS_DIR,
            stored_filename
        )

        try:
            os.makedirs(UPLOADS_DIR, exist_ok=True)
            uploaded_file.save(saved_filepath)

        except OSError:
            app.logger.exception("Failed to save uploaded screenshot")

            return jsonify({
                "error": "Failed to save the uploaded screenshot."
            }), 500

        image_url = f"/api/uploads/{stored_filename}"

        file_size_kb = round(
            os.path.getsize(saved_filepath) / 1024,
            2,
        )

    # --------------------------------------
    # OCR TEXT EXTRACTION
    # --------------------------------------

    try:
        ocr_result = extract_text_from_image(
            saved_filepath,
            fallback_sample_text=sample_ground_truth_text,
        )

    except Exception:
        app.logger.exception("OCR processing failed")

        return jsonify({
            "error": "Screenshot text extraction failed."
        }), 500

    extracted_text = ocr_result.get("raw_text", "")

    # --------------------------------------
    # DARK PATTERN DETECTION
    # --------------------------------------

    try:
        analysis_result = DarkPatternDetector.analyze_text(
            extracted_text
        )

    except Exception:
        app.logger.exception("Dark pattern analysis failed")

        return jsonify({
            "error": "Screenshot analysis failed."
        }), 500

    # --------------------------------------
    # SAVE SCAN TO SQLITE
    # --------------------------------------

    ocr_status = (
        "ok"
        if ocr_result.get("success")
        else "ocr_warning"
    )

    if ocr_result.get("engine") == "sample_fallback":
        ocr_status = "sample_fallback"

    try:
        scan_id = save_scan(
            filename=original_filename,
            image_path=image_url,
            file_size_kb=file_size_kb,
            raw_text=extracted_text,
            analysis_result=analysis_result,
            ocr_engine_status=ocr_status,
        )

    except Exception:
        app.logger.exception("Failed to save scan to SQLite")

        return jsonify({
            "error": "Analysis completed, but saving the scan failed."
        }), 500

    # --------------------------------------
    # RETURN ANALYSIS RESULTS
    # --------------------------------------

    return jsonify({
        "scan_id": scan_id,
        "filename": original_filename,
        "image_url": image_url,
        "file_size_kb": file_size_kb,

        "ocr_info": {
            "success": ocr_result.get("success", False),
            "engine": ocr_result.get("engine", "unknown"),
            "tesseract_installed": ocr_result.get(
                "tesseract_installed",
                False,
            ),
            "notice": ocr_result.get("notice"),
            "error": ocr_result.get("error"),
            "bounding_boxes_count": len(
                ocr_result.get("bounding_boxes", [])
            ),
            "install_guide": ocr_result.get("install_guide"),
        },

        "extracted_text": extracted_text,
        "bounding_boxes": ocr_result.get("bounding_boxes", []),
        "analysis": analysis_result,
    }), 200


# ==========================================
# DIRECT TEXT ANALYSIS
# ==========================================

@app.route("/api/analyze-text", methods=["POST"])
def analyze_text_route():
    """Analyze pasted website or application interface text."""

    data = request.get_json(silent=True) or {}

    text = data.get("text", "")
    title = data.get("title", "Custom Text Analysis")

    if not isinstance(text, str) or not text.strip():
        return jsonify({
            "error": "No valid text provided for analysis."
        }), 400

    if not isinstance(title, str):
        title = "Custom Text Analysis"

    try:
        analysis_result = DarkPatternDetector.analyze_text(text)

        scan_id = save_scan(
            filename=f"[Text] {title[:30]}",
            image_path=None,
            file_size_kb=round(len(text.encode("utf-8")) / 1024, 2),
            raw_text=text,
            analysis_result=analysis_result,
            ocr_engine_status="direct_text",
        )

    except Exception:
        app.logger.exception("Direct text analysis failed")

        return jsonify({
            "error": "Unable to complete text analysis."
        }), 500

    return jsonify({
        "scan_id": scan_id,
        "filename": f"[Text] {title[:30]}",
        "image_url": None,
        "file_size_kb": round(
            len(text.encode("utf-8")) / 1024,
            2,
        ),

        "ocr_info": {
            "success": True,
            "engine": "direct_input",
            "tesseract_installed": get_tesseract_status().get(
                "installed",
                False,
            ),
        },

        "extracted_text": text,
        "bounding_boxes": [],
        "analysis": analysis_result,
    }), 200


# ==========================================
# SCAN HISTORY
# ==========================================

@app.route("/api/history", methods=["GET"])
def history():
    """Return saved scan history."""

    limit = request.args.get(
        "limit",
        default=50,
        type=int,
    )

    if limit is None or limit < 1:
        limit = 50

    limit = min(limit, 500)

    try:
        scans = get_all_scans(limit=limit)

        return jsonify({
            "scans": scans,
            "total_records": len(scans),
        }), 200

    except Exception:
        app.logger.exception("Unable to retrieve scan history")

        return jsonify({
            "error": "Unable to retrieve scan history."
        }), 500


@app.route("/api/history/<int:scan_id>", methods=["GET"])
def get_single_scan(scan_id: int):
    """Retrieve a single saved scan."""

    scan = get_scan_by_id(scan_id)

    if not scan:
        return jsonify({
            "error": f"Scan with ID {scan_id} not found."
        }), 404

    return jsonify({
        "scan": scan
    }), 200


@app.route("/api/history/<int:scan_id>", methods=["DELETE"])
def delete_single_scan(scan_id: int):
    """Delete a saved scan."""

    success = delete_scan(scan_id)

    if not success:
        return jsonify({
            "error": (
                f"Scan with ID {scan_id} not found "
                "or already deleted."
            )
        }), 404

    return jsonify({
        "message": f"Scan {scan_id} successfully deleted.",
        "success": True,
    }), 200


# ==========================================
# ANALYTICS DASHBOARD
# ==========================================

@app.route("/api/analytics", methods=["GET"])
def analytics():
    """Return scan analytics and category statistics."""

    try:
        stats = get_analytics_summary()

        return jsonify(stats), 200

    except Exception:
        app.logger.exception("Unable to retrieve analytics")

        return jsonify({
            "error": "Unable to retrieve analytics."
        }), 500


# ==========================================
# REACT FRONTEND
# ==========================================

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    """Serve the compiled React frontend and its assets."""

    # Do not redirect unknown API requests to index.html
    if path == "api" or path.startswith("api/"):
        return jsonify({
            "error": f"API endpoint '/{path}' not found"
        }), 404

    # Serve existing frontend assets
    if path:
        requested_path = os.path.abspath(
            os.path.join(FRONTEND_DIST, path)
        )

        # Ensure requested assets remain inside the frontend directory
        if (
            os.path.commonpath([FRONTEND_DIST, requested_path])
            == FRONTEND_DIST
            and os.path.isfile(requested_path)
        ):
            return send_from_directory(
                FRONTEND_DIST,
                path,
            )

    # Serve React entry point
    index_file = os.path.join(
        FRONTEND_DIST,
        "index.html",
    )

    if os.path.isfile(index_file):
        return send_from_directory(
            FRONTEND_DIST,
            "index.html",
        )

    return jsonify({
        "message": "Dark Pattern Visualizer API is running.",
        "hint": (
            "Run 'npm run dev' inside the frontend directory "
            "or run 'npm run build' to compile the React UI."
        ),
        "api_health": "/api/health",
    }), 200


# ==========================================
# START SERVER
# ==========================================

if __name__ == "__main__":
    print(
        f"Starting Dark Pattern Visualizer Flask Backend "
        f"on http://{HOST}:{PORT} ..."
    )

    app.run(
        host=HOST,
        port=PORT,
        debug=True,
    )
