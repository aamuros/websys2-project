"""Build Phase 4 documents and a source snapshot from recorded, successful runs.

Run from the repository root after saving PHPUnit JUnit and Playwright CLI evidence.
Requires reportlab; never generates test results or human feedback.
"""

from pathlib import Path
from html import escape
import hashlib
import json
import re
import shutil
import subprocess
import xml.etree.ElementTree as ET
import zipfile

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / 'submission/PHASE4'
DOCS = ROOT / 'docs/phase4'
EVIDENCE = PACK / 'EVIDENCE'
DOCS.mkdir(parents=True, exist_ok=True)
PDF = ROOT / 'output/pdf'
PDF.mkdir(parents=True, exist_ok=True)
cases = ET.parse(EVIDENCE / 'phpunit-results.xml').findall('.//testcase')
assert len(cases) == 86 and all(not list(c) for c in cases), 'Require 86 passing backend cases.'
browser = []
for filename in ('browser-auth.txt', 'browser-features.txt'):
    raw = (EVIDENCE / filename).read_text()
    match = re.search(r'### Result\s*\n(\[.*?\])\s*\n###', raw, re.S)
    assert match, f'Missing completed browser results: {filename}'
    browser.extend(json.loads(match.group(1)))
assert len(browser) == 18 and all(c['status'] == 'PASS' for c in browser)
(EVIDENCE / 'browser-results.json').write_text(json.dumps(browser, indent=2) + '\n')

# These are the expected and observed assertions of Phase4SecurityTest, not scanner findings.
META = {
    'VAL01': ('Empty required fields', 'Login email/password blank', 'Reject both fields', 'HTTP 422; email and password errors; guest'),
    'VAL02': ('Invalid email', 'Email abc', 'Reject malformed email', 'HTTP 422; email error; guest'),
    'VAL03': ('Registration name length', 'Name A; other fields valid', 'Reject name shorter than 2 characters', 'HTTP 422; name error; no user created'),
    'VAL04': ('Duplicate email', 'Existing phase4@example.test', 'Reject duplicate account', 'HTTP 422; email error; user count unchanged'),
    'VAL05': ('Password length', 'Password/confirmation short', 'Require at least 8 characters', 'HTTP 422; password error; no user created'),
    'VAL06': ('Password confirmation', 'Garden123! / Mismatch123!', 'Reject mismatch', 'HTTP 422; password error; no user created'),
    'VAL07': ('Plot numeric and enum validation', 'Size -1; status invalid', 'Reject negative size and unknown status', 'HTTP 422; both errors; no plot created'),
    'VAL08': ('Request note bounds', 'Blank, short, and 501 x characters', 'Require 10-500 characters', 'HTTP 422 for each payload; no request created'),
    'VAL09': ('Event date ordering', 'Start 2026-09-29 10:00; end 09:00', 'End must follow start', 'HTTP 422; ends_at error; no event created'),
    'SQL01': ('Login email injection', "' OR '1'='1' --", 'No login bypass', 'HTTP 422; invalid email; guest; users unchanged'),
    'SQL02': ('Password tautology', "' OR 1=1 --", 'No login bypass', 'HTTP 422; credential error; guest'),
    'SQL03': ('Password UNION payload', "' UNION SELECT 1,2,3 --", 'No login bypass', 'HTTP 422; credential error; guest'),
    'SQL04': ('Search parameter binding', "Search: ' OR 1=1 --", 'Treat as literal search data', 'HTTP 200; 0 matches; payload in bindings, absent from SQL template; plot remains'),
    'SQL05': ('Stacked statement in plot code', "T'); DROP TABLE users;--", 'Store text without executing SQL', 'Exact text persisted; users table intact; payload in bindings, absent from SQL template'),
    'SQL06': ('Numeric ID injection', 'garden_plot_id: 1 OR 1=1', 'Reject non-integer ID', 'HTTP 422; ID error; no request created'),
    'SQL07': ('Legitimate apostrophe', "Name: Maria O'Brien", 'Allow ordinary punctuation safely', 'Account created as member; exact name preserved'),
    'AUTH01': ('Session handling and logout', 'Valid login, logout, then protected URL', 'Rotate session on login; invalidate on logout', 'Session IDs differ; CSRF token rotates on logout; guest; protected URL redirects'),
    'AUTH02': ('Login throttling', '5 incorrect passwords then correct password', 'Reject sixth attempt during lockout', 'Throttle message; guest remains unauthenticated'),
    'AUTH03': ('Suspended account login', 'Correct password for inactive user', 'Deny login', 'HTTP 422; credential error; guest'),
    'AUTH04': ('Suspended active session', 'Suspend logged-in user, revisit dashboard', 'Force logout and invalidate session', 'Login redirect; suspended-account message; guest; new session and CSRF token available'),
    'AUTH05': ('Password-change verification', 'Incorrect current password', 'Reject change', 'HTTP 422; current-password error; original password hash still valid'),
    'AUTH06': ('Anonymous API access', 'GET plots and POST request without login', 'Require authentication', 'Both return HTTP 401'),
    'ROLE01': ('Registration role escalation', 'role=admin; is_active=false', 'Registration creates active member only', 'Stored role member; account active'),
    'ROLE02': ('Self-promotion attempt', 'Member PUT own /members/{id}; role=staff', 'Deny member-access management', 'HTTP 403; role remains member'),
    'ROLE03': ('Staff access-change attempt', 'Staff PUT member role/status', 'Only admin may manage access', 'HTTP 403; target member unchanged'),
    'ROLE04': ('Self-approval attempt', 'Member POST own request /approve', 'Only staff may approve', 'HTTP 403; request pending; no assignment created'),
    'XSS01': ('Stored profile script', '<script>window.__phase4Xss=1</script>', 'Return input as escaped data', 'Exact name stored; Inertia property equals payload; raw tag absent from initial HTML'),
    'XSS02': ('Stored announcement handler', '<img src=x onerror="window.__phase4Xss=2">', 'Return input as escaped data', 'Exact body stored; Inertia property equals payload; raw tag absent from initial HTML'),
    'XSS03': ('Reflected search handler', '<svg onload="window.__phase4Xss=3">', 'Reflect search as escaped data', 'Literal filter value; 0 matches; raw tag absent from initial HTML'),
}
main_cases = {}
for case in cases:
    match = re.match(r'test_((?:val|sql|auth|role|xss)\d+)_', case.get('name'))
    if match:
        main_cases[match.group(1).upper()] = case
assert set(main_cases) == set(META)

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Cell', fontName='Helvetica', fontSize=8, leading=11, spaceAfter=0))
styles.add(ParagraphStyle(name='SmallNote', fontSize=8, leading=11, textColor=colors.HexColor('#53604b')))
styles['BodyText'].fontSize = 10
styles['BodyText'].leading = 14
styles['Title'].textColor = colors.HexColor('#364529')
styles['Heading1'].textColor = colors.HexColor('#364529')
story = []
md = []
WIDTH, HEIGHT = landscape(A4)
AVAILABLE = WIDTH - 72

def text(value):
    return escape(str(value)).replace('\n', '<br/>')

def heading(title, level=1):
    md.append('#' * level + ' ' + title + '\n')
    story.append(Paragraph(text(title), styles['Title' if level == 1 else 'Heading1']))

def para(value):
    md.append(value + '\n')
    story.extend([Paragraph(text(value), styles['BodyText']), Spacer(1, 7)])

def table(headers, rows, widths=None):
    def mdcell(v):
        return str(v).replace('|', '\\|').replace('\n', '<br>')
    md.append('| ' + ' | '.join(map(mdcell, headers)) + ' |')
    md.append('| ' + ' | '.join('---' for _ in headers) + ' |')
    md.extend('| ' + ' | '.join(map(mdcell, row)) + ' |' for row in rows)
    md.append('')
    data = [[Paragraph(text(v), styles['Cell']) for v in row] for row in [headers, *rows]]
    t = Table(data, colWidths=widths or [AVAILABLE / len(headers)] * len(headers), repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e9dd')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), .35, colors.HexColor('#c8d0c1')),
        ('LEFTPADDING', (0, 0), (-1, -1), 6), ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7f9f5')]),
    ]))
    story.extend([t, Spacer(1, 10)])

def footer(canvas, doc):
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#53604b'))
    canvas.drawString(36, 22, 'Community Garden Management System | Phase 4 | 29 September 2026')
    canvas.drawRightString(WIDTH - 36, 22, str(doc.page))

heading('Phase 4 - Security & Testing Report')
para('Community Garden Management System | Testing date: 29 September 2026')
para('Prepared from actual PHPUnit feature tests, Chromium browser checks, screenshots, and targeted source review. All 86 backend cases and 18 browser cases passed after one validation correction. Human usability sessions and leader-approved contribution ratings are pending; this package is not ready for final submission until those records are completed.')
heading('Environment, method, and evidence', 2)
para('Laravel 13 / PHP 8.4; React 19 / TypeScript / Inertia. Backend tests use a fresh in-memory SQLite database. Browser checks use an isolated seeded SQLite database at /private/tmp/websys2-phase4-20260929.sqlite and a loopback-only server at http://127.0.0.1:8765, with the production frontend bundle and database sessions. The normal application database and .env were not changed.')
para('Alternative to Nessus: PHPUnit HTTP/security tests, Playwright-driven browser checks, and source inspection. Nessus was not run. These checks cover application behavior for the listed inputs; hosted PostgreSQL, deployment configuration, dependency vulnerabilities, concurrent load, and a comprehensive penetration test were not assessed.')
para('Canonical backend evidence: EVIDENCE/phpunit-results.xml and phpunit-results.txt. Browser evidence: EVIDENCE/browser-results.json, browser-auth.txt, browser-features.txt, and SCREENSHOTS/*.png. Each backend method name in the inventory maps directly to the JUnit XML. Screenshots are accompanied by exact inputs and observations rather than treated as proof by themselves.')
para('For screenshots B01, B02 and B17, the harness disables native HTML form constraints in its own browser DOM to verify server validation and display the returned messages. The application source retains its native constraints. Test credentials are development-only fixtures from README.md; no real credentials or session-cookie values are included.')

sections = [
    ('A. Input Validation Test', 'VAL'), ('B. SQL Injection Test', 'SQL'),
    ('C. Authentication Test', 'AUTH'), ('D. Authorization Test', 'ROLE'), ('E. XSS Test', 'XSS'),
]
for title, prefix in sections:
    story.append(PageBreak())
    heading(title, 2)
    if prefix == 'SQL':
        para('SQL04 and SQL05 attach a QueryExecuted listener and inspect actual query templates and bindings. The malicious string must appear in the binding values and must be absent from the SQL template. Tests also assert result counts, unchanged records, and continued existence of users. A rejected login alone would not establish parameterization. Search interpolation forms a LIKE binding value; it does not interpolate into SQL syntax. ReportController uses only a constant aggregate selectRaw expression.')
    if prefix == 'AUTH':
        para('Existing AuthenticationTest additionally verifies valid login and logout for all three roles, incorrect credentials, registration with hashed passwords, and guest redirects. Session lifetime is configured to 120 minutes with database storage outside tests. Expiry after elapsed time and other-device session revocation were not tested. The implemented password requirement is at least 8 characters plus confirmation, with the current password required for a change; mixed character types are not required.')
    if prefix == 'ROLE':
        para('Authorization is enforced by Laravel auth/active/role middleware and controller checks, including direct HTTP requests. Staff handles operations; admin handles members and reports. Admin does not automatically gain staff pages. Existing ownership tests cover another member\'s requests, plantings and notifications, and member-specific data filtering.')
    if prefix == 'XSS':
        para('Storing a payload string as data is permitted. The protection is escaping at output and React text rendering, rather than stripping every angle bracket. The backend tests establish safe initial HTML and data transport. B09 adds a cross-user browser check for stored script, image handler, and SVG handler payloads: no executable nodes are created and window.__phase4Xss remains 0. B10 verifies reflected search text. The stored-profile payload has backend evidence only; browser execution checks focus on announcements and search.')
    rows = []
    for ident, case in main_cases.items():
        if ident.startswith(prefix):
            label, input_value, expected, actual = META[ident]
            rows.append([ident + '\n' + label, input_value, expected, actual, 'PASS'])
    table(['Test case', 'Input / procedure', 'Expected result', 'Actual result', 'Status'], rows, [150, 185, 150, 230, AVAILABLE - 715])
    if prefix == 'ROLE':
        table(['Role', 'Page / feature', 'Expected access', 'Actual access', 'Status'], [
            ['Admin', 'GET /members; GET /reports; report export', 'Allowed', 'Allowed, HTTP 200', 'PASS'],
            ['Member', 'GET /members; GET /reports', 'Denied', 'Denied, HTTP 403', 'PASS'],
            ['Staff', 'GET /members; GET /reports', 'Denied', 'Denied, HTTP 403', 'PASS'],
            ['Staff', 'Plot/crop/event management and request approval', 'Allowed', 'Allowed; changes persisted', 'PASS'],
            ['Member', 'POST plot/crop management; own request approval', 'Denied', 'Denied, HTTP 403', 'PASS'],
            ['Admin', 'Garden plots / requests / assignments / calendar', 'Denied', 'Denied, HTTP 403', 'PASS'],
        ])

story.append(PageBreak())
heading('F. Functional Testing', 2)
FUNCTIONAL = [
    ('Registration / login / logout', 'AuthenticationTest', 'Submit valid member registration; log in and out with each role', 'Hashed member account and role redirects; logout clears access'),
    ('Plot inventory and archiving', 'OperationalWorkflowTest', 'Staff archives an unused plot; API reads current plots', 'Plot archived without losing history; structured JSON returned'),
    ('Plot requests and approval', 'OperationalWorkflowTest', 'Member submits a valid request; staff approves it', 'Request approved, assignment created, plot occupied, member notified'),
    ('Request cancellation / resubmission', 'MemberBackendTest', 'Cancel pending own request and submit again', 'Updated history and new pending request'),
    ('Assignment constraints / closing', 'MemberBackendTest', 'Attempt duplicate active assignment; close current assignment', 'Duplicates rejected; closed assignment releases only its own plot'),
    ('Crop add / edit', 'CropPlantingTest', 'Staff adds and edits crop name/type', 'Crop values saved and returned to the page'),
    ('Member plantings', 'CropPlantingTest', 'Plant a crop on own active plot with valid dates', 'Planting saved and displayed on own assignment'),
    ('Search / sorting / pagination', 'CommunityUpdatesTest', 'Search titles/body; change sort; open next page', 'Matching published records; stable sort; filters preserved'),
    ('Announcement lifecycle', 'CommunityUpdatesTest', 'Staff/admin creates, edits, publishes, then archives an update', 'Member sees full published content; archived/draft content hidden'),
    ('Garden calendar / notifications', 'WorkspaceNavigationTest; OperationalWorkflowTest', 'View published schedule; staff publishes draft event', 'Complete published schedule supplied; active users notified'),
    ('Profile / password settings', 'OperationalWorkflowTest', 'Change profile and password using correct current password', 'Profile updated; new password hash validates'),
    ('Member administration', 'OperationalWorkflowTest', 'Admin suspends member; attempt login', 'Access updated; suspended member cannot sign in'),
    ('Reports / CSV', 'OperationalWorkflowTest', 'Admin requests date-filtered report export', 'HTTP 200 with text/csv content type'),
    ('Notification ownership', 'MemberBackendTest', 'Mark own notification read; try another member\'s notification', 'Own read action allowed; another member\'s action denied'),
    ('Navigation / help / role pages', 'WorkspaceNavigationTest', 'Open allowed workspaces as each role and as guest', 'Allowed pages load with personal labels; restricted/guest requests denied'),
    ('Database relationships / sample data', 'DatabaseFoundationTest', 'Migrate fresh database; check relations; seed twice', 'Relationships available and repeatable demo data'),
]
table(['Feature', 'Test procedure', 'Expected result', 'Actual result', 'Status'], [
    [name, procedure + '\nEvidence: ' + source, expected, 'Verified by passing HTTP, data and database assertions in the named test class.', 'PASS']
    for name, source, procedure, expected in FUNCTIONAL
], [140, 230, 210, 135, AVAILABLE - 715])
para('The complete 86-method inventory appears below. The functional table summarizes related assertions and is not added again to test-case totals. Browser B11 verifies adding and searching a real record through the frontend, and B14 verifies an actual CSV response.')

story.append(PageBreak())
heading('G. Usability Testing', 2)
para('Status: PENDING HUMAN TESTERS. Automated mobile checks B07 and B18 confirm one 390 x 844 layout and the navigation menu, but do not substitute for human feedback. No tester names, ratings, quotes, or observations have been invented. Complete DOCUMENTATION/USABILITY_TESTING.md with at least three actual testers before submission, and attach consented photos/screenshots or dated completed feedback records.')
para('Each tester should sign in with a member fixture, locate an available plot, submit a valid request, find request history and an announcement, open settings, trigger an error, and repeat navigation on a mobile device. Record task success, time or difficulty, navigation, readability, interface design, button/link placement, clarity of errors, mobile use, and overall ease of use. Use 1=very difficult/poor through 5=very easy/excellent.')
table(['Tester', 'Device / date', 'Tasks and ratings', 'Comments / improvements', 'Status'], [
    [f'Tester {i} - enter actual name/initials', 'To be recorded', 'To be recorded', 'To be recorded', 'NOT RUN'] for i in range(1, 4)
])

heading('Bug / Issue Log', 2)
table(['ID / issue', 'Description / severity', 'Action taken', 'Evidence', 'Status'], [
    ['BUG-01 - registration name validation', 'Low: browser required 2 characters, but server accepted a single-character name when constraints were bypassed.', 'Added min:2 to RegisterRequest name rule; added VAL03 regression test.', 'security-before.xml: VAL03 failed (302 vs expected 422). Final JUnit: VAL03 passed. Screenshot 17 shows server error.', 'RESOLVED'],
    ['DOC-01 - human usability evidence', 'Submission gap: three actual tester sessions not yet provided. No application defect is established.', 'Provided a structured tester form and procedure; awaiting real responses.', 'DOCUMENTATION/USABILITY_TESTING.md', 'PENDING'],
    ['DOC-02 - member ratings / contributions', 'Submission gap: leader-approved member details and ratings not provided.', 'Provided leader/assistant leader form and rating rubric.', 'DOCUMENTATION/MEMBER_CONTRIBUTIONS.md', 'PENDING'],
])
para('No critical application defect was identified in this test scope. This statement is limited to the executed checks; deployment and other untested areas are not certified. The initial regression run had 28 passes and 1 failure; after the fix, the final security cases all passed.')

story.append(PageBreak())
heading('Browser Evidence Index', 2)
table(['ID / category', 'Input / procedure', 'Expected result', 'Actual result / evidence', 'Status'], [
    [c['id'] + '\n' + c['section'], c['input'], c['expected'], c['actual'] + '\n' + c['evidence'], c['status']]
    for c in browser
], [95, 220, 170, 230, AVAILABLE - 715])
para('SCREENSHOTS/Test_Evidence.pdf contains 16 captioned screenshots. B15 and B16 have structured result evidence in browser-features.txt and browser-results.json. The browser console HTTP 403 corresponds to the deliberate restricted-page test; it is expected.')

story.append(PageBreak())
heading('Complete Backend Test Inventory', 2)
para('Each row is one final executed PHPUnit method. See PROJECT/tests/Feature for its exact fixture inputs, HTTP request sequence and assertions, and EVIDENCE/phpunit-results.xml for its line number and recorded outcome. This inventory counts each method once.')
for classname in sorted({c.get('classname') for c in cases}):
    short = classname.split('.')[-1]
    heading(short, 2)
    rows = []
    for case in cases:
        if case.get('classname') == classname:
            rows.append([case.get('name'), 'Assertions passed: ' + case.get('assertions'), 'PASS'])
    table(['Exact test method', 'Actual result', 'Status'], rows, [AVAILABLE - 160, 110, 50])

story.append(PageBreak())
heading('Members Ratings and Contribution', 2)
para('To be completed and approved by the leader or assistant leader. Use DOCUMENTATION/MEMBER_CONTRIBUTIONS.md to enter actual names, specific tasks with evidence, a rating with the stated scale, and the approving leader\'s name/date. This report does not assign ratings without that approval.')
heading('Final Working Project', 2)
para('PROJECT/ is a fresh source snapshot with the validation fix, current frontend source, migrations, tests, dependency lockfiles, environment templates and production assets. It excludes .env, database files, logs, session data, node_modules, vendor, .git, and unrelated HTML reference files. The previous submission package remains separate. Install instructions are in README_PHASE4.md; local SQLite is suitable for the classroom demonstration, while the normal backend can use PostgreSQL.')
heading('Phase 4 Submission Checklist', 2)
checklist = [
    ('Input validation tested', 'DONE'), ('SQL injection testing performed', 'DONE'),
    ('Authentication and session handling tested', 'DONE'), ('Authorization and ownership tested', 'DONE'),
    ('Basic stored/reflected XSS tested', 'DONE'), ('Major functional testing completed', 'DONE'),
    ('Human usability testing completed', 'PENDING - at least 3 actual testers'),
    ('Test cases documented', 'DONE'), ('Screenshots and machine-readable evidence included', 'DONE'),
    ('Bugs/issues documented and validation fix verified', 'DONE'), ('Updated source project included', 'DONE'),
    ('Member ratings/contributions approved by leader', 'PENDING'), ('Final testing summary included', 'DONE'),
]
table(['Requirement', 'Completion'], checklist, [AVAILABLE * .62, AVAILABLE * .38])
heading('Testing Summary', 2)
table(['Metric', 'Recorded result'], [
    ['Total executed test cases', f'{len(cases) + len(browser)} (86 backend + 18 browser)'],
    ['Passed', str(len(cases) + len(browser))], ['Failed in final run', '0'],
    ['Fixed application bugs', '1 (BUG-01; registration name length)'],
    ['Known unresolved critical bugs in tested scope', '0 identified'],
    ['Remaining submission items', '2: actual human usability feedback; leader-approved member ratings'],
    ['Human usability sessions', '0 recorded; at least 3 required; excluded from executed totals'],
])
para('Complete the two pending human-provided records, reflect their results and any resulting fixes in this report, and then submit the full package. Automated checks cannot establish subjective ease of use or certify every possible vulnerability.')

(DOCS / 'SECURITY_TESTING_REPORT.md').write_text('\n'.join(md).rstrip() + '\n')
report_pdf = PDF / 'Security_Testing_Report.pdf'
SimpleDocTemplate(str(report_pdf), pagesize=landscape(A4), leftMargin=36, rightMargin=36, topMargin=32, bottomMargin=36).build(story, onFirstPage=footer, onLaterPages=footer)

usability = '''# Phase 4 - Usability Testing Record

Status: PENDING. Record at least three real testers. Blank fields are not results.

## Tester procedure

1. Use a development member account on an isolated demonstration database.
2. Find an available plot, request it with valid notes, and locate request history.
3. Read an announcement, inspect the calendar, and locate account settings.
4. Trigger an invalid input and explain what the error message means.
5. Repeat navigation on a phone or narrow screen; open and close the menu.
6. Record task completion and feedback without coaching the first attempt.

Rating scale: 1 = very difficult/poor, 2 = difficult, 3 = acceptable, 4 = easy/good, 5 = very easy/excellent. Use N/A only with an explanation.

'''
for i in range(1, 4):
    usability += f'''## Tester {i}

Name/initials: __________  Date: __________  Device/browser: __________

| Dimension | Rating (1-5) | Actual comments |
| --- | --- | --- |
| Ease of navigation | | |
| Readability | | |
| Interface design | | |
| Button/link placement | | |
| Error messages | | |
| Mobile responsiveness | | |
| Overall ease of use | | |

| Task | Completed? | Time/difficulty | Observation |
| --- | --- | --- | --- |
| Find and request plot | | | |
| Locate request status | | | |
| Read announcement/calendar | | | |
| Find settings and understand an error | | | |
| Use mobile navigation | | | |

Most useful feature: __________
Most confusing part: __________
Suggested improvement: __________
Feedback/evidence filename: __________
Issue log IDs, if any: __________

'''
usability += '## Actual findings and actions\n\nComplete after sessions: recurring feedback, issue severity, fixes/retests, remaining issues, and final human test counts. Obtain tester consent before attaching identifying photos.\n'
if not (DOCS / 'USABILITY_TESTING.md').exists():
    (DOCS / 'USABILITY_TESTING.md').write_text(usability)
member_template = '''# Phase 4 - Members Ratings and Contribution

Status: PENDING LEADER OR ASSISTANT LEADER APPROVAL.

Leader/assistant leader: __________  Date: __________  Course/section: __________

| Member name | Specific contribution | Evidence (file, test, task or commit) | Rating (1-5) | Leader's reason |
| --- | --- | --- | --- | --- |
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |

Suggested scale (replace if the instructor supplied one): 1 = minimal contribution; 2 = partial contribution requiring substantial help; 3 = completed assigned work; 4 = completed substantial work and helped others; 5 = completed substantial work, validated it, and consistently supported the team.

Record actual contributions. Distinguish implementation, test execution, bug fixes, usability coordination and report preparation. Do not assign code or testing work to a member without evidence.

Approval/signature: __________
'''
if not (DOCS / 'MEMBER_CONTRIBUTIONS.md').exists():
    (DOCS / 'MEMBER_CONTRIBUTIONS.md').write_text(member_template)
bug_template = '''# Phase 4 - Bug / Issue Log

| ID | Bug/issue | Description | Severity | Action taken | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| BUG-01 | Server registration accepted a one-character name | Browser minLength=2 was bypassable; server had no equivalent minimum. | Low | Added min:2 to RegisterRequest; added VAL03 regression; backend and browser retested. | Resolved | security-before.xml, final phpunit-results.xml, 17-name-validation-fixed.png |
| DOC-01 | Actual usability feedback missing | At least three real tester sessions still needed. | Submission gap | Prepared procedure and feedback forms. | Pending | USABILITY_TESTING.md |
| DOC-02 | Member ratings and contributions missing | Leader/assistant leader must supply and approve details. | Submission gap | Prepared contribution/rating form. | Pending | MEMBER_CONTRIBUTIONS.md |

Add newly discovered issues here with actual evidence. No unresolved critical defect was identified in the executed test scope; untested deployment conditions remain outside that conclusion.
'''
if not (DOCS / 'BUG_ISSUE_LOG.md').exists():
    (DOCS / 'BUG_ISSUE_LOG.md').write_text(bug_template)

SCREENSHOTS = PACK / 'SCREENSHOTS'
SCREENSHOTS.mkdir(exist_ok=True)
evidence_story = []
for case in browser:
    if not case['evidence'].endswith('.png'):
        continue
    source = ROOT / 'output/playwright' / case['evidence']
    assert source.exists(), f'Missing screenshot {source}'
    shutil.copy2(source, SCREENSHOTS / source.name)
    if evidence_story:
        evidence_story.append(PageBreak())
    evidence_story.append(Paragraph(text(case['id'] + ' - ' + case['section']), styles['Heading1']))
    evidence_story.append(Paragraph(text('Input: ' + case['input']), styles['BodyText']))
    evidence_story.append(Paragraph(text('Observed: ' + case['actual'] + ' | ' + case['status']), styles['BodyText']))
    evidence_story.append(Spacer(1, 8))
    img = Image(str(source))
    ratio = min(AVAILABLE / img.imageWidth, (HEIGHT - 235) / img.imageHeight)
    img.drawWidth = img.imageWidth * ratio
    img.drawHeight = img.imageHeight * ratio
    evidence_story.append(img)
    evidence_story.append(Paragraph(text(source.name), styles['SmallNote']))
evidence_pdf = PDF / 'Test_Evidence.pdf'
SimpleDocTemplate(str(evidence_pdf), pagesize=landscape(A4), leftMargin=36, rightMargin=36, topMargin=30, bottomMargin=36).build(evidence_story, onFirstPage=footer, onLaterPages=footer)
shutil.copy2(evidence_pdf, SCREENSHOTS / evidence_pdf.name)
shutil.copytree(DOCS, PACK / 'DOCUMENTATION', dirs_exist_ok=True)
shutil.copy2(report_pdf, PACK / 'Security_Testing_Report.pdf')

readme = '''# Phase 4 Submission Package

The package contains the recorded security/testing report, 16 screenshots and their evidence PDF, JUnit/browser results, a bug log, human-feedback forms, and the updated project.

**Before submitting:** complete at least three actual usability sessions in `DOCUMENTATION/USABILITY_TESTING.md`, complete `DOCUMENTATION/MEMBER_CONTRIBUTIONS.md` with leader approval, and update the report's pending statuses and counts. No human feedback has been fabricated.

## Contents

- `Security_Testing_Report.pdf` and `DOCUMENTATION/SECURITY_TESTING_REPORT.md`: report sections A-G, issue log, checklist and summary.
- `SCREENSHOTS/Test_Evidence.pdf` and PNGs: captioned application evidence.
- `EVIDENCE/`: raw initial/final JUnit and browser outputs, JSON observations, frontend checks and source hashes.
- `DOCUMENTATION/`: editable feedback, contribution and issue records.
- `PROJECT/`: current source with the verified validation fix and production frontend assets.

## Run the final project locally

Requirements: PHP 8.4 with PDO SQLite, Composer 2, Node.js 24+, npm.

1. Enter `PROJECT`, run `composer install` and `npm ci`.
2. Copy `.env.local.example` to `.env`; run `php artisan key:generate`.
3. Create an empty `database/database.sqlite` file. In `.env`, set `DB_CONNECTION=sqlite`, `DB_DATABASE=` to the **absolute path** of that file, `DB_URL=` blank, `SESSION_CONNECTION=sqlite`, `SESSION_DRIVER=database`, `CACHE_STORE=file`, `APP_ENV=local`, `APP_URL=http://127.0.0.1:8000`, `SESSION_SECURE_COOKIE=false`.
4. On this new isolated database only, run `php artisan migrate --seed`.
5. Run `npm run build` and `php artisan serve --host=127.0.0.1 --port=8000`.
6. Open `http://127.0.0.1:8000`. Development-only emails are `admin@garden.test`, `staff@garden.test`, and `member@garden.test`; their fixture password is `Garden123!`.

SQLite is used for repeatable classroom tests/demonstration. The normal PostgreSQL configuration remains documented in the project README; no hosted PostgreSQL test is claimed.

## Repeat backend verification

```bash
php vendor/bin/phpunit tests/Feature --colors=never --log-junit phase4-results.xml
npm run typecheck
php vendor/bin/pint --test app/Http/Requests/Auth/RegisterRequest.php tests/Feature/Phase4SecurityTest.php
npm run build
```

`PROJECT/output/playwright/` contains the two evidence scripts and an isolated server router. They were executed using the Playwright CLI skill wrapper, a named `phase4` session and the separate test server described in the report. Run auth first, open the staff announcement creation dialog, then run features; output artifacts are relative to the project root. They are evidence-capture helpers, not production routes. The normal .env and public/hot were preserved.

Nessus was not used; PHPUnit and browser-driven vulnerability tests provide the documented alternative. The initial regression failure and final passing results are retained. Source hashes in `EVIDENCE/source-manifest.json` describe this packaged snapshot.
'''
(PACK / 'README_PHASE4.md').write_text(readme)

project = PACK / 'PROJECT'
project.mkdir(exist_ok=True)
directories = ['app', 'bootstrap', 'config', 'database', 'docker', 'resources', 'routes', 'supabase', 'tests', 'public', '.github']
root_files = ['artisan', 'composer.json', 'composer.lock', 'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'phpunit.xml', 'tsconfig.json', 'vite.config.js', 'components.json', 'README.md', 'API_DOCUMENTATION.md', 'Dockerfile.vercel', '.env.example', '.env.local.example', '.dockerignore', '.editorconfig', '.gitattributes', '.gitignore', '.npmrc', '.nvmrc', '.php-version']
def skip(directory, names):
    excluded = {'hot', '.DS_Store', 'node_modules', 'vendor', 'temp', '.branches', '.temp'}
    return [n for n in names if n in excluded or n.endswith(('.sqlite', '.sqlite-shm', '.sqlite-wal')) or (Path(directory).name == 'cache' and n != '.gitignore')]
for name in directories:
    shutil.copytree(ROOT / name, project / name, dirs_exist_ok=True, ignore=skip)
for name in root_files:
    if (ROOT / name).exists():
        shutil.copy2(ROOT / name, project / name)
for relative in ['app/private', 'app/public', 'framework/cache/data', 'framework/sessions', 'framework/testing', 'framework/views', 'logs']:
    dest = project / 'storage' / relative
    dest.mkdir(parents=True, exist_ok=True)
    (dest / '.gitignore').write_text('*\n!.gitignore\n')
helpers = project / 'output/playwright'
helpers.mkdir(parents=True, exist_ok=True)
for name in ['phase4-auth.js', 'phase4-features.js', 'server-router.php']:
    shutil.copy2(ROOT / 'output/playwright' / name, helpers / name)
shutil.copytree(DOCS, project / 'docs/phase4', dirs_exist_ok=True)

manifest = {}
for path in sorted(project.rglob('*')):
    if path.is_file():
        assert path.name != '.env' and 'node_modules' not in path.parts and 'vendor' not in path.parts
        manifest[str(path.relative_to(project))] = hashlib.sha256(path.read_bytes()).hexdigest()
(EVIDENCE / 'source-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
(EVIDENCE / 'snapshot.txt').write_text('Snapshot date: 2026-09-29\nBase commit: ' + commit + '\nIncludes current uncommitted source changes, including pre-existing frontend work. See source-manifest.json for exact packaged file hashes.\n')
archive = ROOT / 'submission/Phase4_Submission.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for path in sorted(PACK.rglob('*')):
        if path.is_file():
            z.write(path, str(Path('PHASE4') / path.relative_to(PACK)))
print(json.dumps({'backend_passed': len(cases), 'browser_passed': len(browser), 'project_files': len(manifest), 'archive': str(archive), 'archive_bytes': archive.stat().st_size, 'pending': ['3 human usability sessions', 'leader-approved member contributions']}))
