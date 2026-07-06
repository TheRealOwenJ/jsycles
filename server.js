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
			return { ok: false, error: "bad_name" };
		}

		if (!userkey) {
			return { ok: false, error: "nologin" };
		}
		if (!userkey.includes(".") ) {
			return { ok: false, error: "bad_userkey" };
		}

		const parts = userkey.split(".");
		const username = parts[0];
		const password = parts.slice(1).join(".");

		const isValid = await authentication.authenticate(username, password);

		if (!isValid.ok) {
			return {
				ok: false,
				error: "wrong_login"
			};
		};

		return queue(async () => {
			let fileContent;
			try {
				fileContent = await fs.readFile(storage.file, 'utf-8');
			} catch {
				return { ok: false, error: "file_error" };
			}

			let data;
			try {
				data = JSON.parse(fileContent);
			} catch {
				return { ok: false, error: "file_error" };
			}

			if (data[name]) {
				return { ok: false, error: "exists" };
			}

			data[name] = { content, owner: username };

			try {
				await fs.writeFile(storage.file, JSON.stringify(data, null, 2));
			} catch {
				return { ok: false, error: "file_error" };
			}
			console.log(`[storage] saved snippet: ${name}`);
			return { ok: true, data: { name, content } };
		});

	},
	async deleteSnippet(name, userkey) {
		if (!userkey) {
			return { ok: false, error: "nologin" };
		}
		if (!userkey.includes(".")) {
			return { ok: false, error: "bad_userkey" };
		}

		if (!name) {
			return { ok: false, error: "missing_fields" };
		}

		if (["__proto__", "constructor", "prototype"].includes(name)) {
			return { ok: false, error: "bad_name" };
		}

		const parts = userkey.split(".");
		const username = parts[0];
		const password = parts.slice(1).join(".");

		if (!username || !password) {
			return { ok: false, error: "bad_userkey" };
		}

		const isValid = await authentication.authenticate(username, password);

		if (!isValid.ok) {
			return { ok: false, error: "wrong_login" };
		}

		return queue(async () => {
			let fileContent;
			try {
				fileContent = await fs.readFile(storage.file, 'utf-8');
			} catch {
				console.log("[storage] read error");
				return { ok: false, error: "file_error" };
			}

			let data;
			try {
				data = JSON.parse(fileContent);
			} catch {
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

			try {
				await fs.writeFile(storage.file, JSON.stringify(data, null, 2));
			} catch {
				console.log('[storage] error writing storage file');
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
			return { ok: false, error: "missing_fields" };
		}

		if (["__proto__", "constructor", "prototype"].includes(username)) {
			return { ok: false, error: "bad_name" };
		}

		return queue(async () => {
			let fileContent;
			try {
				fileContent = await fs.readFile(authentication.file, 'utf-8');
			} catch {
				console.log("[auth] read error");
				return { ok: false, error: "file_error" };
			}

			let data;
			try {
				data = JSON.parse(fileContent);
			} catch {
				return { ok: false, error: "file_error" };
			}

			if (data[username]) {
				console.log(`[auth] user exists: ${username}`);
				return { ok: false, error: "user_exists" };
			}

			data[username] = password;

			try {
				await fs.writeFile(authentication.file, JSON.stringify(data, null, 2));
			} catch {
				console.log('[auth] error writing accounts file');
				return { ok: false, error: "file_error" };
			}

			console.log(`[auth] registered user: ${username}`);
			return { ok: true };
		});
	},
	async authenticate(username, password) {
		let data;
		if (!username || !password) {
			return { ok: false, error: "missing_fields" };
		}

		const fileContent = await readAcc();

		if (fileContent === null) {
			console.log("[auth] read error");
			return {
				ok: false,
				error: "file_error"
			};
		}

		try {
			data = JSON.parse(fileContent);
		} catch {
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
			return { ok: false, error: "missing_fields" };
		}

		return queue(async () => {
			let fileContent, fileContent2;
			try {
				fileContent = await fs.readFile(authentication.file, 'utf-8');
				fileContent2 = await fs.readFile(storage.file, 'utf-8');
			} catch {
				console.log("[auth] read error");
				return { ok: false, error: "file_error" };
			}

			let data, data2;
			try {
				data = JSON.parse(fileContent);
				data2 = JSON.parse(fileContent2);
			} catch {
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

			try {
				await fs.writeFile(authentication.file, JSON.stringify(data, null, 2));
				await fs.writeFile(storage.file, JSON.stringify(data2, null, 2));
			} catch {
				console.log('[auth] error writing files');
				return { ok: false, error: "file_error" };
			}

			console.log(`[auth] succesfully deleted ${username} and its snippets`);
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
    return queue(async () => {
        try {
            return await fs.readFile(storage.file, 'utf-8');
        } catch (err) {
            console.log('error reading file:', err);
            return null;
        }
    });
}

async function save(content) {
    return queue(async () => {
        try {
            return await fs.writeFile(
                storage.file,
                JSON.stringify(content, null, 2)
            );
        } catch (err) {
            console.log('error writing file:', err);
            return null;
        }
    });
}

async function readAcc() {
    return queue(async () => {
        try {
            return await fs.readFile(authentication.file, 'utf-8');
        } catch (err) {
            console.log('error reading file:', err);
            return null;
        }
    });
}

async function saveAcc(content) {
    return queue(async () => {
        try {
            return await fs.writeFile(
                authentication.file,
                JSON.stringify(content, null, 2)
            );
        } catch (err) {
            console.log('error writing file:', err);
            return null;
        }
    });
}

function queue(op) {
    const next = queuevar.then(op);
    queuevar = next.catch(() => {});
    return next;
}