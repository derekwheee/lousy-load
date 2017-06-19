const fs = require('fs');
const test = require('ava');
const sinon = require('sinon');
const jQuery = require('jquery');

window.jQuery = jQuery;

const lousyLoad = require('../dist/lousy-load');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const css = fs.readFileSync('./resources/style.css', 'utf8');

test.beforeEach(t => {

    const head = document.head;

    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    head.appendChild(style);

    // Create container element to call lousyLoad on
    const div = document.createElement('div');
    div.style.width = '1600px';
    div.classList.add('ll-demo');
	document.body.appendChild(div);

    // Add single image to container div for basic testing
    const image = document.createElement('img');
    image.setAttribute('data-src', '../resources/1600x1200.jpg');
    image.setAttribute('height', '1200');
    image.setAttribute('width', '1600');
    image.classList.add('ll-image');
    image.classList.add('ll-src');
    div.appendChild(image);

    const srcset = document.createElement('img');
    srcset.setAttribute('data-srcset', '../resources/800x600.jpg 800w, ../resources/1600x1200.jpg 1600w, ../resources/3200x2400.jpg 3200w');
    srcset.setAttribute('data-src', '../resources/800x600.jpg');
    srcset.setAttribute('height', '1200');
    srcset.setAttribute('width', '1600');
    srcset.classList.add('ll-image');
    srcset.classList.add('ll-srcset');
    div.appendChild(srcset);

    const background = document.createElement('div');
    background.id = 'SVTOFOXL';
    background.style.background = 'none';
    background.setAttribute('data-nowrap', '');
    background.classList.add('ll-image');
    background.classList.add('responsive-background-image');
    div.appendChild(background);

    t.context.container = div;
});

test('validate setup', t => {

    const images = t.context.container.querySelectorAll('.ll-image');

    t.is(images.length, 3);

});

test('debounce', t => {
    const ll = new lousyLoad(t.context.container);
    const spy = sinon.spy();
    const debouncer = ll.__debounce(spy, 100, true);

    debouncer();
    debouncer();
    debouncer();

	t.true(spy.calledOnce)
});

test('wrap element', t => {
    const ll = new lousyLoad(t.context.container);
    const image = t.context.container.querySelector('img');
    const wrapper = document.createElement('div');

    wrapper.classList.add('wrapper');
    ll.__wrapElement(wrapper, image);

    t.true(image.parentElement.classList.contains('wrapper'));
});

test('init', t => {
    const ll = new lousyLoad(t.context.container, { immediate : false, selector : '.ll-image' });
    const init = ll.init();

    t.true(NodeList.prototype.isPrototypeOf(init));
    t.is(init.length, 3);
});

test('image dimensions', t => {
    const ll = new lousyLoad(t.context.container);
    const image = t.context.container.querySelector('img');
    const dimensions = ll.__getImageDimensions(image);

    t.is(dimensions.width, '1600');
    t.is(dimensions.height, '1200');
    t.is(dimensions.maxWidth, 1600);
    t.is(dimensions.aspectRatio, 4 / 3);

});

test('image wrapper', t => {
    const ll = new lousyLoad(t.context.container);
    const image = t.context.container.querySelector('img');

    t.truthy(image.parentElement.classList.contains('ll-image_wrapper'));
    t.is(image.parentElement.style.width, '1600px');
    t.is(image.parentElement.style.height, '1200px');
});

test('no image wrapper', t => {
    const ll = new lousyLoad(t.context.container, { wrapElement : false });
    const image = t.context.container.querySelector('img');

    t.is(image.parentElement, t.context.container);
});

test('nowrap data attribute', t => {
    const ll = new lousyLoad(t.context.container, { selector : '.ll-image' });
    const image = t.context.container.querySelector('.responsive-background-image');

    t.is(image.parentElement, t.context.container);
});

test('image max-width px', t => {
    const image = t.context.container.querySelector('img');

    image.style.maxWidth = '800px';

    const ll = new lousyLoad(t.context.container);

    t.is(image.parentElement.style.width, '800px');
    t.is(image.parentElement.style.height, '600px');
});

test('image max-width %', t => {
    const image = t.context.container.querySelector('img');
    image.style.maxWidth = '50%';

    const ll = new lousyLoad(t.context.container);

    t.is(image.parentElement.style.width, '800px');
    t.is(image.parentElement.style.height, '600px');
});

test('image src', async t => {
    const ll = new lousyLoad(t.context.container);
    const image = t.context.container.querySelector('img');

    t.is(image.src, '../resources/1600x1200.jpg');
});

test('try load image', t => {

    const ll = new lousyLoad(t.context.container);
    const image = t.context.container.querySelector('img.ll-src');
    const spy = sinon.spy(ll, '__loadImageByType');

    t.false(ll.tryLoadImage(image, -1000));
    t.true(ll.tryLoadImage(image, 1000));
    t.truthy(image.src);
    t.true(spy.withArgs(image, 'src').calledOnce);

});

test('try load image srcset', t => {

    const ll = new lousyLoad(t.context.container);
    const image = t.context.container.querySelector('img.ll-srcset');
    const spy = sinon.spy(ll, '__loadImageByType');

    t.false(ll.tryLoadImage(image, -1000));
    t.true(ll.tryLoadImage(image, 1000));
    t.truthy(image.src);
    t.truthy(image.srcset);
    t.true(spy.withArgs(image, 'srcset').calledOnce);

});

test('try load image background', t => {

    const ll = new lousyLoad(t.context.container, { selector : '.ll-image' });
    const image = t.context.container.querySelector('.responsive-background-image');
    const spy = sinon.spy(ll, '__loadImageByType');

    t.false(ll.tryLoadImage(image, -1000));
    t.true(ll.tryLoadImage(image, 1000));
    t.falsy(image.getAttribute('style'));
    t.true(spy.withArgs(image, 'background').calledOnce);

});

test('jquery plugin', t => {

    const $ = window.jQuery;
    const ll = $(t.context.container).lousyLoad();

    t.truthy($(t.context.container).data('plugin_lousyLoad'));

});
