import * as esbuild from "esbuild";

await esbuild.build({
  bundle: true,
  entryPoints: ["src/xiaomi-vacuum-card.js"],
  format: "esm",
  legalComments: "inline",
  minify: false,
  outfile: "dist/xiaomi-vacuum-card.js",
  sourcemap: false,
  target: "es2022",
});

console.log("Successfully built dist/xiaomi-vacuum-card.js");
