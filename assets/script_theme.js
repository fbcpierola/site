/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 523:
/***/ ((module) => {

/* smoothscroll v0.4.4 - 2019 - Dustan Kasten, Jeremias Menichelli - MIT License */
(function () {
  'use strict';

  // polyfill
  function polyfill() {
    // aliases
    var w = window;
    var d = document;

    // return if scroll behavior is supported and polyfill is not forced
    if (
      'scrollBehavior' in d.documentElement.style &&
      w.__forceSmoothScrollPolyfill__ !== true
    ) {
      return;
    }

    // globals
    var Element = w.HTMLElement || w.Element;
    var SCROLL_TIME = 468;

    // object gathering original scroll methods
    var original = {
      scroll: w.scroll || w.scrollTo,
      scrollBy: w.scrollBy,
      elementScroll: Element.prototype.scroll || scrollElement,
      scrollIntoView: Element.prototype.scrollIntoView
    };

    // define timing method
    var now =
      w.performance && w.performance.now
        ? w.performance.now.bind(w.performance)
        : Date.now;

    /**
     * indicates if a the current browser is made by Microsoft
     * @method isMicrosoftBrowser
     * @param {String} userAgent
     * @returns {Boolean}
     */
    function isMicrosoftBrowser(userAgent) {
      var userAgentPatterns = ['MSIE ', 'Trident/', 'Edge/'];

      return new RegExp(userAgentPatterns.join('|')).test(userAgent);
    }

    /*
     * IE has rounding bug rounding down clientHeight and clientWidth and
     * rounding up scrollHeight and scrollWidth causing false positives
     * on hasScrollableSpace
     */
    var ROUNDING_TOLERANCE = isMicrosoftBrowser(w.navigator.userAgent) ? 1 : 0;

    /**
     * changes scroll position inside an element
     * @method scrollElement
     * @param {Number} x
     * @param {Number} y
     * @returns {undefined}
     */
    function scrollElement(x, y) {
      this.scrollLeft = x;
      this.scrollTop = y;
    }

    /**
     * returns result of applying ease math function to a number
     * @method ease
     * @param {Number} k
     * @returns {Number}
     */
    function ease(k) {
      return 0.5 * (1 - Math.cos(Math.PI * k));
    }

    /**
     * indicates if a smooth behavior should be applied
     * @method shouldBailOut
     * @param {Number|Object} firstArg
     * @returns {Boolean}
     */
    function shouldBailOut(firstArg) {
      if (
        firstArg === null ||
        typeof firstArg !== 'object' ||
        firstArg.behavior === undefined ||
        firstArg.behavior === 'auto' ||
        firstArg.behavior === 'instant'
      ) {
        // first argument is not an object/null
        // or behavior is auto, instant or undefined
        return true;
      }

      if (typeof firstArg === 'object' && firstArg.behavior === 'smooth') {
        // first argument is an object and behavior is smooth
        return false;
      }

      // throw error when behavior is not supported
      throw new TypeError(
        'behavior member of ScrollOptions ' +
          firstArg.behavior +
          ' is not a valid value for enumeration ScrollBehavior.'
      );
    }

    /**
     * indicates if an element has scrollable space in the provided axis
     * @method hasScrollableSpace
     * @param {Node} el
     * @param {String} axis
     * @returns {Boolean}
     */
    function hasScrollableSpace(el, axis) {
      if (axis === 'Y') {
        return el.clientHeight + ROUNDING_TOLERANCE < el.scrollHeight;
      }

      if (axis === 'X') {
        return el.clientWidth + ROUNDING_TOLERANCE < el.scrollWidth;
      }
    }

    /**
     * indicates if an element has a scrollable overflow property in the axis
     * @method canOverflow
     * @param {Node} el
     * @param {String} axis
     * @returns {Boolean}
     */
    function canOverflow(el, axis) {
      var overflowValue = w.getComputedStyle(el, null)['overflow' + axis];

      return overflowValue === 'auto' || overflowValue === 'scroll';
    }

    /**
     * indicates if an element can be scrolled in either axis
     * @method isScrollable
     * @param {Node} el
     * @param {String} axis
     * @returns {Boolean}
     */
    function isScrollable(el) {
      var isScrollableY = hasScrollableSpace(el, 'Y') && canOverflow(el, 'Y');
      var isScrollableX = hasScrollableSpace(el, 'X') && canOverflow(el, 'X');

      return isScrollableY || isScrollableX;
    }

    /**
     * finds scrollable parent of an element
     * @method findScrollableParent
     * @param {Node} el
     * @returns {Node} el
     */
    function findScrollableParent(el) {
      while (el !== d.body && isScrollable(el) === false) {
        el = el.parentNode || el.host;
      }

      return el;
    }

    /**
     * self invoked function that, given a context, steps through scrolling
     * @method step
     * @param {Object} context
     * @returns {undefined}
     */
    function step(context) {
      var time = now();
      var value;
      var currentX;
      var currentY;
      var elapsed = (time - context.startTime) / SCROLL_TIME;

      // avoid elapsed times higher than one
      elapsed = elapsed > 1 ? 1 : elapsed;

      // apply easing to elapsed time
      value = ease(elapsed);

      currentX = context.startX + (context.x - context.startX) * value;
      currentY = context.startY + (context.y - context.startY) * value;

      context.method.call(context.scrollable, currentX, currentY);

      // scroll more if we have not reached our destination
      if (currentX !== context.x || currentY !== context.y) {
        w.requestAnimationFrame(step.bind(w, context));
      }
    }

    /**
     * scrolls window or element with a smooth behavior
     * @method smoothScroll
     * @param {Object|Node} el
     * @param {Number} x
     * @param {Number} y
     * @returns {undefined}
     */
    function smoothScroll(el, x, y) {
      var scrollable;
      var startX;
      var startY;
      var method;
      var startTime = now();

      // define scroll context
      if (el === d.body) {
        scrollable = w;
        startX = w.scrollX || w.pageXOffset;
        startY = w.scrollY || w.pageYOffset;
        method = original.scroll;
      } else {
        scrollable = el;
        startX = el.scrollLeft;
        startY = el.scrollTop;
        method = scrollElement;
      }

      // scroll looping over a frame
      step({
        scrollable: scrollable,
        method: method,
        startTime: startTime,
        startX: startX,
        startY: startY,
        x: x,
        y: y
      });
    }

    // ORIGINAL METHODS OVERRIDES
    // w.scroll and w.scrollTo
    w.scroll = w.scrollTo = function() {
      // avoid action when no arguments are passed
      if (arguments[0] === undefined) {
        return;
      }

      // avoid smooth behavior if not required
      if (shouldBailOut(arguments[0]) === true) {
        original.scroll.call(
          w,
          arguments[0].left !== undefined
            ? arguments[0].left
            : typeof arguments[0] !== 'object'
              ? arguments[0]
              : w.scrollX || w.pageXOffset,
          // use top prop, second argument if present or fallback to scrollY
          arguments[0].top !== undefined
            ? arguments[0].top
            : arguments[1] !== undefined
              ? arguments[1]
              : w.scrollY || w.pageYOffset
        );

        return;
      }

      // LET THE SMOOTHNESS BEGIN!
      smoothScroll.call(
        w,
        d.body,
        arguments[0].left !== undefined
          ? ~~arguments[0].left
          : w.scrollX || w.pageXOffset,
        arguments[0].top !== undefined
          ? ~~arguments[0].top
          : w.scrollY || w.pageYOffset
      );
    };

    // w.scrollBy
    w.scrollBy = function() {
      // avoid action when no arguments are passed
      if (arguments[0] === undefined) {
        return;
      }

      // avoid smooth behavior if not required
      if (shouldBailOut(arguments[0])) {
        original.scrollBy.call(
          w,
          arguments[0].left !== undefined
            ? arguments[0].left
            : typeof arguments[0] !== 'object' ? arguments[0] : 0,
          arguments[0].top !== undefined
            ? arguments[0].top
            : arguments[1] !== undefined ? arguments[1] : 0
        );

        return;
      }

      // LET THE SMOOTHNESS BEGIN!
      smoothScroll.call(
        w,
        d.body,
        ~~arguments[0].left + (w.scrollX || w.pageXOffset),
        ~~arguments[0].top + (w.scrollY || w.pageYOffset)
      );
    };

    // Element.prototype.scroll and Element.prototype.scrollTo
    Element.prototype.scroll = Element.prototype.scrollTo = function() {
      // avoid action when no arguments are passed
      if (arguments[0] === undefined) {
        return;
      }

      // avoid smooth behavior if not required
      if (shouldBailOut(arguments[0]) === true) {
        // if one number is passed, throw error to match Firefox implementation
        if (typeof arguments[0] === 'number' && arguments[1] === undefined) {
          throw new SyntaxError('Value could not be converted');
        }

        original.elementScroll.call(
          this,
          // use left prop, first number argument or fallback to scrollLeft
          arguments[0].left !== undefined
            ? ~~arguments[0].left
            : typeof arguments[0] !== 'object' ? ~~arguments[0] : this.scrollLeft,
          // use top prop, second argument or fallback to scrollTop
          arguments[0].top !== undefined
            ? ~~arguments[0].top
            : arguments[1] !== undefined ? ~~arguments[1] : this.scrollTop
        );

        return;
      }

      var left = arguments[0].left;
      var top = arguments[0].top;

      // LET THE SMOOTHNESS BEGIN!
      smoothScroll.call(
        this,
        this,
        typeof left === 'undefined' ? this.scrollLeft : ~~left,
        typeof top === 'undefined' ? this.scrollTop : ~~top
      );
    };

    // Element.prototype.scrollBy
    Element.prototype.scrollBy = function() {
      // avoid action when no arguments are passed
      if (arguments[0] === undefined) {
        return;
      }

      // avoid smooth behavior if not required
      if (shouldBailOut(arguments[0]) === true) {
        original.elementScroll.call(
          this,
          arguments[0].left !== undefined
            ? ~~arguments[0].left + this.scrollLeft
            : ~~arguments[0] + this.scrollLeft,
          arguments[0].top !== undefined
            ? ~~arguments[0].top + this.scrollTop
            : ~~arguments[1] + this.scrollTop
        );

        return;
      }

      this.scroll({
        left: ~~arguments[0].left + this.scrollLeft,
        top: ~~arguments[0].top + this.scrollTop,
        behavior: arguments[0].behavior
      });
    };

    // Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = function() {
      // avoid smooth behavior if not required
      if (shouldBailOut(arguments[0]) === true) {
        original.scrollIntoView.call(
          this,
          arguments[0] === undefined ? true : arguments[0]
        );

        return;
      }

      // LET THE SMOOTHNESS BEGIN!
      var scrollableParent = findScrollableParent(this);
      var parentRects = scrollableParent.getBoundingClientRect();
      var clientRects = this.getBoundingClientRect();

      if (scrollableParent !== d.body) {
        // reveal element inside parent
        smoothScroll.call(
          this,
          scrollableParent,
          scrollableParent.scrollLeft + clientRects.left - parentRects.left,
          scrollableParent.scrollTop + clientRects.top - parentRects.top
        );

        // reveal parent in viewport unless is fixed
        if (w.getComputedStyle(scrollableParent).position !== 'fixed') {
          w.scrollBy({
            left: parentRects.left,
            top: parentRects.top,
            behavior: 'smooth'
          });
        }
      } else {
        // reveal element in viewport
        w.scrollBy({
          left: clientRects.left,
          top: clientRects.top,
          behavior: 'smooth'
        });
      }
    };
  }

  if (true) {
    // commonjs
    module.exports = { polyfill: polyfill };
  } else {}

}());


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";

;// CONCATENATED MODULE: ./node_modules/ismobilejs/esm/isMobile.js
var appleIphone = /iPhone/i;
var appleIpod = /iPod/i;
var appleTablet = /iPad/i;
var appleUniversal = /\biOS-universal(?:.+)Mac\b/i;
var androidPhone = /\bAndroid(?:.+)Mobile\b/i;
var androidTablet = /Android/i;
var amazonPhone = /(?:SD4930UR|\bSilk(?:.+)Mobile\b)/i;
var amazonTablet = /Silk/i;
var windowsPhone = /Windows Phone/i;
var windowsTablet = /\bWindows(?:.+)ARM\b/i;
var otherBlackBerry = /BlackBerry/i;
var otherBlackBerry10 = /BB10/i;
var otherOpera = /Opera Mini/i;
var otherChrome = /\b(CriOS|Chrome)(?:.+)Mobile/i;
var otherFirefox = /Mobile(?:.+)Firefox\b/i;
var isAppleTabletOnIos13 = function (navigator) {
    return (typeof navigator !== 'undefined' &&
        navigator.platform === 'MacIntel' &&
        typeof navigator.maxTouchPoints === 'number' &&
        navigator.maxTouchPoints > 1 &&
        typeof MSStream === 'undefined');
};
function createMatch(userAgent) {
    return function (regex) { return regex.test(userAgent); };
}
function isMobile(param) {
    var nav = {
        userAgent: '',
        platform: '',
        maxTouchPoints: 0
    };
    if (!param && typeof navigator !== 'undefined') {
        nav = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            maxTouchPoints: navigator.maxTouchPoints || 0
        };
    }
    else if (typeof param === 'string') {
        nav.userAgent = param;
    }
    else if (param && param.userAgent) {
        nav = {
            userAgent: param.userAgent,
            platform: param.platform,
            maxTouchPoints: param.maxTouchPoints || 0
        };
    }
    var userAgent = nav.userAgent;
    var tmp = userAgent.split('[FBAN');
    if (typeof tmp[1] !== 'undefined') {
        userAgent = tmp[0];
    }
    tmp = userAgent.split('Twitter');
    if (typeof tmp[1] !== 'undefined') {
        userAgent = tmp[0];
    }
    var match = createMatch(userAgent);
    var result = {
        apple: {
            phone: match(appleIphone) && !match(windowsPhone),
            ipod: match(appleIpod),
            tablet: !match(appleIphone) &&
                (match(appleTablet) || isAppleTabletOnIos13(nav)) &&
                !match(windowsPhone),
            universal: match(appleUniversal),
            device: (match(appleIphone) ||
                match(appleIpod) ||
                match(appleTablet) ||
                match(appleUniversal) ||
                isAppleTabletOnIos13(nav)) &&
                !match(windowsPhone)
        },
        amazon: {
            phone: match(amazonPhone),
            tablet: !match(amazonPhone) && match(amazonTablet),
            device: match(amazonPhone) || match(amazonTablet)
        },
        android: {
            phone: (!match(windowsPhone) && match(amazonPhone)) ||
                (!match(windowsPhone) && match(androidPhone)),
            tablet: !match(windowsPhone) &&
                !match(amazonPhone) &&
                !match(androidPhone) &&
                (match(amazonTablet) || match(androidTablet)),
            device: (!match(windowsPhone) &&
                (match(amazonPhone) ||
                    match(amazonTablet) ||
                    match(androidPhone) ||
                    match(androidTablet))) ||
                match(/\bokhttp\b/i)
        },
        windows: {
            phone: match(windowsPhone),
            tablet: match(windowsTablet),
            device: match(windowsPhone) || match(windowsTablet)
        },
        other: {
            blackberry: match(otherBlackBerry),
            blackberry10: match(otherBlackBerry10),
            opera: match(otherOpera),
            firefox: match(otherFirefox),
            chrome: match(otherChrome),
            device: match(otherBlackBerry) ||
                match(otherBlackBerry10) ||
                match(otherOpera) ||
                match(otherFirefox) ||
                match(otherChrome)
        },
        any: false,
        phone: false,
        tablet: false
    };
    result.any =
        result.apple.device ||
            result.android.device ||
            result.windows.device ||
            result.other.device;
    result.phone =
        result.apple.phone || result.android.phone || result.windows.phone;
    result.tablet =
        result.apple.tablet || result.android.tablet || result.windows.tablet;
    return result;
}
//# sourceMappingURL=isMobile.js.map
// EXTERNAL MODULE: ./node_modules/smoothscroll-polyfill/dist/smoothscroll.js
var smoothscroll = __webpack_require__(523);
var smoothscroll_default = /*#__PURE__*/__webpack_require__.n(smoothscroll);
;// CONCATENATED MODULE: ./scripts/utils/index.js


smoothscroll_default().polyfill();
var utils_isMobile = isMobile();
function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (pair[0] === variable) {
      return pair[1];
    }
  }
  return false;
}
function getPriceString(amount) {
  return '$' + (amount / 100).toFixed(2);
}
function pluralize(value, singular, plural) {
  if (value === 1) {
    return singular;
  } else {
    return plural;
  }
}
function setCartWidgetQuantity(quantity) {
  var dataPrefix = 'data-cart-widget';
  var selectors = {
    widget: "[".concat(dataPrefix, "=\"widget\"]"),
    widgetQuantity: "[".concat(dataPrefix, "=\"quantity\"]")
  };
  var cartWidget = document.querySelectorAll(selectors.widget);
  var cartWidgetQuantity = document.querySelectorAll(selectors.widgetQuantity);
  for (var i = 0; i < cartWidgetQuantity.length; i++) {
    cartWidgetQuantity[i].innerHTML = quantity;
  }
  for (var _i = 0; _i < cartWidget.length; _i++) {
    if (parseInt(quantity) === 0) {
      cartWidget[_i].classList.add(cssClasses.empty);
    } else {
      cartWidget[_i].classList.remove(cssClasses.empty);
    }
  }
}
var theme = Theme;
var strings = theme.strings;
var urls = theme.urls;
var cssClasses = {
  loading: 'loading',
  hidden: 'hidden',
  active: 'active',
  visible: 'visible',
  empty: 'empty',
  unavailable: 'unavailable',
  disabled: 'disabled',
  paused: 'paused',
  filled: 'filled',
  selected: 'selected',
  noScroll: 'no-scroll'
};
function setBodyScroll(set) {
  var body = document.querySelector('body');
  if (set === false && !body.classList.contains(cssClasses.noScroll)) {
    body.classList.add(cssClasses.noScroll);
  } else {
    body.classList.remove(cssClasses.noScroll);
  }
}
var isElementTopInViewport = function isElementTopInViewport(_ref) {
  var element = _ref.element,
    offset = _ref.offset;
  if (!offset) offset = 0;
  if (element.getBoundingClientRect().top - offset >= 0) return true;
  return false;
};
var scrollToElement = function scrollToElement(_ref2) {
  var element = _ref2.element,
    offset = _ref2.offset,
    behavior = _ref2.behavior,
    ifNeeded = _ref2.ifNeeded;
  if (ifNeeded === true && isElementTopInViewport({
    element: element,
    offset: offset
  })) return;
  if (!offset) offset = 0;
  if (!behavior) behavior = 'smooth';
  var viewportY = window.scrollY || window.pageYOffset;
  var top = element.getBoundingClientRect().top + viewportY - offset;
  window.scrollTo({
    top: top,
    left: 0,
    behavior: behavior
  });
};
;// CONCATENATED MODULE: ./scripts/components/input.js

var selectors = {
  container: '[data-input="container"]',
  input: '[data-input="input"]'
};
var setInputFocus = function setInputFocus() {
  var containers = document.querySelectorAll(selectors.container);
  for (var i = 0; i < containers.length; i++) {
    containers[i].addEventListener('click', function (e) {
      if (e.currentTarget.dataset.input === 'container') {
        e.currentTarget.querySelector(selectors.input).focus();
      }
    });
  }
};
var input = function input() {
  var containers = document.querySelectorAll(selectors.container);
  var _loop = function _loop() {
    var input = containers[i].querySelector(selectors.input);
    if (input.value !== '') {
      input.classList.add(cssClasses.filled);
    } else {
      input.classList.remove(cssClasses.filled);
    }
    input.addEventListener('blur', function () {
      if (input.value !== '') {
        input.classList.add(cssClasses.filled);
      } else {
        input.classList.remove(cssClasses.filled);
      }
    });
  };
  for (var i = 0; i < containers.length; i++) {
    _loop();
  }
  setInputFocus();
};
;// CONCATENATED MODULE: ./scripts/components/select.js

var selectContainerSelector = '[data-select="container"]';
var extendSelect = function extendSelect(selectContainer) {
  var select = selectContainer.querySelector('select');
  var inputContainer = document.querySelector("[data-select-input=\"".concat(select.dataset.triggerInput, "\"]"));
  var input = inputContainer.querySelector('input');
  var onChange = function onChange(e) {
    if (e.currentTarget.value === 'more') {
      selectContainer.classList.add(cssClasses.hidden);
      inputContainer.classList.remove(cssClasses.hidden);
      input.setAttribute('name', 'quantity');
      input.focus();
    }
  };
  select.addEventListener('change', onChange);
};
var select_select = function select() {
  var selectContainers = document.querySelectorAll(selectContainerSelector);
  for (var i = 0; i < selectContainers.length; i++) {
    extendSelect(selectContainers[i]);
  }
};
;// CONCATENATED MODULE: ./scripts/components/video.js

var video_selectors = {
  main: '[data-video="main"]',
  video: '[data-video="video"]',
  controls: '[data-video="controls"]',
  initPlay: '[data-video="init-play"]',
  playPause: '[data-video="play-pause"]',
  fullscreen: '[data-video="fullscreen"]',
  mute: '[data-video="mute"]',
  volume: '[data-video="volume"]',
  iconPlay: '[data-video-icon="play"]',
  iconPause: '[data-video-icon="pause"]',
  iconVolume: '[data-video-icon="volume"]',
  iconVolumeMute: '[data-video-icon="volume-mute"]'
};
var initVolume = 0.7;
var addVideoControls = function addVideoControls(videoContainer) {
  var video = videoContainer.querySelector(video_selectors.video);
  if (!video) {
    console.error("DOM Element with video :: ".concat(video_selectors.video, " doesn't exist or it's value is equal null."));
    return;
  }
  var controls = videoContainer.querySelector(video_selectors.controls);
  var initPlay = videoContainer.querySelector(video_selectors.initPlay);
  var playPauseBtn = videoContainer.querySelector(video_selectors.playPause);
  var fullscreenBtn = videoContainer.querySelector(video_selectors.fullscreen);
  var muteBtn = videoContainer.querySelector(video_selectors.mute);
  var volumeBtn = videoContainer.querySelector(video_selectors.volume);
  var iconPlay = videoContainer.querySelector(video_selectors.iconPlay);
  var iconPause = videoContainer.querySelector(video_selectors.iconPause);
  var iconVolume = videoContainer.querySelector(video_selectors.iconVolume);
  var iconVolumeMute = videoContainer.querySelector(video_selectors.iconVolumeMute);
  video.controls = false;
  setVolume(initVolume);
  video.addEventListener('click', function () {
    if (video.paused) {
      play();
    } else {
      pause();
    }
  });
  video.addEventListener('ended', function () {
    pause();
  });
  if (initPlay) {
    initPlay.addEventListener('click', function () {
      play();
      initPlay.classList.add(cssClasses.hidden);
      controls.classList.remove(cssClasses.hidden);
    });
  }
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', function () {
      if (video.paused) {
        play();
      } else {
        pause();
      }
    });
  }
  if (muteBtn) {
    muteBtn.addEventListener('click', function () {
      if (video.muted) {
        toggleMute(false);
      } else {
        toggleMute(true);
      }
    });
  }
  if (volumeBtn) {
    volumeBtn.value = initVolume;
    volumeBtn.addEventListener('input', function (e) {
      setVolume(e.target.value);
    });
  }
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', function () {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if (video.mozRequestFullScreen) {
        video.mozRequestFullScreen();
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
      } else if (video.msRequestFullscreen) {
        video.msRequestFullscreen();
      }
    });
  }
  function play() {
    video.play();
    iconPlay.classList.toggle(cssClasses.hidden);
    iconPause.classList.toggle(cssClasses.hidden);
    videoContainer.classList.remove(cssClasses.paused);
  }
  function pause() {
    video.pause();
    iconPlay.classList.toggle(cssClasses.hidden);
    iconPause.classList.toggle(cssClasses.hidden);
    videoContainer.classList.add(cssClasses.paused);
  }
  function toggleMute(mute) {
    iconVolume.classList.toggle(cssClasses.hidden);
    iconVolumeMute.classList.toggle(cssClasses.hidden);
    if (mute) {
      video.muted = true;
      volumeBtn.value = 0;
    } else {
      video.muted = false;
      volumeBtn.value = video.volume;
      if (video.volume === 0) {
        video.volume = initVolume;
        volumeBtn.value = initVolume;
      }
    }
  }
  function setVolume(value) {
    video.volume = value;
    if (value === '0') {
      toggleMute(true);
    } else if (video.muted) {
      toggleMute(false);
    }
  }
};
var video = function video() {
  var videoContainers = document.querySelectorAll(video_selectors.main);
  for (var i = 0; i < videoContainers.length; i++) {
    addVideoControls(videoContainers[i]);
  }
};
;// CONCATENATED MODULE: ./scripts/components/drawer.js

var drawerSelector = 'data-drawer';
var triggerSelectorPrimary = 'data-drawer-trigger-primary';
var triggerSelectorSecondary = 'data-drawer-trigger-secondary';
var toggleDrawer = function toggleDrawer(targetName) {
  var drawer = document.querySelector("[".concat(drawerSelector, "=\"").concat(targetName, "\"]"));
  drawer.classList.toggle(cssClasses.visible);
  if (drawer.classList.contains(cssClasses.visible)) {
    setBodyScroll(false);
  } else {
    setBodyScroll(true);
  }
};
var drawer = function drawer() {
  var primaryTriggers = document.querySelectorAll("[".concat(triggerSelectorPrimary, "]"));
  var secondaryTriggers = document.querySelectorAll("[".concat(triggerSelectorSecondary, "]"));
  for (var i = 0; i < primaryTriggers.length; i++) {
    primaryTriggers[i].addEventListener('click', function (e) {
      e.preventDefault();
      var targetName = e.currentTarget.getAttribute(triggerSelectorPrimary);
      toggleDrawer(targetName);
    });
  }
  for (var t = 0; t < secondaryTriggers.length; t++) {
    secondaryTriggers[t].addEventListener('click', function (e) {
      e.target.classList.toggle('active');
    });
  }
};
;// CONCATENATED MODULE: ./scripts/theme.js




input();
select_select();
video();
drawer();
})();

/******/ })()
;