module.exports = config:
  paths:
    "watched": ["app", "vendor"]
    "public": "public"
  files:
    javascripts:
      joinTo:
        'js/app.js': /^app/
        'js/vendor.js': /^(?!app)/

      order:
        before: [
          'vendor/phaser.js',
          'vendor/easystar-0.2.1.min.js',
          'vendor/phaser_pathfinding.min.js',
          'vendor/core.js',
          'vendor/cipher-core.js',
          'vendor/hmac.js',
          'vendor/md5.js',
          'vendor/aes.js',
          'vendor/enc-base64.js',
          'vendor/enc-utf16.js',
        ]

    stylesheets:
      joinTo:
        'styles/app.css'

  plugins:

    uglify:
      mangle: false
