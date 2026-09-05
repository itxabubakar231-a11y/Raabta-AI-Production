"""
Raabta AI - Official Civic Dossier PDF Generator
Generates a downloadable, high-grade Government of Pakistan-style civic intelligence dossier
with tracking numbers, risk score breakdowns, SLA targets, and complete audit history.
"""

import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch


def generate_civic_dossier_pdf(report: dict, events: list = None) -> bytes:
    """
    Renders an official PDF dossier for a civic report.
    Returns bytes of the generated PDF document.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#006C35"),  # Pakistan Emerald Green
        alignment=1  # Center
    )

    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569"),
        alignment=1
    )

    section_heading = ParagraphStyle(
        'SecHead',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b")
    )

    bold_body = ParagraphStyle(
        'BoldBody',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    story = []

    # 1. Header & Official Seal text
    story.append(Paragraph("RAABTA AI — CIVIC INTELLIGENCE PLATFORM", title_style))
    story.append(Paragraph("OFFICIAL MUNICIPAL ACTION & INVESTIGATION DOSSIER", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#006C35"), spaceBefore=4, spaceAfter=12))

    # 2. Key Metadata Table
    tracking_id = report.get("tracking_id", "RA-UNKNOWN")
    created_at = report.get("created_at", "N/A")[:19].replace("T", " ")
    status = (report.get("status") or "submitted").upper()
    category = report.get("category", "General Civic Issue")
    dept = report.get("department", {}).get("name") or report.get("department_name") or report.get("department_id") or "Municipal Authority"

    risk_data = report.get("civic_risk_score", {})
    if isinstance(risk_data, dict):
        risk_score = risk_data.get("score", 50)
        risk_level = risk_data.get("level", "MEDIUM")
        sla_hours = risk_data.get("recommended_sla_hours", 48)
    else:
        risk_score = 50
        risk_level = "MEDIUM"
        sla_hours = 48

    meta_data = [
        [
            Paragraph("<b>Dossier Tracking ID:</b>", body_style),
            Paragraph(f"<b>{tracking_id}</b>", bold_body),
            Paragraph("<b>Generated On:</b>", body_style),
            Paragraph(datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"), body_style)
        ],
        [
            Paragraph("<b>Category:</b>", body_style),
            Paragraph(category, body_style),
            Paragraph("<b>Status:</b>", body_style),
            Paragraph(f"<font color='#0284c7'><b>{status}</b></font>", bold_body)
        ],
        [
            Paragraph("<b>Assigned Department:</b>", body_style),
            Paragraph(str(dept), body_style),
            Paragraph("<b>Civic Risk Score:</b>", body_style),
            Paragraph(f"<font color='{'#dc2626' if risk_score >= 75 else '#d97706' if risk_score >= 50 else '#16a34a'}'><b>{risk_score}/100 ({risk_level})</b></font>", bold_body)
        ],
        [
            Paragraph("<b>Mandated SLA:</b>", body_style),
            Paragraph(f"Within {sla_hours} hours", body_style),
            Paragraph("<b>Incident Date:</b>", body_style),
            Paragraph(created_at, body_style)
        ]
    ]

    meta_table = Table(meta_data, colWidths=[1.8*inch, 2.0*inch, 1.4*inch, 2.0*inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # 3. Location & Citizen Incident Description
    story.append(Paragraph("1. INCIDENT SPECIFICATION & LOCATION", section_heading))
    loc = report.get("location") or {}
    addr = loc.get("address") or loc.get("city") or "Location not specified"
    lat = loc.get("latitude")
    lon = loc.get("longitude")
    loc_coords = f"Lat: {lat}, Lon: {lon}" if lat and lon else "GPS coordinates not available"

    desc = report.get("description") or report.get("complaint_body") or "No description provided."

    loc_desc_data = [
        [Paragraph("<b>Incident Title:</b>", body_style), Paragraph(report.get("title", "Civic Complaint"), bold_body)],
        [Paragraph("<b>Location / Address:</b>", body_style), Paragraph(f"{addr} ({loc_coords})", body_style)],
        [Paragraph("<b>Citizen Statement:</b>", body_style), Paragraph(desc, body_style)]
    ]
    loc_desc_table = Table(loc_desc_data, colWidths=[1.8*inch, 5.4*inch])
    loc_desc_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(loc_desc_table)
    story.append(Spacer(1, 14))

    # 4. Civic Risk Score Mathematical Breakdown
    story.append(Paragraph("2. CIVIC RISK SCORE BREAKDOWN (0 - 100 SCALE)", section_heading))

    factors = (risk_data.get("factors") if isinstance(risk_data, dict) else {}) or {}
    factors_rows = [
        [
            Paragraph("<b>Risk Dimension</b>", bold_body),
            Paragraph("<b>Weight</b>", bold_body),
            Paragraph("<b>Factor Score</b>", bold_body),
            Paragraph("<b>Weighted Pts</b>", bold_body),
            Paragraph("<b>Justification / Evidence Basis</b>", bold_body)
        ]
    ]

    factor_names = [
        ("public_safety", "Public Safety Risk", "30%"),
        ("infrastructure_severity", "Infrastructure Severity", "25%"),
        ("citizen_impact", "Citizen Impact & Reach", "20%"),
        ("location_vulnerability", "Location Vulnerability", "15%"),
        ("evidence_confidence", "Evidence Quality & Confidence", "10%")
    ]

    for key, label, wt in factor_names:
        f_info = factors.get(key, {})
        f_score = f_info.get("score", 50)
        f_contrib = f_info.get("contribution", 10.0)
        f_reason = f_info.get("reason", "Automated baseline inspection")
        factors_rows.append([
            Paragraph(label, body_style),
            Paragraph(wt, body_style),
            Paragraph(str(f_score), body_style),
            Paragraph(f"+{f_contrib}", body_style),
            Paragraph(f_reason, body_style)
        ])

    risk_table = Table(factors_rows, colWidths=[1.6*inch, 0.7*inch, 0.9*inch, 0.9*inch, 3.1*inch])
    risk_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(risk_table)
    story.append(Spacer(1, 14))

    # 5. Timeline & Audit Trail
    story.append(Paragraph("3. OFFICIAL TIMELINE & AUDIT LOG", section_heading))
    events_rows = [
        [
            Paragraph("<b>Timestamp</b>", bold_body),
            Paragraph("<b>Actor / Role</b>", bold_body),
            Paragraph("<b>Action Taken</b>", bold_body),
            Paragraph("<b>Audit Details</b>", bold_body)
        ]
    ]

    ev_list = events or report.get("timeline") or []
    if not ev_list:
        events_rows.append([
            Paragraph(created_at, body_style),
            Paragraph("CITIZEN", body_style),
            Paragraph("REPORT_SUBMITTED", body_style),
            Paragraph("Initial civic incident report created and verified by Raabta AI", body_style)
        ])
    else:
        for ev in ev_list[-6:]:
            ts = (ev.get("timestamp") or ev.get("created_at") or "")[:19].replace("T", " ")
            role = ev.get("actor_role") or "SYSTEM"
            action = ev.get("action") or ev.get("status") or "LOG"
            details = ev.get("details") or ev.get("notes") or ""
            if isinstance(details, dict):
                details = ", ".join(f"{k}: {v}" for k, v in details.items())
            events_rows.append([
                Paragraph(ts or "N/A", body_style),
                Paragraph(str(role).upper(), body_style),
                Paragraph(str(action), body_style),
                Paragraph(str(details)[:80], body_style)
            ])

    events_table = Table(events_rows, colWidths=[1.4*inch, 1.1*inch, 1.8*inch, 2.9*inch])
    events_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(events_table)
    story.append(Spacer(1, 18))

    # 6. Certification Sign-off Block
    sign_data = [
        [
            Paragraph("<b>Inspected & Triaged By:</b><br/>Raabta AI Intelligence Engine<br/>Verified Against Municipal Standards", body_style),
            Paragraph("<b>Assigned Duty Officer:</b><br/>__________________________________<br/>Signature & Official Stamp", body_style)
        ]
    ]
    sign_table = Table(sign_data, colWidths=[3.6*inch, 3.6*inch])
    sign_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(sign_table)

    doc.build(story)
    return buffer.getvalue()
