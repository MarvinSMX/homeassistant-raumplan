import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';

const dev = process.env.ROLLUP_WATCH;

const plugins = [
  nodeResolve({}),
  commonjs(),
  typescript(),
  json(),
  !dev && terser(),
].filter(Boolean);

export default [
  {
    input: 'src/room-plan-card.ts',
    output: {
      file: 'dist/homeassistant-raumplan.js',
      format: 'es',
    },
    plugins: [...plugins],
  },
];
