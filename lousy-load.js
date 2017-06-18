/*!
 * Lazy loading plugin for the future
 * Author: Derek Wheelden
 * Git: https://github.com/frxnz
 * License: MIT
 * Attribution: Plugin boilerplate from https://github.com/janrembold/vanilla-plugin-boilerplate
 */
(function (root, factory) {
    const pluginName = 'lousyLoad';

    if (typeof define === 'function' && define.amd) {
        define([], factory(pluginName));
    } else if (typeof exports === 'object') {
        module.exports = factory(pluginName);
    } else {
        root[pluginName] = factory(pluginName);
    }
}(window, function (pluginName) {
    'use strict';

    const defaults = {
        immediate : true,
    };

    /**
     * Merge defaults with user options
     * @param {Object} defaults Default settings
     * @param {Object} options User options
     */
    const extend = function (defaults, options) {
        const extended = {};

        for (let prop in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
                extended[prop] = defaults[prop];
            }
        }

        for (let prop in options) {
            if (Object.prototype.hasOwnProperty.call(options, prop)) {
                extended[prop] = options[prop];
            }
        }

        return extended;
    };

    /**
     * Plugin Object
     * @param element The html element to initialize
     * @param {Object} options User options
     * @constructor
     */
    class Plugin {
        constructor(element, options) {
            this.element = element;
			this._defaults = defaults;
			this._name = pluginName;
            this.options = extend(defaults, options);

            if (this.options.immediate) {
                this.init();
            }
        }

        utils = {
            debounce : function(func, wait, immediate) {
                // https://davidwalsh.name/javascript-debounce-function
                let timeout;
                return function() {
                    const context = this;
                    const args = arguments;
                    const later = function() {
                        timeout = null;
                        if (!immediate) func.apply(context, args);
                    };
                    const callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) func.apply(context, args);
                };
            },
            wrapElement : function(wrapper, elms) {
                // https://stackoverflow.com/questions/3337587/wrapping-a-set-of-dom-elements-using-javascript/13169465#13169465
                // Convert `elms` to an array, if necessary.
                if (!elms.length) elms = [elms];

                // Loops backwards to prevent having to clone the wrapper on the
                // first element (see `child` below).
                for (var i = elms.length - 1; i >= 0; i--) {
                    var child = (i > 0) ? wrapper.cloneNode(true) : wrapper;
                    var el    = elms[i];

                    // Cache the current parent and sibling.
                    var parent  = el.parentNode;
                    var sibling = el.nextSibling;

                    // Wrap the element (is automatically removed from its current
                    // parent).
                    child.appendChild(el);

                    // If the element had a sibling, insert the wrapper before
                    // the sibling to maintain the HTML structure; otherwise, just
                    // append it to the parent.
                    if (sibling) {
                        parent.insertBefore(child, sibling);
                    } else {
                        parent.appendChild(child);
                    }
                }
            }
        };

        init() {
            const $images = this.element.querySelectorAll('img');

            $images.forEach(this.prepareImage.bind(this));

            return $images;
        }

        prepareImage($image) {
            const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            const dimensions = getImageDimensions($image);
            const $wrapper = document.createElement('span');
            $wrapper.classList.add('ll-image_wrapper');
            $wrapper.style.width = `${dimensions.width}px`;
            $wrapper.style.height = `${dimensions.height}px`;
            $wrapper.style.display = 'inline-block';

            $image.classList.add('ll-image');
            $image.style.width = `${dimensions.width}px`;
            $image.style.height = `${dimensions.height}px`;

            this.utils.wrapElement($wrapper, $image);

            $image.onload = function() {
                $image.parentElement.classList.add('is-loaded');
            };

            if ($image.offsetTop < document.documentElement.scrollTop + viewportHeight - 100) {
                $image.src = $image.getAttribute('data-src');
            }

            // if ($image.offset().top < $(window).scrollTop() + $(window).height() - 100) {
            //     this.loadImage($image);
            // } else {
            //     $(window).on('scroll', this.utils.debounce(function() {
            //         if ($image.offset().top < $(window).scrollTop() + $(window).height() - 100) {
            //             this.loadImage($image);
            //         }
            //     }.bind(this), 50))
            // }

            function getImageDimensions($image) {
                const styles = window.getComputedStyle($image);
                let maxWidth = styles.getPropertyValue('max-width');
                let width = $image.getAttribute('width');
                let height = $image.getAttribute('height');
                const aspectRatio = width / height;

                if (maxWidth) {
                    if (maxWidth.indexOf('%') > -1) {
                        maxWidth = $image.parentElement.offsetWidth;
                    }
                    else if (maxWidth.indexOf('px') > -1) {
                        maxWidth = maxWidth.replace('px', '');
                    }

                    if (Number(width) > Number(maxWidth)) {
                        width = maxWidth;
                        height = maxWidth / aspectRatio;
                    }
                }

                return {
                    width : width,
                    height : height,
                    maxWidth : maxWidth,
                    aspectRatio : aspectRatio,
                };
            }
        }
    }

    if (window.jQuery) {
        const $ = window.jQuery;

        $.fn[pluginName] = function (options) {
            options = options || {};

            return this.each(function() {
                // add plugin to element data
                if (!$.data(this, `plugin_${pluginName}`) ) {
                    options.element = this;
                    $.data(this, `plugin_${pluginName}`, new Plugin(this, options));
                }
            });
        };
    }

    return Plugin;
}));