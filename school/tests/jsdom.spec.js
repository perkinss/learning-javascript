var expect = require('chai').expect;
var sinon = require('sinon');
require('chai').use(require('sinon-chai'));
var jsdom = require("jsdom");
//var canvas = require('canvas');

describe('Jsdom', function() {

    var server;

    beforeEach(function() {
        server = require('http').createServer(function(request, response) {
            var index = '' +
            '<html>' +
            '   <head>' +
            '       <title>initial title</title>' +
            '       <script src="/title.js"></script>' +
            '   </head>' +
            '   <body>' +
            '       <script>' +
            '           window.onload = function() { modifyTitle(); }' +
            '       </script>' +
            '       <a id="navigate" href="/next.html">go</a>' +
            '   </body>' +
            '</html>';
            var script = 'function modifyTitle() { document.title = "modified title"; }';
            var next = '' +
            '<html>' +
            '   <head>' +
            '       <title>next page</title>' +
            '   </head>' +
            '   <body>' +
            '   </body>' +
            '</html>';

            if (request.url == '/') {
                response.writeHead(200, { 'content-type':'text/html' });
                response.end(index);
            }
            if (request.url == '/title.js') {
                response.writeHead(200, { 'content-type':'application/javascript' });
                response.end(script);
                return;
            }
            if (request.url == '/next.html') {
                response.writeHead(200, { 'content-type':'text/html' });
                response.end(next);
            }
            if (request.url == '/ping') {
                response.setHeader('Content-Type', 'text/plain');
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.end('pong');
            }
        }).listen(5000);
    });

    afterEach(function() {
        server.close();
    });

    it('can download and execute a script', function(exit) {
        jsdom.env({
          url: "http://localhost:5000/",
          features: {
              FetchExternalResources: ["script"],
              ProcessExternalResources: ["script"]
          },
          done: function (errors, window) {
              expect(window.document.title).to.equal('modified title');
              exit();
          }
        });
    });

    it('can be used to follow a link by hand', function(exit) {
        jsdom.env({
          url: "http://localhost:5000/",
          features: {
              FetchExternalResources: ["script"],
              ProcessExternalResources: ["script"]
          },
          done: function (errors, window) {
              var link = window.document.querySelector('a#navigate');
              jsdom.env({
                url: link.href,
                features: {
                    FetchExternalResources: ["script"],
                    ProcessExternalResources: ["script"]
                },
                done: function (errors, window) {
                    expect(window.document.title).to.equal('next page');
                    exit();
                }
              });
          }
        });
    });

    it('handles events on dom elements', function() {
        var listener = { notify: sinon.spy() };
        var document = jsdom.jsdom('<button id="this-button"></button>');
        var button = document.querySelector('#this-button');
        button.onclick = function() { listener.notify(); }
        var click = document.createEvent('Event');
        click.initEvent('click', true, true);
        button.dispatchEvent(click);

        expect(listener.notify).to.have.been.called;
    });

    it('can be used to create a document element', function() {
        var document = jsdom.jsdom('<html><body><div id="message">Hello world!</div></body></html>');

        expect(document.getElementById('message').innerHTML).to.equal('Hello world!');
    });

    it('can be used to inspect computed color', function() {
        var document = jsdom.jsdom('<html><head><style>span { color:red }</style></head><body><span id="message">Hello world!</span></body></html>');
        var element = document.getElementById("message");
        var style = document.defaultView.getComputedStyle(element, null);

        expect(style.color).to.equal('red');
    });

    it('can be used to inspect window size', function(exit) {
        jsdom.env({
          url: "http://localhost:5000/",
          features: {
              FetchExternalResources: ["script"],
              ProcessExternalResources: ["script"]
          },
          done: function (errors, window) {
              expect(window.innerWidth).to.equal(1024);
              exit();
          }
        });
    });

    it('offers a XMLHttpRequest implementation', function(exit) {
        var window = jsdom.jsdom('<html></html>').defaultView;
        var xhr = new window.XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == xhr.DONE && xhr.status == 200) {
                try {
                    expect(xhr.responseText).to.equal('pong');
                    exit();
                }
                catch (error) {
                    exit(error);
                }
            }
        };
        xhr.open("GET", "http://localhost:5000/ping", true);
        xhr.send();
    });

    it.skip('can be used to inspect canvas content', function() {
        var document = jsdom.jsdom('<canvas id="board" width="15", height="15"></canvas>');
        var canvas = document.getElementById('board');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(1, 1, 1, 1);
        var img = ctx.getImageData(0, 0, 2, 2);

        expect(img.data).to.deep.equal({
            '0':0, '1':0, '2':0, '3':0,
            '4':0, '5':0, '6':0, '7':0,
            '8':0, '9':0, '10':0, '11':0,
            '12':255, '13':0, '14':0, '15':255,
        });
    });
});
