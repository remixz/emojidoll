build:
dev:
	lessc --clean-css css/stylesheet.less > css/stylesheet.css
	browserify js/index.js | uglifyjs > js/bundle.js

.PHONY: build dev