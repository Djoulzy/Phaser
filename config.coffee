module.exports = {
	config: {
		paths: {
			"watched": ["app", "crypt"],
			"public": "public",
		},
		plugins: {
			babel: {
				ignore: /^(node_modules|vendor)/
			}
		},
		files: {
			javascripts: {
				joinTo: {
				'js/app.js': /^app/,
				'js/crypt.js': /^crypt/,
				'js/vendor.js': /(^node_modules|vendor)\//
				},
			},
			stylesheets: {
				joinTo: 'styles/app.css'
			}
		},
		npm: {
			static: [
				'node_modules/crypto-js',
				'node_modules/phaser-ce/build/phaser.js',
			]
		},
		plugins: {
			babel: {
				ignore: /^(node_modules|vendor)/
			}
		}
	}
};
