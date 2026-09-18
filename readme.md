# SLA Monitoring Dashboard

A full-stack SLA monitoring dashboard built for the Full Stack Developer take-home assignment.

The application takes a monitoring CSV, processes and cleans the data through a serverless ingestion function, stores the normalized records in PostgreSQL, and displays SLA and monitoring information in a single dashboard.

## Approach

I started by inspecting the supplied CSV datasets rather than assuming the data was clean.

AI was used during the initial investigation to help identify potential inconsistencies in the datasets. Those findings were then checked against the actual CSV data before building the ingestion logic.

The main issues found were:

* Multiple timestamp formats, including ISO, Unix timestamps, and timezone offsets
* Mixed latency units (`ms` and `s`)
* Missing latency values
* Negative/invalid latency values
* Unknown status codes such as `999`
* Duplicate observations
* Multiple monitoring agents reporting the same service/time
* Whitespace and formatting inconsistencies
* Missing monitoring intervals

The ingestion system was then designed specifically to handle these cases.

```text
CSV Upload
    ↓
Supabase Edge Function
    ↓
Parse → Validate → Clean → Normalize → Deduplicate
    ↓
Supabase PostgreSQL
    ↓
SLA Dashboard
```

## Data Cleaning & Normalization

### Timestamps

All supported timestamp formats are parsed and normalized to UTC.

Invalid timestamps are rejected because the observation cannot be reliably placed on the monitoring timeline.

### Latency

Latency values are normalized to milliseconds.

* `ms` → stored as milliseconds
* `s` → converted to milliseconds
* Missing latency → stored as `NULL`
* Negative/invalid latency → stored as `NULL` and flagged

Missing or invalid latency does **not** automatically make a health check unavailable.

### Status Codes

The original status code is preserved.

Availability is derived during ingestion:

```text
200 → is_available = true
anything else → is_available = false
```

This means `500`, `502`, `503`, and `999` are treated as unavailable checks.

### Duplicates

Duplicate detection happens after timestamp normalization.

Observations from different monitoring agents are preserved because they can represent legitimate independent checks.

### Missing Intervals

The monitoring data is expected to have checks at 15-minute intervals, but missing intervals are not artificially created or counted as failures.

---

# Dashboard Calculation Rules

The dashboard is calculated from the cleaned records stored in the database.

For the supplied 30-day dataset:

| Metric                   | Calculation / Result                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Total checks**         | Count of all cleaned and deduplicated records.                                                                   |
| **Successful checks**    | Count of records where `is_available = true` (`status_code = 200`).                                              |
| **Failed checks**        | Count of records where `is_available = false` (`500 / 502 / 503 / 999`).                                         |
| **Overall availability** | `(Successful checks / Total checks) × 100`                                                                       |
| **Average latency**      | Mean of `latency_ms`, ignoring `NULL` values.                                                                    |
| **Services below 99.9%** | Availability is calculated separately for each service and services below the `99.9%` SLA threshold are counted. |
| **Monitoring period**    | Earliest valid timestamp → latest valid timestamp.                                                               |

Missing latency values are excluded from the average latency calculation and are **not** treated as failed checks.

The logs table displays the same cleaned and processed monitoring records used for the dashboard calculations.

Date/date-range filters are applied in the browser to the loaded dataset; they do not require a separate logs API.


# Architecture

## Frontend

* Next.js
* React
* TypeScript

The frontend provides:

* CSV upload
* SLA summary cards
* Service-level statistics
* Monitoring logs
* Date/date-range filtering

## Backend

Supabase Edge Functions are used as the serverless ingestion layer.

The function:

1. Receives the uploaded CSV
2. Parses the rows
3. Validates required fields
4. Normalizes timestamps
5. Normalizes latency
6. Classifies availability
7. Detects duplicates
8. Inserts cleaned records into PostgreSQL

## Database

Supabase PostgreSQL stores the normalized monitoring observations.

Each upload is treated as a separate import so that different datasets are not accidentally mixed together.

---

# Upload Flow

The application accepts **one CSV file per upload**.

Each upload creates an import and associates the processed monitoring records with that import.

```text
User uploads CSV
       ↓
Create import
       ↓
Process CSV
       ↓
Clean + normalize
       ↓
Remove duplicates
       ↓
Insert records
       ↓
Dashboard displays processed data
```

---

# Technology Stack

* **Frontend:** Next.js, React, TypeScript
* **Serverless:** Supabase Edge Functions
* **Database:** Supabase PostgreSQL
* **Deployment:** Vercel + Supabase

---

# Assumptions

* `200` is considered available.
* Other status codes are considered unavailable.
* Missing/invalid latency does not indicate failure.
* Latency is stored in milliseconds.
* Timestamps are normalized to UTC.
* Duplicate observations are removed after normalization.
* Different monitoring agents can produce legitimate observations for the same service/time.
* Missing monitoring intervals are not treated as failures.
* The SLA threshold used by the dashboard is **99.9%**.

---

# Scope

The implementation focuses on the requirements of the assignment.

Authentication, accounts, multi-tenancy, CI/CD pipelines, and other production features are intentionally outside the scope.

With more time, I would consider adding background processing for larger files, richer import history, automated ingestion tests, configurable SLA thresholds, and more detailed incident reporting.
