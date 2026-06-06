import httpx
import asyncio
import json

API_BASE = "http://localhost:8000/api/v1"

async def run_test():
    async with httpx.AsyncClient() as client:
        # 1. Create a Scan
        print("[*] Creating a new scan...")
        scan_res = await client.post(f"{API_BASE}/scans", json={
            "name": "Test SQLi & XSS Scan",
            "target": "https://httpbin.org",
            "config": {"aggressiveness": "high"}
        })
        scan_id = scan_res.json()["id"]
        print(f"[+] Scan created with ID: {scan_id}")

        # 2. Submit test API Security Payloads
        # We will use httpbin.org to safely simulate sending malicious payloads
        tasks = [
            {
                "method": "GET",
                "url": "https://httpbin.org/get?id=1' OR '1'='1",
                "headers": {"User-Agent": "SecurityScanner/1.0"},
                "payload": None
            },
            {
                "method": "POST",
                "url": "https://httpbin.org/post",
                "headers": {"Content-Type": "application/json"},
                "payload": {"username": "admin", "password": "' OR 1=1--"}
            },
            {
                "method": "GET",
                "url": "https://httpbin.org/get?q=<script>alert(1)</script>",
                "headers": {},
                "payload": None
            }
        ]

        print(f"[*] Submitting {len(tasks)} malicious payloads to the queue...")
        task_res = await client.post(f"{API_BASE}/scans/{scan_id}/tasks", json=tasks)
        print(f"[+] Tasks submitted: {task_res.json()}")

        # 3. Check system metrics
        print("[*] Fetching system metrics...")
        metrics_res = await client.get(f"{API_BASE}/metrics/system")
        print(f"[+] Metrics: {json.dumps(metrics_res.json(), indent=2)}")

if __name__ == "__main__":
    asyncio.run(run_test())
