export const sharedConfig = {
  test: {
    globals: true,
    coverage: {
      provider: "istanbul" as const,
      reporter: [
        [
          "json",
          {
            file: `../coverage.json`,
          },
        ],
      ] as const,
      enabled: true,
    },
    reporters: [["junit", { outputFile: "./junit.xml" }], "default"],
  },
};

// Re-export specific configs for backwards compatibility
export { baseConfig } from "./configs/base-config.js";
