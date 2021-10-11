import path from "path";
import rm from "rimraf";
import ts from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";
import resolve from "@rollup/plugin-node-resolve";
import replace from "rollup-plugin-replace";
import babel from "@rollup/plugin-babel";
import { pascalCase } from "change-case";

rm.sync(resolvePackage("dist/**/*"));

const packageJson = require(resolvePackage("package.json"));
const packageName = packageJson.name;
const mainFilePath = "src/index.ts";
const pascalCasePackageName = pascalCase(packageName);
const input = resolvePackage(mainFilePath);
const output = "index";
const productionSuffix = "prod";
const formats = ["es", "iife", "cjs"];
if (process.env.DEVELOPMENT) formats.splice(2);

const configs = [];
formats.forEach((format) => {
  const config = {
    input,
    external: ["vue-demi"],
    plugins: [
      ts(),
      resolve(),
      babel({
        babelHelpers: "bundled",
        extensions: [".js", ".ts"],
      }),
    ],
    output: {
      globals: {
        "vue-demi": "VueDemi",
      },
      format,
      name: pascalCasePackageName,
      extend: true,
      exports: "auto",
    },
  };

  configs.push({
    ...config,
    plugins: [
      ...config.plugins,
      replace({
        "process.env.NODE_ENV": "'development'",
      }),
    ],
    output: {
      ...config.output,
      file: resolvePackage(`dist/${output}.${format}.js`),
    },
  });

  configs.push({
    ...config,
    plugins: [
      ...config.plugins,
      replace({
        "process.env.NODE_ENV": "'production'",
      }),
      terser(),
    ],
    output: {
      ...config.output,
      file: resolvePackage(`dist/${output}.${format}.${productionSuffix}.js`),
    },
  });
});

export default configs;

function resolvePackage(...paths) {
  return path.resolve(__dirname, process.cwd(), ...paths);
}
