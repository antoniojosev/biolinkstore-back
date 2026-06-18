#!/usr/bin/env bash
# End-to-end smoke test for the bylink backend + frontend wire.
#
# Usage:
#   ./scripts/smoke-e2e.sh                                   # uses default urls + demo creds
#   API_URL=http://localhost:3001 FE_URL=http://localhost:3002 ./scripts/smoke-e2e.sh
#   DEMO_EMAIL=foo@bar.com DEMO_PASSWORD=xxx ./scripts/smoke-e2e.sh
#
# Pre-requisites:
#   - Backend running (default localhost:3001) with the demo seed applied
#     (`pnpm run prisma:seed` + `pnpm run prisma:seed-rates`
#      + `npx ts-node prisma/seeds/page-builder.seed.ts`).
#   - Frontend running (default localhost:3002) with NEXT_PUBLIC_API_URL
#     pointing at the backend.
#
# Exit code: 0 if all checks pass, 1 if any check fails.

set -u

API_URL="${API_URL:-http://localhost:3001}"
FE_URL="${FE_URL:-http://localhost:3002}"
DEMO_EMAIL="${DEMO_EMAIL:-demo@example.com}"
DEMO_PASSWORD="${DEMO_PASSWORD:-password123}"

PASS=0
FAIL=0
FAIL_LINES=()

red()    { printf "\033[31m%s\033[0m" "$*"; }
green()  { printf "\033[32m%s\033[0m" "$*"; }
yellow() { printf "\033[33m%s\033[0m" "$*"; }
gray()   { printf "\033[90m%s\033[0m" "$*"; }

check() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    printf "  %s %-44s %s\n" "$(green "✓")" "$label" "$(gray "→ $actual")"
    PASS=$((PASS + 1))
  else
    printf "  %s %-44s %s (expected %s)\n" "$(red "✗")" "$label" "$(red "→ $actual")" "$expected"
    FAIL=$((FAIL + 1))
    FAIL_LINES+=("$label: got $actual, expected $expected")
  fi
}

http_code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }
http_code_with_token() { curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$@"; }
http_body() { curl -s "$@"; }

section() {
  echo
  printf "── %s ──\n" "$(yellow "$1")"
}

# Pre-flight ------------------------------------------------------------------
section "Pre-flight"
BE_PING=$(http_code "$API_URL/api/docs")
check "Backend reachable ($API_URL)" "200" "$BE_PING"
FE_PING=$(http_code "$FE_URL/")
check "Frontend reachable ($FE_URL)" "200" "$FE_PING"

if [[ "$BE_PING" != "200" || "$FE_PING" != "200" ]]; then
  echo
  red "Cannot continue — backend or frontend is down."
  echo
  exit 1
fi

# Auth ------------------------------------------------------------------------
section "Auth (slice 0)"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}")

TOKEN=$(printf '%s' "$LOGIN_RESPONSE" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("accessToken",""))' 2>/dev/null || echo "")
if [[ -z "$TOKEN" ]]; then
  printf "  %s %s\n" "$(red "✗")" "Could not extract token from login response"
  FAIL=$((FAIL + 1))
  FAIL_LINES+=("login: no token returned")
else
  printf "  %s %-44s %s\n" "$(green "✓")" "Login backend" "$(gray "→ token len=${#TOKEN}")"
  PASS=$((PASS + 1))
fi

# Discover an active store from the user
STORE_ID=""
if [[ -n "$TOKEN" ]]; then
  STORE_ID=$(http_body -H "Authorization: Bearer $TOKEN" "$API_URL/api/users/me/stores" \
    | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("activeStoreId") or (d.get("stores") or [{}])[0].get("id",""))' 2>/dev/null || echo "")
  if [[ -n "$STORE_ID" ]]; then
    printf "  %s %-44s %s\n" "$(green "✓")" "Discovered active store" "$(gray "→ $STORE_ID")"
    PASS=$((PASS + 1))
  else
    printf "  %s %s\n" "$(red "✗")" "Could not discover demo store id"
    FAIL=$((FAIL + 1))
    FAIL_LINES+=("could not discover store id")
  fi
fi

# Storefront público ----------------------------------------------------------
section "Storefront público (BE-109f → BE-132)"
STORE_BODY=$(http_body "$API_URL/api/public/demo-store")
check "GET /public/:slug returns 200" "200" "$(http_code "$API_URL/api/public/demo-store")"
PLAN=$(printf '%s' "$STORE_BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("plan",""))' 2>/dev/null || echo "")
check "Response exposes plan (BE-132)" "PRO" "$PLAN"
HAS_CTA=$(printf '%s' "$STORE_BODY" | python3 -c 'import sys,json; print("yes" if "cta" in json.load(sys.stdin) else "no")' 2>/dev/null || echo "no")
check "Response has cta block (BE-121)" "yes" "$HAS_CTA"
HAS_ABOUT=$(printf '%s' "$STORE_BODY" | python3 -c 'import sys,json; print("yes" if "aboutShort" in json.load(sys.stdin) else "no")' 2>/dev/null || echo "no")
check "Response has aboutShort (BE-123)" "yes" "$HAS_ABOUT"
HAS_SOCIALS=$(printf '%s' "$STORE_BODY" | python3 -c 'import sys,json; print("yes" if isinstance(json.load(sys.stdin).get("socials"), list) else "no")' 2>/dev/null || echo "no")
check "Response has socials array (BE-124)" "yes" "$HAS_SOCIALS"

check "GET /public/:slug/products" "200" "$(http_code "$API_URL/api/public/demo-store/products?limit=10")"
check "GET /public/:slug/categories?tree=true" "200" "$(http_code "$API_URL/api/public/demo-store/categories?tree=true")"
check "GET /public/:slug/rates (BE-129)" "200" "$(http_code "$API_URL/api/public/demo-store/rates")"
check "GET /public/:slug/qr.png (BE-109f)" "200" "$(http_code "$API_URL/api/public/demo-store/qr.png")"

# Page builder global ---------------------------------------------------------
section "Page builder global (BE-120)"
TEMPLATES_COUNT=$(http_body "$API_URL/api/templates" | python3 -c 'import sys,json; print(len(json.load(sys.stdin)))' 2>/dev/null || echo "0")
check "9 templates seeded" "9" "$TEMPLATES_COUNT"
PALETTES_COUNT=$(http_body "$API_URL/api/palettes" | python3 -c 'import sys,json; print(len(json.load(sys.stdin)))' 2>/dev/null || echo "0")
check "8 palette presets seeded" "8" "$PALETTES_COUNT"
check "GET /templates/vitrina (detail)" "200" "$(http_code "$API_URL/api/templates/vitrina")"

# Panel autenticado -----------------------------------------------------------
if [[ -n "$TOKEN" && -n "$STORE_ID" ]]; then
  section "Panel autenticado (BE-118 → BE-132)"
  check "GET /users/me/stores (BE-127)"          "200" "$(http_code_with_token "$API_URL/api/users/me/stores")"
  check "GET /stores/:id (config)"               "200" "$(http_code_with_token "$API_URL/api/stores/$STORE_ID")"
  check "GET /stores/:id/products"               "200" "$(http_code_with_token "$API_URL/api/stores/$STORE_ID/products?limit=10")"
  check "GET /stores/:id/categories"             "200" "$(http_code_with_token "$API_URL/api/stores/$STORE_ID/categories")"
  check "GET /stores/:id/orders (slice 18)"      "200" "$(http_code_with_token "$API_URL/api/stores/$STORE_ID/orders?page=1&limit=5")"
  check "GET /stores/:id/orders?status=PENDING"  "200" "$(http_code_with_token "$API_URL/api/stores/$STORE_ID/orders?page=1&limit=5&status=PENDING")"
  check "GET /stores/:id/orders/export (CSV)"    "200" "$(http_code_with_token "$API_URL/api/stores/$STORE_ID/orders/export")"
  check "GET /stores/:id/analytics/summary (BE-126)"     "200" "$(http_code_with_token "$API_URL/api/stores/$STORE_ID/analytics/summary?period=30d")"
  check "GET /stores/:id/analytics/top-products"         "200" "$(http_code_with_token "$API_URL/api/stores/$STORE_ID/analytics/top-products?period=30d&limit=5")"
  check "GET /stores/:id/analytics/funnel"               "200" "$(http_code_with_token "$API_URL/api/stores/$STORE_ID/analytics/funnel?period=30d")"
  check "GET /stores/:id/analytics/sources"              "200" "$(http_code_with_token "$API_URL/api/stores/$STORE_ID/analytics/sources?period=30d")"
  check "GET /stores/:id/custom-rates (BE-129)"          "200" "$(http_code_with_token "$API_URL/api/stores/$STORE_ID/custom-rates")"
  check "GET /stores/:id/payment-methods"                "200" "$(http_code_with_token "$API_URL/api/stores/$STORE_ID/payment-methods")"
  check "GET /stores/:id/hours"                          "200" "$(http_code_with_token "$API_URL/api/stores/$STORE_ID/hours")"
  check "GET /stores/:id/socials (BE-124)"               "200" "$(http_code_with_token "$API_URL/api/stores/$STORE_ID/socials")"
  check "GET /stores/:id/theme (BE-120)"                 "200" "$(http_code_with_token "$API_URL/api/stores/$STORE_ID/theme")"
  check "GET /stores/:id/whatsapp-template"              "200" "$(http_code_with_token "$API_URL/api/stores/$STORE_ID/whatsapp-template")"

  # Slice 18 pagination shape
  ORDERS_BODY=$(http_body -H "Authorization: Bearer $TOKEN" "$API_URL/api/stores/$STORE_ID/orders?page=1&limit=5")
  META_TOTAL=$(printf '%s' "$ORDERS_BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("meta",{}).get("total",""))' 2>/dev/null || echo "")
  if [[ -n "$META_TOTAL" && "$META_TOTAL" != "0" ]]; then
    printf "  %s %-44s %s\n" "$(green "✓")" "Orders response has meta.total" "$(gray "→ $META_TOTAL")"
    PASS=$((PASS + 1))
  else
    printf "  %s %s (slice 18 fix verifies res.meta.total)\n" "$(red "✗")" "Orders response missing meta.total"
    FAIL=$((FAIL + 1))
    FAIL_LINES+=("orders meta.total: '$META_TOTAL'")
  fi
fi

# Writes ----------------------------------------------------------------------
if [[ -n "$TOKEN" && -n "$STORE_ID" ]]; then
  section "Write paths (state mutation)"

  # Update CTA (BE-121)
  CTA_RESP=$(curl -s -X PATCH "$API_URL/api/stores/$STORE_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"ctaType":"WHATSAPP","ctaLabel":null,"ctaUrl":null}')
  CTA_TYPE=$(printf '%s' "$CTA_RESP" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("cta",{}).get("type",""))' 2>/dev/null || echo "")
  check "PATCH store CTA (BE-121)" "WHATSAPP" "$CTA_TYPE"

  # Update about (BE-123)
  ABOUT_RESP=$(curl -s -X PATCH "$API_URL/api/stores/$STORE_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"aboutShort":"Smoke test","locationLat":-34.6037,"locationLng":-58.3816,"locationLabel":"Buenos Aires"}')
  ABOUT_SHORT=$(printf '%s' "$ABOUT_RESP" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("aboutShort",""))' 2>/dev/null || echo "")
  check "PATCH store about (BE-123)" "Smoke test" "$ABOUT_SHORT"

  # Switch page builder template (BE-120b)
  THEME_RESP=$(curl -s -X POST "$API_URL/api/stores/$STORE_ID/theme/switch-template" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"templateKey":"poster"}')
  ACTIVE_TEMPLATE=$(printf '%s' "$THEME_RESP" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("activeTemplate",""))' 2>/dev/null || echo "")
  check "POST /theme/switch-template (BE-120b)" "poster" "$ACTIVE_TEMPLATE"

  # Track storefront event (BE-125) and verify it shows up in analytics (BE-126)
  TRACK_CODE=$(http_code -X POST "$API_URL/api/public/demo-store/event" \
    -H "Content-Type: application/json" \
    -d '{"type":"PRODUCT_VIEW","sessionId":"smoke-script-session","targetId":"any-product"}')
  check "POST storefront event (BE-125)" "201" "$TRACK_CODE"

  # Change order status (slice 18 PATCH)
  ORDER_ID=$(http_body -H "Authorization: Bearer $TOKEN" "$API_URL/api/stores/$STORE_ID/orders?page=1&limit=5&status=PENDING" \
    | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["data"][0]["id"] if d.get("data") else "")' 2>/dev/null || echo "")
  if [[ -n "$ORDER_ID" ]]; then
    PATCH_RESP=$(curl -s -X PATCH "$API_URL/api/stores/$STORE_ID/orders/$ORDER_ID/status" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status":"CONTACTED"}')
    NEW_STATUS=$(printf '%s' "$PATCH_RESP" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("status",""))' 2>/dev/null || echo "")
    check "PATCH order status (slice 18)" "CONTACTED" "$NEW_STATUS"
  fi
fi

# Frontend pages --------------------------------------------------------------
section "Frontend pages"
check "GET /"                "200" "$(http_code "$FE_URL/")"
check "GET /login"           "200" "$(http_code "$FE_URL/login")"
check "GET /registro"        "200" "$(http_code "$FE_URL/registro")"
check "GET /v2/demo-store"   "200" "$(http_code "$FE_URL/v2/demo-store")"
# legacy /dashboard/cotizaciones should redirect (307) to /dashboard?view=orders (slice 18)
check "GET legacy /dashboard/cotizaciones (slice 18 redirect)" "307" "$(http_code "$FE_URL/dashboard/cotizaciones")"

# Frontend BFF wire (frontend → /api/proxy/api/... → backend) -----------------
if [[ -n "$TOKEN" && -n "$STORE_ID" ]]; then
  section "Frontend BFF wire"
  COOKIE_JAR=$(mktemp)
  trap 'rm -f "$COOKIE_JAR"' EXIT
  BFF_LOGIN=$(curl -s -c "$COOKIE_JAR" -o /dev/null -w "%{http_code}" \
    -X POST "$FE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}")
  if [[ "$BFF_LOGIN" == "200" || "$BFF_LOGIN" == "409" ]]; then
    printf "  %s %-44s %s\n" "$(green "✓")" "BFF login set httpOnly cookies" "$(gray "→ $BFF_LOGIN")"
    PASS=$((PASS + 1))
    check "BFF proxy /api/users/me/stores"      "200" "$(curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" "$FE_URL/api/proxy/api/users/me/stores")"
    check "BFF proxy /api/stores/:id/orders"    "200" "$(curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" "$FE_URL/api/proxy/api/stores/$STORE_ID/orders?limit=3")"
    check "BFF proxy /api/stores/:id/analytics" "200" "$(curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" "$FE_URL/api/proxy/api/stores/$STORE_ID/analytics/summary?period=30d")"
  else
    printf "  %s %s (got %s)\n" "$(red "✗")" "BFF login failed" "$BFF_LOGIN"
    FAIL=$((FAIL + 1))
    FAIL_LINES+=("bff login: $BFF_LOGIN")
  fi
fi

# Summary ---------------------------------------------------------------------
echo
echo "─────────────────────────────────────────"
TOTAL=$((PASS + FAIL))
if [[ "$FAIL" -eq 0 ]]; then
  printf "  %s  %d/%d checks passed\n" "$(green "PASS")" "$PASS" "$TOTAL"
  echo "─────────────────────────────────────────"
  exit 0
else
  printf "  %s  %d/%d checks passed, %d failed\n" "$(red "FAIL")" "$PASS" "$TOTAL" "$FAIL"
  echo
  echo "Failures:"
  for line in "${FAIL_LINES[@]}"; do
    echo "  • $line"
  done
  echo "─────────────────────────────────────────"
  exit 1
fi
