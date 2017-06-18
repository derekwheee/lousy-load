const test = require('ava');
const sinon = require('sinon');
const lousyLoad = require('../dist/lousy-load');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

test.beforeEach(t => {
    // Create container element to call lousyLoad on
    const div = document.createElement('div');
	document.body.appendChild(div);

    // Add single image to container div for basic testing
    const image = document.createElement('img');
    image.setAttribute('data-src', '../resources/1600x1200.jpg');
    image.setAttribute('height', '1200');
    image.setAttribute('width', '1600');
    div.appendChild(image);

    t.context.container = div;
});

test('debounce', t => {
    const ll = new lousyLoad(t.context.container);
    const spy = sinon.spy();
    const debouncer = ll.utils.debounce(spy, 100, true);

    debouncer();
    debouncer();
    debouncer();

	t.true(spy.calledOnce)
});

test('init', t => {
    const ll = new lousyLoad(t.context.container, { immediate : false });
    const init = ll.init();

    t.true(NodeList.prototype.isPrototypeOf(init))
    t.is(init.length, 1)
});

test('image wrapper', t => {
    const ll = new lousyLoad(t.context.container);
    const image = t.context.container.querySelector('img');

    t.truthy(image.parentElement.classList.contains('ll-image_wrapper'));
    t.is(image.parentElement.style.width, '1600px');
    t.is(image.parentElement.style.height, '1200px');
});

test('image max-width', t => {
    const image = t.context.container.querySelector('img');
    image.style.maxWidth = '800px';

    const ll = new lousyLoad(t.context.container);

    t.is(image.parentElement.style.width, '800px');
    t.is(image.parentElement.style.height, '600px');
});

test('image loaded', async t => {
    const ll = new lousyLoad(t.context.container);
    const image = t.context.container.querySelector('img');

    t.is(image.src, '../resources/1600x1200.jpg');

    // This won't work until I can get jsdom to load images
    // await sleep(1000);
    //
    // t.true(image.complete);
    // t.true(image.parentElement.classList.contains('is-loaded'));
});
