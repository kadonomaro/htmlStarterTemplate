const gulp =                require('gulp');
const rigger =              require('gulp-rigger');
const cleanCSS =            require('gulp-clean-css');
const clean =               require('gulp-clean');
const rename =              require('gulp-rename');
const sprite =              require('gulp.spritesmith');
const watch =               require('gulp-watch');
const browserSync =         require('browser-sync').create();
const babel =               require('gulp-babel');

const cache =               require('gulp-cache');
const imagemin =            require('gulp-imagemin');
const imageminPngquant =    require('imagemin-pngquant');
const imageminZopfli =      require('imagemin-zopfli');
const imageminMozjpeg =     require('imagemin-mozjpeg');
const reload =              browserSync.reload;





const path = {
    build: {    //paths to build files
        html: 'build/',
        style: 'build/style/',
        js: 'build/js/',
        img: 'build/image/',
        icons: 'build/icons/',
        fonts: 'build/fonts/'
    },
    source: {   //paths to source files
        html: 'source/*.html',
        style: 'source/style/**/*.*',
        css: 'source/style/**/*.css',
        js: 'source/js/**/*.*',
        img: 'source/image/**/*.{gif,png,jpg}',
        icons: 'source/icons/**/*.*',
        CSSsprites: 'source/style/',
        fonts: 'source/fonts/**/*.*'
    },
    watch: {    //paths to files for Live Reload
        html: 'source/**/*.html',
        style: 'source/style/**/*.scss',
        js: 'source/js/**/*.js',
        img: 'source/image/**/*.*',
        fonts: 'source/fonts/**/*.*'
    },
    clean: './build/'
};


function htmlTemplate () {
    return gulp.src(path.source.html)
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html))
        .pipe(reload({stream: true}));
}

function minifyCSS () {
    return gulp.src(path.source.css)
        .pipe(cleanCSS())
        // .pipe(rename({
        //     suffix: '.min'
        // }))
        .pipe(gulp.dest(path.build.style))
        .pipe(reload({stream: true}));
}

function js() {
    return gulp.src(path.source.js)
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(gulp.dest(path.build.js))
        .pipe(reload({ stream: true }));
}

function fonts() {
    return gulp.src(path.source.fonts)
        .pipe(gulp.dest(path.build.fonts));
}

function cleanDir () {
    return gulp.src(path.clean,{read:false})
        .pipe(clean());
}

function image() {
    return gulp.src([path.source.img])
        .pipe(cache(imagemin([
            //png
            imageminPngquant({
                speed: 1,
                quality: [0.8, 0.9] //lossy settings
            }),
            imageminZopfli({
                more: true,
                iterations: 30 // 50 very slow but more effective
            }),
            //svg
            imagemin.svgo({
                plugins: [{
                    removeViewBox: false
                }]
            }),
            //jpg lossless
            imagemin.jpegtran({
                progressive: true
            }),
            //jpg very light lossy, use vs jpegtran
            imageminMozjpeg({
                quality: 75
            })
        ])))
        .pipe(gulp.dest(path.build.img));
}

function clearCache() {
    cache.clearAll();
}

function createSprites() {
    var spriteData = gulp.src(path.source.icons)
        .pipe(sprite({
            imgName: 'sprite.png',
            cssName: '_sprite.scss',
            algorithm: 'binary-tree',
            imgPath: '../icons/sprite.png',
            cssVarMap: function (sprite) {
                sprite.name = 's-' + sprite.name;
            }
        }));
    var imgStream = spriteData.img.pipe(gulp.dest(path.build.icons));
    var cssStream = spriteData.css.pipe(gulp.dest(path.source.CSSsprites));
    return { imgStream, cssStream };
}


function fileWatch() {
    browserSync.init({
        server: {
            baseDir: 'build/'
        }
    });
    gulp.watch(path.watch.html, gulp.series(htmlTemplate));
    gulp.watch(path.watch.style, gulp.series(minifyCSS));
    gulp.watch(path.watch.js, gulp.series(js));
}



gulp.task('template', htmlTemplate); //generate html file with templates
gulp.task('css', minifyCSS); //minify css files and put to build directory
gulp.task('clean', cleanDir); //delete build directory

gulp.task('image', image); //optimization image files and put to build directory
gulp.task('font', fonts); //move fonts files to build directory
gulp.task('cache', clearCache); //clean image cache for repeat image optimization
gulp.task('sprite', createSprites); //create sprite file and .scss file from icons
gulp.task('watch', fileWatch); //tracking changes in .html, .scss and .js files

