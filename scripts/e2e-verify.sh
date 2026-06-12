#!/usr/bin/env bash
# End-to-end verification of the Phase 0 submit pipeline (PRD §5.3.9).
set -u
BASE=http://localhost:3210
PASS=0; FAIL=0
# authenticate the suite user (signup, falling back to login)
JAR=$(mktemp)
code=$(curl -s -o /dev/null -w '%{http_code}' -c "$JAR" -X POST $BASE/api/auth/signup -H 'content-type: application/json' -d '{"email":"suite@fieldo.test","password":"fieldo-test-password","name":"Suite"}')
if [ "$code" != "201" ]; then
  curl -s -o /dev/null -c "$JAR" -X POST $BASE/api/auth/login -H 'content-type: application/json' -d '{"email":"suite@fieldo.test","password":"fieldo-test-password"}'
fi
AUTH=(-b "$JAR")
ok()  { PASS=$((PASS+1)); echo "  PASS: $1"; }
bad() { FAIL=$((FAIL+1)); echo "  FAIL: $1"; }

SCHEMA='{
  "schemaVersion": 1,
  "title": "E2E Test Form",
  "pages": [{ "id": "page_1", "fields": [
    { "id": "fld_name",  "type": "text",  "label": "Name",  "required": true },
    { "id": "fld_email", "type": "email", "label": "Email", "required": true },
    { "id": "fld_extra", "type": "text",  "label": "Extra (hidden when name is Bob)" }
  ]}],
  "logic": [{ "id": "lr_1",
    "when": { "all": [{ "fieldId": "fld_name", "op": "eq", "value": "Bob" }] },
    "then": [{ "type": "hide", "fieldId": "fld_extra" }] }],
  "theme": {},
  "settings": { "dedupeByEmail": true, "spam": { "minSecondsToSubmit": 0 } }
}'

echo "1) Create form"
CREATE=$(curl -s "${AUTH[@]}" -X POST $BASE/api/forms -H 'content-type: application/json' -d "{\"title\":\"E2E Test Form\",\"schema\":$SCHEMA}")
FID=$(echo "$CREATE" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).form?.id??''))")
[ -n "$FID" ] && ok "created $FID" || { bad "create: $CREATE"; exit 1; }

echo "2) Publish"
PUB=$(curl -s "${AUTH[@]}" -X POST $BASE/api/forms/$FID/publish)
echo "$PUB" | grep -q '"version":1' && ok "published v1" || bad "publish: $PUB"

echo "3) Meta + render token"
META=$(curl -s $BASE/api/v1/forms/$FID/meta)
TOKEN=$(echo "$META" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).renderToken??''))")
[ -n "$TOKEN" ] && ok "got render token" || bad "meta: $META"

echo "4) Valid submit"
R=$(curl -s -w '\n%{http_code}' -X POST $BASE/api/v1/forms/$FID/submit -H 'content-type: application/json' \
  -d "{\"renderToken\":\"$TOKEN\",\"answers\":{\"fld_name\":\"Alice\",\"fld_email\":\"alice@example.com\",\"fld_extra\":\"visible answer\"}}")
CODE=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
[ "$CODE" = 200 ] && echo "$BODY" | grep -q submissionId && ok "valid submit 200" || bad "valid submit: $CODE $BODY"

echo "5) Hidden-field injection strip (name=Bob hides fld_extra)"
R=$(curl -s -w '\n%{http_code}' -X POST $BASE/api/v1/forms/$FID/submit -H 'content-type: application/json' \
  -d "{\"renderToken\":\"$TOKEN\",\"answers\":{\"fld_name\":\"Bob\",\"fld_email\":\"bob@example.com\",\"fld_extra\":\"INJECTED\"}}")
CODE=$(echo "$R" | tail -1)
[ "$CODE" = 200 ] && ok "injected submit accepted (200)" || bad "injected submit: $CODE"

echo "6) Missing required -> 422"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/v1/forms/$FID/submit -H 'content-type: application/json' \
  -d "{\"renderToken\":\"$TOKEN\",\"answers\":{\"fld_email\":\"carol@example.com\"}}")
[ "$CODE" = 422 ] && ok "422 on missing required" || bad "expected 422, got $CODE"

echo "7) Honeypot -> silent reject (200 to bot)"
R=$(curl -s -w '\n%{http_code}' -X POST $BASE/api/v1/forms/$FID/submit -H 'content-type: application/json' \
  -d "{\"renderToken\":\"$TOKEN\",\"_fieldo_website\":\"http://spam.example\",\"answers\":{\"fld_name\":\"Bot\",\"fld_email\":\"bot@example.com\"}}")
CODE=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
[ "$CODE" = 200 ] && echo "$BODY" | grep -q submissionId && ok "honeypot got fake 200" || bad "honeypot: $CODE $BODY"

echo "8) Dedupe by email -> 409"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/v1/forms/$FID/submit -H 'content-type: application/json' \
  -d "{\"renderToken\":\"$TOKEN\",\"answers\":{\"fld_name\":\"Alice2\",\"fld_email\":\"alice@example.com\"}}")
[ "$CODE" = 409 ] && ok "409 on duplicate email" || bad "expected 409, got $CODE"

echo "9) Inspect stored submissions"
SUBS=$(curl -s "${AUTH[@]}" "$BASE/api/forms/$FID/submissions")
echo "$SUBS" | node -e '
let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
  const subs=(JSON.parse(d).submissions??[]);
  const r=(c,m)=>console.log((c?"  PASS: ":"  FAIL: ")+m)||(c?0:process.exitCode=1);
  r(subs.length===3,`3 stored submissions (got ${subs.length})`);
  const bob=subs.find(s=>s.answers?.fld_name==="Bob");
  r(bob && !("fld_extra" in (bob.answers||{})),"logic-hidden fld_extra stripped from Bob submission");
  const bot=subs.find(s=>s.answers?.fld_name==="Bot");
  r(bot?.status==="rejected","honeypot submission stored as rejected");
  const alice=subs.find(s=>s.answers?.fld_name==="Alice");
  r(alice?.status==="complete","valid submission status complete");
  r(alice?.email==="alice@example.com","email extracted");
});' || FAIL=$((FAIL+1))

echo "10) Analytics endpoint"
CODE=$(curl -s "${AUTH[@]}" -o /dev/null -w '%{http_code}' $BASE/api/forms/$FID/analytics)
[ "$CODE" = 200 ] && ok "analytics 200" || bad "analytics: $CODE"

echo
echo "Result: $PASS passed, $FAIL failed"
[ $FAIL = 0 ]
