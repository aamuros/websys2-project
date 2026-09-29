# API Integration Notes

## External API: Open-Meteo Forecast API

- **Purpose:** Show current conditions that help members plan watering and garden visits.
- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Location used:** Manila (`latitude=14.5995`, `longitude=120.9842`)
- **Data requested:** Current temperature, relative humidity, WMO weather code, wind speed, and today's maximum precipitation probability.
- **Authentication:** None. Open-Meteo does not require an API key for this use.
- **Integration:** `GardenWeather` in `resources/js/components/garden-plots-workspace.tsx` calls the endpoint with `fetch()`, checks the HTTP response, reads the JSON payload, and renders loading, success, failure, and retry states without reloading the page.

## Application JSON endpoints

### `GET /api/garden-plots`

Returns the authenticated user's plot directory as JSON. Each item contains the plot ID, code, location, size in square metres, status, and whether the current user already has a pending request. The Garden plots screen retrieves this endpoint with `fetch()` and then searches and filters the returned records in the browser.

### `POST /api/plot-requests`

Creates a plot request for an authenticated member without reloading the page.

Request body:

```json
{
  "garden_plot_id": 1,
  "notes": "I plan to grow vegetables for our household."
}
```

The browser validates required input, length limits, and user feedback first. Laravel validates the request again, ensures the plot is available, prevents duplicate pending requests, and returns either a `201` JSON response or field-specific `422` validation errors.

### `GET /api/garden-calendar/forecasts`

Returns approximate harvest windows for configured crop plantings overlapping the requested date interval. The estimate is calculated locally from the crop's staff-configured `maturity_days_min`/`maturity_days_max` and the planting's `planted_at` date; no external crop or weather API is called. Estimates are indicative and are not automatically recorded as harvests.

The endpoint requires an authenticated, active user with the `member` or `staff` role. Members see only plantings on their own assignments. Staff see plantings on active assignments in non-archived plots. `from` and `to` are optional ISO `YYYY-MM-DD` dates; the default range starts at the current month's first day and ends 90 days later. Invalid, reversed, or greater-than-366-day ranges return `422`.

Example:

```http
GET /api/garden-calendar/forecasts?from=2026-11-01&to=2026-11-30
Accept: application/json
```

Each returned item includes planting/crop identity, `harvest_start_earliest`, `harvest_start_latest`, optional `harvest_window_end`, an informational status, the maturity-day range and source note, and plot code/location. Crops without both maturity values do not produce a forecast. The calendar displays the estimate on the first visible day of each week overlapped by its date range.

Staff manage crop maturity values from the Crops screen. The minimum and maximum are both required to enable estimates; values must be from 1 through 3650 days and minimum may not exceed maximum. The optional harvest duration may be zero through 3650 days. The source/date-basis note is limited to 255 characters.
