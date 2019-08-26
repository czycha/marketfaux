import { Config } from 'bili'

const config: Config = {
  input: {
    marketfaux: 'src/marketfaux.ts'
  },
  output: {
    format: ['umd', 'umd-min', 'esm'],
    moduleName: 'Marketfaux',
    target: 'browser',
    fileName ({ format, minify }, defaultName) {
      if (format === 'umd') {
        return minify ? '[name].min.js' : '[name].js'
      }
      if (format === 'esm') {
        return '[name].es.js'
      }
      return defaultName
    }
  },
  banner: true,
  plugins: {
    cleanup: {
      comments: ['some', 'ts', 'sources'],
      extensions: ['js', 'ts']
    }
  }
}

export default config
