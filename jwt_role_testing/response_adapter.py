from scanner.models import ScanResponse

def create_scan_response(
    endpoint,
    method,
    url,
    status_code,
    body,
    body_json,
    user_id,
    role,
    tenant_id,
    token,
    request_headers,
    request_body=None
):
    return ScanResponse(
        endpoint=endpoint,
        method=method,
        url=url,
        status_code=status_code,
        body=body,
        body_json=body_json,
        user_id=user_id,
        role=role,
        tenant_id=tenant_id,
        token=token,
        request_headers=request_headers,
        request_body=request_body
    )