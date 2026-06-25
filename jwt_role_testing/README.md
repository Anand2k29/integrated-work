# JWT/Token Analysis + User/Role/Tenant Swapping Module

## Overview

This module is a part of the TEAM ALPHA Core Security Engine project for API authorization testing.

The purpose of this module is to analyze JWT tokens, extract user and role information, and test API authorization by simulating access from different users, roles, and tenants.

The module helps identify potential authorization vulnerabilities such as:

* Unauthorized admin access
* Improper role validation
* Broken access control
* Incorrect tenant isolation

---

# Features

## JWT Token Analysis

* Decode JWT tokens
* Extract:

  * User ID
  * Role
  * Tenant ID
  * Permissions
  * Expiry information
* Detect invalid or expired tokens

## User/Role/Tenant Swapping

* Test APIs using different user tokens
* Simulate:

  * Normal user accessing admin APIs
  * Cross-user access attempts
  * Cross-tenant access attempts
* Validate authorization behavior

## API Access Testing

* Send requests using JWT tokens
* Check API response status
* Detect unauthorized access

## Error Handling

* Handles invalid tokens
* Handles request failures
* Handles authorization failures properly

---

# Project Structure

```text
jwt_role_testing/
│
├── jwt_analyzer.py
├── role_swapper.py
├── access_tester.py
├── create_tokens.py
├── dummy_api.py
├── main.py
├── requirements.txt
└── README.md
```

---

# Tech Stack

* Python 3.11
* FastAPI
* PyJWT
* HTTPX
* Uvicorn

---

# Installation

## Clone Repository

```bash
git clone <repository-url>
cd jwt_role_testing
```

## Install Dependencies

```bash
py -3.11 -m pip install -r requirements.txt
```

---

# Running the Project

## Step 1: Generate Sample JWT Tokens

```bash
py -3.11 create_tokens.py
```

Copy the generated tokens into `main.py`.

---

## Step 2: Start Dummy API Server

```bash
py -3.11 -m uvicorn dummy_api:app --host 127.0.0.1 --port 8010 --reload
```

API will run at:

```text
http://127.0.0.1:8010
```

---

## Step 3: Run Authorization Tests

Open another terminal and run:

```bash
py -3.11 main.py
```

---

# Sample Output

```text
admin testing /api/admin/users → 200
user_a testing /api/admin/users → 403
user_b testing /api/admin/users → 403
admin testing /api/users/2/profile → 200
user_a testing /api/users/2/profile → 200
```

---

# Authorization Logic

## Admin API

* Accessible only by admin users
* Normal users should receive `403 Forbidden`

## User Profile API

* Accessible by authenticated users
* Unauthorized users receive `401 Unauthorized`

---

# Example Security Checks

This module can detect situations such as:

* User accessing admin-only API
* Incorrect role validation
* Missing authorization checks
* Broken access control configurations

---

# Current Status

## Completed

* JWT decoding
* Role extraction
* API authorization testing
* User-role swapping
* Status code validation
* Error handling
* Dummy API integration

## Future Improvements

* Tenant isolation testing
* Automated endpoint integration
* Dynamic token generation
* Integration with response diff engine
* Structured vulnerability reporting

---

# Author

Maitri Daga
TEAM ALPHA — Core Security Engine Team

JWT/Token Analysis + User/Role/Tenant Swapping Module
