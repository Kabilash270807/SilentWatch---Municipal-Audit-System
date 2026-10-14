from fastapi import FastAPI, Depends, HTTPException, Query, Request, Header, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import json
import os

from app.schemas.models import (
    MeasurementCreate, MeasurementResponse,
    DashboardSummary, NoiseHeatmapFeatureCollection,
    ViolationScreeningItem, IncidentResponse, IncidentStatusUpdate,
    CalibrationCompareRequest, CalibrationCompareResponse, CalibrationRecordSchema,
    AuditReportGenerateRequest, AuditReportResponse,
    PrivacyStatusResponse, GridStatisticsResponse
)
from app.services.analytics import AnalyticsService
from app.services.storage import StorageService
from app.services.privacy import PrivacyAuditService
from app.services.auth import (
    auth_service,
    require_admin_auth,
    AdminLoginRequest,
    AdminLoginResponse,
    AdminUserResponse
)

app = FastAPI(
    title="SilentWatch Municipal Audit API",
    description="Privacy-Preserving Urban Noise Monitoring and Municipal Audit System",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
storage = StorageService()
analytics = AnalyticsService(storage)
privacy_service = PrivacyAuditService()

# -------------------------------------------------------------
# System & Health (Public)
# -------------------------------------------------------------
@app.get("/api/health", tags=["System"])
def get_health() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "service": "SilentWatch Backend API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": storage.get_status(),
        "privacy_enforced": True,
        "raw_audio_allowed": False,
        "admin_auth_enforced": True
    }

# -------------------------------------------------------------
# Administrator Authentication (No Citizen Accounts)
# -------------------------------------------------------------
@app.post("/api/admin/login", response_model=AdminLoginResponse, tags=["Admin Auth"])
def admin_login(creds: AdminLoginRequest):
    """
    Municipal Administrator Login.
    Citizen registration or accounts are strictly disabled by design.
    """
    auth_result = auth_service.authenticate_admin(creds.username_or_email, creds.password)
    if not auth_result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid municipal administrator credentials."
        )
    return auth_result

@app.post("/api/admin/logout", tags=["Admin Auth"])
def admin_logout(authorization: Optional[str] = Header(None)):
    """Logs out and invalidates administrator session token."""
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            auth_service.invalidate_session(parts[1])
    return {"status": "success", "message": "Administrator session ended."}

@app.get("/api/admin/me", response_model=AdminUserResponse, tags=["Admin Auth"])
def get_current_admin(admin: Dict[str, Any] = Depends(require_admin_auth)):
    """Verifies active administrator session token."""
    return AdminUserResponse(
        admin_id=admin["admin_id"],
        username=admin["username"],
        email=admin["email"],
        full_name=admin["full_name"],
        role=admin["role"],
        created_at=admin["created_at"]
    )

# -------------------------------------------------------------
# Public Citizen Routes (NO Authentication Required)
# -------------------------------------------------------------
@app.get("/api/dashboard", response_model=DashboardSummary, tags=["Dashboard"])
def get_dashboard_summary():
    """Public aggregate noise summary (no sensitive incident details)."""
    return analytics.get_dashboard_summary()

@app.post("/api/measurements", response_model=MeasurementResponse, status_code=status.HTTP_201_CREATED, tags=["Measurements"])
async def record_measurement(request: Request):
    """
    Public anonymous derived measurement ingestion.
    Strictly forbids raw audio data or personal identifiable info.
    """
    try:
        raw_body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    for forbidden in ["audio", "waveform", "audio_base64", "recording", "raw_samples", "voice", "audio_data"]:
        if forbidden in raw_body:
            raise HTTPException(
                status_code=400,
                detail=f"Privacy violation: Field '{forbidden}' is strictly prohibited. Raw audio is never ingested or persisted."
            )
    
    measurement = MeasurementCreate(**raw_body)
    return storage.save_measurement(measurement)

@app.get("/api/measurements", response_model=List[MeasurementResponse], tags=["Measurements"])
def list_measurements(
    grid_id: Optional[str] = Query(None, description="Filter by grid ID"),
    limit: int = Query(100, ge=1, le=1000)
):
    """Public derived measurements log."""
    return storage.get_measurements(grid_id=grid_id, limit=limit)

@app.get("/api/grids", tags=["Grids"])
def list_grids():
    """Public list of monitored grids (Coimbatore)."""
    return storage.get_grids()

@app.get("/api/grids/{grid_id}/statistics", response_model=GridStatisticsResponse, tags=["Grids"])
def get_grid_statistics(grid_id: str):
    """Public grid statistics."""
    stats = analytics.get_grid_statistics(grid_id)
    if not stats:
        raise HTTPException(status_code=404, detail=f"Grid '{grid_id}' not found")
    return stats

@app.get("/api/noise-heatmap", tags=["Heatmap"])
def get_noise_heatmap(
    zone_type: Optional[str] = Query(None),
    min_quality: Optional[str] = Query(None),
    night_only: bool = Query(False)
):
    """Public noise heatmap GeoJSON."""
    return analytics.get_heatmap_geojson(zone_type=zone_type, min_quality=min_quality, night_only=night_only)

@app.post("/api/calibration/compare", response_model=CalibrationCompareResponse, tags=["Calibration"])
def compare_calibration(req: CalibrationCompareRequest):
    """Public instrument calibration comparison calculation."""
    return analytics.compute_calibration_offset(req)

@app.get("/api/calibration/history", response_model=List[CalibrationRecordSchema], tags=["Calibration"])
def get_calibration_history():
    """Public calibration history records."""
    return storage.get_calibration_history()

@app.get("/api/privacy/status", response_model=PrivacyStatusResponse, tags=["Privacy"])
def get_privacy_status():
    """Public privacy and data quality compliance audit."""
    return privacy_service.perform_audit()

# -------------------------------------------------------------
# RESTRICTED: Administrator-Only Routes (Requires Admin Auth)
# -------------------------------------------------------------

# Section A: Incident Reports (Admin Only)
@app.get("/api/incidents", response_model=List[IncidentResponse], tags=["Incidents [Admin Only]"])
def list_incidents(
    grid_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    admin: Dict[str, Any] = Depends(require_admin_auth)
):
    """Restricted to Municipal Administrators: List noise incidents."""
    return storage.get_incidents(grid_id=grid_id, status=status)

@app.get("/api/incidents/{incident_id}", response_model=IncidentResponse, tags=["Incidents [Admin Only]"])
def get_incident(
    incident_id: str,
    admin: Dict[str, Any] = Depends(require_admin_auth)
):
    """Restricted to Municipal Administrators: Get specific incident."""
    inc = storage.get_incident_by_id(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@app.patch("/api/incidents/{incident_id}", response_model=IncidentResponse, tags=["Incidents [Admin Only]"])
def update_incident_status(
    incident_id: str,
    update: IncidentStatusUpdate,
    admin: Dict[str, Any] = Depends(require_admin_auth)
):
    """Restricted to Municipal Administrators: Review or update incident status."""
    inc = storage.update_incident_status(incident_id, update.review_status, update.notes)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

# Section B: Nighttime Violation Screening (Admin Only)
@app.get("/api/violations", response_model=List[ViolationScreeningItem], tags=["Screening [Admin Only]"])
def get_violations(
    zone_type: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    admin: Dict[str, Any] = Depends(require_admin_auth)
):
    """Restricted to Municipal Administrators: Nighttime exceedance screening."""
    return analytics.get_violation_screenings(zone_type=zone_type, status_filter=status_filter)

# Section C: Municipal Audit Reports (Admin Only)
@app.post("/api/audit-reports/generate", response_model=AuditReportResponse, tags=["Audit Reports [Admin Only]"])
def generate_audit_report(
    req: AuditReportGenerateRequest,
    admin: Dict[str, Any] = Depends(require_admin_auth)
):
    """Restricted to Municipal Administrators: Generate official audit report."""
    return analytics.generate_audit_report(req)

@app.get("/api/audit-reports", response_model=List[AuditReportResponse], tags=["Audit Reports [Admin Only]"])
def list_audit_reports(admin: Dict[str, Any] = Depends(require_admin_auth)):
    """Restricted to Municipal Administrators: View municipal audit reports."""
    return storage.get_audit_reports()

@app.get("/api/audit-reports/{report_id}", response_model=AuditReportResponse, tags=["Audit Reports [Admin Only]"])
def get_audit_report(
    report_id: str,
    admin: Dict[str, Any] = Depends(require_admin_auth)
):
    """Restricted to Municipal Administrators: Get specific audit report."""
    rep = storage.get_audit_report_by_id(report_id)
    if not rep:
        raise HTTPException(status_code=404, detail="Audit report not found")
    return rep

# -------------------------------------------------------------
# Static Frontend Serving for Render / Production Deployment
# -------------------------------------------------------------
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Check potential locations of frontend build (relative to backend or repo root)
frontend_dist_candidates = [
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "frontend", "dist"),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static"),
    os.path.abspath("./frontend/dist"),
    os.path.abspath("./static")
]

static_dir = None
for candidate in frontend_dist_candidates:
    if os.path.exists(candidate) and os.path.isdir(candidate):
        static_dir = candidate
        break

if static_dir:
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa_frontend(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = os.path.join(static_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        # Fallback to index.html for client-side routing
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="Not Found")
