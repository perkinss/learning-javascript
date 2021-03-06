var chai = require('chai');
chai.use(require('chai-string'));
var expect = chai.expect;

var webdriver = require('selenium-webdriver'),
    By = webdriver.By;
var Capabilities = require('selenium-webdriver/lib/capabilities').Capabilities;
var capabilities = Capabilities.firefox();
capabilities.set('marionette', false);

xdescribe('Selenium', function() {

    var server;
    var driver;

    beforeEach(function(done) {
        server = require('http').createServer(function(request, response) {
            var index = '' +
            '<html>' +
            '   <head><title>hello</title></head>' +
            '   <body>' +
            '       <div id="greetings" style="display:inline-block">welcome</div>' +
            '   </body>' +
            '</html>';
            response.writeHead(200, { 'content-type':'text/html' });
            response.end(index);
        }).listen(5000, done);
    });

    afterEach(function() {
        server.close();
        driver.quit();
    });

    it('can be used to inspect the computed width of an element', function(done) {
        this.timeout(5000);
        driver = new webdriver.Builder().withCapabilities(capabilities).build();
        driver.get('http://localhost:5000/').then(
            function() {
                var element = driver.findElement(By.id('greetings'));
                element.getCssValue('width').then(
                    function(value) {
                        expect(value).to.endWith('px');
                        done();
                    },
                    function(error) {
                        expect(JSON.stringify(error)).to.equal(undefined);
                        done();
                    }
                );
            },
            function(error) {
                expect(JSON.stringify(error)).to.equal(undefined);
                done();
            }
        );
    });
});
