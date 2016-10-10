require("ts-node/register");
const gulp = require('gulp');
const configure = require("essex.powerbi.base/build_scripts").default;
configure(gulp, __dirname);
