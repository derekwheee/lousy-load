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
        selector : 'img',
        threshold : 0,
        wrapElement : true,
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

    class LousyImage {
        constructor(element) {
            this.__data = {};
            this.__element = element;
        }

        get el() {
            return this.__element;
        }

        data(key, value) {
            if (!key) {
                return this.__data;
            }

            if (!value) {
                return this.__data[key];
            }

            this.__data[key] = value;
        }
    }

    /**
     * Plugin class
     * @param {Node} element The html element to initialize
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

        init(opts = {}) {
            this.$images = this.element.querySelectorAll(this.options.selector);

            this.$images.forEach(this.prepareImage.bind(this));

            if (!opts.isReinit) {
                window.onresize = this.__debounce(this.__resizeHandler.bind(this), 50);
            }

            return this.$images;
        }

        prepareImage(element) {
            const image = new LousyImage(element);
            const $image = image.el;

            const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            const dimensions = this.__getImageDimensions($image);
            const shouldWrap = $image.getAttribute('data-nowrap') === null && this.options.wrapElement;
            let $wrapper;

            image.data('shouldWrap', shouldWrap);

            if (shouldWrap) {
                $wrapper = document.createElement('span');
                $wrapper.classList.add('ll-image_wrapper');
                $wrapper.style.width = `${dimensions.width}px`;
                $wrapper.style.height = `${dimensions.height}px`;
                $wrapper.style.display = 'inline-block';

                $image.classList.add('ll-image');
                $image.style.width = `${dimensions.width}px`;
                $image.style.height = `${dimensions.height}px`;

                this.__wrapElement($wrapper, $image);
                image.data('wrapper', $wrapper);
            }

            const isLoaded = this.tryLoadImage(image);
            const scrollHandler = this.__debounce(function() {
                const isLoaded = this.tryLoadImage(image);

                if (isLoaded) {
                    window.removeEventListener('scroll', scrollHandler);
                }
            }.bind(this), 50);

            if (!isLoaded) {
                window.addEventListener('scroll', scrollHandler);
            }

            return image;
        }

        tryLoadImage(image, _top) {
            const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            const $image = image.el;
            let type;

            if ((_top || $image.getBoundingClientRect().top) > viewportHeight + this.options.threshold) return false;

            if ($image.nodeName !== 'IMG') {
                type = 'background';
            } else if ($image.getAttribute('data-srcset')) {
                type = 'srcset';
            } else {
                type = 'src';
            }

            image.data('type', type);

            this.__loadImageByType(image, type);

            return true;
        }

        __debounce(func, wait, immediate) {
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
        }

        __wrapElement(wrapper, elms) {
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

        __unwrapElement(element) {
            const wrapper = element.parentNode;
            const parent = wrapper.parentNode;

            while (wrapper.firstChild) {
                parent.insertBefore(wrapper.firstChild, wrapper);
            }

            parent.removeChild(wrapper);
        }

        __getImageDimensions($image) {
            const styles = window.getComputedStyle($image);
            // Width and height need to be computed differently for images and background images
            let width = $image.nodeName === 'IMG' ? Number($image.getAttribute('width')) : $image.offsetWidth;
            let height = $image.nodeName === 'IMG' ? Number($image.getAttribute('height')) : $image.offsetHeight;
            let maxWidth = styles.getPropertyValue('max-width') === 'none' ? null : styles.getPropertyValue('max-width');
            const aspectRatio = width / height;

            if (maxWidth) {
                if (maxWidth.indexOf('%') > -1) {
                    const fraction = Number(maxWidth.replace('%', '')) / 100;
                    const parentStyles = window.getComputedStyle($image.parentElement);
                    const parentWidth = parentStyles.getPropertyValue('width');

                    maxWidth = Number(parentWidth.replace('px', '')) * fraction;
                }
                else if (maxWidth.indexOf('px') > -1) {
                    maxWidth = Number(maxWidth.replace('px', ''));
                }

                if (Number(width) > Number(maxWidth)) {
                    width = maxWidth;
                    height = maxWidth / aspectRatio;
                }
            } else {
                maxWidth = width;
            }

            return {
                width : width,
                height : height,
                maxWidth : maxWidth,
                aspectRatio : aspectRatio,
            };
        }

        __attachLoadEvent(image, $wrapper, shouldWrap) {
            const $image = image.el;

            $wrapper = $wrapper || image.data('wrapper');
            shouldWrap = shouldWrap || image.data('shouldWrap');

            if ($image.nodeName === 'IMG') {
                $image.onload = loadHandler.bind(this);
                return;
            }

            const styles = window.getComputedStyle($image);
            const src = styles.getPropertyValue('background-image').replace(/(?:^url\(["']?)|(?:["']?\))$/g, '');
            const img = new Image();
            img.onload = loadHandler.bind(this);
            img.src = src;

            if (img.complete) loadHandler();

            function loadHandler() {
                $image.classList.add('is-loaded');

                if (shouldWrap) {
                    $wrapper.classList.add('is-loaded');
                }
            }
        }

        __loadImageByType(image, type) {
            const $image = image.el;

            switch(type) {
                case 'srcset':
                    $image.srcset = $image.getAttribute('data-srcset');
                    $image.src = $image.getAttribute('data-src');
                    break;
                case 'background':
                    if (this.options.backgroundClass) {
                        $image.classList.remove(this.options.backgroundClass.replace(/^\./, ''));
                    } else {
                        $image.style.removeProperty('background');
                    }
                    break;
                default:
                    $image.src = $image.getAttribute('data-src');
                    break;
            }

            this.__attachLoadEvent(image);
        }

        __resizeHandler() {
            this.$images.forEach(image => {
                if (image.getAttribute('data-nowrap') === null && this.options.wrapElement) {
                    this.__unwrapElement(image);
                }
            });

            this.init({ isReinit : true });
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
