
const ParameterMutator = require('./parameterMutator');
const HeaderMutator = require('./headerMutator');
const MethodMutator = require('./methodMutator');
const PathMutator = require('./pathMutator');


class MutationEngine {

    constructor() {
        this.parameterMutator = new ParameterMutator();
        this.headerMutator = new HeaderMutator();
        this.methodMutator = new MethodMutator();
        this.pathMutator = new PathMutator();
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

        return allMutations;
    }
}

module.exports = MutationEngine;