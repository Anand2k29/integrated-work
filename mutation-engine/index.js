
const ParameterMutator = require('./paramMutator');
const HeaderMutator = require('./headerMutator');
const MethodMutator = require('./methodMutator');
const PathMutator = require('./pathMutator');
const BodyMutator = require('./bodyMutator');


class MutationEngine {

    constructor(options = {}) {
        this.parameterMutator = new ParameterMutator();
        this.headerMutator = new HeaderMutator();
        this.methodMutator = new MethodMutator();
        this.pathMutator = new PathMutator();
        this.bodyMutator = new BodyMutator();
        this.debug = options.debug || false;
    }

    mutate(request) {
        const allMutations = [];

        // Run parameter mutations if request has params
        if (request.params && Object.keys(request.params).length > 0) {
            const paramMutations = this.parameterMutator.mutate(request.params);
            allMutations.push(...paramMutations);
        }

        // Run header mutations if request has headers
        if (request.headers && Object.keys(request.headers).length > 0) {
            const headerMutations = this.headerMutator.mutate(request.headers);
            allMutations.push(...headerMutations);
        }

        // Run body mutations if request has headers
        if (request.body && Object.keys(request.body).length > 0) {
            const bodyMutations = this.bodyMutator.mutate(request.body);
            allMutations.push(...bodyMutations);
        }

        // Run method mutations if request has method
        if (request.method && request.method.trim() !== '') {
            const methodMutations = this.methodMutator.mutate(request.method);
            allMutations.push(...methodMutations);
        }

        // Run path mutations if request has path
        if (request.path && request.path.trim() !== '') {
            const pathMutations = this.pathMutator.mutate(request.path);
            allMutations.push(...pathMutations);
        }
        const deduped = this._deduplicate(allMutations)
        const scored = this._assignSeverity(deduped);
        return scored;
    }

    _assignSeverity(mutations) {
    return mutations.map(mutation => {
        const s = mutation.strategy;
        let severity;

        if (s.includes('tenant_swap') || s.includes('privilege_esc')) {
            severity = 5;
        } else if (s.includes('garbage_token') || s.includes('remove_header') || s.includes('remove_param')) {
            severity = 4;
        } else if (s.includes('method_switch') || s.includes('path_traversal') || s.includes('inject')) {
            severity = 3;
        } else if (s.includes('id_enum') || s.includes('nullify') || s.includes('tenant')) {
            severity = 2;
        } else {
            severity = 1;
        }

        return { ...mutation, severity };
    });
    }

    _generateFingerprint(mutation) {
    return [
        mutation.method  || '',
        mutation.path    || '',
        JSON.stringify(mutation.params  || {}),
        JSON.stringify(mutation.headers || {}),
        JSON.stringify(mutation.body || {})
    ].join('|');
    }

    _deduplicate(mutations) {
    const seen = new Set(); 
    const unique = [];

    for (const mutation of mutations) {
        const fingerprint = this._generateFingerprint(mutation);

        if (!seen.has(fingerprint)) {
            seen.add(fingerprint);
            unique.push(mutation);
        }
       
    }
    if (this.debug){
    console.log(`[MutationEngine] Raw: ${mutations.length} | After dedup: ${unique.length} | Removed: ${mutations.length - unique.length}`);
    }

    return unique;
    }
}

module.exports = MutationEngine;
