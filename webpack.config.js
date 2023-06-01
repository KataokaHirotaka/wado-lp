const webpack = require("webpack");
const path = require("path");
const globule = require("globule");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const RemoveEmptyScriptsPlugin = require("webpack-remove-empty-scripts");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const dir = {
  src: "./src",
  htdocs: "./htdocs",
};
const convertExtensions = {
  pug: "html",
  js: "js",
  scss: "css",
};

/**
 * コンパイル対象を自動で追加する.
 * @param {Object} convertExtensions - key: コンパイル対象の拡張子, val: コンパイル後の拡張子.
 */
function getEntries(convertExtensions) {
  const entries = {};
  for (const [key, val] of Object.entries(convertExtensions)) {
    const entry = (entries[key] = {});

    // コンパイル対象のファイルを抽出.
    const targetFileNames = globule.find({
      src: [`**/*.${key}`, `!**/_*.${key}`, `**/_template.${key}`], // 先頭に _ がつくファイルは対象外.
      srcBase: dir.src,
    });

    targetFileNames.forEach((fileName) => {
      let output = fileName.replace(new RegExp(key, "g"), `${val}`); // フォルダ名と拡張子を置換.

      if (val.match("html")) {
        output = output.replace(`${val}/`, "");
        entry[output] = `${dir.src}/${fileName}`;
        return;
      }

      entry[`assets/${output}`] = `${dir.src}/${fileName}`;
    });
  }

  return entries;
}
const entries = getEntries(convertExtensions);
const data = {};
const HtmlWebpackPlugins = [];
const ProvidePluginOption = {
  $: "jquery",
};

/**
 * JSON を data にまとめる.
 */
const jsonFilesNames = globule.find({ src: ["**/*.json"], srcBase: dir.src });
jsonFilesNames.forEach((fileName) => {
  const key = fileName.replace(/data\/|\.json/g, "");
  data[key] = require(`${dir.src}/${fileName}`);
});

/**
 * ページの数だけ HtmlWebpackPlugin を自動で追加.
 */
for (const [output, src] of Object.entries(entries.pug)) {
  const option = {
    inject: false, // - inject: false - script タグを動的に挿入しなくなる.
    data: data, // JSON
    filename: output,
    template: src,
    minify: {
      collapseWhitespace: true,
      preserveLineBreaks: true,
    },
  };

  /**
   * _template.pug と _data.json を ./src/pug 配下の同ディレクトリに
   * 格納することでページを量産する.
   */
  const templateFileName = "_template";
  const jsonName = "_data";

  if (src.match(/^(?=.*_template)(?=.*pug)/)) {
    const replaceJson = src
      .replace(templateFileName, jsonName)
      .replace(".pug", ".json");

    const json = require(replaceJson);

    Object.keys(json).forEach((fileName) => {
      const outputFileName = output
        .replace(templateFileName, fileName) // hoge.html で量産する場合はここまで.
        .replace(".html", "/index.html"); // ディレクトリで量産する場合.
      const templateOption = { ...option };

      templateOption.filename = outputFileName; // option.filename over write.
      templateOption.templateData = json[fileName];
      HtmlWebpackPlugins.push(new HtmlWebpackPlugin(templateOption));
    });
  } else {
    HtmlWebpackPlugins.push(new HtmlWebpackPlugin(option));
  }
}

const rules = {
  js: {
    test: /\.js$/,
    // swiper 関連の js は除外しないとIEで動かない.
    exclude: /node_modules\/(?!(dom7|ssr-window|swiper)\/).*/,
    use: [
      {
        loader: "babel-loader",
        options: {
          presets: [["@babel/preset-env", { modules: false }]],
        },
      },
    ],
  },
  scss: {
    test: /\.(c|sa|sc)ss$/,
    use: [
      MiniCssExtractPlugin.loader,
      {
        loader: "css-loader",
        options: {
          url: false,
          importLoaders: 2,
        },
      },
      { loader: "postcss-loader" },
      {
        loader: "sass-loader",
        options: {
          implementation: require("sass"),
          sassOptions: {
            fiber: require("fibers"),
          },
        },
      },
    ],
  },
  pug: {
    test: /\.pug$/,
    use: [
      {
        loader: "pug-loader",
        options: {
          pretty: true,
          root: path.resolve(__dirname, `${dir.src}/pug`),
        },
      },
    ],
  },
  glsl: {
    test: /\.(glsl|fs|vs)$/,
    use: ["glslify-import-loader", "raw-loader", "glslify-loader"],
  },
};

const cache = {
  type: "filesystem",
  buildDependencies: { config: [__filename] },
};

module.exports = () => {
  return [
    {
      cache,
      entry: entries.js,
      output: {
        filename: "[name]",
        path: path.join(__dirname, dir.htdocs),
      },
      target: ["web", "es5"],
      devServer: {
        static: {
          directory: path.join(__dirname, dir.htdocs),
        },
        watchFiles: [`${dir.src}/**/*`],
      },
      module: {
        rules: [rules.js, rules.scss, rules.pug, rules.glsl],
      },
      optimization: {
        splitChunks: {
          // 共通モジュールを出力.
          cacheGroups: {
            vendor: {
              test: /node_modules/, // node_modules のみバンドル対象とする.
              name: `./assets/js/vendor.js`,
              chunks: "all",
              enforce: true,
            },
          },
        },
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              compress: { drop_console: true }, // ビルド時に console.log を削除.
            },
          }),
        ],
      },
      plugins: [
        new webpack.ProvidePlugin(ProvidePluginOption),
        ...HtmlWebpackPlugins,
      ],
    },
    {
      cache,
      entry: entries.scss,
      output: { path: path.join(__dirname, dir.htdocs) },
      module: { rules: [rules.scss] },
      plugins: [
        new MiniCssExtractPlugin({ filename: "[name]" }),
        new RemoveEmptyScriptsPlugin(), // 同名の .js ファイルを出力させない.
      ],
    },
  ];
};
