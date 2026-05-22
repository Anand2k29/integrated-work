const { all } = require("axios");

class HeaderMutator{

    mutate(headers){
         const allMutations = [];

         for (const [key,value] of Object.entries(headers)){
            allMutations.push(...this._removeHeader(headers,key));
            allMutations.push(...this._blankValue(headers,key));
            allMutations.push(...this._garbageToken(headers,key,value));
            allMutations.push(...this._privelegeEsc(headers,key));
            allMutations.push(...this._tenantSwapping(headers,key,value));
            allMutations.push(...this._contentTypeSwap(headers,key));
         }
         allMutations.push(...this._idSpoofing(headers));
         return allMutations;
    }

    _removeHeader(headers,key){
        const mutated = {...headers};
        delete mutated[key];

        return [{
            headers: mutated,
            strategy: `remove_header:${key}`,
            reason: `Testing what happens when ${key} is missing`
        }];
    }

    _blankValue(headers,key){
        const mutated = {...headers};
        mutated[key] = "";

        return [{
            headers: mutated,
            strategy: `blanking_value:${key}`,
            reason: `Testing what happens when the value of ${key} is blank`
        }]
    }

    _garbageToken(headers,key,value){
        if (!key.toLowerCase().includes('authorization')) return [];
            const garbageValues = [
                // Category 1 - wrong values
                'Bearer fake',
                'Bearer null',
                'Bearer undefined',
                'Bearer 0',
                '',

                // Category 2 - wrong format
                'Bearer onlyonepart',
                'Bearer !@#$%^&*()',
                'Bearer ' + 'a'.repeat(1000),

                // Category 3 - tampered real token (if value exists)
                value.slice(0, -1) + 'X',
                value.slice(0, 10) + 'X' + value.slice(11),

                // Category 4 - algorithm none
                'Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOiIxIn0.',

                // Category 5 - fake admin payload
                'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwicm9sZSI6ImFkbWluIn0.fakesignature',
            ];
            
            return garbageValues.map (garbageValue =>{
                const mutated = {...headers};
                mutated[key] = garbageValue;
                return {
                    headers: mutated,
                    strategy: `garbage_token:${key}=${garbageValue}`,
                    reason: `Testing what happens when Authorization header has garbage token ${garbageValue}`
                };
            });
        
    }

    _privelegeEsc(headers,key){
        if (!key.toLowerCase().includes('x-user-role')) return [];

        const mutations = [];
        const priveleges = ['admin','superadmin','root','administrator'];

            for (const privelege of priveleges){
                const mutated = {...headers};
                mutated[key] = privelege;
                mutations.push({
                    headers: mutated,
                    strategy: `privelege_esc:${key}=${privelege}`,
                    reason: `Testing privelege escalation`
                })
            }

        return mutations;
        
    }

    _tenantSwapping(headers,key,value){
        const isTenantHeader = key.toLowerCase().includes('id')||key.toLowerCase().includes('tenant')||key.toLowerCase().includes('org');
        if (!isTenantHeader) return [];

        const match = value.match(/\d+/)
        if (!match) return [];

        const num = parseInt(match[0])
        const numStr = match[0];
        const candidates = [num-1,num+1, 0, 1, 9999];
        
        return candidates.map(candidate =>{
            const mutated = {...headers};
            mutated[key] = value.replace(numStr, String(candidate));
            return {
                    headers: mutated,
                    strategy: `tenant_swap:${key}=${candidate}`,
                    reason: `Testing tenant swapping`
            };
        });
    }

    _contentTypeSwap(headers,key){
        if (!key.toLowerCase().includes('type')) return [];
        
        const types = ['text/xml','text/plain','application/x-www-form-urlencoded'];
        return types.map(type =>{
            const mutated = {...headers};
            mutated[key]= type;
            return {
                    headers: mutated,
                    strategy: `type_swap:${key}=${type}`,
                    reason: `Testing content type swapping`
            };
        });
    }

    _idSpoofing(headers){
        const spoofHeaders = ['X-Forwarded-For','X-Original-IP','X-Real-IP'];
        const spoofValue = '127.0.0.1';

        return spoofHeaders.map(spoofKey =>{
            const mutated = {...headers};
            mutated[spoofKey] = spoofValue;
            return {
                    headers: mutated,
                    strategy: `id_spoof:${spoofKey}=${spoofValue}`,
                    reason: `Testing if localhost IP gets special access via ${spoofKey}`
            };
        });
    }
}

module.exports = HeaderMutator;
