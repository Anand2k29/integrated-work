
class ParameterMutator {
  
  // This is the MAIN function. Give it params, get back mutations.
  // params = a plain object like { user_id: "42", status: "active" }
  mutate(params) {
    const allMutations = [];

    // Loop over every key-value pair in the params
    for (const [key, value] of Object.entries(params)) {
      
      // Run all 4 strategies on this key
      allMutations.push(...this._idEnumeration(params, key, value));
      allMutations.push(...this._removeParam(params, key));
      allMutations.push(...this._injectSpecialChars(params, key, value));
      allMutations.push(...this._nullify(params, key));
    }

    return allMutations;
  }

  // ---------------------------------------------------------------
  // STRATEGY 1: ID Enumeration
  // If user_id = 42, try 41, 43, 1, 0, 99999
  // Question we're asking: "Can I read someone ELSE's data?"
  // ---------------------------------------------------------------
  _idEnumeration(params, key, value) {
    const mutations = [];
    const num = Number(value); // try to convert value to a number

    // isNaN means "is Not a Number" — if it's not a number, skip this
    if (isNaN(num)) return [];

    const candidates = [num - 1, num + 1, 1, 0, 99999, -1];

    for (const candidate of candidates) {
      const mutated = { ...params };   // copy the original params
      mutated[key] = String(candidate); // swap just this one value

      mutations.push({
        params: mutated,
        strategy: `id_enum:${key}=${candidate}`,
        reason: `Testing if ${key}=${candidate} leaks another user's data`
      });
    }

    return mutations;
  }

  // ---------------------------------------------------------------
  // STRATEGY 2: Remove the parameter entirely
  // Question: "Does the API crash? Or return ALL records?"
  // ---------------------------------------------------------------
  _removeParam(params, key) {
    const mutated = { ...params }; // copy
    delete mutated[key];           // remove this specific key

    return [{
      params: mutated,
      strategy: `remove_param:${key}`,
      reason: `Testing what happens when ${key} is missing`
    }];
  }

  // ---------------------------------------------------------------
  // STRATEGY 3: Inject dangerous special characters
  // We're testing: SQL injection, path traversal, XSS, etc.
  // ---------------------------------------------------------------
  _injectSpecialChars(params, key, value) {

    // Detect context from field name
    const k = key.toLowerCase();

    let payloads = [];

    if (k.includes('id') || k.includes('user') || k.includes('account')) {
        // Numeric ID field — try ID-based attacks
        payloads = [
            "' OR '1'='1",
            "1 OR 1=1",
            "-1",
            "0",
            "null",
        ];
    }
    else if (k.includes('query') || k.includes('search') || k.includes('filter') || k.includes('q')) {
        // Search field — try injection attacks
        payloads = [
            "' OR '1'='1",
            "<script>alert(1)</script>",
            "\" onmouseover=\"alert(1)",
            "1; DROP TABLE users--",
            "*",
            "%",
        ];
    }
    else if (k.includes('path') || k.includes('file') || k.includes('dir') || k.includes('url')) {
        // File reference field — try traversal
        payloads = [
            "../../../etc/passwd",
            "../../../../windows/system32",
            "%2e%2e%2f%2e%2e%2f",
            "/etc/passwd%00",
        ];
    }
    else if (k.includes('role') || k.includes('permission') || k.includes('access')) {
        // Auth field — try privilege values
        payloads = [
            "admin",
            "superadmin",
            "root",
            "administrator",
            "true",
            "1",
        ];
    }
    else if (k.includes('token') || k.includes('key') || k.includes('secret')) {
        // Credential field — try nullification
        payloads = [
            "",
            "null",
            "undefined",
            "Bearer fake",
        ];
    }
    else {
        // Unknown field — use a small general set
        payloads = [
            "' OR '1'='1",
            "<script>alert(1)</script>",
            "../../../etc/passwd",
            "null",
        ];
    }

    return payloads.map(payload => {
        const mutated = { ...params };
        mutated[key] = payload;
        return {
            params: mutated,
            strategy: `inject:${key}=${JSON.stringify(payload)}`,
            reason: `Testing if ${key} is vulnerable to injection`
        };
    });
  }

  // ---------------------------------------------------------------
  // STRATEGY 4: Nullify — empty or null values
  // Question: "Does it break? Does it skip auth checks?"
  // ---------------------------------------------------------------
  _nullify(params, key) {
    const nullValues = ["", "null", "undefined", "0"];

    return nullValues.map(val => {
      const mutated = { ...params };
      mutated[key] = val;

      return {
        params: mutated,
        strategy: `nullify:${key}=${JSON.stringify(val)}`,
        reason: `Testing what happens when ${key} is empty/null`
      };
    });
  }
}

// This line makes the class available to other files
module.exports = ParameterMutator;