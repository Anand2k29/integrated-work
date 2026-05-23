from jwt_analyzer import decode_token
from role_swapper import generate_test_cases
from access_tester import test_access

base_url = "http://127.0.0.1:8010"

tokens = {
    "admin": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInJvbGUiOiJhZG1pbiIsInRlbmFudF9pZCI6InRlbmFudF9BIiwiZXhwIjoxNzc5Mzg2NTUyfQ.MXoAjuwGhqU6bF7S0w2nzzZMHgKYF8h_7NTQByBetnc",

    "user_a": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMiIsInJvbGUiOiJ1c2VyIiwidGVuYW50X2lkIjoidGVuYW50X0EiLCJleHAiOjE3NzkzODY1NTJ9.W2tcRSb5sSkuxMWetYstb57vn5g_Wcwe8YMubUDmroE",

    "user_b": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMyIsInJvbGUiOiJ1c2VyIiwidGVuYW50X2lkIjoidGVuYW50X0IiLCJleHAiOjE3NzkzODY1NTJ9.0vQ1qBPXrBiUjaNzt1zsmBSzFBC9ZKolAG-8nx0Wu2A"
}

endpoints = [
    {
        "path": "/api/admin/users",
        "method": "GET",
        "expected_role": "admin"
    },
    {
        "path": "/api/users/2/profile",
        "method": "GET",
        "expected_role": "user"
    }
]

test_cases = generate_test_cases(base_url, endpoints, tokens)

for case in test_cases:
    token_info = decode_token(case["token"])
    result = test_access(case["url"], case["token"], case["method"])

    possible_issue = False

    if case["expected_role"] == "admin" and token_info.get("role") != "admin":
        if result.get("status_code") == 200:
            possible_issue = True

    print({
        "test_name": case["test_name"],
        "token_role": token_info.get("role"),
        "endpoint": case["url"],
        "expected_role": case["expected_role"],
        "actual_status": result.get("status_code"),
        "possible_issue": possible_issue,
        "error": result.get("error")
    })