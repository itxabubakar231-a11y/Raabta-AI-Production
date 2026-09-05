"""
Raabta AI - Civic Risk Engine
Calculates an explainable 0–100 Civic Risk Score with 5 weighted factors:
1. Public Safety Risk (30%)
2. Infrastructure Severity (25%)
3. Citizen Impact (20%)
4. Vulnerable / High-Density Location (15%)
5. Evidence Confidence (10%)
"""

from typing import Dict, Any, List, Optional
import math


CATEGORY_BASE_RISK = {
    "electrical_hazards": 90,
    "gas_leaks": 92,
    "structural_collapse": 88,
    "open_manhole": 85,
    "sewage_overflow": 70,
    "water_contamination": 75,
    "water_supply": 55,
    "road_damage": 60,
    "potholes": 45,
    "traffic_lights": 65,
    "garbage_waste": 40,
    "street_lighting": 35,
    "parks_recreation": 25,
    "encroachment": 35,
    "general": 40
}

HIGH_RISK_KEYWORDS = [
    ("spark", 25), ("fire", 30), ("flame", 30), ("blast", 35), ("explosion", 35),
    ("shock", 25), ("electrocute", 35), ("live wire", 35), ("wire fall", 30),
    ("manhole", 25), ("gutter", 20), ("deep hole", 20), ("cave in", 25),
    ("gas smell", 30), ("leak", 20), ("poison", 30), ("toxic", 25),
    ("child", 15), ("school", 20), ("hospital", 25), ("masjid", 15), ("mosque", 15),
    ("elderly", 15), ("death", 30), ("injury", 25), ("accident", 25),
    ("submerged", 20), ("flood", 20), ("blockage", 15), ("highway", 15), ("main road", 15)
]

VULNERABLE_AREAS = [
    "school", "college", "university", "hospital", "clinic", "dispensary",
    "bazaar", "market", "metro", "bus stand", "station", "mosque", "masjid",
    "mall", "highway", "expressway", "chowk", "intersection"
]


def calculate_civic_risk(
    category: str,
    title: str,
    description: str,
    evidence_quality: str = "good",
    evidence_score: float = 0.85,
    location_text: str = "",
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    existing_duplicate_count: int = 0,
    follow_up_answers: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Computes a mathematically grounded, fully transparent 0-100 Civic Risk Score.
    Returns breakdown across all 5 dimensions:
    - Public Safety Risk (30%)
    - Infrastructure Severity (25%)
    - Citizen Impact (20%)
    - Vulnerable / High-Density Location (15%)
    - Evidence Confidence (10%)
    """
    follow_up_context = ""
    answered_count = 0
    if follow_up_answers:
        for item in follow_up_answers:
            if isinstance(item, dict):
                q = str(item.get("question") or item.get("question_id") or "").strip()
                a = str(item.get("answer") or "").strip()
                if a:
                    answered_count += 1
                    follow_up_context += f" {q}: {a}."

    text_corpus = f"{title} {description} {location_text} {follow_up_context}".lower()

    # 1. Public Safety Risk (0-100) - Weight: 30%
    normalized_cat = category.lower().replace(" ", "_").replace("&", "_").replace("-", "_")
    base_safety = CATEGORY_BASE_RISK.get(normalized_cat, 45)

    safety_keyword_boost = 0
    keyword_matches = []
    for kw, boost in HIGH_RISK_KEYWORDS:
        if kw in text_corpus:
            safety_keyword_boost += boost
            keyword_matches.append(kw)
    safety_keyword_boost = min(safety_keyword_boost, 45)

    # Additional safety boost if follow-up answers confirm direct pedestrian/children hazard
    if any(k in follow_up_context.lower() for k in ["yes", "danger", "child", "pedestrian", "urgent", "active"]):
        safety_keyword_boost = min(45, safety_keyword_boost + 10)

    safety_raw = min(100, max(10, base_safety * 0.6 + safety_keyword_boost * 1.2))

    # 2. Infrastructure Severity (0-100) - Weight: 25%
    severity_raw = min(100, max(15, base_safety * 0.85))
    if any(term in text_corpus for term in ["collapsed", "broken", "burst", "severed", "destroyed", "heavy", "deep", "crater"]):
        severity_raw = min(100, severity_raw + 20)
    if any(term in text_corpus for term in ["minor", "small", "cosmetic", "paint", "scratch"]):
        severity_raw = max(10, severity_raw - 25)

    # 3. Citizen Impact (0-100) - Weight: 20%
    # Higher if repeated complaints or broad impact keywords
    impact_raw = 30
    if any(term in text_corpus for term in ["whole area", "entire neighborhood", "sector", "colony", "thousands", "everyone"]):
        impact_raw += 40
    elif any(term in text_corpus for term in ["street", "block", "market", "commuters", "traffic", "busy"]):
        impact_raw += 25
    else:
        impact_raw += 15

    # Boost by duplicates in cluster
    if existing_duplicate_count > 0:
        impact_raw = min(100, impact_raw + min(existing_duplicate_count * 12, 35))

    # 4. Vulnerable / High-Density Location (0-100) - Weight: 15%
    loc_matches = [va for va in VULNERABLE_AREAS if va in text_corpus]
    if loc_matches:
        location_raw = min(100, 50 + len(loc_matches) * 20)
    elif any(term in text_corpus for term in ["sector g", "sector f", "sector i", "mall road", "blue area", "saddar"]):
        location_raw = 65
    else:
        location_raw = 35

    # 5. Evidence Confidence (0-100) - Weight: 10%
    if evidence_quality.lower() == "good":
        evidence_raw = max(75, int(evidence_score * 100))
    elif evidence_quality.lower() == "fair":
        evidence_raw = max(45, int(evidence_score * 80))
    else:
        evidence_raw = max(20, int(evidence_score * 50))

    # Answering follow-up questions boosts confidence by verifying details
    if answered_count > 0:
        evidence_raw = min(100, evidence_raw + min(answered_count * 8, 20))

    # Calculate weighted total
    w_safety = 0.30
    w_severity = 0.25
    w_impact = 0.20
    w_location = 0.15
    w_evidence = 0.10

    safety_contrib = round(safety_raw * w_safety, 1)
    severity_contrib = round(severity_raw * w_severity, 1)
    impact_contrib = round(impact_raw * w_impact, 1)
    location_contrib = round(location_raw * w_location, 1)
    evidence_contrib = round(evidence_raw * w_evidence, 1)

    total_score = int(round(safety_contrib + severity_contrib + impact_contrib + location_contrib + evidence_contrib))
    total_score = max(5, min(99, total_score))

    # Determine risk level and SLA
    if total_score >= 75:
        risk_level = "CRITICAL"
        recommended_sla_hours = 4
        primary_driver = f"Urgent safety hazard ({', '.join(keyword_matches[:3]) if keyword_matches else category})"
    elif total_score >= 50:
        risk_level = "HIGH"
        recommended_sla_hours = 12
        primary_driver = f"Substantial civic disruption in {category}"
    elif total_score >= 25:
        risk_level = "MEDIUM"
        recommended_sla_hours = 48
        primary_driver = f"Standard municipal maintenance for {category}"
    else:
        risk_level = "LOW"
        recommended_sla_hours = 96
        primary_driver = "Cosmetic or minor community issue"

    res = {
        "score": total_score,
        "level": risk_level,
        "recommended_sla_hours": recommended_sla_hours,
        "primary_driver": primary_driver,
        "factors": {
            "public_safety": {
                "score": int(safety_raw),
                "weight": 30,
                "contribution": safety_contrib,
                "reason": f"Category hazard baseline with keywords: {', '.join(keyword_matches) if keyword_matches else 'standard'}"
            },
            "infrastructure_severity": {
                "score": int(severity_raw),
                "weight": 25,
                "contribution": severity_contrib,
                "reason": "Physical severity assessed from damage descriptors"
            },
            "citizen_impact": {
                "score": int(impact_raw),
                "weight": 20,
                "contribution": impact_contrib,
                "reason": f"Impact scope and community reach ({existing_duplicate_count} nearby reports)"
            },
            "location_vulnerability": {
                "score": int(location_raw),
                "weight": 15,
                "contribution": location_contrib,
                "reason": f"Proximity to high-traffic or vulnerable zones ({', '.join(loc_matches) if loc_matches else 'standard urban street'})"
            },
            "evidence_confidence": {
                "score": int(evidence_raw),
                "weight": 10,
                "contribution": evidence_contrib,
                "reason": f"Evidence quality rated as {evidence_quality} with {int(evidence_score * 100)}% clarity"
            }
        }
    }
    res["breakdown"] = res["factors"]
    return res
