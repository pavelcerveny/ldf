const URL = require('url');
const Readable = require('stream').Readable;
const Writable = require('stream').Writable;

// Set up the sinon stubbing library
global.sinon = require('sinon');

// Set up the Chai assertion library
const chai = require('chai');
global.test = {};
global.expect = chai.expect;
global.should = chai.should();
chai.use(require('sinon-chai'));

// Test helper for the extractQueryParams function of routers
test.extractQueryParams = function (description, url, intent, query, expectedQuery) {
  const router = this;
  it(description + ' ' + intent, function () {
    const result = router.extractQueryParams({ url: URL.parse(url, true) }, query);
    expect(result).to.equal(undefined, 'should not return anything');
    expect(query).to.deep.equal(expectedQuery, 'should match the expected query');
  });
};

// Creates a dummy HTTP response
test.createHttpResponse = function (contents, contentType) {
  const response = new Readable();
  response._read = function () {};
  response.statusCode = 200;
  response.headers = { 'content-type': contentType };
  response.abort = function () { response.aborted = true; };
  setImmediate(function () { response.push(contents); response.push(null); });
  return response;
};

// Creates an in-memory stream
test.createStreamCapture = function () {
  const stream = new Writable({ objectMode: true });
  stream.buffer = '';
  stream._write = function (chunk, encoding, callback) {
    this.buffer += chunk;
    callback && callback();
  };
  return stream;
};

chai.use(function (chai, utils) {
  // Checks whether the stream contains the given number of elements
  chai.Assertion.addMethod('streamWithLength', function (expectedLength, callback) {
    let stream = utils.flag(this, 'object');
    let length = 0;
    let self = this;
    stream.on('data', function () { length++; });
    stream.on('end', function () {
      self.assert(length === expectedLength,
        'expected #{this} to be a stream of length ' + expectedLength + ', was ' + length,
        'expected #{this} not to be a stream of length ' + expectedLength);
      callback();
    });
  });
});