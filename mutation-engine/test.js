const MutationEngine = require('./index');

const engine = new MutationEngine();

const mutations = engine.mutate({
    method: 'GET',
    path: '/api/users/42',
    params: { userId: '42', status: 'active' },
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.test.signature',
        'X-Tenant-ID': 'company-123',
        'X-User-Role': 'user',
        'Content-Type': 'application/json'
    }
});

console.log(`Total mutations generated: ${mutations.length}`);
console.log(`First fifty mutations`);


mutations.slice(0, 50).forEach((m, i) => {
    console.log(`\n[${i+1}] Strategy: ${m.strategy}`);
    console.log(`    Reason:   ${m.reason}`);
});
