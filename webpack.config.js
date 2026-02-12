import path from 'path';
import { fileURLToPath } from 'url';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import packageInfo from './package.json' with { type: 'json' };

const { DefinePlugin } = webpack;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env) => {
  const isProduction = env?.production ?? true;

  return {
    mode: isProduction ? 'production' : 'development',
    entry: './src/index.ts',
    devtool: isProduction ? undefined : 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        react: 'preact/compat',
        'react-dom': 'preact/compat',
        'react/jsx-runtime': 'preact/jsx-runtime',
      },
    },
    plugins: [
      new DefinePlugin({
        NAME: JSON.stringify(packageInfo.name),
        DESCRIPTION: JSON.stringify(packageInfo.description),
        VERSION: JSON.stringify(packageInfo.version),
      }),
    ],
    output: {
      filename: 'homeassistant-raumplan.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      libraryTarget: 'module',
    },
    experiments: {
      outputModule: true,
    },
    optimization: {
      minimize: isProduction,
      minimizer: isProduction
        ? [
            new TerserPlugin({
              extractComments: false,
            }),
          ]
        : [],
    },
    performance: {
      hints: false,
    },
    devServer: isProduction
      ? undefined
      : {
          static: { directory: path.join(__dirname, 'dist') },
          compress: true,
          port: 5000,
        },
  };
};
