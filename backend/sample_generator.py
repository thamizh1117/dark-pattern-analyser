import os
from PIL import Image, ImageDraw, ImageFont
from typing import List, Dict, Any

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "samples")
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")

os.makedirs(SAMPLES_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

SAMPLE_DEFINITIONS = [
    {
        "id": "sample_urgency",
        "filename": "sample_urgency.png",
        "title": "False Urgency - Flash Countdown & Scarcity",
        "category": "False Urgency",
        "description": "Artificially pressurized checkout with countdown timer and exaggerated scarcity claims.",
        "text": "MegaDeals Electronics. Ultra Wireless ANC Headphones Pro. Regular Price: $229.00. Special Offer: $129.99. HURRY, LAST CHANCE! Only 2 left in stock! Deal expires in 04:59. 18 other shoppers are viewing this right now! Order within 5 minutes to guarantee delivery.",
        "bg_color": (248, 250, 252),
        "header_color": (15, 23, 42),
        "accent_color": (225, 29, 72), # Red
        "badge_text": "HIGH RISK: FALSE URGENCY",
        "elements": [
            ("title", "MegaDeals Electronics - Product Page", 30, (30, 41, 59)),
            ("heading", "Ultra Wireless ANC Headphones Pro", 22, (15, 23, 42)),
            ("price", "$129.99 (40% OFF)", 26, (16, 185, 129)),
            ("banner", "HURRY, LAST CHANCE! Only 2 left in stock!", 20, (225, 29, 72)),
            ("sub", "Deal expires in 04:59 - Order within 5 minutes!", 16, (185, 28, 28)),
            ("social", "18 other shoppers are viewing this right now!", 15, (100, 116, 139)),
            ("btn", "[ ADD TO CART - BUY NOW ]", 18, (255, 255, 255), (225, 29, 72))
        ]
    },
    {
        "id": "sample_confirm_shaming",
        "filename": "sample_confirm_shaming.png",
        "title": "Confirm Shaming - Guilt Trip Opt-Out",
        "category": "Confirm Shaming",
        "description": "Manipulative popup dialog using derogatory opt-out text to guilt users into purchasing.",
        "text": "EXCLUSIVE OFFER! Unlock 25% OFF your entire cart today! Join 50,000 smart shoppers who never overpay. [CLAIM MY 25% DISCOUNT] No thanks, I hate saving money and prefer paying full price.",
        "bg_color": (241, 245, 249),
        "header_color": (15, 23, 42),
        "accent_color": (79, 70, 229), # Indigo
        "badge_text": "HIGH RISK: CONFIRM SHAMING",
        "elements": [
            ("title", "StyleHub Fashion - VIP Club Popup", 28, (30, 41, 59)),
            ("heading", "EXCLUSIVE OFFER! Unlock 25% OFF Today!", 22, (79, 70, 229)),
            ("sub", "Join 50,000 smart shoppers who never overpay.", 16, (71, 85, 105)),
            ("btn", "[ YES! CLAIM MY 25% DISCOUNT ]", 18, (255, 255, 255), (16, 185, 129)),
            ("shame", "No thanks, I hate saving money and prefer paying full price.", 15, (148, 163, 184))
        ]
    },
    {
        "id": "sample_hidden_costs",
        "filename": "sample_hidden_costs.png",
        "title": "Hidden Costs - Drip Pricing & Stealth Subscriptions",
        "category": "Hidden Costs",
        "description": "Hidden processing fees and undisclosed recurring monthly billing slipped into final order summary.",
        "text": "Checkout Order Summary. Event Ticket: $50.00. Subtotal: $50.00. Mandatory convenience fee: $12.50. Processing fee: $6.00. Automatically renews at $19.99 charged monthly after trial unless cancelled. Total Due: $88.49.",
        "bg_color": (255, 255, 255),
        "header_color": (15, 23, 42),
        "accent_color": (217, 119, 6), # Amber
        "badge_text": "HIGH RISK: HIDDEN COSTS",
        "elements": [
            ("title", "TicketMaster Express - Final Checkout", 28, (30, 41, 59)),
            ("heading", "Order Summary & Payment Review", 22, (15, 23, 42)),
            ("line1", "Base Ticket Price: $50.00", 16, (51, 65, 85)),
            ("fee1", "+ Mandatory convenience fee: $12.50", 15, (225, 29, 72)),
            ("fee2", "+ Additional handling and processing fee: $6.00", 15, (225, 29, 72)),
            ("auto", "Note: Automatically renews at $19.99 charged monthly after trial.", 14, (100, 116, 139)),
            ("total", "Total Charged: $88.49", 22, (15, 23, 42)),
            ("btn", "[ COMPLETE ORDER ]", 18, (255, 255, 255), (15, 23, 42))
        ]
    },
    {
        "id": "sample_forced_action",
        "filename": "sample_forced_action.png",
        "title": "Forced Action - Data Wall & Permission Gating",
        "category": "Forced Action",
        "description": "Blocks article access demanding phone number submission and push notification authorization.",
        "text": "Daily News Network. Breaking Tech Report: AI in 2026. Access Gated. Required to proceed: Enter your phone number to continue. You must allow notifications to proceed. Mandatory sign-up to unlock full reading access.",
        "bg_color": (248, 250, 252),
        "header_color": (15, 23, 42),
        "accent_color": (147, 51, 234), # Purple
        "badge_text": "HIGH RISK: FORCED ACTION",
        "elements": [
            ("title", "Daily News Network - Access Wall", 28, (30, 41, 59)),
            ("heading", "Access Gated: Required to proceed", 22, (225, 29, 72)),
            ("input_label", "Enter your phone number to continue:", 16, (30, 41, 59)),
            ("input_box", "[ +1 (555) 000-0000 ]", 15, (100, 116, 139)),
            ("forced", "You must allow notifications to proceed.", 15, (185, 28, 28)),
            ("sub", "Mandatory sign-up required to unlock free article.", 14, (100, 116, 139)),
            ("btn", "[ SUBMIT & UNLOCK ]", 18, (255, 255, 255), (79, 70, 229))
        ]
    },
    {
        "id": "sample_trick_questions",
        "filename": "sample_trick_questions.png",
        "title": "Trick Questions - Deceptive Opt-Out Checkboxes",
        "category": "Trick Questions",
        "description": "Double-negative checkboxes designed to confuse users into consenting to spam.",
        "text": "Account Notification Preferences. Privacy Settings. Uncheck this box if you do not wish to opt-out of partner marketing emails. Check here to opt-out of not receiving daily promo SMS. Save preferences.",
        "bg_color": (255, 255, 255),
        "header_color": (15, 23, 42),
        "accent_color": (234, 88, 12), # Orange
        "badge_text": "HIGH RISK: TRICK QUESTIONS",
        "elements": [
            ("title", "CloudPortal - Notification Preferences", 28, (30, 41, 59)),
            ("heading", "Marketing & Communication Options", 22, (15, 23, 42)),
            ("check1", "[X] Uncheck this box if you do not wish to opt-out of marketing.", 15, (225, 29, 72)),
            ("check2", "[ ] Check here to opt-out of not receiving daily partner calls.", 15, (225, 29, 72)),
            ("note", "Please review your opt-in selections carefully.", 13, (148, 163, 184)),
            ("btn", "[ SAVE PREFERENCES ]", 18, (255, 255, 255), (15, 23, 42))
        ]
    },
    {
        "id": "sample_clean",
        "filename": "sample_clean.png",
        "title": "Clean Ethical UI - Transparent Consent",
        "category": "Clean UI",
        "description": "Clear, honest newsletter subscription form with transparent terms and no manipulative language.",
        "text": "TechNotes Digest. Subscribe to our monthly newsletter. We send curated programming tutorials once a month. No spam, no hidden fees. You can unsubscribe at any time with one click. [Subscribe] [Cancel]",
        "bg_color": (248, 250, 252),
        "header_color": (15, 23, 42),
        "accent_color": (16, 185, 129), # Emerald Green
        "badge_text": "VERIFIED: CLEAN UI (NO DARK PATTERNS)",
        "elements": [
            ("title", "TechNotes Digest - Community Newsletter", 28, (30, 41, 59)),
            ("heading", "Subscribe to our Monthly Newsletter", 22, (15, 23, 42)),
            ("body", "Get curated programming articles once every month.", 16, (71, 85, 105)),
            ("reassure", "We respect your privacy. You can unsubscribe at any time.", 15, (16, 185, 129)),
            ("input_box", "[ enter your email address... ]", 15, (148, 163, 184)),
            ("btn", "[ SUBSCRIBE ]   [ CANCEL ]", 16, (255, 255, 255), (16, 185, 129))
        ]
    }
]

def generate_sample_images():
    """
    Renders high-quality mock UI screenshots with PIL so users have realistic test images immediately.
    """
    for sample in SAMPLE_DEFINITIONS:
        filepath = os.path.join(SAMPLES_DIR, sample["filename"])
        
        # Dimensions 800 x 500
        w, h = 800, 520
        img = Image.new("RGB", (w, h), color=sample["bg_color"])
        draw = ImageDraw.Draw(img)

        # Header bar
        draw.rectangle([0, 0, w, 60], fill=(15, 23, 42))
        
        # Draw mock browser bar / window controls
        draw.ellipse([20, 24, 32, 36], fill=(239, 68, 68))
        draw.ellipse([38, 24, 50, 36], fill=(245, 158, 11))
        draw.ellipse([56, 24, 68, 36], fill=(16, 185, 129))
        
        # App URL bar simulation
        draw.rectangle([90, 16, 710, 44], fill=(30, 41, 59), outline=(51, 65, 85), width=1)

        # Try default font or fallback font
        try:
            font_title = ImageFont.truetype("arial.ttf", 18)
            font_header = ImageFont.truetype("arialbd.ttf", 22)
            font_body = ImageFont.truetype("arial.ttf", 16)
            font_small = ImageFont.truetype("arial.ttf", 13)
            font_btn = ImageFont.truetype("arialbd.ttf", 16)
        except Exception:
            font_title = ImageFont.load_default()
            font_header = ImageFont.load_default()
            font_body = ImageFont.load_default()
            font_small = ImageFont.load_default()
            font_btn = ImageFont.load_default()

        # URL text
        draw.text((110, 22), f"https://example.com/checkout/{sample['id']}", fill=(203, 213, 225), font=font_small)

        # Container card
        draw.rectangle([40, 85, w - 40, h - 35], fill=(255, 255, 255), outline=(226, 232, 240), width=2)
        
        # Badge
        badge_color = sample.get("accent_color", (79, 70, 229))
        draw.rectangle([60, 105, 380, 135], fill=badge_color)
        draw.text((70, 112), sample["badge_text"], fill=(255, 255, 255), font=font_small)

        # Render elements vertically
        curr_y = 155
        for elem in sample["elements"]:
            etype = elem[0]
            text = elem[1]
            color = elem[3] if len(elem) > 3 else (15, 23, 42)
            
            if etype == "title":
                draw.text((60, curr_y), text, fill=(100, 116, 139), font=font_body)
                curr_y += 30
            elif etype == "heading":
                draw.text((60, curr_y), text, fill=color, font=font_header)
                curr_y += 38
            elif etype == "price":
                draw.text((60, curr_y), text, fill=color, font=font_header)
                curr_y += 36
            elif etype == "banner":
                # Draw colored alert box
                draw.rectangle([60, curr_y, 740, curr_y + 40], fill=(254, 242, 242), outline=color, width=1)
                draw.text((75, curr_y + 10), text, fill=color, font=font_body)
                curr_y += 52
            elif etype == "btn":
                btn_bg = elem[4] if len(elem) > 4 else (15, 23, 42)
                draw.rectangle([60, curr_y, 420, curr_y + 45], fill=btn_bg)
                draw.text((80, curr_y + 12), text, fill=(255, 255, 255), font=font_btn)
                curr_y += 58
            elif etype == "shame":
                draw.text((60, curr_y), text, fill=color, font=font_body)
                curr_y += 28
            else:
                draw.text((60, curr_y), text, fill=color, font=font_body)
                curr_y += 28

        img.save(filepath, "PNG")

def get_sample_list() -> List[Dict[str, Any]]:
    """Returns sample metadata for frontend picker."""
    samples = []
    for s in SAMPLE_DEFINITIONS:
        samples.append({
            "id": s["id"],
            "filename": s["filename"],
            "title": s["title"],
            "category": s["category"],
            "description": s["description"],
            "badge_text": s["badge_text"],
            "text": s["text"],
            "image_url": f"/api/samples/{s['filename']}"
        })
    return samples

if __name__ == "__main__":
    generate_sample_images()
    print("Sample screenshots generated successfully in backend/samples/")
