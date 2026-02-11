import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import serve from 'rollup-plugin-serve';
import json from '@rollup/plugin-json';

export default {
  input: 'src/room-plan-card.ts',
  output: {
    file: 'dist/homeassistant-raumplan.js',
    format: 'es',
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript(),
    json(),
    serve({
      contentBase: './dist',
      host: '0.0.0.0',
      port: 5000,
      allowCrossOrigin: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    }),
  ],
};
