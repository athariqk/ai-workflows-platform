import { defineProject, mergeConfig } from 'vitest/config'
import { sharedConfig } from '@repo/vitest-config';

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      projects: [
        {
          test: {
            name: 'unit',
            include: ['**/*.unit.test.ts'],
          }
        },
        {
          test: {
            name: 'integration',
            include: ['**/*.int.test.ts'],
          }
        }
      ]
    }
  })
)