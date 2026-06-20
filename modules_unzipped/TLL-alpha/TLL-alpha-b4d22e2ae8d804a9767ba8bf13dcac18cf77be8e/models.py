"""
Shared data models for the Response Diff Engine + Reporting pipeline.
Team Alpha — Task 6
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


# ─── Enums ────────────────────────────────────────────────────────────────────

class IssueType(str, Enum):
    BOLA            = "BOLA"           # Broken Object Level Authorization
    BFLA            = "BFLA"           # Broken Function Level Authorization
    TENANT_LEAK     = "TENANT_LEAK"    # Cross-tenant data contamination
    JWT_BYPASS      = "JWT_BYPASS"     # Tampered JWT accepted
    PRIV_ESCALATION = "PRIV_ESCALATION"# Lower role accessed higher-role resource
    INFO_DISCLOSURE = "INFO_DISCLOSURE"# Non-critical data leakage


class SeverityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH     = "HIGH"
    MEDIUM   = "MEDIUM"
    LOW      = "LOW"
    INFO     = "INFO"


SEVERITY_SCORE: Dict[SeverityLevel, int] = {
    SeverityLevel.CRITICAL: 9,
    SeverityLevel.HIGH:     7,
    SeverityLevel.MEDIUM:   5,
    SeverityLevel.LOW:      3,
    SeverityLevel.INFO:     1,
}


# ─── Core scan objects ────────────────────────────────────────────────────────

@dataclass
class ScanResponse:
    """A single HTTP response captured during scanning."""
    endpoint:    str                          # e.g. "GET /api/users/42"
    method:      str                          # GET / POST / PUT / DELETE / PATCH
    url:         str                          # Full URL
    status_code: int
    headers:     Dict[str, str]               = field(default_factory=dict)
    body:        Optional[str]                = None
    body_json:   Optional[Any]                = None  # Parsed JSON if applicable
    user_id:     Optional[str]                = None
    role:        Optional[str]                = None
    tenant_id:   Optional[str]                = None
    token:       Optional[str]                = None  # JWT / bearer token used
    request_headers: Dict[str, str]           = field(default_factory=dict)
    request_body:    Optional[str]            = None
    latency_ms:  Optional[float]              = None
    timestamp:   datetime                     = field(default_factory=datetime.utcnow)


@dataclass
class DiffResult:
    """Output of comparing two ScanResponse objects."""
    endpoint:          str
    method:            str
    response_a:        ScanResponse          # Reference (e.g. owner / admin)
    response_b:        ScanResponse          # Challenger (e.g. other user / lower role)

    status_delta:      int  = 0              # response_b.status - response_a.status
    body_similarity:   float = 0.0           # 0.0 (totally different) → 1.0 (identical)
    leaked_fields:     List[str] = field(default_factory=list)   # field names present in both
    added_fields:      List[str] = field(default_factory=list)   # fields only in B
    removed_fields:    List[str] = field(default_factory=list)   # fields only in A
    value_changes:     Dict[str, Any] = field(default_factory=dict)  # changed values

    is_anomaly:        bool  = False
    anomaly_reason:    str   = ""

    # Cross-tenant detection
    foreign_ids_found: List[str] = field(default_factory=list)  # IDs from A found in B body


@dataclass
class ReproductionSteps:
    """Machine-readable steps to reproduce a finding."""
    description: str
    request_method:  str
    request_url:     str
    request_headers: Dict[str, str]
    request_body:    Optional[str]
    user_a_token:    Optional[str]
    user_b_token:    Optional[str]
    expected_status: int
    actual_status:   int
    curl_command:    str = ""


@dataclass
class Issue:
    """A classified security finding."""
    issue_id:    str
    issue_type:  IssueType
    severity:    SeverityLevel
    title:       str
    description: str

    endpoint:    str
    method:      str
    diff:        DiffResult

    repro:       Optional[ReproductionSteps] = None
    recommendation: str = ""
    cwe:         str = ""           # e.g. "CWE-285"
    owasp:       str = ""           # e.g. "OWASP API1:2023"
    false_positive_likelihood: float = 0.0   # 0.0 → 1.0

    discovered_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ScanSummary:
    total_endpoints:  int = 0
    total_requests:   int = 0
    total_issues:     int = 0
    critical_count:   int = 0
    high_count:       int = 0
    medium_count:     int = 0
    low_count:        int = 0
    info_count:       int = 0
    duration_seconds: float = 0.0
    scan_start:       Optional[datetime] = None
    scan_end:         Optional[datetime] = None


@dataclass
class ScanReport:
    """Top-level object containing all findings from a scan."""
    report_id:   str
    target_url:  str
    scan_name:   str
    summary:     ScanSummary
    issues:      List[Issue]        = field(default_factory=list)
    metadata:    Dict[str, Any]     = field(default_factory=dict)
    created_at:  datetime           = field(default_factory=datetime.utcnow)
