$(function() {

	//quit if not on ios, ios fixes only from here
	var defaultOptions = {};

	$.fn.fakeScroll = function(options) {
		options = options || defaultOptions;
		for (var i = 0, l = this.length; i < l; i++) {
			setupFakeScroll.call(this[i]);
		}
	};


	function IOSIframeCheck() {
		var isInIframe = true || window.frameElement && window.frameElement.nodeName == "IFRAME";
		var isIOS = (/iPad|iPhone|iPod/.test(navigator.platform)) || (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
		if (!isIOS || !isInIframe) return;
		
		console.warn("FAKESCROLL: Is iOS in iFrame");

		$(document).fakeScroll();
	}

	IOSIframeCheck();

	function setupFakeScroll() {
		removeStyle();
		
		var overflowElements = $(getElementsByCSSAttributeName.call(this,"overflow", [ "scroll"]));
		var overflowXElements = $(getElementsByCSSAttributeName.call(this,"overflow-x", ["scroll"]));
		var overflowYElements = $(getElementsByCSSAttributeName.call(this,"overflow-y", ["scroll"]));
		
		var allOverflowElements = $(overflowElements).add(overflowXElements).add(overflowYElements);

		allOverflowElements.each(function(index, item) {
			var $item = $(item);
			var yScroll = ["scroll"].indexOf($item.css("overflow-y")) != -1;
			var xScroll = ["scroll"].indexOf($item.css("overflow-x")) != -1; 
			if (yScroll && xScroll) $item.attr("scroll", "both");
			else if (xScroll) $item.attr("scroll", "x");
			else if (yScroll) $item.attr("scroll", "y");
		});

		injectStyle();

		//fake scroll using tranformations
		var scrollTop = 0;
		var scrollLeft = 0;
		var scrollOffsetTop = 0;
		var scrollOffsetLeft = 0;
		var startY = 0;
		var startX = 0;
		var styleY = false;
		var fakeScrolling = false;
	    var b = document.body;
	    var $scrollingElement;
	    var $fixedChildren;
	    var isFixed = false;
	    b.removeEventListener('touchstart', touchStart);
	    b.addEventListener('touchstart', touchStart);
	    function touchStart(event) {
	    	var $current = $(event.target);
	    	var $stack = $current.parents().add($current);

	    	var $fixed = $stack.filter(function(index, item) {
	    		return $(item).css("position") == "fixed";
	    	});
	    	isFixed = ($fixed.length > 0);

	    	$scrollingElement = $stack.filter(".scrollable");
	    	$scrollingElementParent = $stack.filter("[scroll]");

	    	fakeScrolling = false;
	    	if ($scrollingElement.length === 0) return
	    	if ($scrollingElementParent.length === 0) return;
	    	$scrollingElementParent = $($scrollingElementParent[$scrollingElementParent.length-1]);
	    	fakeScrolling = true;
	    	$fixedChildren = $(getElementsByCSSAttributeName.call($scrollingElement[0], "position", ["fixed"]));

	    	switch ($scrollingElementParent.attr("scroll")) {
	    	case "both":
	    		styleY = true;
	    		styleX = true;
	    		break;
	    	case "x":
	    		styleY = false;
	    		styleX = true;
	    		break;
	    	case "y": 
	    		styleY = true;
	    		styleX = false;
	    		break;
	    	default:
	    		styleY = false;
	    		styleX = false;
	    	}

	    	scrollTop = parseInt($scrollingElementParent.attr("scrollTop")) || 0;
	    	scrollLeft = parseInt($scrollingElementParent.attr("scrollLeft")) || 0;
		    startY = event.targetTouches[0].pageY;
		    startX = event.targetTouches[0].pageX;
		    scrollOffsetTop = scrollTop * -1;
		    scrollOffsetLeft = scrollLeft * -1;
		}
		b.removeEventListener('touchmove', touchMove);
	    b.addEventListener('touchmove', touchMove);
	    function touchMove(event) {
	    	if (!fakeScrolling) return;
	    	var posy = event.targetTouches[0].pageY;
	    	var posx = event.targetTouches[0].pageX;

	    	if (!(styleY && Math.abs(startY-posy) > 5) && !(styleX && Math.abs(startX-posx) > 5))return;
	    	
	    	if (styleY) {
	    		
		    	event.preventDefault();
	        	scrollOffsetTop = (scrollTop*-1) - (startY-posy);

		        if (scrollOffsetTop > 0 ) scrollOffsetTop = 0;

		        var parentHeight = $scrollingElementParent.innerHeight();
		        var childHeight = $scrollingElement.outerHeight();
		        if (parentHeight > childHeight) scrollOffsetTop = 0;
		        else if (Math.abs(scrollOffsetTop) > childHeight - parentHeight) scrollOffsetTop = (childHeight - parentHeight)*-1;
	    	}

	    	if (styleX) {
		    	
		    	event.preventDefault();
		        scrollOffsetLeft = (scrollLeft*-1) - (startX-posx);

		       	if (scrollOffsetLeft > 0 ) scrollOffsetLeft = 0;

		        var parentWidth = $scrollingElementParent.innerWidth();
		        var childWidth = $scrollingElement.outerWidth();
		        if (parentWidth > childWidth) scrollOffsetLeft = 0;
		        else if (Math.abs(scrollOffsetLeft) > childWidth - parentWidth) scrollOffsetLeft = (childWidth - parentWidth)*-1;
	    	}

	    	$scrollingElement.css({
	    		"-webkit-transform": "translate("+scrollOffsetLeft+"px,"+scrollOffsetTop+"px)"
	    	});
	    	$fixedChildren.css({
	    		"-webkit-transform": "translate("+(-scrollOffsetLeft)+"px,"+(-scrollOffsetTop)+"px)"
	    	});
	       
	        $scrollingElementParent.attr("scrollTop", scrollOffsetTop*-1);
	        $scrollingElementParent.attr("scrollLeft", scrollOffsetLeft*-1);

	    	//$(window).scroll();
	    }
	    b.removeEventListener('touchend', touchEnd);
	    b.addEventListener('touchend', touchEnd);
	    function touchEnd() {
	    	if (!fakeScrolling) return;
			if (scrollOffsetTop > 0 ) scrollOffsetTop = 0;
	        if (scrollOffsetLeft > 0 ) scrollOffsetLeft = 0;
			var parentHeight = $scrollingElementParent.innerHeight();
			var childHeight = $scrollingElement.outerHeight();
			var parentWidth = $scrollingElementParent.innerWidth();
			var childWidth = $scrollingElement.outerWidth();
			if (parentHeight > childHeight) scrollOffsetTop = 0;
	        else if (Math.abs(scrollOffsetTop) > childHeight - parentHeight) scrollOffsetTop = (childHeight - parentHeight)*-1;
	        if (parentWidth > childWidth) scrollOffsetLeft = 0;
	        else if (Math.abs(scrollOffsetLeft) > childWidth - parentWidth) scrollOffsetLeft = (childWidth - parentWidth)*-1;
	        scrollTop = scrollOffsetTop*-1;
	        scrollLeft = scrollOffsetLeft*-1;
	        $scrollingElementParent.attr("scrollTop", scrollTop);
	        $scrollingElementParent.attr("scrollLeft", scrollLeft);
	    }
	}

	function scrollTo($current, x,y) {
    	var $stack = $current.parents().add($current);

    	var $fixed = $stack.filter(function(index, item) {
    		return $(item).css("position") == "fixed";
    	});
    	isFixed = ($fixed.length > 0);

    	$scrollingElement = $stack.filter(".scrollable");
    	$scrollingElementParent = $stack.filter("[scroll]");

    	fakeScrolling = false;
    	if ($scrollingElement.length === 0) return
    	if ($scrollingElementParent.length === 0) return;
    	fakeScrolling = true;
    	$fixedChildren = $(getElementsByCSSAttributeName.call($scrollingElement[0], "position", ["fixed"]));

    	switch ($scrollingElementParent.attr("scroll")) {
    	case "both":
    		styleY = true;
    		styleX = true;
    		break;
    	case "x":
    		styleY = false;
    		styleX = true;
    		break;
    	case "y": 
    		styleY = true;
    		styleX = false;
    		break;
    	default:
    		styleY = false;
    		styleX = false;
    	}

	    scrollOffsetTop = y * -1;
	    scrollOffsetLeft = x * -1;

	    if (!fakeScrolling) return;

    	if (styleY) {

	        if (scrollOffsetTop > 0 ) scrollOffsetTop = 0;

	        var parentHeight = $scrollingElementParent.innerHeight();
	        var childHeight = $scrollingElement.outerHeight();
	        if (parentHeight > childHeight) scrollOffsetTop = 0;
	        else if (Math.abs(y) > childHeight - parentHeight) scrollOffsetTop = (childHeight - parentHeight)*-1;
    	}

    	if (styleX) {
	       
    		if (scrollOffsetLeft > 0 ) scrollOffsetLeft = 0;

	        var parentWidth = $scrollingElementParent.innerWidth();
	        var childWidth = $scrollingElement.outerWidth();
	        if (parentWidth > childWidth) scrollOffsetLeft = 0;
	        else if (Math.abs(scrollOffsetLeft) > childWidth - parentWidth) scrollOffsetTop = (childWidth - parentWidth)*-1;
    	}

    	$scrollingElement.css({
    		"-webkit-transform": "translate3d("+scrollOffsetLeft+"px,"+scrollOffsetTop+"px,0)"
    	});
    	$fixedChildren.css({
    		"-webkit-transform": "translate3d("+(-scrollOffsetLeft)+"px,"+(-scrollOffsetTop)+"px,0)"
    	});
       
        $scrollingElementParent.attr("scrollTop", scrollOffsetTop*-1);
        $scrollingElementParent.attr("scrollLeft", scrollOffsetLeft*-1);

    	//$(window).scroll();

    	scrollTop = scrollOffsetTop*-1;
        scrollLeft = scrollOffsetLeft*-1;
        $scrollingElementParent.attr("scrollTop", scrollTop);
        $scrollingElementParent.attr("scrollLeft", scrollLeft);

	}


	function injectStyle() {
		if ($("#fake-scroll").length > 0) return;
		
		var style = document.createElement("style");
		$(style).attr("id", "fake-scroll").html("[scroll] { overflow:hidden !important; } * {transform-style: flat;}");
		document.getElementsByTagName("head")[0].appendChild(style);
	}

	function removeStyle() {
		$("#fake-scroll").remove();
	}


    //hack jquery scrollTop to return the fake scroll offset
	var jqueryScrollTop = $.fn.scrollTop;
	$(window).scroll(function(event) {
		console.log("scrolling");
	});
	var windowScrollTo = window.scrollTo;
	window.scrollTo = function(x,y) {
		console.log("window scrollTo", x, y);
		scrollTo($(".scrollable-body"), x || 0, y || 0);
	};
	$.fn.scrollTop = function(value) {
		if (this[0] === window) {
			if (value !== undefined) {
				console.log("scroll to", value);
				scrollTo($(".scrollable-body"), 0, value);
				_.defer(function() {
					$("body")[0].scrollTop = 0;
				});
			} else {
				return (parseInt($("html").attr("scrolltop")));
			}
		} else {
			return jqueryScrollTop.apply(this, arguments);
		}
	};
	var jqueryOffset = $.fn.offset;
	$.fn.offset = function() {
		var offset = jqueryOffset.call(this);
		console.log("fetching offset", offset.top, offset.left);
		var $stack = this.parents().add(this);
		var $scrollParents = $stack.filter("[scroll]");
		$scrollParents.each(function(index, item) {
			var $item = $(item);
			var scrolltop = parseInt($item.attr("scrolltop"));
			var scrollleft = parseInt($item.attr("scrollleft"));
			offset.top += scrolltop;
			offset.left += scrollleft;
		});
		return offset;
	};


    /* TODO
    * need to make jquery.scrollTo use fake scroll.
    * need to make sure overflow notify and drawer scroll
    * need to correct trickle as tranformation + z-index cause the button to disappear
    */

    /*WHAT WORKS
    * don't use PLP as scrollTo doesn't work (or huge plp as scrolling won't work)
    * don't use huge notify feedback
    * don't use trickle
    * otherwise all good - works perfectly on a desktop fullscreen iframe, all glitches are ios iframe hacks
    */
	
	function getElementsByCSSAttributeName(name, values) {
		if (name === undefined) throw "Must specify a css attribute name";

		var tags = this.getElementsByTagName('*'), el;

		var rtn = [];
		for (var i = 0, len = tags.length; i < len; i++) {
		    el = tags[i];
		    var currentValue;
		    if (el.currentStyle) { //ie
		    	var scriptName = changeCSSAttributeNameFormat(name);
		    	currentValue = el.currentStyle[scriptName];
		    } else if (window.getComputedStyle) { //other
		    	currentValue = document.defaultView.getComputedStyle(el, null).getPropertyValue(name);
		    }
		    if( currentValue !== 'none' ) {
		    	if ( values ) {
		    		var found = false;
		    		for (var v = 0, vl = values.length; v < vl; v++) {
		    			if (values[v] == currentValue) {
		    				found = true;
		    				break;
		    			}
		    		}
		    		if (!found) continue;
		    	}
	        	rtn.push(el);		       		
	        }
		}
		return rtn;
	}

	function changeCSSAttributeNameFormat(CSSName) {
		var noDash = CSSName.replace(/-/g," ");
		var titleCase = toTitleCase(noDash);
		var noSpace = titleCase.replace(/ /g, "");
		var lowerCaseStart = noSpace.substr(0,1).toLowerCase() + noSpace.substr(1);
		return lowerCaseStart;
	}

	function toTitleCase(str){
	    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	}
})