import httpx

def test_access(url, token, method="GET"):
    headers = {
        "Authorization": f"Bearer {token.strip()}"
    }

    try:
        response = httpx.request(method, url, headers=headers, timeout=10)

        return {
            "status_code": response.status_code,
            "response_preview": response.text[:300],
            "error": None
        }

    except Exception as e:
        return {
            "status_code": None,
            "response_preview": None,
            "error": str(e)
        }