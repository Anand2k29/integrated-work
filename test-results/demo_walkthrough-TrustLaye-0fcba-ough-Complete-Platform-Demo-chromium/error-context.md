# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo_walkthrough.spec.ts >> TrustLayer Product Demo Walkthrough >> Complete Platform Demo
- Location: demo_walkthrough.spec.ts:39:7

# Error details

```
Test timeout of 180000ms exceeded.
```

```
Tearing down "context" exceeded the test timeout of 180000ms.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - img [ref=e6]
        - generic [ref=e8]: TRUSTLAYERSECURITY
      - generic [ref=e9]:
        - button "Sign In" [ref=e10] [cursor=pointer]
        - button "Launch Console" [ref=e11] [cursor=pointer]:
          - text: Launch Console
          - img [ref=e12]
    - main [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]:
          - img [ref=e17]
          - text: AI-Powered API Security Intelligence Platform
        - heading "Automated API Authorization Testing for Enterprise DevSecOps." [level=1] [ref=e19]:
          - text: Automated API
          - text: Authorization Testing
          - text: for Enterprise DevSecOps.
        - paragraph [ref=e20]: Discover endpoints, crawl schemas, decode tokens, mutate parameter payloads, and swap roles autonomously in real time. Seal BOLA and privilege leaks before deployment.
        - generic [ref=e21]:
          - button "Start Security Scan" [ref=e22] [cursor=pointer]:
            - text: Start Security Scan
            - img [ref=e23]
          - button "Request API Key" [ref=e25] [cursor=pointer]
        - generic [ref=e26]:
          - generic [ref=e27]:
            - generic [ref=e28]: 100%
            - generic [ref=e29]: Autonomous Discovery
          - generic [ref=e30]:
            - generic [ref=e31]: < 15ms
            - generic [ref=e32]: Token Parsing Latency
          - generic [ref=e33]:
            - generic [ref=e34]: P1-P4
            - generic [ref=e35]: Distributed Queues
      - generic [ref=e37]:
        - generic [ref=e43]:
          - img [ref=e44]
          - text: SECURITY ENGINES
        - generic [ref=e46]:
          - generic [ref=e48]:
            - generic [ref=e49]:
              - img [ref=e50]
              - text: ENDPOINT DISCOVERY
            - generic [ref=e54]: Active
          - generic [ref=e57]:
            - generic [ref=e58]:
              - generic [ref=e59]:
                - img [ref=e60]
                - text: JWT DECODER & ANALYSIS
              - generic [ref=e64]: Analyzing
            - generic [ref=e65]: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMiIsInJvbGUi...
          - generic [ref=e66]:
            - generic [ref=e67]:
              - generic [ref=e68]:
                - img [ref=e69]
                - text: ROLE & TENANT SWAPPING
              - generic [ref=e73]: 9 Critical Checks
            - generic [ref=e74]: "Testing swap: admin ↔️ anonymous"
        - generic [ref=e75]:
          - generic [ref=e77]: SIMULATED SCAN TRAFFIC LOG
          - generic [ref=e79]: Initializing socket scanner streams...
    - generic [ref=e83]:
      - generic [ref=e84]:
        - heading "API Security Intelligence Engines" [level=2] [ref=e85]
        - paragraph [ref=e86]: Seven specialized core security engines cooperating asynchronously to identify authorization bypasses, token defects, and data leakage.
      - generic [ref=e87]:
        - generic [ref=e88]:
          - img [ref=e90]
          - heading "Endpoint Discovery" [level=3] [ref=e94]
          - paragraph [ref=e95]: Auto-parse Swagger/OpenAPI files to identify routes, authorization metadata, and request parameters.
        - generic [ref=e96]:
          - img [ref=e98]
          - heading "API Schema Crawler" [level=3] [ref=e102]
          - paragraph [ref=e103]: Traverse endpoint dependency trees to crawl inputs and reconstruct sequence transaction flows.
        - generic [ref=e104]:
          - img [ref=e106]
          - heading "Mutation Engine" [level=3] [ref=e109]
          - paragraph [ref=e110]: Node-powered parameter fuzzing, mutating headers, query strings, and payload IDs dynamically.
        - generic [ref=e111]:
          - img [ref=e113]
          - heading "JWT Token Analysis" [level=3] [ref=e117]
          - paragraph [ref=e118]: Deep inspections on cryptographic signing algorithms, signature strength, and expiration claims.
    - contentinfo [ref=e119]:
      - generic [ref=e120]:
        - generic [ref=e121]:
          - img [ref=e122]
          - generic [ref=e124]: TrustLayer Labs API Shield
        - generic [ref=e125]: © 2026 TrustLayer Labs. All rights reserved. Deployment Ready.
  - button "Open Next.js Dev Tools" [ref=e131] [cursor=pointer]:
    - img [ref=e132]
  - alert [ref=e135]
```