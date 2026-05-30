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
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0F766E"))
        
        # 1. Header (Only on page 2 and later)
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.75)
            self.line(54, 738, 558, 738)
            
            try:
                logo_path = r"d:\MediaHive App\Media App logo for Luminous.png"
                if os.path.exists(logo_path):
                    self.drawImage(logo_path, 54, 743, 14, 14, mask='auto')
                    self.drawString(75, 746, "MediaHive &bull; User & Capabilities Manual")
                else:
                    self.drawString(54, 746, "MediaHive &bull; User & Capabilities Manual")
            except Exception:
                self.drawString(54, 746, "MediaHive &bull; User & Capabilities Manual")
            
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawRightString(558, 746, f"Chapter {self._pageNumber - 1}")
            
        # 2. Footer (On all pages)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.75)
        self.line(54, 50, 558, 50)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "MediaHive Platform Handbook &bull; All Rights Reserved")
        self.restoreState()

def build_pdf():
    pdf_filename = "MediaHive_User_Manual.pdf"
    try:
        if os.path.exists(pdf_filename):
            with open(pdf_filename, "ab") as f:
                pass
    except PermissionError:
        pdf_filename = "MediaHive_User_Manual_Updated.pdf"

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
        fontSize=28,
        leading=34,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=17,
        textColor=colors.HexColor("#0F766E"),
        spaceAfter=15
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
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=16,
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
        leading=14.5,
        textColor=colors.HexColor("#334155"),
        spaceAfter=10
    )
    
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#334155"),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=6
    )
    
    table_text_style = ParagraphStyle(
        'TableText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#334155")
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.white
    )

    story = []

    # Title & Brand Logo Section on Page 1 (Cover Block)
    logo_path = r"d:\MediaHive App\Media App logo for Luminous.png"
    
    if os.path.exists(logo_path):
        logo_img = Image(logo_path, width=48, height=48)
        title_para = Paragraph("<font size=28 color='#0F172A'><b>MediaHive</b></font><br/><font size=10 color='#64748B'><b>The Complete Platform Handbook</b></font>", styles['Normal'])
        header_table = Table([[logo_img, title_para]], colWidths=[60, 444])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (1, 0), (1, 0), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(header_table)
    else:
        story.append(Paragraph("MediaHive Platform", title_style))
        
    story.append(Paragraph("The Non-Technical, Human Guide to Managing Tasks, Media, and Teams in Real-Time", subtitle_style))
    story.append(Paragraph("EDITION: 2026 Professional Release &bull; AUTHOR: System Product Specialist &bull; TARGET: Non-Technical Users", meta_style))
    
    # Welcome & Intro
    story.append(Paragraph("Welcome to MediaHive", h1_style))
    story.append(Paragraph(
        "Modern work does not always happen sitting at a pristine desk in an office with perfect Wi-Fi. It happens on the move "
        "&mdash; in outdoor gardens, active nursery sites, remote campuses, and busy event halls. "
        "Connecting team members and keeping track of daily operations requires a centralized, secure digital coordinator.<br/><br/>"
        "<b>MediaHive</b> is designed specifically to fill this role. It is a highly optimized digital dashboard that "
        "acts as your team's collective brain. Running comfortably in your hand as a native mobile application, or in any web browser, "
        "MediaHive keeps your tasks, schedules, and shared documents perfectly coordinated using a clean, online-first real-time cloud connection.",
        body_style
    ))
    
    story.append(Paragraph("Our Core Design Philosophies", h2_style))
    story.append(Paragraph("<b>&bull; Simplicity First:</b> No technical degrees required. The app is clean, colorful, and behaves exactly like the tools you already use in your daily life.", bullet_style))
    story.append(Paragraph("<b>&bull; Real-Time Collaboration:</b> Field actions, task completions, and document uploads synchronize immediately across all team screens via active secure database channels.", bullet_style))
    story.append(Paragraph("<b>&bull; Built for Communities:</b> The app is designed for modern hierarchical organizations. Different branches, departments, and roles are kept safe, secure, and isolated under one single, powerful umbrella.", bullet_style))

    story.append(PageBreak())

    # Chapter 1: The Core Organization Hierarchy
    story.append(Paragraph("Chapter 1: The Organizational Family Tree", h1_style))
    story.append(Paragraph(
        "To understand how MediaHive works, imagine a large family living in a modern apartment building. "
        "Everyone shares the same structure, plumbing, and security doors, but each family has their own private apartment, "
        "their own private keys, and can never see what is inside their neighbor's rooms. "
        "This is how MediaHive organizes data. Under one digital system, we maintain complete and absolute privacy using a clear, four-level hierarchy:",
        body_style
    ))
    
    story.append(Paragraph("<b>1. The Tenant (The Organization):</b> This is the top-level parent company or umbrella organization. Information from one tenant can <i>never</i> leak or be seen by another tenant. They are completely separated rooms.", bullet_style))
    story.append(Paragraph("<b>2. The Institution (The Campus/Branch):</b> Inside a tenant, you can create multiple campuses, properties, or branches. For example, a nursery business might have a 'North Campus' and a 'South Campus'.", bullet_style))
    story.append(Paragraph("<b>3. The Department / Unit:</b> Inside each branch, you have functional teams. For instance, 'Horticulture', 'Logistics', 'Administration', or 'Customer Service'.", bullet_style))
    story.append(Paragraph("<b>4. The Operational Data:</b> This is where the daily work lives &mdash; tasks, photos, event calendar details, checklist logs, and check-in/out attendance logs scoped precisely to the team members authorized to see them.", bullet_style))
    
    story.append(Spacer(1, 10))

    # Chapter 2: Command Center & Dashboard
    story.append(Paragraph("Chapter 2: The Command Center (General Navigation)", h1_style))
    story.append(Paragraph(
        "When you first log in to MediaHive, you are welcomed by the <b>Command Center (Dashboard)</b>. "
        "The layout is designed with high-contrast, premium, responsive layouts to ensure it works beautifully on "
        "mobile screens, tablets, and desktops alike.",
        body_style
    ))
    
    story.append(Paragraph("<b>&bull; Personal Greeting & Quick Actions:</b> The top of your screen greets you by name and offers immediate buttons for common actions, like adding a new task, uploading a file, or managing your schedule.", bullet_style))
    story.append(Paragraph("<b>&bull; The Activity Feed:</b> A real-time stream of what is happening in your team. When a colleague completes a task or uploads a new document, you see it instantly without needing to check multiple screens.", bullet_style))
    story.append(Paragraph("<b>&bull; Quick Navigation Bar:</b> On mobile, a sleek, tactile bottom bar allows you to switch between <b>Tasks</b>, the <b>Calendar</b>, the <b>Files Hub</b>, and your <b>Profile</b> with a single thumb-tap.", bullet_style))

    story.append(PageBreak())

    # Chapter 3: Smart Task Management
    story.append(Paragraph("Chapter 3: Smart Task Management (The Board & List)", h1_style))
    story.append(Paragraph(
        "Tasks are the heartbeat of daily operations. MediaHive gives you two powerful, interactive ways to view and manage your team's duties:",
        body_style
    ))
    
    story.append(Paragraph("<b>1. The Kanban Board (Visual Progress):</b>", h2_style))
    story.append(Paragraph(
        "A <i>Kanban Board</i> is a visual wall divided into three simple columns: <b>To-Do</b>, <b>In Progress</b>, and <b>Completed</b>. "
        "Each task is a visual 'card' pinned to the wall. To move a task, you simply click/tap and drag it from one column to another. "
        "This gives managers and team members an instant, birds-eye view of who is doing what, and where bottlenecks are occurring.",
        body_style
    ))
    
    story.append(Paragraph("<b>2. The Detailed List View:</b>", h2_style))
    story.append(Paragraph(
        "For teams that prefer a structured list, this view displays tasks in a clean, vertical table sorted by deadlines, "
        "assignees, or priority levels (Low, Medium, High). Clicking any task card opens its <b>Details Panel</b>, which features:",
        body_style
    ))
    story.append(Paragraph("<b>&bull; Subtask Checklists:</b> Break big duties down into bite-sized checkboxes. As field members tick them off, the master task card shows a visual percentage progress bar.", bullet_style))
    story.append(Paragraph("<b>&bull; Team Assignments:</b> Easily assign tasks to one or more departments or specific personnel.", bullet_style))
    story.append(Paragraph("<b>&bull; Proof of Work Attachments:</b> Upload photos directly into the task details so team leads can visually verify completed work from anywhere.", bullet_style))

    story.append(Spacer(1, 10))

    # Chapter 4: The Unified Calendar
    story.append(Paragraph("Chapter 4: The Unified Calendar", h1_style))
    story.append(Paragraph(
        "Time management is critical for organizing shift rotations, client visits, nursery maintenance, and seasonal milestones. "
        "The <b>MediaHive Calendar</b> is a clean, interactive scheduler that maps out dates clearly.",
        body_style
    ))
    
    story.append(Paragraph("<b>&bull; Multiple Layout Options:</b> Toggle easily between a standard grid monthly calendar view or a sleek vertical List schedule view tailored for phone screens.", bullet_style))
    story.append(Paragraph("<b>&bull; Integrated Event Creation:</b> Click any date to schedule a team meeting, equipment servicing, or facility check-up. Assign it to specific departments so their calendars update automatically.", bullet_style))
    story.append(Paragraph("<b>&bull; Task Overlays:</b> Choose to display task deadlines directly on your calendar, allowing you to see how your duties align with your upcoming weekly or monthly schedule.", bullet_style))

    story.append(PageBreak())

    # Chapter 5: Files Hub & Media Center
    story.append(Paragraph("Chapter 5: Files Hub & Media Center", h1_style))
    story.append(Paragraph(
        "Pictures and documents are essential for auditing, training, and coordination. The <b>Files Hub</b> is your "
        "organization's shared cloud drive, designed to organize photos and documents in one centralized location.",
        body_style
    ))
    
    story.append(Paragraph("<b>&bull; Proof of Work Gallery:</b> Field staff can snap photos on their phones and upload them directly to the organization's media folder. This is ideal for logging field status, inventory delivery, or layout progress.", bullet_style))
    story.append(Paragraph("<b>&bull; Smart Categorization:</b> Organize files into custom folders or tag them with categories (e.g., 'Field Reports', 'Invoices', 'Training Manuals') for immediate search later.", bullet_style))
    story.append(Paragraph("<b>&bull; Personalized Profiles:</b> Each team member gets a profile portal to track personal statistics, edit contact information, and upload custom avatars to represent themselves on task cards and dashboards.", bullet_style))

    story.append(Spacer(1, 10))

    # Chapter 6: High-Value Product Roadmap Features
    story.append(Paragraph("Chapter 6: Premium Future Expansion Roadmap", h1_style))
    story.append(Paragraph(
        "Because MediaHive is engineered with solid, enterprise-grade architectures, the codebase is structurally prepared for "
        "rapid feature expansion. Managers and potential buyers can customize the application by activating the pre-modeled backend engines:",
        body_style
    ))
    
    story.append(Paragraph("<b>1. One-Tap Check-In / Check-Out Shift Attendance:</b>", h2_style))
    story.append(Paragraph(
        "A highly requested team feature is automated shift logging. MediaHive is already pre-modeled in the database schema "
        "with secure columns (`check_in` and `check_out` text logs) and has a completed backend API endpoint (`/api/attendance`). "
        "A sleek, one-tap visual check-in/out button can be immediately layered onto the frontend layout as a premium product add-on, "
        "enabling organizations to instantly eliminate paper shift logs.",
        body_style
    ))
    
    story.append(Paragraph("<b>2. Automated Work Log Reports:</b>", h2_style))
    story.append(Paragraph(
        "By utilizing the pre-built attendance database logs, the system can generate automated department-level "
        "performance reports, tracking shift duration histories and work notes directly into clean Excel/CSV spreadsheets.",
        body_style
    ))
    
    story.append(Paragraph("<b>3. Ambient Network Recovery Alerts:</b>", h2_style))
    story.append(Paragraph(
        "The app is integrated with a browser network watchdog. If you happen to step into a blind spot and drop your internet connection, "
        "the app immediately detects the drop, displaying a toast notification telling you that you are offline. The second "
        "connectivity is restored, a secure presence dot updates to notify you that your cloud session has recovered.",
        body_style
    ))

    story.append(PageBreak())

    # Chapter 7: Four-Role Permissions Matrix
    story.append(Paragraph("Chapter 7: User Roles & Permissions", h1_style))
    story.append(Paragraph(
        "To keep organization operations organized and secure, MediaHive operates on a granular **Role-Based Access Control (RBAC)** "
        "system. Four standard roles dictate exactly what a team member can see and do:",
        body_style
    ))
    
    role_headers = [
        Paragraph("User Role", table_header_style),
        Paragraph("Authorized Permissions Scoped", table_header_style),
        Paragraph("Best Suited For", table_header_style)
    ]
    
    role_rows = [
        [
            Paragraph("<b>Admin</b>", table_text_style),
            Paragraph("Full platform control. Can add/remove campuses, invite/deactivate users, read immutable security audit logs, send global team-wide announcements, and modify any task, event, or schedule.", table_text_style),
            Paragraph("Business owners, general managers, and branch directors.", table_text_style)
        ],
        [
            Paragraph("<b>Manager</b>", table_text_style),
            Paragraph("Branch-level control. Can view all tasks/events in their campus, assign duties to teams, review uploaded media, create new schedules, and generate department reports.", table_text_style),
            Paragraph("Campus supervisors, plant directors, and team leaders.", table_text_style)
        ],
        [
            Paragraph("<b>Team</b>", table_text_style),
            Paragraph("Daily operational access. Can view tasks assigned to their department, create new task cards, update progress status, add subtask checklists, and upload proof-of-work photos.", table_text_style),
            Paragraph("Field staff, operational teams, and specialists.", table_text_style)
        ],
        [
            Paragraph("<b>Guest / Member</b>", table_text_style),
            Paragraph("Basic access level. Can view task lists assigned to them, see shared department calendars, and upload profile avatar pictures. Read-only permissions on other team members' records.", table_text_style),
            Paragraph("Temporary contractors, seasonal helpers, volunteers, or clients.", table_text_style)
        ]
    ]
    
    role_table_data = [role_headers] + role_rows
    role_table = Table(role_table_data, colWidths=[90, 254, 160])
    role_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0F172A")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))
    
    story.append(role_table)

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {pdf_filename}")

if __name__ == "__main__":
    build_pdf()
