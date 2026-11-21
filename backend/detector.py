import re
from typing import List, Dict, Any

class DarkPatternDetector:
    """
    Explainable, rule-based dark pattern detector.
    Analyzes extracted text using transparent lexical heuristics and regular expressions.
    Note: These detections are preliminary indicators based on known deceptive UX design
    patterns, not definitive proof of malicious developer intent.
    """

    PATTERNS_DB = [
        # --- 1. False Urgency ---
        {
            "category": "False Urgency",
            "risk_level": "High Risk",
            "regex": r"\b(only\s+\d+\s+(left|remaining|in\s+stock)|selling\s+fast|almost\s+gone|expires\s+in\s+\d+|offer\s+ends\s+in|deal\s+expires|limited\s+time\s+offer|hurry[,\s!]+last\s+chance|in\s+high\s+demand|order\s+within\s+\d+|countdown|prices?\s+will\s+increase|rare\s+find|few\s+hours\s+left)\b",
            "explanation": "Creates artificial scarcity or immediate time pressure to induce rushed purchasing decisions before the customer can reflect or compare alternatives.",
            "recommendation": "Display factual stock figures only when genuinely limited, without aggressive timers or hyperbolic countdown alerts.",
            "base_confidence": "High"
        },
        {
            "category": "False Urgency",
            "risk_level": "Moderate Risk",
            "regex": r"\b(\d+\s+other\s+(people|shoppers|customers|travelers)\s+are\s+viewing|booked\s+\d+\s+times\s+today|act\s+fast|don'?t\s+miss\s+out|flash\s+sale|before\s+it'?s\s+gone)\b",
            "explanation": "Leverages social proof and FOMO (Fear Of Missing Out) to pressurize the consumer into completing an immediate transaction.",
            "recommendation": "Avoid high-pressure social counters unless strictly verified, aggregate, and non-intrusive.",
            "base_confidence": "Medium"
        },

        # --- 2. Hidden Costs ---
        {
            "category": "Hidden Costs",
            "risk_level": "High Risk",
            "regex": r"\b(convenience\s+fee|processing\s+fee|service\s+charge|mandatory\s+fee|undisclosed\s+fee|additional\s+handling\s+fee|plus\s+taxes\s+and\s+mandatory\s+fees|resort\s+fee\s+not\s+included)\b",
            "explanation": "Drip pricing tactic where non-negotiable fees or unexpected service surcharges are concealed until the late or final stage of checkout.",
            "recommendation": "Present all-inclusive upfront pricing from the initial product display to respect transparent price comparison.",
            "base_confidence": "High"
        },
        {
            "category": "Hidden Costs",
            "risk_level": "High Risk",
            "regex": r"\b(automatically\s+renews\s+at|charged\s+monthly\s+after\s+trial|auto-?renews?\s+for|non-?refundable\s+deposit|subscription\s+converts\s+to\s+paid|billed\s+annually\s+at\s+\$\d+|recurring\s+charge\s+of)\b",
            "explanation": "Concealed recurring billing cycle or automatic subscription conversion that is easy to enter into but not prominently disclosed upfront.",
            "recommendation": "Clearly display the recurring price, renewal frequency, and cancel-anytime policy right next to the call to action.",
            "base_confidence": "High"
        },

        # --- 3. Confirm Shaming ---
        {
            "category": "Confirm Shaming",
            "risk_level": "High Risk",
            "regex": r"\b(no\s*thanks?[,\s]+i\s+(hate|don'?t\s+like|prefer)\s+(saving\s+money|discounts|free\s+cash|deals|staying\s+safe)|no[,\s]+i'?d\s+rather\s+pay\s+full\s+price|no[,\s]+i\s+don'?t\s+care\s+about\s+(my\s+security|quality|savings)|i\s+don'?t\s+want\s+to\s+save|no[,\s]+i\s+want\s+to\s+miss\s+out|no\s*thanks?[,\s]+keep\s+my\s+bill\s+high)\b",
            "explanation": "Emotionally manipulative opt-out copy designed to guilt-trip, insult, or embarrass the user into complying with the primary offer.",
            "recommendation": "Use neutral, respectful opt-out text such as 'No thanks', 'Skip for now', or 'Close'.",
            "base_confidence": "High"
        },
        {
            "category": "Confirm Shaming",
            "risk_level": "Moderate Risk",
            "regex": r"\b(i'?ll\s+risk\s+it|no[,\s]+i\s+hate\s+fun|remind\s+me\s+later\s+and\s+lose\s+discount|no\s*thanks?[,\s]+i'?m\s+not\s+interested\s+in\s+success)\b",
            "explanation": "Subtle emotional steering that frames rejection of an offer as an irrational or risky choice.",
            "recommendation": "Treat both acceptance and decline pathways with equal visual weight and neutral language.",
            "base_confidence": "Medium"
        },

        # --- 4. Forced Action ---
        {
            "category": "Forced Action",
            "risk_level": "High Risk",
            "regex": r"\b(enter\s+your\s+phone\s+number\s+to\s+continue|must\s+allow\s+notifications?\s+to\s+(view|proceed|continue)|mandatory\s+sign-?up|required\s+to\s+proceed|agree\s+to\s+all\s+tracking\s+to\s+access|enable\s+location\s+to\s+view|must\s+complete\s+survey\s+to\s+unlock|share\s+with\s+\d+\s+friends\s+to\s+download)\b",
            "explanation": "Forces users to give up sensitive personal data, grant device permissions, or invite peers as an artificial prerequisite for basic content access.",
            "recommendation": "Decouple access to basic functionality from unnecessary permissions or forced marketing subscriptions.",
            "base_confidence": "High"
        },
        {
            "category": "Forced Action",
            "risk_level": "Moderate Risk",
            "regex": r"\b(you\s+must\s+accept\s+all\s+cookies\s+to\s+view|sign\s+in\s+to\s+read\s+the\s+rest|download\s+app\s+to\s+read\s+article|install\s+extension\s+to\s+proceed)\b",
            "explanation": "Soft gating or friction gates that wall off open content until an auxiliary action is executed.",
            "recommendation": "Offer an easy, one-click 'Reject non-essential' or allow guest browsing mode without forced barriers.",
            "base_confidence": "Medium"
        },

        # --- 5. Trick Questions ---
        {
            "category": "Trick Questions",
            "risk_level": "High Risk",
            "regex": r"\b(uncheck\s+(this\s+box\s+)?if\s+you\s+do\s+not\s+wish|check\s+here\s+to\s+opt-?out|do\s+not\s+send\s+me\s+updates\s+unless\s+unchecked|tick\s+here\s+if\s+you\s+prefer\s+not|check\s+if\s+you\s+do\s+not\s+want\s+to\s+receive|uncheck\s+to\s+avoid\s+charges|by\s+deselecting\s+you\s+agree)\b",
            "explanation": "Confusing double negatives and inverted checkbox states intentionally phrased to mislead users into consenting to unwanted options.",
            "recommendation": "Use straightforward affirmative phrasing (e.g. 'Send me weekly discounts: [ ] Yes') with opt-in unchecked by default.",
            "base_confidence": "High"
        },
        {
            "category": "Trick Questions",
            "risk_level": "Moderate Risk",
            "regex": r"\b(unless\s+you\s+opt-?out|deselect\s+if\s+not\s+wanted|opt-?in\s+by\s+leaving\s+blank|pre-?selected\s+add-?on)\b",
            "explanation": "Non-standard consent phrasing where the default non-action leads to unexpected enrollment.",
            "recommendation": "Adhere to explicit affirmative consent standards with clear positive statements.",
            "base_confidence": "Medium"
        }
    ]

    @classmethod
    def analyze_text(cls, text: str) -> Dict[str, Any]:
        """
        Analyzes the given text string against the transparent rule base.
        Returns a structured dictionary of detected patterns, confidence, and matches.
        """
        if not text or not text.strip():
            return {
                "total_patterns": 0,
                "patterns": [],
                "highest_risk": "None",
                "clean_ui": True,
                "summary": "No text extracted or provided for analysis.",
                "disclaimer": "Analysis is based on keyword and regular expression heuristics. Results are preliminary indicators, not legal determinations of intentional deception."
            }

        detected_patterns = []
        categories_found = set()
        highest_risk = "None"
        risk_hierarchy = {"High Risk": 3, "Moderate Risk": 2, "Informational": 1, "None": 0}

        cleaned_text = " ".join(text.split())

        for rule in cls.PATTERNS_DB:
            regex = re.compile(rule["regex"], re.IGNORECASE)
            matches = list(regex.finditer(cleaned_text))

            if matches:
                matched_phrases = []
                for m in matches:
                    phrase = m.group(0).strip()
                    # Capture surrounding snippet for context (up to 40 chars before and after)
                    start = max(0, m.start() - 30)
                    end = min(len(cleaned_text), m.end() + 30)
                    context_snippet = ("..." if start > 0 else "") + cleaned_text[start:end] + ("..." if end < len(cleaned_text) else "")
                    
                    matched_phrases.append({
                        "phrase": phrase,
                        "context": context_snippet,
                        "start_pos": m.start(),
                        "end_pos": m.end()
                    })

                categories_found.add(rule["category"])
                
                # Check risk level
                if risk_hierarchy.get(rule["risk_level"], 0) > risk_hierarchy.get(highest_risk, 0):
                    highest_risk = rule["risk_level"]

                # Calculate confidence score
                confidence = rule["base_confidence"]
                if len(matched_phrases) > 1 and confidence == "Medium":
                    confidence = "High"

                detected_patterns.append({
                    "id": f"dp_{len(detected_patterns)+1}",
                    "category": rule["category"],
                    "risk_level": rule["risk_level"],
                    "confidence": confidence,
                    "explanation": rule["explanation"],
                    "recommendation": rule["recommendation"],
                    "matches_count": len(matched_phrases),
                    "matches": matched_phrases,
                    "matched_snippets": [p["phrase"] for p in matched_phrases],
                    "heuristic_type": "Deterministic Regex / Lexical Pattern"
                })

        total_patterns = len(detected_patterns)
        is_clean = (total_patterns == 0)

        if is_clean:
            summary = "No suspicious dark pattern keywords or deceptive structures detected in the extracted text."
        else:
            cats = ", ".join(sorted(list(categories_found)))
            summary = f"Detected {total_patterns} potential dark pattern signal(s) across {len(categories_found)} category/categories ({cats})."

        return {
            "total_patterns": total_patterns,
            "patterns": detected_patterns,
            "categories_found": list(categories_found),
            "highest_risk": highest_risk if not is_clean else "None",
            "clean_ui": is_clean,
            "summary": summary,
            "disclaimer": "Preliminary keyword-based indicators only. These heuristics flag common linguistic tropes associated with manipulative UI design and should be reviewed by a human UX auditor rather than taken as proof of malicious deception."
        }
