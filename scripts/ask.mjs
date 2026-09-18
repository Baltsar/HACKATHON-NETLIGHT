#!/usr/bin/env node
const question = process.argv.slice(2).join(" ").trim();
if (!question) {
  console.error('Usage: pnpm ask "your question"');
  process.exit(1);
}

const res = await fetch("http://localhost:3456/api/agent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ question }),
});
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
if (!res.ok) process.exit(1);
