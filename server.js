import * as fs from 'fs/promises';

// i know saving in json is stupid but who cares i like it
const storage = {
	file: "storage.json",
	async saveSnippet(name, content) {
		let fileContent = await read();

		if (fileContent === null) {
			console.log("[storage] read error");
			return {
				ok: false,
				error: "file_error"
			};
		}

		let data = JSON.parse(fileContent);

		if (data[name]) {
			console.log(`[storage] snippet exists: ${name}`);
			return {
				ok: false,
				error: "exists"
			};
		}

		data[name] = content;

		await save(data);

		console.log(`[storage] saved snippet: ${name}`);

		return {
			ok: true,
			data: {
				name,
				content
			}
		};
	},
	async deleteSnippet(name) {
		let fileContent = await read();

		if (fileContent === null) {
			console.log("[storage] read error");
			return {
				ok: false,
				error: "file_error"
			};
		}

		let data = JSON.parse(fileContent);

		if (!data[name]) {
			console.log(`[storage] snippet not found: ${name}`);
			return {
				ok: false,
				error: "not_found"
			};
		}

		delete data[name];

		await save(data);

		console.log(`[storage] deleted snippet: ${name}`);

		return {
			ok: true
		};
	}
};

//YOUR SENSITIVE INFO IN MY JSON MUHAHAHA
const authentication = {
	file: "accounts.json",
	async register(username, password) {
		const fileContent = await readAcc();

		if (fileContent === null) {
			console.log("[auth] read error");
			return {
				ok: false,
				error: "file_error"
			};
		}

		let data = JSON.parse(fileContent);

		if (data[username]) {
			console.log(`[auth] user exists: ${username}`);
			return {
				ok: false,
				error: "user_exists"
			};
		}

		data[username] = password;

		await saveAcc(data);

		console.log(`[auth] registered user: ${username}`);

		return {
			ok: true
		};
	},
	async authenticate(username, password) {
		const fileContent = await readAcc();

		if (fileContent === null) {
			console.log("[auth] read error");
			return {
				ok: false,
				error: "file_error"
			};
		}

		let data = JSON.parse(fileContent);

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
			ok: true,
			username
		};
	},
	async delAcc(username, password) {
		const fileContent = await readAcc();

		if (fileContent === null) {
			console.log("[auth] read error");
			return {
				ok: false,
				error: "file_error"
			};
		}

		let data = JSON.parse(fileContent);

		if (!data[username]) {
			console.log(`[auth] user doesnt exist: ${username}`);
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

		delete data[username];
		await saveAcc(data);
		console.log(`[auth] succesfully deleted ${username}`);
		return {
			ok: true
		};
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
			if (!name || !content) {
				return new Response(JSON.stringify({
					ok: false,
					error: "missing_fields"
				}), {
					status: 400
				});
			}
			const result = await storage.saveSnippet(
				name,
				content
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
			const result = await storage.deleteSnippet(
				name
			);

			if (!result.ok) {
				return new Response(result.error, {
					status: 400
				});
			}

			return new Response(JSON.stringify({
				ok: true
			}));
		};

		if (url.pathname === "/register") {
			const username = url.searchParams.get("username");
			const password = url.searchParams.get("password");

			if (!username || !password) {
				return new Response(JSON.stringify({
					ok: false,
					error: "missing_fields"
				}), {
					status: 400
				});
			}

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

			if (!username || !password) {
				return new Response(JSON.stringify({
					ok: false,
					error: "missing_fields"
				}), {
					status: 400
				});
			}

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

			if (!username || !password) {
				return new Response(JSON.stringify({
					ok: false,
					error: "missing_fields"
				}), {
					status: 400
				});
			};

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
		return await fs.readFile(storage.file, 'utf-8');
	} catch (err) {
		console.log('error reading file: ', err);
		return null;
	}
}

async function save(content) {
	try {
		return await fs.writeFile(storage.file, JSON.stringify(content, null, 2));
	} catch (err) {
		console.log('error writing file: ', err);
		return null;
	}
}

async function saveAcc(content) {
	try {
		return await fs.writeFile(authentication.file, JSON.stringify(content, null, 2));
	} catch (err) {
		console.log('error writing file: ', err);
		return null;
	}
}

async function readAcc() {
	try {
		return await fs.readFile(authentication.file, 'utf-8');
	} catch (err) {
		console.log('error reading file: ', err);
		return null;
	}
}