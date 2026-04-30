#!/bin/bash
# Stress test: two concurrent requests for the same slot
# Expected: one 200 with {id}, one 409 with {code: "SLOT_OCCUPIED"}

PAYLOAD='{
  "org_id":         "54d2bc71-f9fd-402e-8b3a-66165417988c",
  "master_id":      "24d62582-1f91-4d7b-9812-6b0ede0fe87e",
  "date":           "2026-05-01",
  "time_slot":      "13:00",
  "slot_start_utc": "2026-05-01T17:00:00Z",
  "slot_end_utc":   "2026-05-01T17:30:00Z",
  "client_name":    "Test Client",
  "client_phone":   "+12125550001",
  "service_name":   "Haircut",
  "price_cents":    2500,
  "duration_min":   30
}'

echo "=== Firing 2 concurrent requests ==="

curl -s -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\nHTTP %{http_code}\n" &

curl -s -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\nHTTP %{http_code}\n" &

wait
echo "=== Done ==="
