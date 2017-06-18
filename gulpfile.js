const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const pump = require('pump');

gulp.task('babel', () => {
  return gulp.src('./lousy-load.js')
    .pipe(babel())
    .pipe(gulp.dest('dist'));
});

gulp.task('compress', ['babel'], (cb) => {
    pump([
        gulp.src('./dist/lousy-load.js'),
        uglify(),
        rename({ suffix: '.min' }),
        gulp.dest('dist')
    ], cb);
});

gulp.task('watch', ['compress'], () => {
  gulp.watch('./lousy-load.js', ['babel']);
});

gulp.task('dev', ['watch']);
