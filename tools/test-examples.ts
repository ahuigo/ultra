import { join } from "../lib/deps.ts";
import { initExampleConfig } from "./dev.ts";

async function testExample(example: string) {
<<<<<<< HEAD
  try {
    const examplePath = join("examples", example);
    await initExampleConfig(example);
=======
  initExampleConfig(example);
  const examplePath = join("examples", example);
  try {
>>>>>>> bff16da (feat: add unittest for examples)
    const cmd = [
      Deno.execPath(),
      "test",
      "-c",
      "deno.dev.json",
      "-A",
<<<<<<< HEAD
    ];
    console.log("test ", examplePath, cmd);
=======
      "./server.tsx",
    ];
    console.log(examplePath, cmd);
>>>>>>> bff16da (feat: add unittest for examples)
    const process = Deno.run({
      cmd,
      cwd: examplePath,
      env: {
        ULTRA_MODE: "development",
      },
    });

    const status = await process.status();
    if (status.code > 0) {
      Deno.exit(status.code);
    }
  } catch (err) {
    console.error(err);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  for (const example of Deno.args) {
    await testExample(example);
  }
}
