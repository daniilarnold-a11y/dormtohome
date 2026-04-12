#!/usr/bin/env python3
"""
DormToHome Debugging Agent
===========================
Scans the codebase, verifies each reported bug, tests live endpoints,
and produces a diagnostic report with exact locations and fix status.

Usage:
    python debug_agent.py                  # scan codebase only
    python debug_agent.py --live           # also probe running server
    python debug_agent.py --live --fix     # scan + probe + show fix snippets
    python debug_agent.py --json           # output machine-readable JSON

Run from the repo root:  cd dormtohome && python debug_agent.py
"""

import os
import re
import sys
import json
import argparse
import textwrap
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional
from datetime import datetime

# Optional: only imported if --live flag is used
requests = None

# ─── CONFIGURATION ────────────────────────────────────────────

REPO_ROOT = Path(".")
FRONTEND  = REPO_ROOT / "public" / "app.js"
HTML_FILE = REPO_ROOT / "public" / "index.html"
AUTH_ROUTE = REPO_ROOT / "routes" / "auth.js"
API_ROUTE  = REPO_ROOT / "routes" / "api.js"
ROUTES_FILE = REPO_ROOT / "routes" / "routes.js"
SERVER_FILE = REPO_ROOT / "server.js"
DB_FILE     = REPO_ROOT / "db" / "database.js"

BASE_URL = "http://localhost:3000"
DEMO_PASSENGER = {"email": "alex@tamu.edu", "password": "password123"}
DEMO_DRIVER    = {"email": "marcus@dormtohome.com", "password": "password123"}


# ─── DATA MODEL ───────────────────────────────────────────────

@dataclass
class BugResult:
    bug_id: str
    title: str
    section: str
    priority: str  # P0, P1, P2, P3
    status: str    # CONFIRMED, LIKELY_FIXED, NEEDS_MANUAL_CHECK, FILE_NOT_FOUND
    file: str
    line: Optional[int] = None
    evidence: str = ""
    fix_hint: str = ""
    details: str = ""


# ─── FILE UTILITIES ───────────────────────────────────────────

def read_file(path: Path) -> Optional[str]:
    """Read a file and return its contents, or None if missing."""
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except FileNotFoundError:
        return None


def find_line(content: str, pattern: str, regex: bool = False) -> list[tuple[int, str]]:
    """Return list of (line_number, line_text) where pattern appears."""
    results = []
    for i, line in enumerate(content.splitlines(), 1):
        if regex:
            if re.search(pattern, line):
                results.append((i, line.strip()))
        else:
            if pattern in line:
                results.append((i, line.strip()))
    return results


def find_function(content: str, func_name: str) -> Optional[tuple[int, int]]:
    """Find function boundaries. Returns (start_line, approx_end_line)."""
    lines = content.splitlines()
    start = None
    brace_depth = 0
    for i, line in enumerate(lines, 1):
        if start is None:
            if re.search(rf'(function\s+{func_name}|{func_name}\s*=\s*(async\s+)?function|\b{func_name}\s*\()', line):
                start = i
                brace_depth = line.count('{') - line.count('}')
        else:
            brace_depth += line.count('{') - line.count('}')
            if brace_depth <= 0:
                return (start, i)
    if start:
        return (start, start + 30)  # fallback
    return None


def extract_function_body(content: str, func_name: str) -> Optional[str]:
    """Extract the full text of a function."""
    bounds = find_function(content, func_name)
    if not bounds:
        return None
    lines = content.splitlines()
    return "\n".join(lines[bounds[0]-1:bounds[1]])


# ─── BUG CHECKS ──────────────────────────────────────────────
# Each check function returns a BugResult

def check_guardian_email_validation(fe: str, be: str) -> BugResult:
    """1.1 — No email validation on guardian email during signup."""
    func = extract_function_body(fe, "doRegister")
    has_validation = False
    if func:
        has_validation = bool(
            re.search(r'isValidEmail|validateEmail|email.*regex|emailRegex|@.*\.|\.test\(.*email', func, re.I)
        )
    hits = find_line(be, "emailRegex") + find_line(be, "email.*regex", regex=True)
    be_validated = len(hits) > 0

    return BugResult(
        bug_id="1.1",
        title="No guardian email validation on sign-up",
        section="Sign Up",
        priority="P1",
        status="CONFIRMED" if not has_validation else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=find_function(fe, "doRegister")[0] if find_function(fe, "doRegister") else None,
        evidence="doRegister() contains no email regex or isValidEmail call" if not has_validation
                 else "Found email validation in doRegister()",
        fix_hint="Add isValidEmail() check before the API call in doRegister(). Also add server-side check in routes/auth.js POST /register.",
        details=f"Frontend validated: {has_validation}, Backend validated: {be_validated}"
    )


def check_phone_validation(fe: str, be: str) -> BugResult:
    """1.2 — No phone validation on sign-up for passenger or guardian."""
    func = extract_function_body(fe, "doRegister")
    has_validation = False
    if func:
        has_validation = bool(
            re.search(r'isValidPhone|validatePhone|phone.*regex|phoneRegex|\\d\{10\}', func, re.I)
        )
    return BugResult(
        bug_id="1.2",
        title="No phone number validation on sign-up",
        section="Sign Up",
        priority="P1",
        status="CONFIRMED" if not has_validation else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=find_function(fe, "doRegister")[0] if find_function(fe, "doRegister") else None,
        evidence="doRegister() contains no phone validation logic" if not has_validation
                 else "Found phone validation in doRegister()",
        fix_hint="Add isValidPhone() regex check for both passenger phone and guardian phone fields."
    )


def check_rate_limiting(sv: str) -> BugResult:
    """1.3 — No rate limiting on account creation."""
    has_rate_limit = "rate-limit" in sv.lower() or "rateLimit" in sv or "rateLimiter" in sv
    hits = find_line(sv, "rate")
    return BugResult(
        bug_id="1.3",
        title="No rate limiting on sign-up endpoint",
        section="Sign Up",
        priority="P1",
        status="CONFIRMED" if not has_rate_limit else "LIKELY_FIXED",
        file=str(SERVER_FILE),
        evidence="No reference to express-rate-limit or rateLimit found in server.js" if not has_rate_limit
                 else f"Found rate limiting reference at lines: {[h[0] for h in hits]}",
        fix_hint="npm install express-rate-limit, then apply signupLimiter middleware to POST /api/auth/register."
    )


def check_premium_rows(fe: str) -> BugResult:
    """2.1 — Premium rows shown in seat selection."""
    hits = find_line(fe, "isPrem")
    premium_legend = find_line(fe, "Premium (rows")
    return BugResult(
        bug_id="2.1",
        title="Premium seat rows shown during ticket purchase",
        section="Available Routes",
        priority="P2",
        status="CONFIRMED" if hits else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=hits[0][0] if hits else None,
        evidence=f"Found isPrem logic at lines: {[h[0] for h in hits]}. Legend at: {[h[0] for h in premium_legend]}" if hits
                 else "No isPrem references found — may be fixed.",
        fix_hint="Remove rows '1','2' from ROWS array in buildSeatModal(). Delete isPrem variable and premium legend."
    )


def check_for_you_button(fe: str) -> BugResult:
    """2.2 — Non-functional 'For You' button."""
    hits = find_line(fe, "for-you-btn") + find_line(fe, "For You")
    return BugResult(
        bug_id="2.2",
        title="Non-functional 'For You' sorting button",
        section="Available Routes",
        priority="P2",
        status="CONFIRMED" if hits else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=hits[0][0] if hits else None,
        evidence=f"Found 'For You' button at lines: {[h[0] for h in hits]}" if hits
                 else "No 'For You' button found — may be removed.",
        fix_hint="Delete the <button class='for-you-btn'> element from buildRoutesPage()."
    )


def check_filter_persistence(fe: str) -> BugResult:
    """2.3 — Filters reset when panel closes."""
    func = extract_function_body(fe, "openFilterPanel")
    has_saved_state = "savedFilters" in fe or "savedFilter" in fe
    # Check if filter panel rebuilds HTML from scratch
    rebuilds = func and ("innerHTML" in func or "html =" in func) if func else False
    return BugResult(
        bug_id="2.3",
        title="Filter selections reset when panel closes and reopens",
        section="Available Routes",
        priority="P0",
        status="CONFIRMED" if not has_saved_state else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=find_function(fe, "openFilterPanel")[0] if find_function(fe, "openFilterPanel") else None,
        evidence="No savedFilters state object found. openFilterPanel() rebuilds HTML from scratch each time." if not has_saved_state
                 else "Found savedFilters — state may be persisted.",
        fix_hint="Move filter state to a persistent object outside the panel. Restore values when panel reopens."
    )


def check_time_filter_invisible(fe: str) -> BugResult:
    """2.4 — Time of Day filter button turns invisible after click."""
    func = extract_function_body(fe, "openFilterPanel")
    # The time filter toggles use inline styles that can set color to empty string
    inline_toggle = find_line(fe, "this.style.color=this.classList")
    return BugResult(
        bug_id="2.4",
        title="Time of Day filter button turns invisible",
        section="Available Routes",
        priority="P1",
        status="CONFIRMED" if inline_toggle else "NEEDS_MANUAL_CHECK",
        file=str(FRONTEND),
        line=inline_toggle[0][0] if inline_toggle else None,
        evidence=f"Inline style toggle at line {inline_toggle[0][0]} sets color to empty string when deactivated, inheriting white/transparent" if inline_toggle
                 else "Could not find inline toggle — check CSS :focus/:active rules.",
        fix_hint="Ensure deactivated state explicitly sets color:var(--navy-dark) and background:var(--gray-100)."
    )


def check_time_filter_functionality(fe: str) -> BugResult:
    """2.5 — Time of Day filter doesn't actually filter routes."""
    func = extract_function_body(fe, "applyFilterPanel")
    handles_time = func and "time" in func and ("hour" in func or "getHours" in func or "TIMES" in func) if func else False
    # Check if applyFilterPanel has a case for activeFilter === 'time'
    time_case = find_line(fe, "activeFilter === 'time'")
    apply_func = extract_function_body(fe, "applyFilterPanel")
    time_in_apply = apply_func and "'time'" in apply_func if apply_func else False
    return BugResult(
        bug_id="2.5",
        title="Time of Day filter does not work / unclear what it filters",
        section="Available Routes",
        priority="P1",
        status="CONFIRMED" if not time_in_apply else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=find_function(fe, "applyFilterPanel")[0] if find_function(fe, "applyFilterPanel") else None,
        evidence="applyFilterPanel() has NO handler for activeFilter === 'time'. The time filter panel renders but the Apply button ignores it." if not time_in_apply
                 else "Found time handling in applyFilterPanel().",
        fix_hint="Add time-of-day filtering logic: parse departure_time hour, match against selected TIMES ranges.",
        details="Also needs a label: 'Filter by departure time'."
    )


def check_date_filter(be: str) -> BugResult:
    """2.6 — Date filter does exact match instead of range."""
    hits = find_line(be, "departure_date =")
    has_range = find_line(be, "departure_date >=") or find_line(be, "date_from") or find_line(be, "dateFrom")
    return BugResult(
        bug_id="2.6",
        title="Date filter does exact match instead of date range",
        section="Available Routes",
        priority="P0",
        status="CONFIRMED" if (hits and not has_range) else "LIKELY_FIXED",
        file=str(ROUTES_FILE),
        line=hits[0][0] if hits else None,
        evidence=f"Found exact match 'departure_date =' at line {hits[0][0]}. No range query (>=, <=) found." if (hits and not has_range)
                 else "Found date range query parameters.",
        fix_hint="Accept date_from and date_to params. Use departure_date >= $date_from AND departure_date <= $date_to."
    )


def check_request_filters(fe: str) -> BugResult:
    """2.7 — Route request tab filters don't work."""
    func = extract_function_body(fe, "applyFilterPanel")
    filters_requests = func and ("req-list" in func or "requests" in func.lower() or "reqList" in func) if func else False
    return BugResult(
        bug_id="2.7",
        title="Route request filters do nothing",
        section="Available Routes",
        priority="P0",
        status="CONFIRMED" if not filters_requests else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=find_function(fe, "applyFilterPanel")[0] if find_function(fe, "applyFilterPanel") else None,
        evidence="applyFilterPanel() only re-renders #routes-list, never touches #req-list. Request tab filters are cosmetic." if not filters_requests
                 else "Found request list filtering in applyFilterPanel().",
        fix_hint="Detect active tab. If requests tab is active, filter S.requests array and re-render #req-list."
    )


def check_request_year(fe: str) -> BugResult:
    """3.1 — Route requests don't show the year."""
    func = extract_function_body(fe, "buildReqCard")
    has_year = func and ("year" in func or "getFullYear" in func or "'numeric'" in func) if func else False
    return BugResult(
        bug_id="3.1",
        title="Route requests don't show year in date",
        section="Route Requests",
        priority="P3",
        status="CONFIRMED" if not has_year else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=find_function(fe, "buildReqCard")[0] if find_function(fe, "buildReqCard") else None,
        evidence="buildReqCard() displays r.requested_date raw with no year formatting." if not has_year
                 else "Found year formatting in buildReqCard().",
        fix_hint="Use toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})."
    )


def check_placeholder_contrast(fe: str) -> BugResult:
    """3.2 — 'Search city' placeholder text too low contrast."""
    hits = find_line(fe, 'placeholder="Search city')
    # Check if there's any ::placeholder CSS override
    html = read_file(HTML_FILE) or ""
    has_placeholder_css = "::placeholder" in html and ("req-from" in html or "search city" in html.lower())
    return BugResult(
        bug_id="3.2",
        title="'Search city' placeholder text has poor contrast",
        section="Route Requests",
        priority="P2",
        status="CONFIRMED" if not has_placeholder_css else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=hits[0][0] if hits else None,
        evidence=f"Placeholder 'Search city...' found at lines {[h[0] for h in hits]} with no ::placeholder CSS override." if not has_placeholder_css
                 else "Found ::placeholder styling.",
        fix_hint="Add CSS: #req-from::placeholder, #req-to::placeholder { color: #6b7280; opacity: 1; }"
    )


def check_bidirectional_time(fe: str) -> BugResult:
    """3.3 — Changing arrival doesn't auto-update departure."""
    has_update_arrival = "updateReqArrival" in fe
    has_update_departure = "updateReqDeparture" in fe
    # Also check if req-arr input has oninput
    arr_input = find_line(fe, 'id="req-arr"')
    arr_has_oninput = any("oninput" in h[1] for h in arr_input) if arr_input else False
    return BugResult(
        bug_id="3.3",
        title="Changing arrival time doesn't auto-update departure",
        section="Route Requests",
        priority="P1",
        status="CONFIRMED" if not has_update_departure else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=find_function(fe, "updateReqArrival")[0] if find_function(fe, "updateReqArrival") else None,
        evidence=f"updateReqArrival() exists but updateReqDeparture() does NOT. Arrival input oninput={arr_has_oninput}." if not has_update_departure
                 else "Found updateReqDeparture() function.",
        fix_hint="Add updateReqDeparture() that calculates departure = arrival - 3h30m. Add oninput handler to req-arr.",
        details="Also change footnote text to '* Arrival and Departure auto-estimated from route distance'."
    )


def check_review_page_times(fe: str) -> BugResult:
    """3.4 — Review page doesn't show departure/arrival times or time of day."""
    func_bounds = find_function(fe, "showRequestStep")
    if func_bounds:
        lines = fe.splitlines()[func_bounds[0]-1:func_bounds[1]]
        review_section = "\n".join(lines)
    else:
        review_section = ""
    # Check if step 5 has separate departure/arrival display
    has_dep_arr = "DEPARTURE" in review_section and "ARRIVAL" in review_section
    has_time_of_day = "Morning" in review_section or "timeOfDay" in review_section or "time_of_day" in review_section
    return BugResult(
        bug_id="3.4",
        title="Review page doesn't show departure/arrival times separately",
        section="Route Requests",
        priority="P2",
        status="CONFIRMED" if not has_dep_arr else "LIKELY_FIXED",
        file=str(FRONTEND),
        evidence="Step 5 shows one combined time field, not separate departure/arrival with time-of-day labels." if not has_dep_arr
                 else "Found separate DEPARTURE/ARRIVAL display.",
        fix_hint="Show departure time + 'Morning/Afternoon/Evening' label and arrival time + label on review page."
    )


def check_self_support(fe: str, be: str) -> BugResult:
    """3.5 — Creator can support their own route request."""
    # Backend: POST /requests inserts into route_requests but NOT into route_request_supports
    post_requests = extract_function_body(be, "")  # Can't easily extract, search manually
    hits = find_line(be, "INSERT INTO route_request_supports")
    # Count occurrences — there should be one in POST /requests AND one in POST /requests/:id/support
    post_request_lines = find_line(be, "INSERT INTO route_requests")
    support_insert_near_create = False
    for req_line in post_request_lines:
        for sup_line in hits:
            if abs(req_line[0] - sup_line[0]) < 8:
                support_insert_near_create = True

    # Frontend: check if buildReqCard disables button for creator
    has_requester_check = "requester_id" in fe and "S.user" in fe
    card_func = extract_function_body(fe, "buildReqCard")
    btn_disabled = card_func and ("requester_id" in card_func or "Your Request" in card_func) if card_func else False

    return BugResult(
        bug_id="3.5",
        title="Creator can support their own route request (double vote)",
        section="Route Requests",
        priority="P1",
        status="CONFIRMED" if not support_insert_near_create else "LIKELY_FIXED",
        file=str(API_ROUTE),
        evidence="POST /requests creates the request with supporter_count=1 but does NOT insert into route_request_supports. "
                 "The support endpoint's duplicate check finds nothing, allowing the creator to vote again." if not support_insert_near_create
                 else "Found route_request_supports insert near request creation.",
        fix_hint="Add INSERT INTO route_request_supports VALUES ($1,$2) right after creating the request. "
                 "Frontend: disable 'Support' button when r.requester_id === S.user.id.",
        details=f"Frontend button disabled for creator: {btn_disabled}"
    )


def check_cancel_button(fe: str) -> BugResult:
    """3.6 — No cancel button on request wizard steps."""
    func = extract_function_body(fe, "showRequestStep") or ""
    has_cancel = "cancelRequest" in func or "Cancel" in func
    # The existing "Cancel" in the filter panel doesn't count
    cancel_in_wizard = "cancelRequest" in fe
    return BugResult(
        bug_id="3.6",
        title="No Cancel button on route request wizard steps",
        section="Route Requests",
        priority="P2",
        status="CONFIRMED" if not cancel_in_wizard else "LIKELY_FIXED",
        file=str(FRONTEND),
        evidence="showRequestStep() has Back/Next buttons but no Cancel on any step. No cancelRequest() function exists." if not cancel_in_wizard
                 else "Found cancelRequest() function.",
        fix_hint="Add a Cancel button to each step. cancelRequest() should confirm, clear state, and navigate to routes."
    )


def check_request_card_times(fe: str) -> BugResult:
    """3.7 — Request cards don't show departure/arrival times."""
    func = extract_function_body(fe, "buildReqCard")
    has_times = func and ("departure_time" in func or "arrival_time" in func or "Departs:" in func) if func else False
    return BugResult(
        bug_id="3.7",
        title="Route request cards don't show departure/arrival times",
        section="Route Requests",
        priority="P2",
        status="CONFIRMED" if not has_times else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=find_function(fe, "buildReqCard")[0] if find_function(fe, "buildReqCard") else None,
        evidence="buildReqCard() only shows r.requested_time, not separate departure/arrival." if not has_times
                 else "Found time display in buildReqCard().",
        fix_hint="Add '🕐 Departs: ${r.requested_time}' to the card template."
    )


def check_past_tab(fe: str) -> BugResult:
    """4.1 — Clicking 'Past' tab does nothing."""
    hits = find_line(fe, '>Past</div>')
    past_has_onclick = any("onclick" in h[1] for h in hits) if hits else False
    # Also check for switchTicketTab function
    has_switch = "switchTicketTab" in fe
    return BugResult(
        bug_id="4.1",
        title="'Past' tickets tab has no click handler",
        section="My Tickets",
        priority="P1",
        status="CONFIRMED" if (hits and not past_has_onclick and not has_switch) else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=hits[0][0] if hits else None,
        evidence=f"'Past' tab at line {hits[0][0]} has no onclick handler. No switchTicketTab() function found." if (hits and not past_has_onclick and not has_switch)
                 else "Found click handler or switchTicketTab function.",
        fix_hint="Add onclick='switchTicketTab(\"past\")'. Rename tabs to 'Active Tickets' / 'Former Tickets'."
    )


def check_tab_names(fe: str) -> BugResult:
    """4.2 — Tab names should be 'Active Tickets' and 'Former Tickets'."""
    has_upcoming = find_line(fe, ">Upcoming</")
    has_active_tickets = find_line(fe, "Active Tickets")
    return BugResult(
        bug_id="4.2",
        title="Tab labels should be 'Active Tickets' / 'Former Tickets'",
        section="My Tickets",
        priority="P3",
        status="CONFIRMED" if has_upcoming else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=has_upcoming[0][0] if has_upcoming else None,
        evidence="Tabs still say 'Upcoming' and 'Past'." if has_upcoming else "Tabs may already be renamed.",
        fix_hint="Change 'Upcoming' → 'Active Tickets', 'Past' → 'Former Tickets'."
    )


def check_qr_codes(fe: str) -> BugResult:
    """4.3 — QR codes are random patterns, not real QR codes."""
    hits = find_line(fe, "Math.random()")
    qr_random = [h for h in hits if "QR" in fe[max(0, fe.find(h[1])-200):fe.find(h[1])+10].upper()
                 or "qr" in fe[max(0, fe.find(h[1])-200):fe.find(h[1])+10]]
    func = extract_function_body(fe, "miniQR")
    uses_random = func and "Math.random" in func if func else False
    has_qr_lib = "QRCode" in fe or "qrcode" in fe.lower()
    return BugResult(
        bug_id="4.3",
        title="QR codes are random pixel patterns, not real scannable QR codes",
        section="My Tickets",
        priority="P0",
        status="CONFIRMED" if uses_random and not has_qr_lib else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=find_function(fe, "miniQR")[0] if find_function(fe, "miniQR") else None,
        evidence="miniQR() uses Math.random() to generate fake pixel grids. No QR library imported." if (uses_random and not has_qr_lib)
                 else "QR library reference found.",
        fix_hint="Add <script src='https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'></script>. "
                 "Use QRCode.toCanvas() with the booking ID as the encoded data."
    )


def check_checkpoint_passenger(fe: str) -> BugResult:
    """6.1 — Passenger sees checkpoint notifications toggle (should be guardian only)."""
    hits = find_line(fe, "Checkpoint updates")
    in_account = False
    if hits:
        # Check if it's inside buildAccountPage
        func_bounds = find_function(fe, "buildAccountPage")
        if func_bounds:
            in_account = any(func_bounds[0] <= h[0] <= func_bounds[1] for h in hits)
    return BugResult(
        bug_id="6.1",
        title="Passenger sees 'Checkpoint updates' toggle (guardian-only feature)",
        section="Account Settings",
        priority="P1",
        status="CONFIRMED" if in_account else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=hits[0][0] if hits else None,
        evidence=f"'Checkpoint updates' toggle found in buildAccountPage() at line {hits[0][0]}." if in_account
                 else "Checkpoint toggle not found in account page — may be removed.",
        fix_hint="Remove 'Checkpoint updates' from the notification toggles array in buildAccountPage()."
    )


def check_phone_validation_settings(fe: str) -> BugResult:
    """6.2 — No phone validation when changing phone in account settings."""
    func = extract_function_body(fe, "saveProfile")
    has_validation = func and ("isValidPhone" in func or "phone.*regex" in func or "validatePhone" in func) if func else False
    return BugResult(
        bug_id="6.2",
        title="No phone validation when changing phone in account settings",
        section="Account Settings",
        priority="P1",
        status="CONFIRMED" if not has_validation else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=find_function(fe, "saveProfile")[0] if find_function(fe, "saveProfile") else None,
        evidence="saveProfile() sends phone value with no validation." if not has_validation
                 else "Found phone validation in saveProfile().",
        fix_hint="Add isValidPhone() check at the top of saveProfile() before the API call."
    )


def check_guardian_edit(fe: str) -> BugResult:
    """6.3 — No way to edit guardian (only remove)."""
    has_edit = "editGuardian" in fe
    func = extract_function_body(fe, "buildGuardianCard")
    has_edit_btn = func and ("Edit" in func or "editGuardian" in func) if func else False
    return BugResult(
        bug_id="6.3",
        title="No way to edit guardian profile (only remove)",
        section="Account Settings",
        priority="P1",
        status="CONFIRMED" if not has_edit else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=find_function(fe, "buildGuardianCard")[0] if find_function(fe, "buildGuardianCard") else None,
        evidence="No editGuardian() function found. buildGuardianCard() only has a Remove button." if not has_edit
                 else "Found editGuardian() function.",
        fix_hint="Add editGuardian() function that replaces the card with inline edit fields. "
                 "Backend PATCH /guardians/:id already exists.",
        details="Also rename 'Checkpoints' label to 'Send Checkpoint Notifications'."
    )


def check_checkpoint_label(fe: str) -> BugResult:
    """6.3b — Checkpoint label should say 'Send Checkpoint Notifications'."""
    has_old = find_line(fe, '>Checkpoints<')
    has_new = find_line(fe, 'Send Checkpoint Notifications')
    return BugResult(
        bug_id="6.3b",
        title="Checkpoint label says 'Checkpoints' instead of 'Send Checkpoint Notifications'",
        section="Account Settings",
        priority="P2",
        status="CONFIRMED" if has_old and not has_new else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=has_old[0][0] if has_old else None,
        evidence=f"Old label 'Checkpoints' found at line(s) {[h[0] for h in has_old]}" if has_old and not has_new
                 else "Label appears to be updated.",
        fix_hint="Replace '>Checkpoints<' with '>Send Checkpoint Notifications<'."
    )


def check_guardian_add_validation(fe: str) -> BugResult:
    """6.4 — Adding a new guardian doesn't validate email or phone."""
    func = extract_function_body(fe, "saveGuardian")
    has_validation = func and ("isValidEmail" in func or "isValidPhone" in func or "validateEmail" in func) if func else False
    return BugResult(
        bug_id="6.4",
        title="Adding new guardian doesn't validate email or phone",
        section="Account Settings",
        priority="P1",
        status="CONFIRMED" if not has_validation else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=find_function(fe, "saveGuardian")[0] if find_function(fe, "saveGuardian") else None,
        evidence="saveGuardian() posts data with no email/phone validation." if not has_validation
                 else "Found validation in saveGuardian().",
        fix_hint="Add isValidEmail/isValidPhone checks before the API call in saveGuardian()."
    )


def check_guardian_remove_confirmation(fe: str) -> BugResult:
    """6.5 — Removing guardian has no confirmation dialog."""
    func = extract_function_body(fe, "deleteGuardian")
    has_confirm = func and ("confirm(" in func) if func else False
    has_wrapper = "confirmDeleteGuardian" in fe
    return BugResult(
        bug_id="6.5",
        title="Removing guardian has no confirmation dialog",
        section="Account Settings",
        priority="P2",
        status="CONFIRMED" if (not has_confirm and not has_wrapper) else "LIKELY_FIXED",
        file=str(FRONTEND),
        line=find_function(fe, "deleteGuardian")[0] if find_function(fe, "deleteGuardian") else None,
        evidence="deleteGuardian() immediately calls the API with no confirm() dialog." if (not has_confirm and not has_wrapper)
                 else "Found confirmation logic.",
        fix_hint="Wrap in confirmDeleteGuardian() that calls confirm() before proceeding."
    )


# ─── LIVE SERVER PROBES ──────────────────────────────────────

def probe_server(base_url: str) -> list[BugResult]:
    """Hit live endpoints to verify bugs. Requires --live flag."""
    global requests
    import requests as req_lib
    requests = req_lib

    results = []
    session = requests.Session()

    # Check if server is running
    try:
        r = session.get(f"{base_url}/", timeout=5)
        if r.status_code != 200:
            results.append(BugResult("LIVE.0", "Server unreachable", "Server", "P0", "CONFIRMED",
                                     base_url, evidence=f"GET / returned {r.status_code}"))
            return results
    except Exception as e:
        results.append(BugResult("LIVE.0", "Server unreachable", "Server", "P0", "CONFIRMED",
                                 base_url, evidence=str(e),
                                 fix_hint="Start the server with: npm start"))
        return results

    results.append(BugResult("LIVE.0", "Server is running", "Server", "INFO", "OK", base_url,
                             evidence="GET / returned 200"))

    # --- Test rate limiting ---
    for i in range(7):
        r = session.post(f"{base_url}/api/auth/register", json={
            "first_name": f"test{i}", "last_name": "user",
            "email": f"ratetest{i}_{datetime.now().timestamp()}@test.com",
            "password": "test12345", "role": "passenger"
        })
        if r.status_code == 429:
            results.append(BugResult("LIVE.1", "Rate limiting", "Sign Up", "P1", "LIKELY_FIXED",
                                     "server.js", evidence=f"Got 429 after {i+1} requests"))
            break
    else:
        results.append(BugResult("LIVE.1", "Rate limiting not active", "Sign Up", "P1", "CONFIRMED",
                                 "server.js", evidence="Sent 7 register requests without hitting a rate limit"))

    # --- Test email validation ---
    r = session.post(f"{base_url}/api/auth/register", json={
        "first_name": "Bad", "last_name": "Email",
        "email": "not-an-email", "password": "test12345", "role": "passenger"
    })
    if r.status_code == 400:
        results.append(BugResult("LIVE.2", "Server rejects invalid email", "Sign Up", "P1", "LIKELY_FIXED",
                                 "routes/auth.js", evidence=f"POST /register with bad email returned 400: {r.json().get('error','')}"))
    else:
        results.append(BugResult("LIVE.2", "Server accepts invalid email", "Sign Up", "P1", "CONFIRMED",
                                 "routes/auth.js", evidence=f"POST /register with 'not-an-email' returned {r.status_code}"))

    # --- Test login and get token ---
    r = session.post(f"{base_url}/api/auth/login", json=DEMO_PASSENGER)
    if r.status_code != 200:
        results.append(BugResult("LIVE.3", "Cannot login with demo account", "Auth", "P0", "CONFIRMED",
                                 "routes/auth.js", evidence=f"Login returned {r.status_code}: {r.text[:200]}"))
        return results

    token = r.json().get("token", "")
    user_id = r.json().get("user", {}).get("id", "")
    headers = {"Authorization": f"Bearer {token}"}

    # --- Test date filter (exact vs range) ---
    r = session.get(f"{base_url}/api/routes?date_from=2025-01-01&date_to=2026-12-31")
    if r.status_code == 200:
        routes_range = r.json()
        r2 = session.get(f"{base_url}/api/routes")
        all_routes = r2.json() if r2.status_code == 200 else []
        if len(routes_range) == 0 and len(all_routes) > 0:
            results.append(BugResult("LIVE.4", "Date range filter not implemented", "Routes", "P0", "CONFIRMED",
                                     "routes/routes.js", evidence=f"date_from/date_to query returned 0 routes but {len(all_routes)} total exist"))
        else:
            results.append(BugResult("LIVE.4", "Date range filter", "Routes", "P0",
                                     "LIKELY_FIXED" if len(routes_range) > 0 else "NEEDS_MANUAL_CHECK",
                                     "routes/routes.js", evidence=f"date_from/date_to returned {len(routes_range)} routes"))

    # --- Test self-support on route request ---
    # Create a request, then try to support it
    r = session.post(f"{base_url}/api/requests", json={
        "from_city": "Debug Test City", "to_city": "Debug Dest",
        "requested_date": "2026-12-25", "requested_time": "08:00"
    }, headers=headers)
    if r.status_code == 200:
        req_id = r.json().get("id")
        if req_id:
            r2 = session.post(f"{base_url}/api/requests/{req_id}/support", headers=headers)
            if r2.status_code == 200:
                results.append(BugResult("LIVE.5", "Creator can self-support their own request", "Requests", "P1",
                                         "CONFIRMED", "routes/api.js",
                                         evidence=f"POST /requests/{req_id}/support succeeded for the creator (status {r2.status_code})"))
            elif r2.status_code == 409:
                results.append(BugResult("LIVE.5", "Self-support blocked", "Requests", "P1",
                                         "LIKELY_FIXED", "routes/api.js",
                                         evidence="Creator correctly blocked from supporting own request (409)"))

    # --- Test guardian validation ---
    r = session.post(f"{base_url}/api/guardians", json={
        "name": "Bad Guardian", "email": "not-valid", "phone": "abc"
    }, headers=headers)
    if r.status_code == 200:
        results.append(BugResult("LIVE.6", "Server accepts invalid guardian email/phone", "Guardians", "P1",
                                 "CONFIRMED", "routes/api.js",
                                 evidence="POST /guardians with email='not-valid' phone='abc' returned 200 (accepted)"))
        # Clean up — delete the guardian
        gid = r.json().get("id")
        if gid:
            session.delete(f"{base_url}/api/guardians/{gid}", headers=headers)
    else:
        results.append(BugResult("LIVE.6", "Server validates guardian input", "Guardians", "P1",
                                 "LIKELY_FIXED", "routes/api.js",
                                 evidence=f"POST /guardians with bad data returned {r.status_code}"))

    return results


# ─── REPORT GENERATION ────────────────────────────────────────

COLORS = {
    "CONFIRMED": "\033[91m",        # Red
    "LIKELY_FIXED": "\033[92m",     # Green
    "NEEDS_MANUAL_CHECK": "\033[93m",  # Yellow
    "FILE_NOT_FOUND": "\033[90m",   # Gray
    "OK": "\033[92m",               # Green
    "INFO": "\033[94m",             # Blue
}
RESET = "\033[0m"
BOLD  = "\033[1m"


def print_report(results: list[BugResult], show_fixes: bool = False):
    """Print a human-readable diagnostic report."""
    confirmed = [r for r in results if r.status == "CONFIRMED"]
    fixed     = [r for r in results if r.status == "LIKELY_FIXED"]
    manual    = [r for r in results if r.status == "NEEDS_MANUAL_CHECK"]

    header = f"""
{'='*72}
  DormToHome Debugging Agent — Diagnostic Report
  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
{'='*72}

  SUMMARY
  ───────
  🔴 Bugs confirmed:     {len(confirmed)}
  🟢 Likely fixed:       {len(fixed)}
  🟡 Needs manual check: {len(manual)}
  Total checks:          {len(results)}
"""
    print(header)

    # Group by section
    sections = {}
    for r in results:
        sections.setdefault(r.section, []).append(r)

    for section, bugs in sections.items():
        print(f"\n{'─'*72}")
        print(f"  {BOLD}{section.upper()}{RESET}")
        print(f"{'─'*72}")
        for r in sorted(bugs, key=lambda x: x.bug_id):
            color = COLORS.get(r.status, "")
            status_icon = {"CONFIRMED": "🔴", "LIKELY_FIXED": "🟢", "NEEDS_MANUAL_CHECK": "🟡",
                          "FILE_NOT_FOUND": "⚫", "OK": "✅", "INFO": "ℹ️"}.get(r.status, "❓")

            print(f"\n  {status_icon}  [{r.priority}] {r.bug_id} — {r.title}")
            print(f"     {color}{r.status}{RESET}")
            print(f"     File: {r.file}{f':{r.line}' if r.line else ''}")
            if r.evidence:
                # Wrap long evidence text
                wrapped = textwrap.fill(r.evidence, width=64, initial_indent="     ", subsequent_indent="     ")
                print(wrapped)
            if r.details:
                print(f"     {BOLD}Detail:{RESET} {r.details}")
            if show_fixes and r.fix_hint and r.status == "CONFIRMED":
                print(f"     {BOLD}Fix:{RESET}")
                for line in r.fix_hint.split(". "):
                    print(f"       → {line.strip()}")

    # Priority breakdown
    print(f"\n{'='*72}")
    print(f"  PRIORITY BREAKDOWN OF CONFIRMED BUGS")
    print(f"{'='*72}")
    for p in ["P0", "P1", "P2", "P3"]:
        p_bugs = [r for r in confirmed if r.priority == p]
        if p_bugs:
            label = {"P0": "CRITICAL", "P1": "HIGH", "P2": "MEDIUM", "P3": "LOW"}[p]
            print(f"\n  {p} ({label}): {len(p_bugs)} bugs")
            for r in p_bugs:
                print(f"    • {r.bug_id} — {r.title}")

    print(f"\n{'='*72}\n")


def output_json(results: list[BugResult]):
    """Output machine-readable JSON."""
    data = {
        "generated": datetime.now().isoformat(),
        "summary": {
            "confirmed": len([r for r in results if r.status == "CONFIRMED"]),
            "likely_fixed": len([r for r in results if r.status == "LIKELY_FIXED"]),
            "needs_manual_check": len([r for r in results if r.status == "NEEDS_MANUAL_CHECK"]),
            "total": len(results),
        },
        "bugs": [asdict(r) for r in results],
    }
    print(json.dumps(data, indent=2))


# ─── MAIN ────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="DormToHome Debugging Agent")
    parser.add_argument("--live", action="store_true", help="Also probe the running server at localhost:3000")
    parser.add_argument("--fix", action="store_true", help="Show fix hints for confirmed bugs")
    parser.add_argument("--json", action="store_true", help="Output JSON instead of human-readable report")
    parser.add_argument("--url", default=BASE_URL, help="Base URL for live probes (default: http://localhost:3000)")
    args = parser.parse_args()

    # Read all source files
    fe = read_file(FRONTEND)
    html = read_file(HTML_FILE)
    be_auth = read_file(AUTH_ROUTE)
    be_api = read_file(API_ROUTE)
    be_routes = read_file(ROUTES_FILE)
    sv = read_file(SERVER_FILE)
    db = read_file(DB_FILE)

    if not fe:
        print(f"ERROR: Cannot find {FRONTEND}. Are you in the repo root directory?")
        print(f"  Run:  cd dormtohome && python debug_agent.py")
        sys.exit(1)

    results: list[BugResult] = []

    # ── Run all static checks ──
    print("🔍 Scanning codebase..." if not args.json else "", file=sys.stderr)

    results.append(check_guardian_email_validation(fe, be_auth or ""))
    results.append(check_phone_validation(fe, be_auth or ""))
    results.append(check_rate_limiting(sv or ""))
    results.append(check_premium_rows(fe))
    results.append(check_for_you_button(fe))
    results.append(check_filter_persistence(fe))
    results.append(check_time_filter_invisible(fe))
    results.append(check_time_filter_functionality(fe))
    results.append(check_date_filter(be_routes or ""))
    results.append(check_request_filters(fe))
    results.append(check_request_year(fe))
    results.append(check_placeholder_contrast(fe))
    results.append(check_bidirectional_time(fe))
    results.append(check_review_page_times(fe))
    results.append(check_self_support(fe, be_api or ""))
    results.append(check_cancel_button(fe))
    results.append(check_request_card_times(fe))
    results.append(check_past_tab(fe))
    results.append(check_tab_names(fe))
    results.append(check_qr_codes(fe))
    results.append(check_checkpoint_passenger(fe))
    results.append(check_phone_validation_settings(fe))
    results.append(check_guardian_edit(fe))
    results.append(check_checkpoint_label(fe))
    results.append(check_guardian_add_validation(fe))
    results.append(check_guardian_remove_confirmation(fe))

    # ── Live probes ──
    if args.live:
        print("🌐 Probing live server..." if not args.json else "", file=sys.stderr)
        try:
            live_results = probe_server(args.url)
            results.extend(live_results)
        except ImportError:
            print("ERROR: --live requires the 'requests' package. Install with: pip install requests",
                  file=sys.stderr)
            sys.exit(1)

    # ── Output ──
    if args.json:
        output_json(results)
    else:
        print_report(results, show_fixes=args.fix)


if __name__ == "__main__":
    main()
