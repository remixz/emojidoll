build:
dev:
	lessc stylesheet.less > stylesheet.css
	browserify index.js > bundle.js

.PHONY: build dev