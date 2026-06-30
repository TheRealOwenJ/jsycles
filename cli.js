#!/usr/bin/env bun

import * as fs from 'fs/promises';

const args = process.argv.slice(2);

// help me helper function i am in need of help apsjfpianjfpidn
async function setCfg(key, subkey, val) {
    let fileContent;
    let data;

    try {
        fileContent = await fs.readFile('jsyclescfg.json', 'utf8');
    } catch {
        return { ok: false, error: "cfg_error" };
    }

    try {
        data = JSON.parse(fileContent);
    } catch {
        return { ok: false, error: "cfg_error" };
    }

    if (!data[key]) {
        data[key] = {};
    }
    data[key][subkey] = val;

    try {
        await fs.writeFile(
            'jsyclescfg.json',
            JSON.stringify(data, null, 2)
        );
        return { ok: true };
    } catch {
        return { ok: false, error: "cfg_error" };
    }
}

// translate from i dont care messages to i DO care messages
function hoomanizer(type, code) {
    if (type === "error") {
        switch (code) {
            case "exists":
                return "That snippet already exists. Try a different name.";
            case "not_found":
                return "That snippet doesn't exist.";
            case "file_error":
                return "Something went wrong with the server storage.";
            case "cfg_error":
                return "Something went wrong with the config file.";
            case "user_exists":
                return "That username is already taken.";
            case "no_user":
                return "That account doesn't exist.";
            case "wrong_password":
                return "Wrong password.";
            default:
                return "Something went wrong.";
        }
    }

    if (type === "success") {
        switch (code) {
            case "upload":
                return "Snippet uploaded successfully.";
            case "delete":
                return "Snippet deleted successfully.";
            case "register":
                return "Account created successfully.";
            case "delacc":
                return "Account deleted successfully.";
            default:
                return "Success.";
        }
    }
}

// hey dude im thinking before doing
async function handle(response, action) {
    let data;

    try {
        data = await response.json();
    } catch {
        console.log('Error: Invalid server response.');
        return;
    }

    if (!response.ok) {
        console.log('Error:', hoomanizer('error', data.error || 'unknown'));
        return;
    }

    console.log(hoomanizer('success', action));
}

if (args[0] === 'upload') {
    const name = args[1];
    const content = args[2];

    if (!name || !content) {
        console.log('Invalid Arguments! See `jsycles help` for correct usage!');
        process.exit(1);
    }

    const response = await fetch(
        `http://localhost:3000/upload?name=${encodeURIComponent(name)}&content=${encodeURIComponent(content)}`
    );

    await handle(response, "upload");
} else if (args[0] === 'delete') {
    const name = args[1];

    if (!name) {
        console.log('Invalid Arguments! See `jsycles help` for correct usage!');
        process.exit(1);
    }

    const response = await fetch(
        `http://localhost:3000/delete?name=${encodeURIComponent(name)}`
    );

    await handle(response, "delete");
} else if (args[0] === 'register') {
    const username = args[1];
    const password = args[2];
    if (!username || !password) {
        console.log('Invalid Arguments! See `jsycles help` for correct usage!');
        process.exit(1);
    };
    const response = await fetch(
        `http://localhost:3000/register?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    );
    await handle(response, "register");
} else if (args[0] === 'delacc') {
    const username = args[1];
    const password = args[2];
    if (!username || !password) {
        console.log('Invalid Arguments! See `jsycles help` for correct usage!');
        process.exit(1);
    };
    const response = await fetch(
        `http://localhost:3000/delacc?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    );
    await handle(response, "delacc");
}