/*
 * grunt-html2js
 * https://github.com/karlgoldstein/grunt-html2js
 *
 * Copyright (c) 2013 Karl Goldstein
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function ( grunt ) {

    var path = require( 'path' );
    var minify = require( 'html-minifier' ).minify;

    var escapeContent = function ( content, quoteChar, indentString ) {
        var bsRegexp = new RegExp( '\\\\', 'g' );
        var quoteRegexp = new RegExp( '\\' + quoteChar, 'g' );
        //    var nlReplace = '\\n' + quoteChar + ' +\n' + indentString + indentString + quoteChar;
        var nlReplace = '';
        var tabReplace = '';
        return content.replace( bsRegexp, '\\\\' ).replace( quoteRegexp, '\\' + quoteChar ).replace( /\r?\n/g, nlReplace ).replace( /\t/g, tabReplace );
    };

    var normalizePath = function ( p ) {
        if ( path.sep !== '/' ) {
            p = p.replace( /\\/g, '/' );
        }
        return p;
    };

    var existsFilter = function ( filepath ) {
        if ( !grunt.file.exists( filepath ) ) {
            grunt.log.warn( 'Source file "' + filepath + '" not found.' );
            return false;
        } else {
            return true;
        }
    };

    var getContent = function ( filepath, quoteChar, indentString, htmlmin, process ) {
        var content = grunt.file.read( filepath );

        // Process files as templates if requested.
        if ( typeof process === 'function' ) {
            content = process( content, filepath );
        } else if ( process ) {
            if ( process === true ) {
                process = {};
            }
            content = grunt.template.process( content, process );
        }

        if ( Object.keys( htmlmin ).length ) {
            try {
                content = minify( content, htmlmin );
            } catch ( err ) {
                grunt.warn( filepath + '\n' + err );
            }
        }

        return escapeContent( content, quoteChar, indentString );
    };

    var convertTemplate = function ( filepath, name, quoteChar, indentString, useStrict, htmlmin, process ) {
        var content = getContent( filepath, quoteChar, indentString, htmlmin, process );
        var strict = ( useStrict ) ? quoteChar + 'use strict' + quoteChar + ';\n' : '';
        var text = strict + 'triptop.callback(' + quoteChar + name + quoteChar + ',' + quoteChar + content + quoteChar + ');';
        return text;
    };

    grunt.registerMultiTask( 'html2js', 'Convert templates to JavaScript.', function () {

        var options = this.options( {
            base: 'src',
            quoteChar: '\'',
            fileHeaderString: '',
            fileFooterString: '',
            indentString: '  ',
            target: 'js',
            htmlmin: {},
            process: false
        } );

        var counter = 0;

        this.files.forEach( function ( f ) {
            f.src.filter( existsFilter ).map( function ( filepath ) {
                //        var name = /templates\/(.*)\.html/.exec(filepath);
                var name = /(.*)\.html/.exec( filepath );
                if ( name !== null && name.length > 0 ) {
                    var convert = convertTemplate( filepath, name[ 1 ], options.quoteChar, options.indentString, options.useStrict, options.htmlmin, options.process );
                    grunt.file.write( filepath + '.js', grunt.util.normalizelf( options.fileHeaderString + convert + options.fileFooterString ) );
                }
            } );
        } );
        grunt.log.writeln( 'Successfully converted.' );
    } );
};