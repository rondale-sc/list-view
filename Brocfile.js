var concat = require('broccoli-concat');
var env = process.env.EMBER_ENV;
var es6 = require('broccoli-es6-module-transpiler');
var jshint = require('broccoli-jshint');
var merge = require('broccoli-merge-trees');
var moveFile = require('broccoli-file-mover');
var wrap = require('broccoli-wrap');
var pickFiles = require('broccoli-static-compiler');

function testTree(libTree, packageName){
  var test = pickFiles('packages/' + packageName + '/tests', {
    srcDir: '/',
    files: [ '**/*.js' ],
    destDir: '/'
  });
  var jshinted = jshint(libTree);
  jshinted = wrap(jshinted, {
    wrapper: [ "if (!QUnit.urlParams.nojshint) {\n", "\n}"]
  });
  return merge([jshinted, test]);
}

var testRunner = pickFiles('tests', {
  srcDir: '/',
  inputFiles: [ '**/*' ],
  destDir: '/'
});

var bower = pickFiles('bower_components', {
  srcDir: '/',
  inputFiles: [ '**/*' ],
  destDir: '/bower_components'
});

var listViewFiles = pickFiles('packages/list-view/lib', {
  srcDir: '/',
  files: [ '**/*.js' ],
  destDir: '/list-view'
});

listViewFiles = es6(listViewFiles, {moduleName: true});

if (env === 'production'){ listViewFiles = es3SafeRecast(listViewFiles); }

var testFiles = testTree(listViewFiles, 'list-view');

var loaderJS = pickFiles('bower_components/loader.js', {
  srcDir: '/',
  files: [ 'loader.js' ],
  destDir: '/'
});

var globalBuild = concat(merge([listViewFiles, loaderJS]), {
  inputFiles: ['loader.js', '**/*.js'],
  separator: '\n',
  outputFile: '/list-view.js'
});

globalBuild = wrap(globalBuild, {
  wrapper: [ "(function(global){\n",  "\n requireModule('list-view/main');\n})(this);"]
});


testFiles = concat(testFiles, {
  inputFiles: ['test_helper.js', '**/*.js'],
  separator: '\n',
  // wrapInEval: true,
  // wrapInFunction: true,
  outputFile: '/tests.js'
});

var distTree = merge([globalBuild, testFiles, testRunner, bower]);

module.exports = distTree;
