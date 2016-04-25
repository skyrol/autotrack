/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var ga = require('./analytics');
var constants = require('../lib/constants');


var browserCaps;


describe('socialTracker', function() {

  before(function() {
    browserCaps = browser.session().value;

    browser.url('/test/social-tracker.html');
  });


  beforeEach(function() {
    browser
        .execute(ga.run, 'create', 'UA-XXXXX-Y', 'auto')
        .execute(ga.trackHitData);
  });


  afterEach(function () {
    browser
        .execute(ga.clearHitData)
        .execute(ga.run, 'socialTracker:remove')
        .execute(ga.run, 'remove');
  });


  it('should support tweets and follows from the official twitter widgets',
      function() {

    if (notSupportedInBrowser()) return;

    browser.execute(ga.run, 'require', 'socialTracker');

    browser.waitForVisible('iframe.twitter-share-button');
    var tweetFrame = browser.element('iframe.twitter-share-button').value;

    browser.waitForVisible('iframe.twitter-follow-button');
    var followFrame = browser.element('iframe.twitter-follow-button').value;

    browser
        .frame(tweetFrame)
        .click('a')
        .frame()
        .frame(followFrame)
        .click('a')
        .frame()
        .waitUntil(ga.hitDataMatches([
          ['[0].socialNetwork', 'Twitter'],
          ['[0].socialAction', 'tweet'],
          ['[0].socialTarget', 'https://example.com'],
          ['[1].socialNetwork', 'Twitter'],
          ['[1].socialAction', 'follow'],
          ['[1].socialTarget', 'twitter']
        ]));
  });


  // TODO(philipwalton): figure out why this doesn't work...
  // it('should support likes from the official facebook widget', function() {

  //   var mainWindow = browser
  //       .url('/test/social-tracker-widgets.html')
  //       .windowHandle().value;

  //   var likeFrame = browser
  //       .waitForVisible('.fb-like iframe')
  //       .element('.fb-like iframe').value;

  //   browser
  //       .frame(likeFrame)
  //       .click('form .pluginButtonLabel')
  //       .debug();
  // });


  it('should support customizing any field via the fieldsObj', function() {

    if (notSupportedInBrowser()) return;

    browser.execute(ga.run, 'require', 'socialTracker', {
      fieldsObj: {
        nonInteraction: true
      }
    });

    browser.waitForVisible('iframe.twitter-share-button');
    var tweetFrame = browser.element('iframe.twitter-share-button').value;

    browser.waitForVisible('iframe.twitter-follow-button');
    var followFrame = browser.element('iframe.twitter-follow-button').value;

    browser
        .frame(tweetFrame)
        .click('a')
        .frame()
        .frame(followFrame)
        .click('a')
        .frame()
        .waitUntil(ga.hitDataMatches([
          ['[0].socialNetwork', 'Twitter'],
          ['[0].socialAction', 'tweet'],
          ['[0].socialTarget', 'https://example.com'],
          ['[0].nonInteraction', true],
          ['[1].socialNetwork', 'Twitter'],
          ['[1].socialAction', 'follow'],
          ['[1].socialTarget', 'twitter'],
          ['[1].nonInteraction', true]
        ]));
  });


  it('should support specifying a hit filter', function() {

    browser.execute(requireSocialTracker_hitFilter);

    browser.waitForVisible('iframe.twitter-share-button');
    var tweetFrame = browser.element('iframe.twitter-share-button').value;

    browser.waitForVisible('iframe.twitter-follow-button');
    var followFrame = browser.element('iframe.twitter-follow-button').value;

    browser
        .frame(tweetFrame)
        .click('a')
        .frame()
        .frame(followFrame)
        .click('a')
        .frame()
        .waitUntil(ga.hitDataMatches([
          ['[0].socialNetwork', 'Twitter'],
          ['[0].socialAction', 'follow'],
          ['[0].socialTarget', 'twitter'],
          ['[0].nonInteraction', true]
        ]));
  });


  it('should include the &did param with all hits', function() {

    browser
        .execute(ga.run, 'require', 'socialTracker')
        .execute(ga.run, 'send', 'pageview')
        .waitUntil(ga.hitDataMatches([['[0].devId', constants.DEV_ID]]));
  });

});


/**
 * @return {boolean} True if the current browser doesn't support all features
 *    required for these tests.
 */
function notSupportedInBrowser() {
  // TODO(philipwalton): IE and Edge are flaky with the tweet button test,
  // though they work when manually testing.
  return browserCaps.browserName == 'MicrosoftEdge' ||
      browserCaps.browserName == 'internet explorer';
}


/**
 * Since function objects can't be passed via parameters from server to
 * client, this one-off function must be used to set the value for
 * `hitFilter`.
 */
function requireSocialTracker_hitFilter() {
  ga('require', 'socialTracker', {
    hitFilter: function(model) {
      var action = model.get('socialAction');
      if (action == 'tweet') {
        throw 'Exclude tweet actions';
      }
      else {
        model.set('nonInteraction', true);
      }
    }
  });
}
