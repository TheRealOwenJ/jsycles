import * as fs from 'fs/promises';
let queuevar = Promise.resolve();

// i know saving in json is stupid but who cares i like it
const storage = {
	file: "storage.json",
	async saveSnippet(name, content, userkey) {
		if (!name || !content) {
			return {
				ok: false,
				error: "missing_fields"
			};
		}

		if (["__proto__", "constructor", "prototype"].includes(name)) {
			console.log("[storage] bad snippet name");
			return { ok: false, error: "bad_name" };
		}

		if (!userkey) {
			console.log('[storage] missing userkey');
			return { ok: false, error: "nologin" };
		}
		if (!userkey.includes(".") ) {
			console.log('[storage] bad userkey');
			return { ok: false, error: "bad_userkey" };
		}

		const parts = userkey.split(".");
		const username = parts[0];
		const password = parts.slice(1).join(".");

		return queue(async () => {
			const isValid = await authentication.authenticate(username, password);

			if (!isValid.ok) {
				console.log(`[storage] authentication failed: ${username}`);
				return {
					ok: false,
					error: "wrong_login"
				};
			};
			let fileContent;
			try {
				fileContent = await read();
			} catch {
				return { ok: false, error: "file_error" };
			}

			if (fileContent === null) {
				return { ok: false, error: "file_error" };
			}

			let data;
			try {
				data = JSON.parse(fileContent);
			} catch {
				console.log('[storage] failed to parse json');
				return { ok: false, error: "file_error" };
			}

			if (data[name]) {
				console.log(`[storage] snippet ${name} exists`);
				return { ok: false, error: "exists" };
			}

			data[name] = { content, owner: username };

			const ok = await save(data);

			if (!ok) {
				return { ok: false, error: "file_error" };
			}
			console.log(`[storage] saved snippet: ${name}`);
			return { ok: true, data: { name, content } };
		});

	},
	async deleteSnippet(name, userkey) {
		if (!userkey) {
			console.log('[storage] missing userkey');
			return { ok: false, error: "nologin" };
		}
		if (!userkey.includes(".")) {
			console.log('[storage] bad userkey');
			return { ok: false, error: "bad_userkey" };
		}

		if (!name) {
			console.log('[storage] missing fields');
			return { ok: false, error: "missing_fields" };
		}

		if (["__proto__", "constructor", "prototype"].includes(name)) {
			console.log("[storage] bad snippet name");
			return { ok: false, error: "bad_name" };
		}

		const parts = userkey.split(".");
		const username = parts[0];
		const password = parts.slice(1).join(".");

		if (!username || !password) {
			console.log('[storage] bad userkey');
			return { ok: false, error: "bad_userkey" };
		}

		return queue(async () => {
			const isValid = await authentication.authenticate(username, password);

			if (!isValid.ok) {
				console.log(`[storage] authentication failed: ${username}`);
				return { ok: false, error: "wrong_login" };
			}
			let fileContent;
			try {
				fileContent = await read();
			} catch {
				return { ok: false, error: "file_error" };
			}

			if (fileContent === null) {
				return { ok: false, error: "file_error" };
			}

			let data;
			try {
				data = JSON.parse(fileContent);
			} catch {
				console.log('[storage] failed to parse json');
				return { ok: false, error: "file_error" };
			}

			if (!data[name]) {
				console.log(`[storage] snippet not found: ${name}`);
				return { ok: false, error: "not_found" };
			}

			if (data[name]["owner"] !== username) {
				return { ok: false, error: "wrong_owner" };
			}

			delete data[name];

			const ok = await save(data);

			if (!ok) {
				return { ok: false, error: "file_error" };
			}

			console.log(`[storage] deleted snippet: ${name}`);
			return { ok: true };
		});
	}
};

//YOUR SENSITIVE INFO IN MY JSON MUHAHAHA
const authentication = {
	file: "accounts.json",
	async register(username, password) {
		if (!username || !password) {
			console.log("[auth] missing fields");
			return { ok: false, error: "missing_fields" };
		}

		if (["__proto__", "constructor", "prototype"].includes(username)) {
			console.log("[auth] bad username");
			return { ok: false, error: "bad_name" };
		}

		return queue(async () => {
			let fileContent;
			try {
				fileContent = await readAcc();
			} catch {
				return { ok: false, error: "file_error" };
			}

			if (fileContent === null) {
				return { ok: false, error: "file_error" };
			}

			let data;
			try {
				data = JSON.parse(fileContent);
			} catch {
				console.log('[auth] failed to parse json');
				return { ok: false, error: "file_error" };
			}

			if (data[username]) {
				console.log(`[auth] user exists: ${username}`);
				return { ok: false, error: "user_exists" };
			}

			data[username] = password;

			const ok = await saveAcc(data);

			if (!ok) {
				return { ok: false, error: "file_error" };
			}

			console.log(`[auth] registered user: ${username}`);
			return { ok: true };
		});
	},
	async authenticate(username, password) {
		let data;
		if (!username || !password) {
			console.log("[auth] missing fields");
			return { ok: false, error: "missing_fields" };
		}
		const fileContent = await readAcc();

		if (fileContent === null) {
			return {
				ok: false,
				error: "file_error"
			};
		}

		try {
			data = JSON.parse(fileContent);
		} catch {
			console.log('[auth] failed to parse json');
			return { ok: false, error: "file_error" };
		}

		if (!data[username]) {
			console.log(`[auth] missing user: ${username}`);
			return {
				ok: false,
				error: "no_user"
			};
		}

		if (data[username] !== password) {
			console.log(`[auth] wrong password: ${username}`);
			return {
				ok: false,
				error: "wrong_password"
			};
		}

		console.log(`[auth] success: ${username}`);

		return {
			ok: true
		};
	},
	async delAcc(username, password) {
		if (!username || !password) {
			console.log("[auth] missing fields");
			return { ok: false, error: "missing_fields" };
		}

		return queue(async () => {
			let fileContent, fileContent2;
			try {
				fileContent = await readAcc();
				fileContent2 = await read();
			} catch {
				return { ok: false, error: "file_error" };
			}

			if (fileContent === null || fileContent2 === null) {
				return { ok: false, error: "file_error" };
			}

			let data, data2;
			try {
				data = JSON.parse(fileContent);
				data2 = JSON.parse(fileContent2);
			} catch {
				console.log('[auth] failed to parse json');
				return { ok: false, error: "file_error" };
			}

			if (!data[username]) {
				console.log(`[auth] user doesnt exist: ${username}`);
				return { ok: false, error: "no_user" };
			}

			if (data[username] !== password) {
				console.log(`[auth] wrong password: ${username}`);
				return { ok: false, error: "wrong_password" };
			}

			for (const name of Object.keys(data2)) {
				if (data2[name]["owner"] === username) {
					delete data2[name];
				}
			}

			delete data[username];

			const ok = await saveAcc(data);
			const ok2 = await save(data2);

			if (!ok || !ok2) {
				return { ok: false, error: "file_error" };
			}

			console.log(`[auth] successfully deleted ${username} and its snippets`);
			return { ok: true };
		});
	}
};

// bread
const server = Bun.serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url);

		if (url.pathname === "/upload") {
			const name = url.searchParams.get("name");
			const content = url.searchParams.get("content");
			const userkey = url.searchParams.get("userkey");

			const result = await storage.saveSnippet(
				name,
				content,
				userkey
			);

			if (!result.ok) {
				return new Response(JSON.stringify(result), {
					status: 400
				});
			}

			return new Response(JSON.stringify({
				ok: true,
				data: result.data
			}));
		}

		if (url.pathname === "/delete") {
			const name = url.searchParams.get("name");
            const userkey = url.searchParams.get("userkey");

			const result = await storage.deleteSnippet(
				name, userkey
			);

			if (!result.ok) {
				return new Response(JSON.stringify({
					ok: false,
					error: result.error
				}), {
					status: 400
				});
			}

			return new Response(JSON.stringify({
				ok: true,
			}));
		};

		if (url.pathname === "/register") {
			const username = url.searchParams.get("username");
			const password = url.searchParams.get("password");

			const result = await authentication.register(username, password);

			if (!result.ok) {
				return new Response(JSON.stringify({
					ok: false,
					error: result.error
				}), {
					status: 400
				});
			}

			return new Response(JSON.stringify({
				ok: true
			}));
		};

		if (url.pathname === "/delacc") {
			const username = url.searchParams.get("username");
			const password = url.searchParams.get("password");

			const result = await authentication.delAcc(username, password);

			if (!result.ok) {
				return new Response(JSON.stringify({
					ok: false,
					error: result.error
				}), {
					status: 400
				});
			};

			return new Response(JSON.stringify({
				ok: true
			}));
		};

		if (url.pathname === "/authenticate") {
			const username = url.searchParams.get("username");
			const password = url.searchParams.get("password");

			const result = await authentication.authenticate(username, password);

			if (!result.ok) {
				return new Response(JSON.stringify({
					ok: false,
					error: result.error
				}), {
					status: 400
				});
			};

			return new Response(JSON.stringify({
				ok: true
			}));
		};

		return new Response("404 Not Found", {
			status: 404
		});
	},
});

console.log(`Listening on http://localhost:${server.port}`);

//random helpers cuz i aint typing allat shi bruv
async function read() {
    try {
        return await fs.readFile(storage.file, "utf8");
    } catch {
		console.log('[storage] read failed');
        return null;
    }
}

async function save(data) {
    try {
        await fs.writeFile(storage.file, JSON.stringify(data, null, 2));
        return true;
    } catch {
		console.log('[storage] write failed');
        return false;
    }
}

async function readAcc() {
    try {
        return await fs.readFile(authentication.file, "utf8");
    } catch {
		console.log('[auth] read failed');
        return null;
    }
}

async function saveAcc(data) {
    try {
        await fs.writeFile(authentication.file, JSON.stringify(data, null, 2));
        return true;
    } catch {
		console.log('[auth] write failed');
        return false;
    }
}

function queue(op) {
    const next = queuevar.then(op);
    queuevar = next.catch(() => {});
    return next;
}