const MutationEngine = require('./index');

function run() {
    let data = "";
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', chunk => {
        data += chunk;
    });

    process.stdin.on('end', () => {
        try {
            if (!data.trim()) {
                console.error("No input provided via stdin");
                process.exit(1);
            }
            const requests = JSON.parse(data);
            const engine = new MutationEngine({ debug: false });
            
            const results = [];
            for (const req of requests) {
                const mutations = engine.mutate(req);
                results.push({
                    original: req,
                    mutations: mutations
                });
            }
            
            console.log(JSON.stringify(results, null, 2));
        } catch (error) {
            console.error("Error processing mutations:", error);
            process.exit(1);
        }
    });
}

run();
