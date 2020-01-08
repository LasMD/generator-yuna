module.exports = {
  "presets": [
    ["@babel/preset-env", {
      "targets": {
        "browsers": ["firefox >= 60"]
      },
      "modules": "false",
      "useBuiltIns": "usage",
    }]
  ],
  "plugins": [
    ["@babel/plugin-transform-runtime", {
      "helpers": true,
      "regenerator": true
    }],
    "@babel/plugin-transform-classes"
  ]
}