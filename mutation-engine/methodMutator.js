

class MethodMutator{

    mutate(method){
        const allMutations =[];
        allMutations.push(...this._methodSwitching(method));
        allMutations.push(...this._caseSwapping(method));
        allMutations.push(...this._garbageMethod(method));
        allMutations.push(...this._methodOverrideHeader(method));

        return allMutations;
    }

    _methodSwitching(currMethod){
        const methods = ['GET','POST','PUT','DELETE','PATCH','OPTIONS','HEAD'];
        const mutations = [];
        
        for (const method of methods){
            if (method === currMethod) continue;
            mutations.push({
                method: method,
                strategy: `method_switch:${method}`,
                reason: `Testing if ${method} is accessible when original method is ${currMethod}`
            });
        }

        return mutations;
    }

    _caseSwapping(currMethod){
        const variants = [currMethod.toLowerCase()];

        for (let i = 0; i< currMethod.length; i++){
            const method1 = currMethod.slice(0,i)+currMethod[i].toLowerCase()+currMethod.slice(i+1);
            variants.push(method1);
            const method2 = currMethod.slice(0,i).toLowerCase()+currMethod[i]+currMethod.slice(i+1).toLowerCase();
            variants.push(method2);
        }
        return variants.map(method =>{
            return{
                method: method,
                strategy: `case_swap:${method}`,
                reason: `Testing if ${method} is accessible`
            };
        });
        
    }

    _garbageMethod(currMethod){
        const garbageVals = ['HACK','','FAKEMETHOD','NULL'];

        return garbageVals.map(val=>{
            return{
                method: val,
                strategy: `garbage_method:${val}`,
                reason: `Testing if garbage method ${val} is accepted`
            };
        });
    }

    _methodOverrideHeader(currMethod){
        return[{
            method: currMethod,
            headers: {"X-HTTP-Method-Override" : "DELETE"},
            strategy: `method_override:DELETE`,
            reason: `Testing if server respects 'X-HTTP-Method-Override' header`
        }];
    }
}

module.exports = MethodMutator;