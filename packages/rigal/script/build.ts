#!/usr/bin/env bun

const args = process.argv.slice(2)
const compile = args.includes("--compile") || args.includes("-c")
const target = args.find((a) => a.startsWith("--target="))?.split("=")[1]

if (compile) {
  console.log("Building RIGAL standalone binary...")

  const targets = target
    ? [target]
    : [
        "bun-linux-x64",
        "bun-linux-arm64",
        "bun-darwin-x64",
        "bun-darwin-arm64",
        "bun-windows-x64",
      ]

  for (const t of targets) {
    const platform = t.split("-")[1]
    const arch = t.split("-")[2]
    const ext = platform === "windows" ? ".exe" : ""
    const outfile = `dist/rigal-${platform}-${arch}${ext}`

    console.log(`  Compiling for ${platform}/${arch}...`)

    const result = await Bun.build({
      entrypoints: ["src/cli/main.tsx"],
      outdir: "dist",
      target: "bun",
      format: "esm",
      minify: true,
      sourcemap: "none",
      splitting: false,
      external: ["react", "ink", "ink-text-input", "ink-spinner", "effect"],
    })

    if (!result.success) {
      for (const log of result.logs) {
        console.error(log)
      }
      process.exit(1)
    }

    // Use bun build --compile via shell command
    const proc = Bun.spawn([
      "bun",
      "build",
      "--compile",
      `--target=${t}`,
      "--minify",
      "src/cli/main.tsx",
      "--outfile",
      outfile,
    ])

    await proc.exited

    if (proc.exitCode !== 0) {
      console.error(`  Failed to compile for ${t}`)
      process.exit(1)
    }

    console.log(`  ✓ ${outfile}`)
  }

  console.log("\n✓ All binaries built successfully")
} else {
  console.log("Building RIGAL for npm distribution...")

  const result = await Bun.build({
    entrypoints: ["src/cli/main.tsx"],
    outdir: "dist",
    target: "bun",
    format: "esm",
    minify: false,
    sourcemap: "inline",
    splitting: false,
    external: ["react", "ink", "ink-text-input", "ink-spinner", "chalk", "effect"],
  })

  if (!result.success) {
    for (const log of result.logs) {
      console.error(log)
    }
    process.exit(1)
  }

  const fs = await import("fs")
  fs.chmodSync("dist/main.js", 0o755)

  console.log("✓ RIGAL built successfully")
}
