// module.exports = {
//   publicPath: "/",
//   devServer: {
//     headers: {
//       "Access-Control-Allow-Origin": "*",
//     },
//     proxy: {
//       "^/api": {
//         // target: "https://zalooaub.chuyendoisoquocgia.net/",
//         target: "https://localhost:5001/",
//         ws: true,
//         changeOrigin: true,
//       },
//     },
//   },
// };

// vue.config.js
// vue.config.js
module.exports = {
  publicPath: '/zalo-fe/',
  devServer: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true
      }
    }
  }
};
