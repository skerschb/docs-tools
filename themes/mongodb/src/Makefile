TARGETS=../static/mongodb-docs.css ../static/controller.js
CSS_INPUTS=css/bootstrap-custom.css \
           css/icomoon.css \
           css/uriwriter.css \
           css/font-awesome.css \
           css/mongodb-docs.css \
           css/feedback.css \
           css/header.css \
           css/mws.css \
           css/tabs.css \
           css/lightbox.css \
           css/code-buttons.css \
           css/guides.css
CSS_FILES=$(CSS_INPUTS) css/basic.css

CSS_ERRORS=errors,empty-rules,duplicate-properties,selector-max-approaching
CSS_WARNINGS=regex-selectors,unqualified-attributes,text-indent
TARGETS=../static/mongodb-docs.css ../static/guides.css ../static/controller.js
POSTCSS=./node_modules/.bin/postcss

.PHONY: all lint-css clean

all: $(TARGETS)

../static/controller.js: js/*.js node_modules/.CURRENT
	./node_modules/.bin/rollup -m -c rollup.config.js -o $@

../static/mongodb-docs.css: css/manual/*.css css/*.css postcss.config.js node_modules/.CURRENT
	$(POSTCSS) css/manual/mongodb-docs.css -c postcss.config.js -o $@

../static/guides.css: css/guides/*.css css/*.css postcss.config.js node_modules/.CURRENT
	$(POSTCSS) css/guides/guides.css -c postcss.config.js -o $@

lint-css: node_modules/.CURRENT
	./node_modules/.bin/csslint --quiet --format=compact --errors=$(ERRORS) --warnings=$(CSS_WARNINGS) css/basic.css css/mongodb-docs.css

node_modules node_modules/.CURRENT: package.json package-lock.json
	npm install
	touch $@

clean:
	-rm $(TARGETS) ../static/controller.js.map
