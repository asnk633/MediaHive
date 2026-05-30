import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # 1. Header (Only on page 2 and later)
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.75)
            self.line(54, 738, 558, 738)
            
            try:
                logo_path = r"d:\MediaHive App\Media App logo for Luminous.png"
                if os.path.exists(logo_path):
                    self.drawImage(logo_path, 54, 743, 14, 14, mask='auto')
                    self.drawString(75, 746, "MediaHive — Valuation & Pricing Report")
                else:
                    self.drawString(54, 746, "MediaHive — Valuation & Pricing Report")
            except Exception:
                self.drawString(54, 746, "MediaHive — Valuation & Pricing Report")
            
        # 2. Footer (On all pages)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.75)
        self.line(54, 50, 558, 50)
        
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "CONFIDENTIAL — MediaHive Valuation Report (May 2026)")
        self.restoreState()

def build_pdf():
    pdf_filename = "MediaHive_Valuation_and_Pricing_Report.pdf"
    try:
        if os.path.exists(pdf_filename):
            with open(pdf_filename, "ab") as f:
                pass
    except PermissionError:
        pdf_filename = "MediaHive_Valuation_and_Pricing_Report_Updated.pdf"

    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0F766E"),
        spaceAfter=12
    )
    
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=25
    )
    
    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#0F766E"),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=8
    )
    
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor("#334155"),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=5
    )
    
    table_text_style = ParagraphStyle(
        'TableText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#334155")
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=colors.white
    )

    story = []

    # Title & Brand Logo Section on Page 1
    logo_path = r"d:\MediaHive App\Media App logo for Luminous.png"
    
    if os.path.exists(logo_path):
        logo_img = Image(logo_path, width=42, height=42)
        title_para = Paragraph("<font size=24 color='#0F172A'><b>MediaHive</b></font><br/><font size=9.5 color='#64748B'><b>Enterprise Media & Task Management Platform</b></font>", styles['Normal'])
        header_table = Table([[logo_img, title_para]], colWidths=[52, 452])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (1, 0), (1, 0), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(header_table)
    else:
        story.append(Paragraph("MediaHive App & Script", title_style))
        
    story.append(Paragraph("Comprehensive Technical Asset Valuation, SaaS Models, & Buyout Pricing Guide", subtitle_style))
    story.append(Paragraph("PREPARED FOR: Shukoor Rahman &bull; DATE: May 25, 2026 &bull; VALUATION STANDARD: Indian Rupees (INR)", meta_style))
    
    # 1. Executive Summary & Core Value Proposition
    story.append(Paragraph("1. Executive Summary & Technical Assets", h1_style))
    story.append(Paragraph(
        "<b>MediaHive</b> (originally developed as <i>Thaiba Garden Media Manager</i>) is an enterprise-grade, "
        "mobile-first task and media management ecosystem. Architected with high-fidelity components and rigorous security policies, "
        "the codebase represents a high-value software asset. Unlike generic templates or basic MVPs, MediaHive integrates "
        "premium, battle-tested features that make it instantly ready for commercialization or institutional deployment:",
        body_style
    ))
    
    story.append(Paragraph("<b>&bull; Scalable Multi-Tenant Architecture:</b> Strict data isolation utilizing a 3-layer relational hierarchy (Tenant ➔ Institution ➔ Department/Unit) secured by database-level Row Level Security (RLS) policies.", bullet_style))
    story.append(Paragraph("<b>&bull; Four-Role Permission Architecture:</b> Fine-grained control with granular user roles (Admin, Manager, Team, and Guest/Member) ensuring correct data exposure and feature mapping.", bullet_style))
    story.append(Paragraph("<b>&bull; Secure Server Operations:</b> Zod request schema validation, IP-scoped API rate limiting, text and URL sanitization, SameSite/HttpOnly secure session cookies, and an immutable security audit database table.", bullet_style))
    story.append(Paragraph("<b>&bull; Clean Mobile & Web Footprint:</b> Next.js 15 App Router (TypeScript) frontend coupled with a pre-configured Capacitor native compilation system supporting immediate Android APK builds.", bullet_style))
    story.append(Paragraph("<b>&bull; Comprehensive Automated Testing:</b> A complete Playwright end-to-end integration test suite configured for standard local execution and automated GitHub Actions CI/CD workflows.", bullet_style))
    
    story.append(Spacer(1, 10))

    # 2. Cost-to-Replicate Asset Valuation
    story.append(Paragraph("2. Raw Cost-to-Replicate Valuation (Asset Valuation)", h1_style))
    story.append(Paragraph(
        "A highly accurate method to establish a baseline price is the <b>Cost-to-Replicate</b> method. This calculates "
        "the human-capital expense required to design, develop, secure, and test this software system to the same "
        "engineering specifications. Below is a detailed breakdown based on market-standard senior development rates in India:",
        body_style
    ))
    
    # Engineering Table Setup (Total width 504 pt)
    eng_headers = [
        Paragraph("Role", table_header_style),
        Paragraph("Responsibilities", table_header_style),
        Paragraph("Duration", table_header_style),
        Paragraph("Rate (INR)", table_header_style),
        Paragraph("Total Cost", table_header_style)
    ]
    
    # Replaced ₹ with Rs. to resolve dark box Helvetica encoding errors
    eng_rows = [
        [
            Paragraph("Lead Architect", table_text_style),
            Paragraph("Multi-tenant security, direct-access API, 4-tier RBAC framework, database RLS policies, and architectural review.", table_text_style),
            Paragraph("3 Months", table_text_style),
            Paragraph("Rs. 2,50,000", table_text_style),
            Paragraph("Rs. 7,50,000", table_text_style)
        ],
        [
            Paragraph("Senior Full-Stack", table_text_style),
            Paragraph("Next.js 15 setup, custom UI, files hub backend, Capacitor wrapper integration, and core business logic.", table_text_style),
            Paragraph("3 Months", table_text_style),
            Paragraph("Rs. 1,80,000", table_text_style),
            Paragraph("Rs. 5,40,000", table_text_style)
        ],
        [
            Paragraph("QA Automation", table_text_style),
            Paragraph("Developing Playwright E2E suites (drag-and-drop, UI flows), and establishing GitHub Actions pipelines.", table_text_style),
            Paragraph("1.5 Months", table_text_style),
            Paragraph("Rs. 1,20,000", table_text_style),
            Paragraph("Rs. 1,80,000", table_text_style)
        ],
        [
            Paragraph("Project Lead / DevOps", table_text_style),
            Paragraph("Deployment workflows, security hardening (rate-limit, JWT), and database cluster configurations.", table_text_style),
            Paragraph("1 Month", table_text_style),
            Paragraph("Rs. 1,30,000", table_text_style),
            Paragraph("Rs. 1,30,000", table_text_style)
        ],
        [
            Paragraph("UI/UX Designer", table_text_style),
            Paragraph("Sleek responsive dashboards, visual design systems, brand guidelines, and interactive animations.", table_text_style),
            Paragraph("1 Month", table_text_style),
            Paragraph("Rs. 1,00,000", table_text_style),
            Paragraph("Rs. 1,00,000", table_text_style)
        ],
        [
            Paragraph("<b>Total Baseline</b>", table_text_style),
            Paragraph("<b>Human Resource Capital (Excluding operational markups)</b>", table_text_style),
            Paragraph("<b>-</b>", table_text_style),
            Paragraph("<b>-</b>", table_text_style),
            Paragraph("<b>Rs. 17,00,000</b>", table_text_style)
        ]
    ]
    
    eng_table_data = [eng_headers] + eng_rows
    eng_table = Table(eng_table_data, colWidths=[90, 204, 55, 75, 80])
    eng_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0F172A")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor("#F8FAFC")]),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#F1F5F9")),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
    ]))
    
    story.append(eng_table)
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "<b>Additional Intangible Assets:</b><br/>"
        "&bull; <b>Production-Ready Premium (+15%):</b> Pre-vetted code with fixed dependency conflicts and compiled Android wrappers saves 3+ months of typical deployment debugging. (Value: ~<b>Rs. 2,50,000</b>)<br/>"
        "&bull; <b>Comprehensive System Runbooks (+5%):</b> Complete disaster recovery rules, design contracts, and setup pipelines. (Value: ~<b>Rs. 1,00,000</b>)<br/>"
        "<b>ESTIMATED ASSET VALUATION (CONSERVATIVE): Rs. 15,00,000</b><br/>"
        "<b>ESTIMATED ASSET VALUATION (FAIR MARKET): Rs. 20,50,000</b>",
        body_style
    ))
    
    story.append(PageBreak())

    # 3. SaaS Subscription Pricing Model
    story.append(Paragraph("3. SaaS Subscription Pricing Model (Recurring Revenue)", h1_style))
    story.append(Paragraph(
        "By leveraging the platform's multi-tenant architecture, you can commercialize MediaHive as a "
        "<b>B2B Software-as-a-Service (SaaS)</b> for institutions, offices, or properties. Below is a structured "
        "subscription model optimized for the Indian business software market:",
        body_style
    ))
    
    saas_headers = [
        Paragraph("Subscription Tier", table_header_style),
        Paragraph("Monthly Price (INR)", table_header_style),
        Paragraph("Target Segment", table_header_style),
        Paragraph("Features Scoped", table_header_style)
    ]
    
    saas_rows = [
        [
            Paragraph("<b>Lite / Basic</b>", table_text_style),
            Paragraph("Rs. 3,499 / Month<br/><i>(Billed Annually: Rs. 35,000)</i>", table_text_style),
            Paragraph("Single-site properties, small teams or localized centers.", table_text_style),
            Paragraph("1 Campus/Branch, up to 20 users. Core task management, calendar list view, basic notifications, and standard email support.", table_text_style)
        ],
        [
            Paragraph("<b>Growth / Pro</b>", table_text_style),
            Paragraph("Rs. 9,999 / Month<br/><i>(Billed Annually: Rs. 1,00,000)</i>", table_text_style),
            Paragraph("Medium organizations with multiple branches or departments.", table_text_style),
            Paragraph("Up to 5 branches, up to 100 users. Custom 4-tier role configurations, 50GB media hub storage, priority email support.", table_text_style)
        ],
        [
            Paragraph("<b>Enterprise</b>", table_text_style),
            Paragraph("Rs. 24,999+ / Month<br/><i>(Billed Annually: Rs. 2.5L+)</i>", table_text_style),
            Paragraph("Large institutional chains, colleges, or government units.", table_text_style),
            Paragraph("Unlimited branches/users. Direct database synchronization, dedicated server scaling, custom white-labeled domain, priority SLA support.", table_text_style)
        ]
    ]
    
    saas_table_data = [saas_headers] + saas_rows
    saas_table = Table(saas_table_data, colWidths=[90, 100, 114, 200])
    saas_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0F766E")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))
    
    story.append(saas_table)
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "<b>Alternative User-based Scaling Model:</b><br/>"
        "Instead of broad packages, you can charge a flat base platform fee of <b>Rs. 1,999/month</b> (includes up to 10 users) "
        "and scale at <b>Rs. 150 to Rs. 250 per user per month</b> for additional accounts. This model reduces onboarding friction "
        "for smaller organizations and scales automatically as they expand.",
        body_style
    ))
    
    story.append(Spacer(1, 10))

    # 4. Sole Ownership / Full Buyout Pricing
    story.append(Paragraph("4. Sole Ownership & Full Buyout Pricing", h1_style))
    story.append(Paragraph(
        "If a client, investor, or buyer wants to buy <b>sole ownership</b> of the app, you must charge a premium that "
        "accounts for the complete transfer of intellectual property (IP) and your inability to monetize this codebase again. "
        "Use the three scenarios below to navigate buyout discussions:",
        body_style
    ))
    
    buyout_headers = [
        Paragraph("Licensing Model", table_header_style),
        Paragraph("Intellectual Property (IP) Scope", table_header_style),
        Paragraph("Recommended Price Range", table_header_style)
    ]
    
    buyout_rows = [
        [
            Paragraph("<b>Scenario 1: Non-Exclusive White-Label</b>", table_text_style),
            Paragraph("You customize, brand, and build a dedicated instance of the app (on client's servers and App Store) under their logo. <b>You keep the source code IP</b> and can sell it to other companies.", table_text_style),
            Paragraph("<b>Rs. 1,50,000 - Rs. 3,00,000</b> (One-time Setup)<br/>+<br/><b>Rs. 15,000 - Rs. 25,000 / Month</b> (Hosting/SLA)", table_text_style)
        ],
        [
            Paragraph("<b>Scenario 2: Source Code Developer License</b>", table_text_style),
            Paragraph("You deliver a complete developer snapshot of the codebase, schemas, and build wrappers. The buyer has the right to modify and host it internally. <b>You also keep the source code IP</b> and can continue using it.", table_text_style),
            Paragraph("<b>Rs. 10,00,000 - Rs. 15,00,000</b><br/><i>(One-time code delivery, no maintenance or support retainers included)</i>", table_text_style)
        ],
        [
            Paragraph("<b>Scenario 3: Exclusive Sole Buyout</b>", table_text_style),
            Paragraph("Complete 100% transfer of IP. You sign non-compete agreements, hand over control of Github repos, app store package IDs, and keys. <b>You lose all rights to sell, license, or host the code again.</b>", table_text_style),
            Paragraph("<b>Rs. 35,00,000 - Rs. 50,00,000</b><br/><i>(Calculated at standard 2x - 3x baseline replacement value for premium pre-revenue IP)</i>", table_text_style)
        ]
    ]
    
    buyout_table_data = [buyout_headers] + buyout_rows
    buyout_table = Table(buyout_table_data, colWidths=[120, 244, 140])
    buyout_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))
    
    story.append(buyout_table)
    story.append(Spacer(1, 10))
    
    # 5. Strategic Negotiation Recommendations
    story.append(Paragraph("5. Strategic Negotiation Recommendations for Shukoor", h1_style))
    story.append(Paragraph("<b>&bull; Frame as 'Build vs. Buy' Advantage:</b> If a buyer thinks a Rs. 20 Lakh price is high, show them they would spend over Rs. 30 Lakhs and wait 6 to 8 months if they hired a custom software agency to build multi-tenancy, custom 4-role RBAC, and comprehensive Playwright automation from scratch. Buying MediaHive eliminates developer risk and delivers a production-ready system in 24 hours.", bullet_style))
    story.append(Paragraph("<b>&bull; Secure Monthly Maintenance Retainers:</b> If the client buys sole ownership (Scenario 3) or source code (Scenario 2), they will need technical guidance. Propose a separate post-sale developer retainer of <b>Rs. 75,000 to Rs. 1,50,000 per month</b> for 10-15 hours of architectural consulting. This guarantees recurring revenue for you while ensuring they have technical safety.", bullet_style))
    story.append(Paragraph("<b>&bull; Highlight Premium Strategic Roadmap:</b> Leverage the developed backend models for **Attendance Shift logs & Check-in / Check-out** to upsell as high-margin custom roadmap modifications. Highlighting these pre-built backend endpoints shows technical foresight and allows you to charge premium setup costs to build the frontend visual buttons.", bullet_style))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {pdf_filename}")

if __name__ == "__main__":
    build_pdf()
