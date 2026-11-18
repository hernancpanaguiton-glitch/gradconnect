/**
 * Reads the access gates written inside controller methods, form requests
 * and policies, so a unit's role marks follow the rule the code enforces.
 *
 * Only real gates count: abort_unless/abort_if arguments, $this->authorize()
 * (via the policy method), and a form request's authorize(). A plain `if`
 * that merely shows different data to different roles is not a gate.
 */

const unique = (xs) => [...new Set(xs)];

/** Text between the parenthesis at `open` and its matching close. */
function balanced(src, open) {
    let depth = 0;
    for (let i = open; i < src.length; i++) {
        if (src[i] === '(') depth++;
        if (src[i] === ')' && --depth === 0) return src.slice(open + 1, i);
    }

    return src.slice(open + 1);
}

/** Signature and body of one method, or null when the file lacks it. */
export function methodSource(php, method) {
    const start = php.search(new RegExp(`function ${method}\\s*\\(`));
    if (start < 0) return null;

    const sigOpen = php.indexOf('(', start);
    const signature = balanced(php, sigOpen);
    const braceOpen = php.indexOf('{', sigOpen + signature.length);
    let depth = 0;
    for (let i = braceOpen; i < php.length; i++) {
        if (php[i] === '{') depth++;
        if (php[i] === '}' && --depth === 0) return { signature, body: php.slice(braceOpen + 1, i) };
    }

    return { signature, body: php.slice(braceOpen + 1) };
}

const permissionsIn = (s) => [...s.matchAll(/hasPermissionTo\('([^']+)'\)/g)].map((m) => m[1]);
const rolesIn = (s) => [...s.matchAll(/hasRole\('([a-z_]+)'\)/g)].map((m) => m[1]);
const hasOwnership = (s) => /===|owns\(|->is\(/.test(s);

/**
 * Each abort_unless/abort_if is a separate requirement that must also pass,
 * so each becomes its own clause; the caller intersects them.
 */
/** Private helpers of the same class called as $this->name(…), excluding the framework's. */
const helperCalls = (php, text) => [...new Set([...text.matchAll(/\$this->(\w+)\(/g)].map((m) => m[1]))]
    .filter((name) => !['authorize', 'validate', 'middleware'].includes(name) && methodSource(php, name));

export function gatesInMethod(php, method, seen = new Set([method])) {
    const src = methodSource(php, method);
    if (!src) return { clauses: [], policies: [], requests: [] };

    const gateArgs = [...src.body.matchAll(/abort_(?:unless|if)\s*\(/g)]
        .map((m) => balanced(src.body, m.index + m[0].length - 1));

    const clauses = gateArgs
        .map((args) => {
            // A gate often tests a variable assigned just before it
            // ($canManage = $user->hasPermissionTo(...)) or a private helper
            // ($this->canManage($user)); fold either one's text in.
            const assigned = [...new Set([...args.matchAll(/\$(\w+)/g)].map((v) => v[1]))]
                .map((name) => src.body.match(new RegExp(`\\$${name}\\s*=\\s*([^;]+);`))?.[1] ?? '')
                .join('\n');
            const helpers = helperCalls(php, `${args}\n${assigned}`).map((name) => methodSource(php, name).body).join('\n');
            const text = `${args}\n${assigned}\n${helpers}`;

            return { permissions: unique(permissionsIn(text)), roles: unique(rolesIn(text)), ownership: hasOwnership(args) };
        })
        .filter((c) => c.permissions.length || c.roles.length || c.ownership);

    // A helper called on its own line (e.g. $this->authorizeModify(...)) may
    // hold the gate itself; its gates are this method's gates too.
    const inGate = new Set(helperCalls(php, gateArgs.join('\n')));
    for (const name of helperCalls(php, src.body).filter((n) => !inGate.has(n) && !seen.has(n))) {
        seen.add(name);
        clauses.push(...gatesInMethod(php, name, seen).clauses);
    }

    const policies = [...src.body.matchAll(/(?:\$this->authorize|Gate::authorize)\(\s*'(\w+)'\s*,\s*(?:(\w+)::class|\$(\w+))/g)]
        .map((m) => {
            const model = m[2] ?? src.signature.match(new RegExp(`(\\w+)\\s+\\$${m[3]}\\b`))?.[1];

            return { ability: m[1], model };
        })
        .filter((p) => p.model);

    const requests = [...src.signature.matchAll(/(\w+Request)\s+\$/g)]
        .map((m) => m[1])
        .filter((name) => name !== 'Request');

    return { clauses, policies, requests };
}

/** Permissions and roles a policy ability or form request authorize() demands. */
export function gatesInBody(php, method) {
    const src = methodSource(php, method);
    if (!src) return { permissions: [], roles: [], ownership: false };

    return {
        permissions: unique(permissionsIn(src.body)),
        roles: unique(rolesIn(src.body)),
        ownership: hasOwnership(src.body),
    };
}
