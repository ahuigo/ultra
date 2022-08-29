import {
  Builder,
  crayon,
  deepMerge,
  fromFileUrl,
  join,
  outdent,
  relative,
  resolve,
  sprintf,
  VirtualFile,
} from "./lib/build/deps.ts";
import type {
  BuildOptions,
  BuildPlugin,
  DenoConfig,
} from "./lib/build/types.ts";

/**
 * Re-export these types as convenience to build plugin authors
 */
export type { BuildPlugin };

const defaultOptions: Omit<
  BuildOptions,
  "browserEntrypoint" | "serverEntrypoint" | "plugin"
> = {
  output: ".ultra",
  exclude: [
    ".git",
    join("**", ".DS_Store"),
  ],
};

export default async function build(
  options: Partial<BuildOptions>,
) {
  const resolvedOptions = deepMerge<BuildOptions>(defaultOptions, options);
  const root = Deno.cwd();
  const output = resolvedOptions.output
    ? resolve(root, resolvedOptions.output)
    : resolve(root, ".ultra");

  function makeRelative(path: string) {
    return `./${
      relative(
        root,
        fromFileUrl(path),
      )
    }`;
  }

  const mainModule = makeRelative(Deno.mainModule);
  const browserEntrypoint = makeRelative(resolvedOptions.browserEntrypoint);
  const serverEntrypoint = makeRelative(resolvedOptions.serverEntrypoint);

  const builder = new Builder({
    root,
    output,
    name: "ultra",
    importMap: "./importMap.json",
    logLevel: "INFO",
    compiler: {
      minify: true,
      sourceMaps: resolvedOptions.sourceMaps,
    },
  });

  builder.setEntrypoints({
    [browserEntrypoint]: {
      vendorOutputDir: "browser",
      target: "browser",
    },
    [serverEntrypoint]: {
      vendorOutputDir: "server",
      target: "deno",
    },
  });

  builder.setExcluded([
    mainModule,
    ...(resolvedOptions.exclude || []),
  ]);

  builder.setHashed([
    "./src/**/*.+(ts|tsx|js|jsx|css)",
    "./public/**/*.+(css|ico|webp|avif|jpg|png|svg|gif|otf|ttf|woff)",
    browserEntrypoint,
  ]);

  builder.setCompiled([
    "./**/*.+(ts|tsx|js|jsx)",
  ]);

  /**
   * Clean the output directory
   */
  await builder.cleanOutput();

  /**
   * Gather all sources from root
   */
  const sources = await builder.gatherSources();

  /**
   * Copy sources to output
   */
  const buildSources = await builder.copySources(sources);

  /**
   * Execute the build
   */
  const result = await builder.build(buildSources);

  /**
   * Remove the dev importMap
   */
  await buildSources.get("./importMap.json").then((source) => source.remove());

  /**
   * Generate asset-manifest.json
   */
  builder.log.info("Generating asset-manifest.json");
  const manifest = builder.toManifest(buildSources, {
    exclude: [
      "./deno.json",
      "./importMap*.json",
    ],
    prefix: "/",
  });

  const assetManifest = manifest.map(([relative, absolute]) => {
    return [relative.replace("./public/", "./"), absolute];
  });

  const assetManifestSource = new VirtualFile(
    "./asset-manifest.json",
    builder.context.output,
    JSON.stringify(assetManifest, null, 2),
  );

  builder.copySource(assetManifestSource, builder.context.output);

  /**
   * Patch deno.json
   */
  builder.log.info("Patching deno.json");
  const denoConfigSource = await buildSources.get("./deno.json");

  if (denoConfigSource) {
    const denoConfig = await denoConfigSource.readAsJson<DenoConfig>();
    if (denoConfig) {
      if (denoConfig.compilerOptions?.jsx) {
        denoConfig.compilerOptions.jsx = "react-jsx";
      }
      denoConfig.importMap = "./importMap.server.json";
      await denoConfigSource.writeJson(denoConfig, true);
    }
  }

  if (resolvedOptions.plugin) {
    builder.log.info(
      sprintf(
        "Starting build plugin %s",
        crayon.lightBlue(resolvedOptions.plugin.name),
      ),
    );
    await resolvedOptions.plugin.onBuild(builder, result);
  }

  builder.log.success("Build complete");

  // deno-fmt-ignore
  console.log(outdent`\n
    You can now deploy the "${crayon.lightBlue(output)}" output directory to a platform of your choice.
    Instructions for common deployment platforms can be found at ${crayon.green('https://ultrajs.dev/docs#deploying')}.\n
    Alternatively, you can cd into "${crayon.lightBlue(output)}" and run: ${crayon.underline("deno task start")}
  `);
}
