#!/bin/bash
# Quick API smoke test using curl
# BASE_URL defaults to http://localhost:8080
# Optional third-party URLs can be set with environment variables like
# THIRDPARTY_DEEPSEEK_BASE_URL or THIRDPARTY_OPENAI_BASE_URL.

BASE_URL=${BASE_URL:-http://localhost:8080}
ADMIN_AUTH="-u admin:password"

function section() {
    echo -e "\n== $1 =="
}

section "Ping"
curl -i "$BASE_URL/api/ping"

section "Register user"
curl -i -H "Content-Type: application/json" \
    -d '{"username":"demo","password":"pass123","email":"demo@example.com","phone":"555"}' \
    "$BASE_URL/api/users/register"

section "Login"
curl -i -H "Content-Type: application/json" \
    -d '{"account":"demo","password":"pass123"}' \
    "$BASE_URL/api/users/login"

section "Logout"
curl -i -H "X-USER-TOKEN: TOKEN" \
    -X POST "$BASE_URL/api/users/1/logout"

section "Create FAQ"
curl -i -H "Content-Type: application/json" \
    -d '{"question":"What?","answer":"It works"}' \
    "$BASE_URL/api/faqs"

section "List FAQs"
curl -i "$BASE_URL/api/faqs"

section "Create system notification"
curl -i $ADMIN_AUTH -H "Content-Type: application/json" \
    -d '{"message":"System notice"}' \
    "$BASE_URL/api/notifications/system"

section "Create user notification"
curl -i -H "Content-Type: application/json" \
    -d '{"message":"Hi"}' \
    "$BASE_URL/api/notifications/user/1"

section "List user notifications"
curl -i "$BASE_URL/api/notifications/user/1"

section "Submit contact message"
curl -i -H "Content-Type: application/json" \
    -d '{"name":"Tester","email":"test@example.com","message":"Hello"}' \
    "$BASE_URL/api/contact"

section "Save user preference"
curl -i -H "Content-Type: application/json" \
    -d '{"theme":"light","systemLanguage":"en","searchLanguage":"en","dictionaryModel":"DEEPSEEK"}' \
    "$BASE_URL/api/preferences/user/1"

section "Get user preference"
curl -i "$BASE_URL/api/preferences/user/1"

section "Save user profile"
curl -i -H "Content-Type: application/json" \
    -d '{"age":30,"gender":"M","job":"dev","interest":"code","goal":"learn"}' \
    "$BASE_URL/api/profiles/user/1"

section "Get user profile"
curl -i "$BASE_URL/api/profiles/user/1"

section "Upload avatar"
curl -i -F "file=@avatar.jpg" "$BASE_URL/api/users/1/avatar-file"

section "Add search record"
curl -i -H "Content-Type: application/json" \
    -d '{"term":"hello","language":"ENGLISH"}' \
    "$BASE_URL/api/search-records/user/1"

section "List search records"
curl -i "$BASE_URL/api/search-records/user/1"

section "Favorite search record"
curl -i -X POST "$BASE_URL/api/search-records/user/1/1/favorite"

section "Unfavorite search record"
curl -i -X DELETE "$BASE_URL/api/search-records/user/1/1/favorite"

section "Delete one search record"
curl -i -X DELETE "$BASE_URL/api/search-records/user/1/1"

section "Lookup word (default model)"
curl -i "$BASE_URL/api/words?userId=1&term=hello&language=ENGLISH"

section "Lookup word (doubao model)"
curl -i "$BASE_URL/api/words?userId=1&term=hello&language=ENGLISH&model=doubao"

section "Clear search records"
curl -i -X DELETE "$BASE_URL/api/search-records/user/1"



section "List LLM models"
curl -i "$BASE_URL/api/llm/models"

