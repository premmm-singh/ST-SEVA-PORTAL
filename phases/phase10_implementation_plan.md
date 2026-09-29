# Phase 10 Implementation Plan: Reports, Analytics & Executive BI Dashboard (Features 108–118)

## 1. Overview
**Phase 10: Reports, Analytics & Executive BI Dashboard** delivers a mission-critical business intelligence console for the Ministry of Tribal Affairs (MoTA) and the State Welfare Department. It provides real-time telemetry, geographic heatmaps, demographic equity metrics (with explicit focus on Particularly Vulnerable Tribal Groups - PVTGs), scrutiny turnaround bottlenecks, automated Parliament Question (PQ) and CAG audit exports, and predictive budget forecasting.

---

## 2. Detailed Features Breakdown (Features 108–118)

| Feature ID | Feature Name | Description & Technical Scope |
|:---|:---|:---|
| **F-108** | **Central & State Real-Time KPIs** | Live metric cards: Total Applications, Institute Verified, Sanctioned Beneficiaries, Total DBT Disbursed (₹ Crores), and Pending Grievances. |
| **F-109** | **Jharkhand 24-District Geo-Spatial Heatmap** | Interactive choropleth / regional map showing scholarship penetration, disbursement saturation, and gender ratios across all 24 districts. |
| **F-110** | **Demographic & Tribal Sub-Caste Equity** | Disaggregated enrollment analytics by Scheduled Tribe communities (Santhal, Oraon, Munda, Ho, Kharia, Lohra, Mahli, and PVTGs). |
| **F-111** | **Budget Outlay & Treasury Utilization** | Financial tracking: Central Sector vs Centrally Sponsored ratio, Allocated Budget vs Committed vs Disbursed with remaining treasury balances. |
| **F-112** | **Scrutiny Bottleneck & TAT Analytics** | Average Turnaround Time (TAT) in days at each scrutiny stage (Student $\rightarrow$ College $\rightarrow$ DWO $\rightarrow$ Sanction $\rightarrow$ PFMS credit). Identifies bottleneck districts. |
| **F-113** | **Institutional Performance League Table** | Ranking of colleges & universities by verification speed, defect clearing rates, and compliance flagging for chronic defaulters. |
| **F-114** | **DBT Success & Failure Root-Cause Engine** | Breakdown of transaction outcomes: Success, NPCI unlinked, Account Inactive, IFSC Invalid, and PFMS technical timeouts. |
| **F-115** | **Statutory Parliament Question (PQ) & CAG Report Exporter** | Standardized tabular data exports tailored for Parliamentary inquiries, Vidhan Sabha queries, and CAG compliance dossiers in CSV/Excel/PDF formats. |
| **F-116** | **Predictive Budget & Outlay Forecasting** | Linear/statistical regression modeling estimating fund requirements for upcoming academic year based on cohort enrollment trends. |
| **F-117** | **PVTG Priority Tracking Dashboard** | Dedicated surveillance for Particularly Vulnerable Tribal Groups (Birhor, Asur, Mal Pahariya, Sauria Pahariya, Korwa, Birjia, Sabar) ensuring zero dropouts. |
| **F-118** | **Automated Executive Digest Scheduler** | Generates periodic executive PDF/summary digests for the Chief Secretary and Principal Secretary with automated email dispatch. |

---

## 3. Database Architecture (`backend/app/db/models/analytics.py`)

### A. `DailyReportSnapshot`
- `id`: UUID (Primary Key)
- `snapshot_date`: Date (Indexed)
- `financial_year`: String (e.g. `2026-2027`)
- `total_applications`: Integer
- `verified_institutions`: Integer
- `dwo_approved`: Integer
- `sanctioned_students`: Integer
- `dbt_disbursed_amount`: Float
- `dbt_success_count`: Integer
- `dbt_failed_count`: Integer
- `pvtg_beneficiaries_count`: Integer
- `female_beneficiaries_count`: Integer
- `created_at`: DateTime

### B. `DistrictMetric`
- `id`: UUID
- `district_name`: String (24 districts of Jharkhand)
- `financial_year`: String
- `total_applications`: Integer
- `total_disbursed_amount`: Float
- `avg_tat_days`: Float
- `pvtg_count`: Integer
- `active_institutions`: Integer

### C. `ParliamentQuestionExport`
- `id`: UUID
- `question_reference_no`: String (e.g. `LS-PQ-STARRED-402`)
- `generated_by_user_id`: Foreign Key (`users.id`)
- `session_type`: String (`LOK_SABHA`, `RAJYA_SABHA`, `VIDHAN_SABHA`, `CAG_AUDIT`)
- `export_params`: JSON (Filters applied)
- `export_file_url`: String
- `generated_at`: DateTime

---

## 4. Backend Services & Endpoints

### Service Layer (`backend/app/services/analytics_service.py`):
1. `get_executive_overview`: Computes live aggregate metrics across applications, schemes, allocations, DBT, and grievances.
2. `get_district_heatmap_data`: Returns 24-district data array with geo-saturation scores, gender split, and disbursement values.
3. `get_tribal_demographic_breakdown`: Aggregates by sub-caste with special PVTG cohort tracking.
4. `get_budget_utilization_chart`: Computes financial allocations vs actual disbursements for current fiscal year.
5. `get_institution_league_table`: Computes verification TAT and compliance score for all enrolled colleges.
6. `export_parliament_question_data`: Generates statutory reports formatted for Parliamentary questions and audit bodies.
7. `calculate_budget_forecast`: Statistical regression estimating required outlay for next academic cycle.

### REST Endpoints (`backend/app/api/v1/endpoints/analytics.py`):
- `GET /analytics/executive-summary`: High-level counters and macro metrics.
- `GET /analytics/district-heatmap`: 24-district geo-spatial data.
- `GET /analytics/demographics`: Sub-caste and PVTG equity breakdown.
- `GET /analytics/budget-utilization`: Financial utilization and treasury drawdown.
- `GET /analytics/scrutiny-tat`: Stage-wise turnaround times and bottlenecks.
- `GET /analytics/institutions-ranking`: College compliance and verification performance league.
- `GET /analytics/dbt-health`: PFMS and NPCI transaction diagnostics.
- `POST /analytics/export/parliament-report`: Generate official PQ / CAG report.
- `GET /analytics/forecast`: Predictive budget estimation model.

---

## 5. Frontend UI/UX Design (`frontend/src/pages/analytics/`)
1. `frontend/src/services/analyticsService.js`: API client for BI endpoints.
2. `frontend/src/pages/analytics/ExecutiveBiDashboardPage.jsx`:
   - Interactive KPI ribbon with live central/state counter.
   - 24-District Geo-Spatial SVG Heatmap with hover details (enrollment %, disbursement, gender split).
   - Demographic equity bar & donut charts with dedicated PVTG highlights.
   - Financial budget utilization thermometer & waterfall chart.
   - Scrutiny TAT timeline identifying slow districts and institutions.
   - College League Table with search and export.
   - One-click Statutory PQ & CAG Export generator modal with customizable filters.

---

## 6. Verification & Automated Testing Plan
- Create `backend/tests/test_phase10.py` covering:
  1. Executive summary metrics calculation.
  2. 24-District heatmap data structure and bounds.
  3. Tribal sub-caste and PVTG breakdown queries.
  4. Budget utilization calculations.
  5. Scrutiny TAT bottleneck computation.
  6. Institution ranking algorithm.
  7. Parliament question export generation.
  8. Budget forecasting regression calculations.
- Run complete regression suite across all 10 phases.
- Confirm 0 compilation errors via `npm run build`.
