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
