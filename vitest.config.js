import { defineConfig, mergeConfig } from 'vitest/config'
import { sharedConfig } from "@repo/vitest-config";

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      projects: ['packages/*'],
    }
  }),
  true
)