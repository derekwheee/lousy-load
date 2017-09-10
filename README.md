# Lousy Load

[![Build Status](https://travis-ci.org/frxnz/lousy-load.svg?branch=master)](https://travis-ci.org/frxnz/lousy-load)

Lousy Load is a JavaScript lazy loading plugin for images. End of speech.

Install
-------

```bash
npm install --save lousy-load # npm
yarn add lousy-load           # yarn
```

Or [download the latest release](https://github.com/frxnz/lousy-load/releases)

Basic Examples
--------------

Vanilla JavaScript
```html
<img data-src="path/to/image.jpg">
        
<script src="lousy-load.min.js"></script>
<script>
    var ll = new lousyLoad(document.body);
</script>
```

jQuery
```html
<img data-src="path/to/image.jpg">
        
<script src="lousy-load.min.js"></script>
<script>
    $('body').lousyLoad();
</script>
```

Advanced Example
---------------

```html
<img 
    class="ll-image"
    data-src="path/to/image.jpg">

<img 
    data-nowrap
    class="ll-image"
    data-src="path/to/image2.jpg">
        
<script src="lousy-load.min.js"></script>
<script>
    var ll = new lousyLoad(document.body, {
        selector : '.ll-image',
        threshold : 100,
    });
</script>
```

Usage
-------

### Syntax
Vanilla JS
```js
new lousyLoad([container[, options]])
```

jQuery
```js
$(container).lousyLoad([options]);
```

### `container`

`container` is the DOM element that contains the images you want to lazy load.

### `options`

**`threshold`** *number* - Number of pixels above and below the viewport Lousy Load will check for images.

**`selector`** *string* - Selector Lousy Load will use to populate list of lazy loaded images.

**`wrapElement`** *boolean* - If true images will be wrapped in a `span` tag. Useful for loading transitions.