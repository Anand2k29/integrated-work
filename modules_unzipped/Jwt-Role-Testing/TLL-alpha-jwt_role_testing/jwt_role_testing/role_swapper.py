def generate_test_cases(base_url, endpoints, tokens):
    test_cases = []

    for endpoint in endpoints:
        path = endpoint["path"]
        method = endpoint.get("method", "GET")
        expected_role = endpoint.get("expected_role")

        for token_name, token_value in tokens.items():
            test_cases.append({
                "test_name": f"{token_name} testing {path}",
                "url": base_url + path,
                "method": method,
                "token_name": token_name,
                "token": token_value,
                "expected_role": expected_role
            })

    return test_cases