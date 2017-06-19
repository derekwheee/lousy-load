'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * Lazy loading plugin for the future
 * Author: Derek Wheelden
 * Git: https://github.com/frxnz
 * License: MIT
 * Attribution: Plugin boilerplate from https://github.com/janrembold/vanilla-plugin-boilerplate
 */
(function (root, factory) {
    var pluginName = 'lousyLoad';

    if (typeof define === 'function' && define.amd) {
        define([], factory(pluginName));
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        module.exports = factory(pluginName);
    } else {
        root[pluginName] = factory(pluginName);
    }
})(window, function (pluginName) {
    'use strict';

    var defaults = {
        immediate: true,
        selector: 'img',
        threshold: 100,
        wrapElement: true
    };

    /**
     * Merge defaults with user options
     * @param {Object} defaults Default settings
     * @param {Object} options User options
     */
    var extend = function extend(defaults, options) {
        var extended = {};

        for (var prop in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
                extended[prop] = defaults[prop];
            }
        }

        for (var _prop in options) {
            if (Object.prototype.hasOwnProperty.call(options, _prop)) {
                extended[_prop] = options[_prop];
            }
        }

        return extended;
    };

    // NodeList `forEach` polyfill for IE support
    // via https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach
    if (window.NodeList && !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = function (callback, argument) {
            argument = argument || window;
            for (var i = 0; i < this.length; i++) {
                callback.call(argument, this[i], i, this);
            }
        };
    }

    /**
     * Plugin class
     * @param {Node} element The html element to initialize
     * @param {Object} options User options
     * @constructor
     */

    var Plugin = function () {
        function Plugin(element, options) {
            _classCallCheck(this, Plugin);

            this.element = element;
            this._defaults = defaults;
            this._name = pluginName;
            this.options = extend(defaults, options);

            if (this.options.immediate) {
                this.init();
            }
        }

        _createClass(Plugin, [{
            key: 'init',
            value: function init() {
                var $images = this.element.querySelectorAll(this.options.selector);

                $images.forEach(this.prepareImage.bind(this));

                return $images;
            }
        }, {
            key: 'prepareImage',
            value: function prepareImage($image) {
                var viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
                var dimensions = this.__getImageDimensions($image);
                var shouldWrap = $image.getAttribute('data-nowrap') === null && this.options.wrapElement;
                var $wrapper = void 0;

                if (shouldWrap) {
                    $wrapper = document.createElement('span');
                    $wrapper.classList.add('ll-image_wrapper');
                    $wrapper.style.width = dimensions.width + 'px';
                    $wrapper.style.height = dimensions.height + 'px';
                    $wrapper.style.display = 'inline-block';

                    $image.classList.add('ll-image');
                    $image.style.width = dimensions.width + 'px';
                    $image.style.height = dimensions.height + 'px';

                    this.__wrapElement($wrapper, $image);
                }

                $image.onload = function () {
                    $image.parentElement.classList.add('is-loaded');

                    if (shouldWrap) {
                        $wrapper.classList.add('is-loaded');
                    }
                }.bind(this);

                var isLoaded = this.tryLoadImage($image, document.body.scrollTop + viewportHeight - this.options.threshold);
                var scrollHandler = this.__debounce(function () {
                    var isLoaded = this.tryLoadImage($image, document.body.scrollTop + viewportHeight - this.options.threshold);

                    if (isLoaded) {
                        window.removeEventListener('scroll', scrollHandler);
                    }
                }.bind(this), 50);

                if (!isLoaded) {
                    window.addEventListener('scroll', scrollHandler);
                }
            }
        }, {
            key: 'tryLoadImage',
            value: function tryLoadImage($image, scrollTop) {
                var type = void 0;

                if ($image.offsetTop > scrollTop) return false;

                if ($image.nodeName !== 'IMG') {
                    type = 'background';
                } else if ($image.getAttribute('data-srcset')) {
                    type = 'srcset';
                } else {
                    type = 'src';
                }

                this.__loadImageByType($image, type);
                return true;
            }
        }, {
            key: '__debounce',
            value: function __debounce(func, wait, immediate) {
                // https://davidwalsh.name/javascript-debounce-function
                var timeout = void 0;
                return function () {
                    var context = this;
                    var args = arguments;
                    var later = function later() {
                        timeout = null;
                        if (!immediate) func.apply(context, args);
                    };
                    var callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) func.apply(context, args);
                };
            }
        }, {
            key: '__wrapElement',
            value: function __wrapElement(wrapper, elms) {
                // https://stackoverflow.com/questions/3337587/wrapping-a-set-of-dom-elements-using-javascript/13169465#13169465
                // Convert `elms` to an array, if necessary.
                if (!elms.length) elms = [elms];

                // Loops backwards to prevent having to clone the wrapper on the
                // first element (see `child` below).
                for (var i = elms.length - 1; i >= 0; i--) {
                    var child = i > 0 ? wrapper.cloneNode(true) : wrapper;
                    var el = elms[i];

                    // Cache the current parent and sibling.
                    var parent = el.parentNode;
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
        }, {
            key: '__getImageDimensions',
            value: function __getImageDimensions($image) {
                var styles = window.getComputedStyle($image);
                var maxWidth = styles.getPropertyValue('max-width');
                var width = $image.getAttribute('width');
                var height = $image.getAttribute('height');
                var aspectRatio = width / height;

                if (maxWidth) {
                    if (maxWidth.indexOf('%') > -1) {
                        var fraction = Number(maxWidth.replace('%', '')) / 100;
                        var parentStyles = window.getComputedStyle($image.parentElement);
                        var parentWidth = parentStyles.getPropertyValue('width');

                        maxWidth = Number(parentWidth.replace('px', '')) * fraction;
                    } else if (maxWidth.indexOf('px') > -1) {
                        maxWidth = maxWidth.replace('px', '');
                    }

                    if (Number(width) > Number(maxWidth)) {
                        width = maxWidth;
                        height = maxWidth / aspectRatio;
                    }
                }

                return {
                    width: width,
                    height: height,
                    maxWidth: maxWidth,
                    aspectRatio: aspectRatio
                };
            }
        }, {
            key: '__loadImageByType',
            value: function __loadImageByType($image, type) {
                switch (type) {
                    case 'srcset':
                        $image.srcset = $image.getAttribute('data-srcset');
                        $image.src = $image.getAttribute('data-src');
                        break;
                    case 'background':
                        $image.style.removeProperty('background');
                        break;
                    default:
                        $image.src = $image.getAttribute('data-src');
                        break;
                }
            }
        }]);

        return Plugin;
    }();

    if (window.jQuery) {
        var $ = window.jQuery;

        $.fn[pluginName] = function (options) {
            options = options || {};

            return this.each(function () {
                // add plugin to element data
                if (!$.data(this, 'plugin_' + pluginName)) {
                    options.element = this;
                    $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
                }
            });
        };
    }

    return Plugin;
});