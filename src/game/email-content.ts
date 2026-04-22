export type EmailType = "valid" | "phishing";
export type AttachmentType = "exe" | "zip" | "png" | "jpeg" | "docx" | "pdf";

export interface EmailCase {
    from: string;
    domain: string;
    subject: string;
    body: string;
    attachments: string[];
    type: EmailType;
    violations: string[];
}

export interface SubjectHeaderBan {
    word: string;
    companies?: string[];
}

export interface DayPlan {
    day: number;
    focus: string;
    dailyRules: string[];
    subjectBans?: SubjectHeaderBan[];
    emails: EmailCase[];
}

export const MAX_DAYS = 10;

export const COMPANY_RULES = [
    {
        company: "redforge",
        domains: ["redforge.com", "redforge.security", "redforge.co"],
        topics: [
            {
                label: "MFA, VPN, account security",
                keywords: ["mfa", "vpn", "password", "account"],
            },
            {
                label: "Incident response and SOC",
                keywords: ["incident", "response", "soc", "escalation"],
            },
            {
                label: "Firewall, endpoint, threat hunting",
                keywords: [
                    "firewall",
                    "endpoint",
                    "threat",
                    "hunt",
                    "security policy",
                    "security tool",
                ],
            },
        ],
        employees: [
            "john -> John Smith",
            "sarah -> Sarah Chen",
            "michael -> Michael Torres",
        ],
    },
    {
        company: "bluepeak",
        domains: ["bluepeak.org", "bluepeak.co", "bluepeak.security"],
        topics: [
            {
                label: "Payroll, benefits, PTO",
                keywords: ["payroll", "benefits", "pto", "enrollment"],
            },
            {
                label: "Training and awareness",
                keywords: ["training", "awareness", "phishing simulation"],
            },
            {
                label: "HR policy",
                keywords: ["hr", "dress code", "employee account"],
            },
        ],
        employees: [
            "emily -> Emily Carter",
            "david -> David Kim",
            "lisa -> Lisa Patel",
        ],
    },
    {
        company: "northstar",
        domains: ["northstar.io", "northstar.tech", "northstar.security"],
        topics: [
            {
                label: "Threat intel, SIEM, detection",
                keywords: [
                    "threat",
                    "siem",
                    "detection",
                    "endpoint",
                    "intel",
                    "tuning",
                ],
            },
            {
                label: "Pen testing and security reviews",
                keywords: ["pen test", "pentest", "test scope", "review"],
            },
            {
                label: "Assets, VPN, awareness",
                keywords: [
                    "asset",
                    "inventory",
                    "vpn",
                    "remote access",
                    "awareness",
                    "poster",
                    "whiteboard",
                    "war room",
                ],
            },
        ],
        employees: [
            "ryan -> Ryan Brooks",
            "nina -> Nina Alvarez",
            "kevin -> Kevin Shah",
        ],
    },
    {
        company: "stonegate",
        domains: ["stonegate.co", "stonegate.org", "stonegate.security"],
        topics: [
            {
                label: "Visitors, reception, badges",
                keywords: [
                    "visitor",
                    "reception",
                    "badge",
                    "access",
                    "front desk",
                    "camera",
                ],
            },
            {
                label: "Hiring and onboarding",
                keywords: [
                    "hire",
                    "hiring",
                    "interview",
                    "candidate",
                    "offer letter",
                    "onboarding",
                    "panel",
                ],
            },
            {
                label: "Facilities, PTO, payroll, reimbursements",
                keywords: [
                    "facility",
                    "facilities",
                    "office",
                    "lobby",
                    "supply",
                    "pto",
                    "payroll",
                    "expense",
                    "reimbursement",
                    "travel",
                ],
            },
        ],
        employees: [
            "olivia -> Olivia Reed",
            "daniel -> Daniel Park",
            "grace -> Grace Miller",
        ],
    },
    {
        company: "clearpath",
        domains: ["clearpath.net", "clearpath.io", "clearpath.security"],
        topics: [
            {
                label: "Clients, vendors, third-party risk",
                keywords: [
                    "client",
                    "vendor",
                    "third-party",
                    "risk",
                    "attestation",
                ],
            },
            {
                label: "Questionnaires, assessments, evidence",
                keywords: [
                    "questionnaire",
                    "assessment",
                    "evidence",
                    "agenda",
                    "contact sheet",
                ],
            },
            {
                label: "Risk registers and memos",
                keywords: ["register", "review", "acceptance", "committee"],
            },
        ],
        employees: [
            "aaron -> Aaron Blake",
            "megan -> Megan Foster",
            "tyler -> Tyler Ross",
        ],
    },
    {
        company: "ironclad",
        domains: ["ironclad.com", "ironclad.tech", "ironclad.security"],
        topics: [
            {
                label: "Hardware and diagnostics",
                keywords: [
                    "hardware",
                    "infrastructure",
                    "diagnostic",
                    "log",
                    "printer",
                ],
            },
            {
                label: "Access control, doors, sensors",
                keywords: [
                    "access",
                    "badge",
                    "door",
                    "sensor",
                    "reader",
                    "panel",
                ],
            },
            {
                label: "Network cabinets and maintenance",
                keywords: ["network", "cabinet", "layout", "maintenance"],
            },
        ],
        employees: [
            "hannah -> Hannah Wells",
            "jason -> Jason Cole",
            "priya -> Priya Nair",
        ],
    },
];

const noAttachments: string[] = [];

const RAW_DAYS: DayPlan[] = [
    {
        day: 1,
        focus: "Username, company, extension, and obvious banned files.",
        dailyRules: ["Subject header monitoring is active today."],
        subjectBans: [{ word: "password" }],
        emails: [
            {
                from: "John Smith",
                domain: "john@redforge.com",
                subject: "Updated MFA Schedule",
                body: "Starting Friday, RedForge staff must use MFA when connecting to internal VPN resources. Please review the updated schedule.",
                attachments: ["mfa_schedule.pdf"],
                type: "valid",
                violations: [],
            },
            {
                from: "Sarah Chen",
                domain: "john@redforge.security",
                subject: "Password Reset Utility",
                body: "Use the attached tool to automatically reset your account password before end of day.",
                attachments: ["reset_tool.exe"],
                type: "phishing",
                violations: [
                    "username does not match sender",
                    ".exe attachments are always banned",
                ],
            },
            {
                from: "Emily Carter",
                domain: "emily@bluepeak.co",
                subject: "Benefits Enrollment Reminder",
                body: "Open enrollment closes Friday. Please review the attached guide if you still need to update your selections.",
                attachments: ["benefits_guide.pdf"],
                type: "valid",
                violations: [],
            },
            {
                from: "John Smith",
                domain: "john@redforge.biz",
                subject: "VPN Reminder",
                body: "RedForge staff should confirm VPN access before Friday's MFA schedule change.",
                attachments: noAttachments,
                type: "phishing",
                violations: ["redforge.biz is not an approved RedForge domain"],
            },
            {
                from: "Olivia Reed",
                domain: "olivia@stonegate.co",
                subject: "Visitor Desk Instructions",
                body: "Reception needs all visitors logged at the front desk before temporary badges are issued.",
                attachments: noAttachments,
                type: "valid",
                violations: [],
            },
        ],
    },
    {
        day: 2,
        focus: "Wrong company extensions and subject/body mismatches.",
        dailyRules: ["No special daily alerts."],
        emails: [
            {
                from: "David Kim",
                domain: "david@bluepeak.security",
                subject: "Training Session Reminder",
                body: "This is a reminder that the required phishing awareness session begins at 2 PM in Conference Room B.",
                attachments: noAttachments,
                type: "valid",
                violations: [],
            },
            {
                from: "Ryan Brooks",
                domain: "ryan@northstar.com",
                subject: "Threat Intel Bulletin",
                body: "Attached is the weekly threat bulletin for analyst review.",
                attachments: ["intel_report.pdf"],
                type: "phishing",
                violations: [
                    "northstar.com is not an approved NorthStar domain",
                ],
            },
            {
                from: "Lisa Patel",
                domain: "lisa@bluepeak.org",
                subject: "HR Dress Code Reminder",
                body: "Please review the attached SIEM rule update before tonight's deployment.",
                attachments: ["siem_update.docx"],
                type: "phishing",
                violations: ["subject and body are about different topics"],
            },
            {
                from: "Olivia Reed",
                domain: "olivia@stonegate.org",
                subject: "Visitor Badge Policy",
                body: "Please remind visitors to sign in at reception and display temporary badges at all times.",
                attachments: ["visitor_policy.pdf"],
                type: "valid",
                violations: [],
            },
            {
                from: "Sarah Chen",
                domain: "sarah@redforge.co",
                subject: "Incident Response Newsletter",
                body: "This month's security note covers the new incident response handoff process and escalation contacts.",
                attachments: noAttachments,
                type: "valid",
                violations: [],
            },
            {
                from: "Aaron Blake",
                domain: "aaron@clearpath.com",
                subject: "Client Risk Summary",
                body: "Attached is the client risk summary for tomorrow's vendor review.",
                attachments: ["risk_summary.pdf"],
                type: "phishing",
                violations: [
                    "clearpath.com is not an approved ClearPath domain",
                ],
            },
        ],
    },
    {
        day: 3,
        focus: "Full identity checks and attachment context.",
        dailyRules: ["Attachments must match the subject and body topic."],
        emails: [
            {
                from: "John Davis",
                domain: "john@redforge.co",
                subject: "New Endpoint Detection Guide",
                body: "Please review the attached guide before next week's rollout.",
                attachments: ["edr_guide.pdf"],
                type: "phishing",
                violations: ["john maps to John Smith, not John Davis"],
            },
            {
                from: "Nina Alvarez",
                domain: "nina@northstar.tech",
                subject: "Quarterly Awareness Poster",
                body: "Marketing needs approval on the latest security awareness poster before it is printed for the office.",
                attachments: ["awareness_poster.png"],
                type: "valid",
                violations: [],
            },
            {
                from: "Grace Miller",
                domain: "grace@stonegate.co",
                subject: "Travel Reimbursement Form",
                body: "Please complete the reimbursement request and return it by Thursday.",
                attachments: ["server_rack.jpeg"],
                type: "phishing",
                violations: ["attachment does not match the email topic"],
            },
            {
                from: "Aaron Blake",
                domain: "aaron@clearpath.net",
                subject: "Client Questionnaire Draft",
                body: "Attached is the first draft of the client security questionnaire for internal review.",
                attachments: ["questionnaire.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Priya Nair",
                domain: "priya@ironclad.security",
                subject: "Compressed Log Bundle",
                body: "Attached are the consolidated logs from this morning's hardware diagnostics.",
                attachments: ["hardware_logs.zip"],
                type: "phishing",
                violations: [".zip attachments are always banned"],
            },
            {
                from: "Jason Cole",
                domain: "jason@ironclad.tech",
                subject: "Hardware Checkout Log",
                body: "Attached is the updated hardware checkout log for devices issued this week.",
                attachments: ["hardware_checkout.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Emily Morris",
                domain: "emily@bluepeak.org",
                subject: "Payroll Window",
                body: "Payroll edits close at noon tomorrow. Please review the attached schedule.",
                attachments: ["payroll_window.pdf"],
                type: "phishing",
                violations: ["emily maps to Emily Carter, not Emily Morris"],
            },
        ],
    },
    {
        day: 4,
        focus: "Daily topic bans.",
        dailyRules: ["Reject emails mentioning weather today."],
        subjectBans: [{ word: "weather" }],
        emails: [
            {
                from: "Emily Carter",
                domain: "emily@bluepeak.org",
                subject: "Weather Closure Update",
                body: "Due to forecasted heavy rain, departments may be dismissed early tomorrow afternoon.",
                attachments: noAttachments,
                type: "phishing",
                violations: ["weather topic is blocked today"],
            },
            {
                from: "Michael Torres",
                domain: "michael@redforge.security",
                subject: "Firewall Rule Review",
                body: "Please review the attached firewall change summary before tonight's maintenance window.",
                attachments: ["firewall_review.pdf"],
                type: "valid",
                violations: [],
            },
            {
                from: "Hannah Wells",
                domain: "hannah@ironclad.com",
                subject: "Printer Driver Update",
                body: "Please run the attached utility to install the new secure print driver.",
                attachments: ["print_patch.exe"],
                type: "phishing",
                violations: [".exe attachments are always banned"],
            },
            {
                from: "Daniel Park",
                domain: "daniel@stonegate.security",
                subject: "Interview Schedule",
                body: "HR finalized next week's interview schedule. Please review the attached document for timing and room assignments.",
                attachments: ["interview_schedule.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Tyler Ross",
                domain: "tyler@clearpath.io",
                subject: "Travel Delay Notice",
                body: "Snow may impact travel to the client site tomorrow morning.",
                attachments: ["travel_notice.pdf"],
                type: "phishing",
                violations: ["weather topic is blocked today"],
            },
            {
                from: "Kevin Shah",
                domain: "kevin@northstar.security",
                subject: "Detection Rule Tuning Notes",
                body: "Attached are the latest tuning notes for the detection set discussed in today's engineering review.",
                attachments: ["tuning_notes.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Megan Foster",
                domain: "megan@clearpath.security",
                subject: "Vendor Attestation Checklist",
                body: "Attached is the attestation checklist for tomorrow's third-party risk review.",
                attachments: ["attestation_checklist.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Aaron Blake",
                domain: "aaron@clearpath.net",
                subject: "Office Temperature Notice",
                body: "A heat wave may affect afternoon site visits. Please check local conditions before travel.",
                attachments: noAttachments,
                type: "phishing",
                violations: ["weather topic is blocked today"],
            },
        ],
    },
    {
        day: 5,
        focus: "Blocked senders.",
        dailyRules: [
            "Michael Torres has been terminated. Reject Michael from now on.",
        ],
        emails: [
            {
                from: "Michael Torres",
                domain: "michael@redforge.com",
                subject: "Immediate Password Update",
                body: "Please review the attached instructions and complete your password update before your access is restricted.",
                attachments: ["password_steps.docx"],
                type: "phishing",
                violations: ["Michael Torres is blocked"],
            },
            {
                from: "John Smith",
                domain: "john@redforge.security",
                subject: "SOC Escalation Matrix",
                body: "Please reference the attached escalation matrix for after-hours incident handling.",
                attachments: ["escalation_matrix.pdf"],
                type: "valid",
                violations: [],
            },
            {
                from: "Megan Foster",
                domain: "megan@clearpath.security",
                subject: "Vendor Review Packet",
                body: "Attached is the vendor review packet for tomorrow's risk committee meeting.",
                attachments: ["vendor_review.pdf"],
                type: "valid",
                violations: [],
            },
            {
                from: "Michael Torres",
                domain: "michael@redforge.co",
                subject: "Laptop Return Label",
                body: "Please print the attached return label and use it for device shipment.",
                attachments: ["return_label.pdf"],
                type: "phishing",
                violations: ["Michael Torres is blocked"],
            },
            {
                from: "Olivia Reed",
                domain: "olivia@stonegate.org",
                subject: "New Hire Packet",
                body: "Attached is the onboarding packet for next Monday's analyst start date.",
                attachments: ["new_hire_packet.pdf"],
                type: "valid",
                violations: [],
            },
            {
                from: "Sarah Chen",
                domain: "sarah@redforge.net",
                subject: "Incident Debrief",
                body: "Attached is the summary from yesterday's debrief.",
                attachments: ["incident_debrief.pdf"],
                type: "phishing",
                violations: ["redforge.net is not an approved RedForge domain"],
            },
            {
                from: "Jason Cole",
                domain: "jason@ironclad.tech",
                subject: "Badge Controller Maintenance",
                body: "Badge controller maintenance begins at 11 PM. Expect brief interruptions for door access sync.",
                attachments: noAttachments,
                type: "valid",
                violations: [],
            },
            {
                from: "Hannah Wells",
                domain: "hannah@ironclad.com",
                subject: "Access Panel Inspection",
                body: "Attached is the inspection photo from the Building C access panel replacement.",
                attachments: ["panel_inspection.jpeg"],
                type: "valid",
                violations: [],
            },
            {
                from: "Nina Alvarez",
                domain: "nina@northstarr.tech",
                subject: "Detection Backlog",
                body: "Attached is the current detection backlog for review before planning.",
                attachments: ["detection_backlog.docx"],
                type: "phishing",
                violations: [
                    "northstarr.tech is not an approved NorthStar domain",
                ],
            },
        ],
    },
    {
        day: 6,
        focus: "Company-wide distrust.",
        dailyRules: [
            "Michael Torres remains blocked.",
            "BluePeak has been breached. Reject all BluePeak emails today.",
        ],
        subjectBans: [{ word: "payroll", companies: ["bluepeak"] }],
        emails: [
            {
                from: "Emily Carter",
                domain: "emily@bluepeak.org",
                subject: "Payroll Confirmation",
                body: "Please review the attached payroll confirmation document.",
                attachments: ["payroll.pdf"],
                type: "phishing",
                violations: ["BluePeak is blocked today"],
            },
            {
                from: "Sarah Chen",
                domain: "sarah@redforge.co",
                subject: "MFA Exception Request",
                body: "Please send any MFA exception requests before 2 PM for manager review.",
                attachments: noAttachments,
                type: "valid",
                violations: [],
            },
            {
                from: "David Kim",
                domain: "david@bluepeak.security",
                subject: "Phishing Simulation Results",
                body: "Attached are the results from last week's internal phishing exercise.",
                attachments: ["simulation_results.pdf"],
                type: "phishing",
                violations: ["BluePeak is blocked today"],
            },
            {
                from: "Daniel Park",
                domain: "daniel@stonegate.co",
                subject: "Badge Access Review",
                body: "Please review contractor badge permissions for the third floor before close of business.",
                attachments: ["badge_review.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Aaron Blake",
                domain: "aaron@clearpath.io",
                subject: "Client Security Questionnaire",
                body: "Attached is the completed client questionnaire for leadership review before submission.",
                attachments: ["client_questionnaire.pdf"],
                type: "valid",
                violations: [],
            },
            {
                from: "Lisa Patel",
                domain: "lisa@bluepeak.co",
                subject: "Updated PTO Tracker",
                body: "Attached is the revised PTO tracker for this month.",
                attachments: ["pto_tracker.docx"],
                type: "phishing",
                violations: ["BluePeak is blocked today"],
            },
            {
                from: "Ryan Brooks",
                domain: "ryan@northstar.io",
                subject: "Threat Intel Summary",
                body: "Attached is this morning's intel summary for engineering and SOC review.",
                attachments: ["intel_summary.pdf"],
                type: "valid",
                violations: [],
            },
            {
                from: "Priya Nair",
                domain: "priya@ironclad.security",
                subject: "Door Sensor Replacement Log",
                body: "Attached is the replacement log for the failed door sensors in Building B.",
                attachments: ["sensor_log.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Grace Miller",
                domain: "grace@stonegate.co",
                subject: "Office Supply Audit",
                body: "Attached is the office supply audit for facilities review before Friday.",
                attachments: ["supply_audit.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Emily Carter",
                domain: "emily@bluepeak.co",
                subject: "Benefits FAQ",
                body: "Attached is the updated benefits FAQ for employees with open enrollment questions.",
                attachments: ["benefits_faq.pdf"],
                type: "phishing",
                violations: ["BluePeak is blocked today"],
            },
        ],
    },
    {
        day: 7,
        focus: "Day-specific attachment bans.",
        dailyRules: [
            "Michael Torres remains blocked.",
            "Reject all .pdf attachments today.",
        ],
        emails: [
            {
                from: "John Smith",
                domain: "john@redforge.co",
                subject: "Revised Security Policy",
                body: "Please review the revised policy attached before Friday.",
                attachments: ["policy.pdf"],
                type: "phishing",
                violations: [".pdf attachments are banned today"],
            },
            {
                from: "Sarah Chen",
                domain: "sarah@redforge.com",
                subject: "SOC Shift Board",
                body: "Attached is the updated shift board image for this weekend.",
                attachments: ["shift_board.png"],
                type: "valid",
                violations: [],
            },
            {
                from: "Nina Alvarez",
                domain: "nina@northstar.security",
                subject: "Pen Test Scope Draft",
                body: "Please review the first draft of the test scope before tomorrow's call.",
                attachments: ["pentest_scope.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Olivia Reed",
                domain: "olivia@stonegate.org",
                subject: "Expense Form",
                body: "Please complete the attached reimbursement form and send it back to HR.",
                attachments: ["expense_form.pdf"],
                type: "phishing",
                violations: [".pdf attachments are banned today"],
            },
            {
                from: "Grace Miller",
                domain: "grace@stonegate.security",
                subject: "Lobby Poster Approval",
                body: "Facilities would like approval on the updated awareness poster for the front lobby.",
                attachments: ["poster.jpeg"],
                type: "valid",
                violations: [],
            },
            {
                from: "Emily Carter",
                domain: "emily@bluepeak.security",
                subject: "Open Immediately",
                body: "Please unpack the attached archive to review the latest benefits materials.",
                attachments: ["materials.zip"],
                type: "phishing",
                violations: [".zip attachments are always banned"],
            },
            {
                from: "Tyler Ross",
                domain: "tyler@clearpath.security",
                subject: "Risk Review Notes",
                body: "Attached are the review notes from today's vendor risk meeting.",
                attachments: ["risk_notes.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Jason Cole",
                domain: "jason@ironclad.com",
                subject: "Network Cabinet Inventory",
                body: "Attached is the finalized cabinet inventory sheet.",
                attachments: ["cabinet_inventory.pdf"],
                type: "phishing",
                violations: [".pdf attachments are banned today"],
            },
            {
                from: "Kevin Shah",
                domain: "kevin@northstar.tech",
                subject: "War Room Whiteboard Snapshot",
                body: "Attached is the image from today's whiteboard review after the incident briefing.",
                attachments: ["warroom.png"],
                type: "valid",
                violations: [],
            },
            {
                from: "David Kim",
                domain: "david@bluepeak.org",
                subject: "Awareness Slide Draft",
                body: "Attached is the slide image for next week's phishing awareness training.",
                attachments: ["awareness_slide.png"],
                type: "valid",
                violations: [],
            },
            {
                from: "Megan Foster",
                domain: "megan@clearpath.net",
                subject: "Risk Acceptance Memo",
                body: "Please review the attached risk acceptance memo before the committee meeting.",
                attachments: ["risk_acceptance.pdf"],
                type: "phishing",
                violations: [".pdf attachments are banned today"],
            },
        ],
    },
    {
        day: 8,
        focus: "Subtle phishing language and near-legit messages.",
        dailyRules: [
            "Michael Torres remains blocked.",
            "Reject urgent credential or account verification requests.",
        ],
        subjectBans: [{ word: "icecream" }],
        emails: [
            {
                from: "Sarah Chen",
                domain: "sarah@redforge.security",
                subject: "Threat Hunt Notes",
                body: "Attached are the notes from the morning hunt review covering the suspicious PowerShell activity we discussed.",
                attachments: ["hunt_notes.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "John Smith",
                domain: "john@redforge.com",
                subject: "HR Update",
                body: "Please open the attached form and re-enter your VPN credentials so your account is not disabled.",
                attachments: ["vpn_form.docx"],
                type: "phishing",
                violations: [
                    "subject/body mismatch",
                    "suspicious credential request",
                ],
            },
            {
                from: "Grace Miller",
                domain: "grace@stonegate.co",
                subject: "Reception Desk Coverage",
                body: "Please confirm whether you can cover the front desk from 12 to 1 while the receptionist is in a meeting.",
                attachments: noAttachments,
                type: "valid",
                violations: [],
            },
            {
                from: "Daniel Park",
                domain: "daniel@stonegate.security",
                subject: "Security Camera Review",
                body: "Please run the attached utility to view the updated camera logs.",
                attachments: ["camera_review.exe"],
                type: "phishing",
                violations: [".exe attachments are always banned"],
            },
            {
                from: "Kevin Shah",
                domain: "kevin@northstar.io",
                subject: "Asset Inventory Snapshot",
                body: "Attached is the updated image export from the asset inventory dashboard.",
                attachments: ["inventory.png"],
                type: "valid",
                violations: [],
            },
            {
                from: "Lisa Patel",
                domain: "lisa@bluepeak.org",
                subject: "Benefits Reminder",
                body: "We detected an issue with your crypto wallet access. Review the attached instructions immediately.",
                attachments: ["wallet_steps.docx"],
                type: "phishing",
                violations: [
                    "subject/body mismatch",
                    "suspicious unrelated crypto theme",
                ],
            },
            {
                from: "Olivia Reed",
                domain: "olivia@stonegate.org",
                subject: "Offer Letter Draft",
                body: "Attached is the current draft of the offer letter for the analyst candidate scheduled to start next month.",
                attachments: ["offer_letter.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Emily Carter",
                domain: "emily@bluepeak.co",
                subject: "Account Verification Needed",
                body: "Your employee account requires immediate verification. Open the attached archive and follow the steps inside.",
                attachments: ["verify.zip"],
                type: "phishing",
                violations: [
                    ".zip attachments are always banned",
                    "suspicious urgent account verification",
                ],
            },
            {
                from: "Megan Foster",
                domain: "megan@clearpath.net",
                subject: "Third-Party Risk Agenda",
                body: "Attached is tomorrow's agenda for the third-party risk review meeting.",
                attachments: ["risk_agenda.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Ryan Brooks",
                domain: "ryan@northstar.tech",
                subject: "Meeting Notes",
                body: "Please see the attached notes from the detection review.",
                attachments: ["beach_trip.jpeg"],
                type: "phishing",
                violations: ["attachment does not match the email topic"],
            },
            {
                from: "Aaron Blake",
                domain: "aaron@clearpath.io",
                subject: "Vendor Evidence List",
                body: "Attached is the current evidence list for the vendor security assessment.",
                attachments: ["vendor_evidence.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Hannah Wells",
                domain: "hannah@ironclad.security",
                subject: "Account Lock Notice",
                body: "Your infrastructure account will lock in 30 minutes unless you send your password for verification.",
                attachments: noAttachments,
                type: "phishing",
                violations: ["suspicious urgent credential request"],
            },
        ],
    },
    {
        day: 9,
        focus: "Topic/company alignment.",
        dailyRules: [
            "Michael Torres remains blocked.",
            "HR topics only from BluePeak or StoneGate.",
            "Security engineering/detection topics only from RedForge, NorthStar, or ClearPath.",
            "IronClad is trusted mainly for infrastructure, access, hardware, and maintenance.",
        ],
        emails: [
            {
                from: "John Smith",
                domain: "john@redforge.security",
                subject: "Firewall Exception Request",
                body: "Attached is the latest firewall exception request for internal review before deployment.",
                attachments: ["firewall_request.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Ryan Brooks",
                domain: "ryan@northstar.io",
                subject: "HR Payroll Review",
                body: "Attached is the payroll review packet for your department.",
                attachments: ["payroll_review.docx"],
                type: "phishing",
                violations: ["HR topic from wrong company category today"],
            },
            {
                from: "Emily Carter",
                domain: "emily@bluepeak.security",
                subject: "Endpoint Alert Summary",
                body: "Attached are the latest endpoint detections from the environment.",
                attachments: ["endpoint_summary.docx"],
                type: "phishing",
                violations: [
                    "security detection topic from wrong company category today",
                ],
            },
            {
                from: "Olivia Reed",
                domain: "olivia@stonegate.co",
                subject: "Updated PTO Window",
                body: "The PTO submission window for next month closes on Friday. Please complete requests before then.",
                attachments: noAttachments,
                type: "valid",
                violations: [],
            },
            {
                from: "John Smith",
                domain: "john@stonegate.org",
                subject: "Interview Panel Update",
                body: "Please review the revised panel assignments for tomorrow.",
                attachments: ["panel_update.docx"],
                type: "phishing",
                violations: ["John Smith does not work at StoneGate"],
            },
            {
                from: "Nina Alvarez",
                domain: "nina@northstar.tech",
                subject: "SIEM Rule Tuning Notes",
                body: "Attached are the latest tuning notes following the false positive review from this morning.",
                attachments: ["siem_tuning.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Sarah Chen",
                domain: "sarah@redforge.com",
                subject: "Policy Reminder",
                body: "Due to possible storms tomorrow, the office may close early.",
                attachments: noAttachments,
                type: "phishing",
                violations: ["subject and body are about different topics"],
            },
            {
                from: "Grace Miller",
                domain: "grace@stonegate.security",
                subject: "Interview Schedule Revision",
                body: "Attached is the revised interview schedule for the support analyst candidates.",
                attachments: ["schedule.jpeg"],
                type: "valid",
                violations: [],
            },
            {
                from: "Daniel Park",
                domain: "daniel@stonegate.com",
                subject: "Office Access Update",
                body: "Please review the changes to reception access procedures.",
                attachments: ["access_update.docx"],
                type: "phishing",
                violations: [
                    "stonegate.com is not an approved StoneGate domain",
                ],
            },
            {
                from: "Tyler Ross",
                domain: "tyler@clearpath.io",
                subject: "Detection Coverage Map",
                body: "Attached is the latest detection coverage map for review before tomorrow's client briefing.",
                attachments: ["coverage.png"],
                type: "valid",
                violations: [],
            },
            {
                from: "Lisa Patel",
                domain: "lisa@bluepeak.org",
                subject: "Benefits Package",
                body: "Please review the attached package and confirm your payroll credentials.",
                attachments: ["benefits.pdf"],
                type: "phishing",
                violations: ["suspicious credential request"],
            },
            {
                from: "Priya Nair",
                domain: "priya@ironclad.com",
                subject: "Access Reader Replacement Log",
                body: "Attached is the replacement log for the east lobby access readers.",
                attachments: ["reader_replacement.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Megan Foster",
                domain: "megan@clearpath.security",
                subject: "Benefits Open Enrollment Checklist",
                body: "Attached is the open enrollment checklist for staff benefit changes.",
                attachments: ["enrollment_checklist.docx"],
                type: "phishing",
                violations: ["HR topic from wrong company category today"],
            },
        ],
    },
    {
        day: 10,
        focus: "Layered final checks.",
        dailyRules: [
            "Michael Torres remains blocked.",
            "BluePeak is under restricted trust.",
            "Reject all .pdf attachments today.",
            "Reject weather-related content.",
            "Reject urgent credential or account verification requests.",
            "Topic/company alignment still matters.",
        ],
        subjectBans: [
            { word: "weather" },
            { word: "benefits", companies: ["bluepeak"] },
        ],
        emails: [
            {
                from: "Sarah Chen",
                domain: "sarah@redforge.co",
                subject: "IR Team Rotation",
                body: "Please confirm your availability for next week's incident response rotation by end of day.",
                attachments: noAttachments,
                type: "valid",
                violations: [],
            },
            {
                from: "Michael Torres",
                domain: "michael@redforge.security",
                subject: "Security Tool Update",
                body: "Please review the attachment before tonight's maintenance window.",
                attachments: ["tool_update.docx"],
                type: "phishing",
                violations: ["Michael Torres is blocked"],
            },
            {
                from: "Emily Carter",
                domain: "emily@bluepeak.co",
                subject: "Benefits Action Required",
                body: "Please complete the attached account verification steps immediately to prevent interruption to payroll.",
                attachments: ["verification.docx"],
                type: "phishing",
                violations: [
                    "BluePeak is restricted",
                    "suspicious urgent account verification",
                ],
            },
            {
                from: "Nina Alvarez",
                domain: "nina@northstar.security",
                subject: "Detection Logic Review",
                body: "Attached is the latest draft of the detection logic review for tomorrow's engineering sync.",
                attachments: ["logic_review.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "John Smith",
                domain: "john@redforge.com",
                subject: "Snow Delay Notice",
                body: "Snowfall may delay office opening tomorrow morning.",
                attachments: noAttachments,
                type: "phishing",
                violations: ["weather topic is blocked today"],
            },
            {
                from: "Olivia Reed",
                domain: "olivia@stonegate.org",
                subject: "Payroll Correction",
                body: "Please open the attached archive and complete the correction form today.",
                attachments: ["payroll_fix.zip"],
                type: "phishing",
                violations: [".zip attachments are always banned"],
            },
            {
                from: "Grace Miller",
                domain: "grace@stonegate.co",
                subject: "Candidate Packet",
                body: "Attached is the candidate packet for the systems support interviews scheduled this week.",
                attachments: ["candidate_packet.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Kevin Shah",
                domain: "kevin@northstar.io",
                subject: "VPN Guide",
                body: "Attached is the latest remote access guide.",
                attachments: ["vpn_guide.pdf"],
                type: "phishing",
                violations: [".pdf attachments are banned today"],
            },
            {
                from: "Jason Cole",
                domain: "jason@ironclad.tech",
                subject: "Office Hardware Layout",
                body: "Attached is the updated hardware layout image for the new access control cabinet installation.",
                attachments: ["hardware_layout.png"],
                type: "valid",
                violations: [],
            },
            {
                from: "Ryan Carter",
                domain: "ryan@northstar.tech",
                subject: "Threat Review Notes",
                body: "Attached are the notes from today's engineering threat review.",
                attachments: ["review_notes.docx"],
                type: "phishing",
                violations: ["ryan maps to Ryan Brooks, not Ryan Carter"],
            },
            {
                from: "Aaron Blake",
                domain: "aaron@clearpath.security",
                subject: "Approved Vendor Contact Sheet",
                body: "Attached is the latest approved vendor contact sheet for the risk team.",
                attachments: ["vendor_contacts.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Lisa Patel",
                domain: "lisa@bluepeak.security",
                subject: "Benefits Update",
                body: "To avoid account suspension, confirm your payroll login using the attached instructions immediately.",
                attachments: ["login_steps.docx"],
                type: "phishing",
                violations: [
                    "BluePeak is restricted",
                    "suspicious credential request",
                ],
            },
            {
                from: "Tyler Ross",
                domain: "tyler@clearpath.net",
                subject: "Client Risk Register",
                body: "Attached is the updated client risk register for tomorrow's security briefing.",
                attachments: ["client_risk_register.docx"],
                type: "valid",
                violations: [],
            },
            {
                from: "Daniel Park",
                domain: "daniel@stonegate.security",
                subject: "Weather Closure Reminder",
                body: "Rain may delay building opening tomorrow morning. Please check for updates before commuting.",
                attachments: noAttachments,
                type: "phishing",
                violations: ["weather topic is blocked today"],
            },
        ],
    },
];

function getCompanyDisplayName(company: string) {
    return company
        .replace("redforge", "RedForge")
        .replace("bluepeak", "BluePeak")
        .replace("northstar", "NorthStar")
        .replace("stonegate", "StoneGate")
        .replace("clearpath", "ClearPath")
        .replace("ironclad", "IronClad");
}

function getCompanyKeyFromDomain(address: string) {
    const domain = address.toLowerCase().split("@")[1] ?? "";
    return domain.split(".")[0] ?? "";
}

function getCompanyRuleForEmail(email: EmailCase) {
    const companyKey = getCompanyKeyFromDomain(email.domain);
    return COMPANY_RULES.find((rule) => rule.company === companyKey);
}

function formatCompanyList(companies: string[]) {
    return companies.map(getCompanyDisplayName).join(", ");
}

function emailMatchesCompanyTopic(email: EmailCase, rule: typeof COMPANY_RULES[number]) {
    const searchableText = [
        email.subject,
        email.body,
        ...email.attachments,
    ]
        .join(" ")
        .toLowerCase();

    return rule.topics.some((topic) =>
        topic.keywords.some((keyword) =>
            searchableText.includes(keyword.toLowerCase()),
        ),
    );
}

function applyCompanyTopicRules(dayPlan: DayPlan): DayPlan {
    return {
        ...dayPlan,
        emails: dayPlan.emails.map((email) => {
            const companyRule = getCompanyRuleForEmail(email);

            if (
                !companyRule ||
                emailMatchesCompanyTopic(email, companyRule)
            ) {
                return email;
            }

            const companyName = getCompanyDisplayName(companyRule.company);
            const topicList = companyRule.topics
                .map((topic) => topic.label)
                .join("; ");
            const violation = `${companyName} does not normally send this topic. Expected: ${topicList}.`;

            return {
                ...email,
                type: "phishing",
                violations:
                    email.violations.includes(violation) ?
                        email.violations
                    :   [...email.violations, violation],
            };
        }),
    };
}

function formatSubjectBanRule(ban: SubjectHeaderBan) {
    const scope =
        ban.companies && ban.companies.length > 0 ?
            ` for ${formatCompanyList(ban.companies)}`
        :   "";

    return `Reject subject headers containing "${ban.word}"${scope}.`;
}

function subjectBanAppliesToEmail(ban: SubjectHeaderBan, email: EmailCase) {
    if (!ban.companies || ban.companies.length === 0) {
        return true;
    }

    return ban.companies.includes(getCompanyKeyFromDomain(email.domain));
}

function applySubjectHeaderRules(dayPlan: DayPlan): DayPlan {
    const subjectBans = dayPlan.subjectBans ?? [];

    if (subjectBans.length === 0) {
        return dayPlan;
    }

    return {
        ...dayPlan,
        emails: dayPlan.emails.map((email) => {
            const subject = email.subject.toLowerCase();
            const violations = subjectBans
                .filter(
                    (ban) =>
                        subjectBanAppliesToEmail(ban, email) &&
                        subject.includes(ban.word.toLowerCase()),
                )
                .map(
                    (ban) =>
                        `subject header contains banned word "${ban.word}"${
                            ban.companies && ban.companies.length > 0 ?
                                ` for ${formatCompanyList(ban.companies)}`
                            :   ""
                        }`,
                );

            if (violations.length === 0) {
                return email;
            }

            return {
                ...email,
                type: "phishing",
                violations: [
                    ...email.violations,
                    ...violations.filter(
                        (violation) =>
                            !email.violations.includes(violation),
                    ),
                ],
            };
        }),
    };
}

export const DAYS: DayPlan[] = RAW_DAYS.map((dayPlan) =>
    applySubjectHeaderRules(applyCompanyTopicRules(dayPlan)),
);

export function getRulebookPages(dayPlan: DayPlan) {
    const companyPages = COMPANY_RULES.map((rule, index) => ({
        title: getCompanyDisplayName(rule.company),
        companyIndex: index,
        body:
            `Domains: ${rule.domains.join(", ")}\n\n` +
            `Employees:\n${rule.employees.join("\n")}\n\n` +
            `Topics:\n${rule.topics.map((topic) => `- ${topic.label}`).join("\n")}`,
    }));

    return [
        {
            title: "Core Rules",
            body:
                "Accept mail only when every core check passes.\n\n" +
                "Address format:\nusername@company.extension\n\n" +
                "Identity checks:\n" +
                "- username matches sender first name\n" +
                "- username maps to the full sender name\n" +
                "- sender belongs to that company\n" +
                "- company extension is approved",
        },
        {
            title: "Core Rules: Content",
            body:
                "Read the subject, body, and attachments together.\n\n" +
                "Content checks:\n" +
                "- subject and body discuss the same topic\n" +
                "- topic fits the sender company's expected topics\n" +
                "- attachments match the email topic\n\n" +
                "Always reject:\n" +
                "- .exe attachments\n" +
                "- .zip attachments",
        },
        ...companyPages,
        {
            title: `Day ${dayPlan.day} Alerts`,
            body:
                `${dayPlan.focus}\n\n` +
                [
                    ...dayPlan.dailyRules,
                    ...(dayPlan.subjectBans ?? []).map(formatSubjectBanRule),
                ]
                    .map((rule) => `- ${rule}`)
                    .join("\n"),
        },
    ];
}
