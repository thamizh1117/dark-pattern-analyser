import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "dark_patterns.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            image_path TEXT,
            file_size_kb REAL DEFAULT 0,
            uploaded_at TEXT NOT NULL,
            raw_text TEXT,
            clean_text TEXT,
            patterns_count INTEGER DEFAULT 0,
            highest_risk TEXT DEFAULT 'None',
            ocr_engine_status TEXT DEFAULT 'ok',
            analysis_json TEXT
        )
    """)
    conn.commit()
    conn.close()

def save_scan(
    filename: str,
    image_path: Optional[str],
    file_size_kb: float,
    raw_text: str,
    analysis_result: Dict[str, Any],
    ocr_engine_status: str = "ok"
) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    clean_text = " ".join(raw_text.split()) if raw_text else ""
    patterns_count = analysis_result.get("total_patterns", 0)
    highest_risk = analysis_result.get("highest_risk", "None")
    analysis_json_str = json.dumps(analysis_result)

    cursor.execute("""
        INSERT INTO scans (
            filename, image_path, file_size_kb, uploaded_at, 
            raw_text, clean_text, patterns_count, highest_risk, 
            ocr_engine_status, analysis_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        filename, image_path, file_size_kb, now_str,
        raw_text, clean_text, patterns_count, highest_risk,
        ocr_engine_status, analysis_json_str
    ))
    scan_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return scan_id

def get_all_scans(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, filename, image_path, file_size_kb, uploaded_at,
               clean_text, patterns_count, highest_risk, ocr_engine_status, analysis_json
        FROM scans
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    results = []
    for r in rows:
        row_dict = dict(r)
        if row_dict.get("analysis_json"):
            try:
                row_dict["analysis"] = json.loads(row_dict["analysis_json"])
            except Exception:
                row_dict["analysis"] = None
        results.append(row_dict)
    conn.close()
    return results

def get_scan_by_id(scan_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, filename, image_path, file_size_kb, uploaded_at,
               raw_text, clean_text, patterns_count, highest_risk, 
               ocr_engine_status, analysis_json
        FROM scans
        WHERE id = ?
    """, (scan_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    res = dict(row)
    if res.get("analysis_json"):
        try:
            res["analysis"] = json.loads(res["analysis_json"])
        except Exception:
            res["analysis"] = None
    return res

def delete_scan(scan_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM scans WHERE id = ?", (scan_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_analytics_summary() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Total scans
    cursor.execute("SELECT COUNT(*) FROM scans")
    total_scans = cursor.fetchone()[0]

    # Clean vs Deceptive
    cursor.execute("SELECT COUNT(*) FROM scans WHERE patterns_count = 0")
    clean_scans = cursor.fetchone()[0]
    flagged_scans = total_scans - clean_scans

    # Total patterns detected
    cursor.execute("SELECT SUM(patterns_count) FROM scans")
    sum_patterns = cursor.fetchone()[0] or 0

    # Risk breakdown
    cursor.execute("SELECT highest_risk, COUNT(*) FROM scans GROUP BY highest_risk")
    risk_rows = cursor.fetchall()
    risk_breakdown = {r[0]: r[1] for r in risk_rows}

    # Category breakdown by inspecting analysis_json
    cursor.execute("SELECT analysis_json FROM scans WHERE patterns_count > 0")
    json_rows = cursor.fetchall()
    category_counts = {
        "False Urgency": 0,
        "Hidden Costs": 0,
        "Confirm Shaming": 0,
        "Forced Action": 0,
        "Trick Questions": 0
    }

    for (j_str,) in json_rows:
        if not j_str:
            continue
        try:
            data = json.loads(j_str)
            for p in data.get("patterns", []):
                cat = p.get("category")
                if cat in category_counts:
                    category_counts[cat] += 1
                else:
                    category_counts[cat] = category_counts.get(cat, 0) + 1
        except Exception:
            pass

    conn.close()

    return {
        "total_scans": total_scans,
        "clean_scans": clean_scans,
        "flagged_scans": flagged_scans,
        "total_patterns_detected": sum_patterns,
        "risk_breakdown": risk_breakdown,
        "category_counts": category_counts
    }
