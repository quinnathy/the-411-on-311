# The 411 on 311: NYC Service Request Analysis

A scroll-driven data story investigating how long New Yorkers wait for 311 complaints to be resolved — and how that experience differs by ZIP code, complaint type, and borough. Inspired by *The Pudding* and *NYT Upshot*-style visual essays, the project combines statistical analysis, geospatial mapping, and frontend storytelling to surface patterns of inequality in city service delivery.

**Live project:** https://quinnmadethis.com/the-411-on-311[^1]

[^1]: As of Oct 30, the article has not been optimized for mobile viewing — a larger screen is recommended.

---

## The Data

**Source:** [311 Service Requests from 2010 to Present](https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9/about_data) — NYC OpenData

**Scope:** October 2020 – October 2025[^2]

[^2]: The OpenData dataset goes back to 2010, but due to local hardware constraints I used the most recent 5-year window, which is still the most relevant period for everyday New Yorkers.

| Metric | Value |
|---|---|
| Raw records downloaded | 16,398,779 |
| Records after cleaning | 15,351,913 |
| ZIP codes covered | 202 |
| Complaint types | 248 |
| City agencies | 17 |

---

## Data Cleaning

All cleaning was done in Python (Pandas) inside `311.ipynb`.

**Steps taken:**

- **ZIP code validation** — Removed entries with invalid, malformed, or out-of-state ZIP codes (e.g., Michigan ZIPs that appeared due to data entry errors), as well as a known test entry (`ZTESTINT`). ZIP codes were standardized to integer then string format for consistent merging.
- **Date parsing** — Converted `Created Date` and `Closed Date` from raw strings to Python `datetime` objects.
- **Wait time calculation** — Computed response time as `Closed Date − Created Date`, expressed in hours.
- **Invalid time filtering** — Removed records where the closure date preceded the creation date (negative wait times), records with zero wait time, and records with sub-1-minute wait times, which likely represent data artifacts rather than real resolutions.
- **Incomplete records** — Excluded any record without a `Closed Date`, since unresolved or still-open cases cannot have a meaningful wait time measured.

The result is a clean dataset of **15,351,913 service requests** with valid geographic identifiers, complaint classifications, and measurable response times.

---

## Analysis Methods

### Average Wait Times by ZIP Code

The primary unit of analysis is average response time (in hours) per ZIP code. After grouping the cleaned dataframe by `Incident ZIP`, I calculated the mean wait time across all requests per ZIP.

**Citywide summary:**
- Mean wait time across all records: **486 hours (~20 days)**
- Fastest ZIP (10278 — Financial District): **105.6 hours**
- Slowest ZIP (10153 — Midtown/57th St corridor): **4,487 hours (~187 days)**

---

### Empirical Bayes Shrinkage

Raw averages alone can be misleading when ZIP codes have very different complaint volumes. A ZIP code with only a handful of requests will have a volatile average — one unusually slow case can make the whole area look like a service black hole, even if that's not representative.

To correct for this, I applied **Empirical Bayes shrinkage** (also called regularization toward the global mean). The formula used:

```
shrunken_estimate = (n / (n + k)) * raw_mean + (k / (n + k)) * global_mean
```

Where `n` is the number of complaints in a ZIP and `k = 300` is the shrinkage parameter (chosen to reflect the point at which a ZIP has enough volume to be trusted on its own). ZIP codes with low complaint counts are pulled toward the citywide average of ~486 hours; high-volume ZIPs retain most of their raw average.

This produces a more honest geographic comparison: the map of shrunken estimates reflects true systemic differences in service delivery rather than noise from sparse data.

---

### Complaint Volume Analysis

I also calculated a **daily complaint rate** per ZIP code by dividing total complaint counts by the number of days in the 5-year window.

- Citywide average: **41.6 complaints/ZIP/day**
- Highest volume: ZIP 10466 (Bronx, near Wakefield) — **225.5/day**
- Lowest volume: ZIP 10152 (midtown office building) — **0.027/day**

One of the more counterintuitive findings: high-complaint-volume ZIPs tend to have *faster* resolution times, not slower. This suggests city agencies may prioritize or staff for areas that generate the most requests.

---

### Complaint Type Analysis

I grouped by complaint type to measure average wait time and total volume across the 248 categories in the dataset.

**10 longest average wait times:**

| Complaint Type | Avg Wait (hours) | Avg Wait (days) |
|---|---|---|
| Window Guard | 18,876 | ~786 |
| Smoking | 16,072 | ~670 |
| Tattooing | 15,982 | ~666 |
| Day Care | 15,717 | ~655 |
| Adopt-A-Basket | 13,852 | ~577 |
| Non-Residential Heat | 13,149 | ~548 |
| Calorie Labeling | 12,988 | ~541 |
| New Tree Request | 12,821 | ~534 |
| Mobile Food Vendor | 11,716 | ~488 |
| Food Establishment | 11,017 | ~459 |

**10 most common complaint types (with wait times):**

| Complaint Type | Count | Avg Wait (hours) |
|---|---|---|
| Illegal Parking | 2,187,257 | 2.5 |
| Noise - Residential | 1,800,990 | 8.2 |
| HEAT/HOT WATER | 1,188,664 | 51.9 |
| Noise - Street/Sidewalk | 811,981 | 2.4 |
| Blocked Driveway | 803,925 | 2.7 |
| Unsanitary Condition | 499,764 | 613.5 |
| Large Bulky Item Collection | 404,587 | 88.9 |
| Abandoned Vehicle | 306,817 | 3.3 |
| Street Condition | 303,017 | 110.4 |
| Noise - Commercial | 301,223 | 1.5 |

The contrast is stark: the most common complaints (parking, noise) resolve in hours because they're handled by the NYPD, which operates 24/7. Complaints routed to regulatory or inspection agencies — food establishments, building code, tree requests — can sit open for months or years.

---

### Agency Workload Distribution

17 NYC agencies handle 311 requests. Three — **NYPD, HPD (Housing), and DSNY (Sanitation)** — account for over 75% of all complaints. This concentration explains much of the wait time distribution: NYPD's fast-closing noise and parking complaints pull the city's average down, while smaller regulatory agencies drag it back up.

---

### Anomaly Investigation: ZIP Code 10153

The analysis flagged ZIP 10153 as a significant outlier — the longest average wait time in the city at **4,487 hours (~187 days)**, nearly 9× the citywide mean. But 10153 is a single city block near the southeast corner of Central Park, generating only **0.34 complaints/day**.

Drilling into the raw data revealed that virtually all of the extreme wait times originated from a single address: **767 5th Avenue** (the GM Building). The complaints were all **Mobile Food Vendor** requests — and nearly all of them had the same `Closed Date` of **January 11, 2025**, regardless of when they were originally submitted.

This points to a bulk administrative closure: dozens of long-pending complaints were resolved simultaneously on a single date, inflating the average wait time dramatically. Or in other words: someone probably got fed up with all the complaints and wiped it clean. They might've taken the food vendor out back and shot him. 

Just kidding! They didn't do that. Because the same ZIP has since resumed making the exact same complaint.

---

## Geospatial Pipeline

Once analysis was complete, I used **GeoPandas** to join the aggregated dataframes to NYC's official [Modified Zip Code Tabulation Areas (MODZCTA)](https://catalog.data.gov/dataset/modified-zip-code-tabulation-areas-modzcta) boundary shapefile, producing three GeoJSON files:

| File | Contents |
|---|---|
| `311_complaint_avg.geojson` | Complaint volume (daily avg) per ZIP |
| `311_wait_times.geojson` | Raw average wait time per ZIP |
| `311_shrinkage_wait.geojson` | Bayesian-adjusted wait time per ZIP |

These files were loaded into **D3.js v7** (Mercator projection) to render interactive choropleth maps with hover tooltips. Color scales use ColorBrewer palettes (GnBu for volume, PuRd/RdPu for wait times) with quantile breaks so the distribution is always legible regardless of outliers.

---

## Key Findings

1. **The average New Yorker waits ~20 days** for a 311 complaint to be resolved — but that number masks enormous variation.

2. **Where you live determines how fast you get help.** ZIP codes in the Bronx and outer boroughs with high complaint volumes tend to resolve faster; lower-density or wealthier Manhattan ZIPs often wait longer, partly due to complaint type mix.

3. **What you complain about matters more than where you are.** Complaint type is the strongest predictor of wait time. Noise and parking (NYPD-routed) resolve in hours; regulatory and inspection complaints can take years.

4. **Window Guard complaints average 786 days (~2 years)** to close — the longest of any category. These involve landlord compliance with a city housing code requirement and are handled by HPD.

5. **The fastest-resolving complaint type** is Noise - House of Worship, at under 1 hour on average.

6. **High complaint volume correlates with faster resolution**, not slower — suggesting the city's capacity scales with demand in ways that disadvantage neighborhoods that don't usually call 311 for various reasons.

7. **Statistical outliers can reflect administrative behavior**, not just service quality. The ZIP 10153 anomaly shows how bulk data closures can create misleading signals in geographic analysis.

---

## Tech Stack

| Layer | Tools |
|---|---|
| Data processing | Python, Pandas, NumPy |
| Analysis environment | Jupyter Notebook |
| Geospatial | GeoPandas, GeoJSON |
| Statistical method | Empirical Bayes shrinkage |
| Maps | D3.js v7, Mercator projection |
| Charts | Datawrapper (embedded via iframe) |
| Narrative | Scrollama (scroll-driven transitions), Nutshell (expandable explanations) |
| Frontend | HTML5, CSS3, vanilla JavaScript |
| Typography | IBM Plex Serif, Poppins, Fira Mono |

---

## Repo Structure

```
the-411-on-311/
├── 311.ipynb                          # Full analysis notebook
├── story/
│   ├── index.html                     # Published article
│   ├── script.js                      # D3.js map logic
│   └── style.css                      # Styles and responsive layout
├── *.geojson                          # Map data files
├── complaint_types_by_wait.csv        # Top complaint types by wait time
└── complaint_types_by_count.csv       # Top complaint types by frequency
```
