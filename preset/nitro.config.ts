import { fileURLToPath } from 'node:url';

export default {
  extends: 'node-server',
  entry: "./preset/entry.ts",
  hooks: {
    compiled() {
      console.info('Using Custom Preset!');
    },
  },
};