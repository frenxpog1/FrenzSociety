import { mkdir, copyFile, cp, rm } from "node:fs/promises";
// Ship only the browser application, never tests, source-control data or tooling.
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
for (const file of ["index.html", "styles.css"])
  await copyFile(file, `dist/${file}`);
await cp("src", "dist/src", { recursive: true });
console.log("Static game built in dist/");
