const path = require('path');
const resolve = dir => path.resolve(__dirname, dir);
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: resolve('src/index.tsx'),
  output: {
    path: resolve('dist'),
    filename: 'app.js',
    publicPath: "/"
  },
  resolve: {
    // extensions 能够使用户在引入模块时不带扩展
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': resolve('src')
    }
  },
  module: {
    rules: [
      // webpack 5 新增 Asset Modules 资源模块，允许使用资源文件无须配置额外 loader
      // {
      //   test: /\.(png|jpg|jpeg|gif)$/i,
      //   use: [
      //     {
      //       loader: 'url-loader',
      //       options: {
      //         limit: 8192,
      //       },
      //     },
      //   ],
      // },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8192
          }
        }
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: ['ts-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.less$/,
        // 使 node_modules 第三方包中没有使用 css modules 的包也正常运行
        exclude: [/node_modules/],
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                mode: 'local',
                localIdentName: '[local]___[hash:base64:5]'
              },
            }
          },
          'less-loader'
        ]
      },
      {
        test: /\.(js|mjs|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        },
      },

    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: resolve('public/index.html'),
      favicon: resolve('public/favicon.ico')
    }),
  ],
  devServer: {
    static: path.join('public'),
  }
}
