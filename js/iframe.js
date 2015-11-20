var moodleResponsiveIFrame = {
	$window: null,
	isInIframe: null,
	iframeDocument:null,
	iframeWindow:null,
	iframe:null,
	dynamicStyleTag:null //to keep adapt sizes in order
};

$(function() {
	//generic responsive iframe bits

	moodleResponsiveIFrame.$window = $(window);
	moodleResponsiveIFrame.isInIframe = window.frameElement && window.frameElement.nodeName == "IFRAME";
		
	if (moodleResponsiveIFrame.isInIframe) {
		genericCaptureIFrameElements();
		genericSetupResponsiveIFrameScriptAndStyle();
		genericSetupResponsiveIFrameMessaging();	
		
	}

	function genericCaptureIFrameElements() {
		moodleResponsiveIFrame.iframeDocument = top.window.document;
		moodleResponsiveIFrame.iframeWindow = top.window;
		findMoodleIframe();
	}

	function findMoodleIframe() {
		moodleResponsiveIFrame.iframe = moodleResponsiveIFrame.iframeDocument.getElementsByTagName("iframe")[0];
		if (moodleResponsiveIFrame.iframe === undefined) {
			moodleResponsiveIFrame.iframe = moodleResponsiveIFrame.iframeDocument.getElementById("scorm_object");
		}
		if (moodleResponsiveIFrame.iframe === undefined) {
			throw "cannot find iframe";
		}
		return moodleResponsiveIFrame.iframe;
	}

	function genericSetupResponsiveIFrameScriptAndStyle() {
		//inject corrective styling and script to iframe window to fix iframe sizing for everything and ios
		var meta = moodleResponsiveIFrame.iframeDocument.createElement("meta");
		var style = moodleResponsiveIFrame.iframeDocument.createElement("style");
		var script = moodleResponsiveIFrame.iframeDocument.createElement("script");
		$(style).html("html, body { overflow-x:hidden; overflow-y: hidden; } html, body, iframe {padding:0px;margin:0px;border:0px;height:100%;width:100%;} iframe { position: fixed !important; top:0px !important; left: 0px !important; box-sizing: content-box;height:100%;width:100%;}");
		$(script).html('setTimeout(resizeMe,1000);setTimeout(resizeMe,2000);\nwindow.addEventListener("resize", resizeMe);\nfunction resizeMe() {\nvar iframe = findMoodleIframe();\niframe.style.width = window.innerWidth+"px";\niframe.style.height = window.innerHeight+"px";\nconsole.log("resizeme sending message", window.innerHeight, window.innerWidth);\n iframe.contentWindow.postMessage("resizeme","*");\n}\nfunction findMoodleIframe() {\niframe = document.getElementsByTagName("iframe")[0];\nif (iframe === undefined) {\niframe = document.getElementById("scorm_object");\n}\nif (iframe === undefined) {\nthrow "cannot find iframe";\n}\nreturn iframe;\n}');
		$(meta).attr({
			"name": "viewport",
			"content": "width=device-width, initial-scale=1.0, maximum-scale=1.0"
		});
		moodleResponsiveIFrame.iframeDocument.getElementsByTagName("head")[0].appendChild(meta);
		moodleResponsiveIFrame.iframeDocument.getElementsByTagName("head")[0].appendChild(style);
		moodleResponsiveIFrame.iframeDocument.getElementsByTagName("head")[0].appendChild(script);

		//append dynamic styling to iframe content
		moodleResponsiveIFrame.dynamicStyleTag = window.document.createElement("style");
		window.document.getElementsByTagName("head")[0].appendChild(moodleResponsiveIFrame.dynamicStyleTag);

	}

	function genericSetupResponsiveIFrameMessaging() {
		//force iframe content html size to match iframe size

		window.addEventListener("message", receiveMessage, false);
		function receiveMessage(event) {
		  switch (event.data) {
		  case "resizeme":
		  	genericAdaptContentResize();
		  	break;
		  }
		}
	}

	$(function() {
		$.scrollBarSize = function() {
			var scrollDiv = $('<div style="width: 100px;height: 100px;overflow: scroll;position: absolute;top: -9999px;"></div>');
			$("body").append(scrollDiv);
			var scrollBarSize = scrollDiv[0].offsetWidth - scrollDiv[0].clientWidth;
			scrollDiv.remove();
			return scrollBarSize;
		};
	});

	var oldDimensions = { height: 0, width: 0 };
	function genericAdaptContentResize() {
		console.log("resizeme message received");
		var newDimensions = {
			height: moodleResponsiveIFrame.iframeWindow.innerHeight,
			width: moodleResponsiveIFrame.iframeWindow.innerWidth
		};

	  	if (oldDimensions.height == newDimensions.height && oldDimensions.width == newDimensions.width) return;

	  	var scrollSize = $.scrollBarSize();

		var dynamicStyle = "html { height:" + newDimensions.height + "px; width:" + (newDimensions.width-scrollSize) +"px; max-height:" + newDimensions.height + "px; max-width:" + (newDimensions.width-scrollSize) +"px; }";

		$(moodleResponsiveIFrame.dynamicStyleTag).html(dynamicStyle);

		oldDimensions = newDimensions;
		window.innerHeight = newDimensions.height;
		window.innerWidth = newDimensions.width;
		window.outerHeight = newDimensions.height;
		window.outerWidth = newDimensions.width;

		_.defer(function() {
	  		moodleResponsiveIFrame.$window.resize();
	  	});
	}
});

define([
	'coreJS/adapt'
],function(Adapt) {

	
	var isIOS = (/iPad|iPhone|iPod/.test(navigator.platform)) || (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
	var $pseudoHtml;
	var $pseudoBody;

	if (isIOS && moodleResponsiveIFrame.isInIframe) {
		iOSSetupFixes();
	}

	function iOSSetupFixes () {
		console.warn("FAKESCROLL: Is iOS in iFrame");

		//fix iframe attributes
		iOSSetupIFrameAttributes();

		//listen to orientation changes
		iOSSetupOrientationChangeListener();

		//reset scroll at interval
		iOSSetupResetScrollInterval();

		//add styling fixes
		$("html").addClass("pseudohtml");

		//wait for adapt to be ready
		Adapt.on("app:dataReady", iOSSetupScrollContainers);
		//wait for navigation to be rendered
		Adapt.once("adapt:initialize", iOSMoveNavigation);

		//hijack jquery window scroll handlers
		iOSApplyJQueryWindowScrollHacks();

	}

	function iOSSetupIFrameAttributes() {
		//force stop iframe scrolling
		moodleResponsiveIFrame.iframe.setAttribute("scrolling", "no");
	}

	function iOSSetupOrientationChangeListener() {
		//make sure iframe resizes properly on ios orientation change
		$(moodleResponsiveIFrame.iframeDocument.getElementsByTagName("body")[0]).attr({
			 "onorientationchange": "resizeMe();"
		});
	}

	function iOSSetupResetScrollInterval() {
		//potentially unnecessary but here from legacy code
		setInterval(function() {
			//force any error scrolls to reset
			moodleResponsiveIFrame.iframeDocument.getElementsByTagName("body")[0].scrollTop = 0;
			moodleResponsiveIFrame.iframeWindow.scrollTop = 0;
			window.document.getElementsByTagName("body")[0].scrollTop = 0;
			window.scrollTop = 0;

			//readjust height to force iframe to render properly
			$("body").css("height", "auto");
			_.defer(function(){
				$("body").css("height", "100%");
			});
			
		}, 500);
	}

	function iOSSetupScrollContainers() {
		//move #wrapper into new container
		$pseudoHtml = $('<div id="pseudo-html"><div id="pseudo-body"></div></div>');
		$pseudoBody = $pseudoHtml.find("#pseudo-body");
		$("body").append($pseudoHtml);
		$("#wrapper").appendTo($pseudoBody);

		$pseudoHtml.on("scroll", function() {
			moodleResponsiveIFrame.$window.scroll();
		})			
	}

	function iOSMoveNavigation() {
		//ios navigation fixed inside scrollable jump fix
		//create container
		var $navigationContainer = $('<div class="navigation-container"></div>');
		$("body").prepend($navigationContainer);
		//move navigation to new continer
		$(".navigation").prependTo($navigationContainer);
	}

	function iOSApplyJQueryWindowScrollHacks() {
		//jquery scrolling fixes
		var originalScrollTo = $.fn.scrollTo;
		$.fn.scrollTo = function(target, duration, settings) {
			if (this[0] === window) {
				var rtn = originalScrollTo.apply($pseudoHtml, arguments);
				moodleResponsiveIFrame.$window.scroll();
				return rtn;
			} else {
				return originalScrollTo.apply(this, arguments);
			}
		};
		var originalScrollTop = $.fn.scrollTop;
		$.fn.scrollTop = function(value) {
			if (this[0] === window) {
				var rtn = originalScrollTop.apply($pseudoHtml, arguments);
				if (value !== undefined) {
					moodleResponsiveIFrame.$window.scroll();
				}
				return rtn;
			} else {
				return originalScrollTop.apply(this, arguments);
			}
		};
		var jqueryOffset = $.fn.offset;
		$.fn.offset = function() {
			var offset = jqueryOffset.call(this);
			var scrolltop = parseInt($pseudoHtml.scrollTop());
			var scrollleft = parseInt($pseudoHtml.scrollLeft());
			offset.top += scrolltop;
			offset.left += scrollleft;
			return offset;
		};
		window.scrollTo = function(x,y) {
			$pseudoHtml[0].scrollTop = y || 0;
			$pseudoHtml[0].scrollLeft = x || 0;
			moodleResponsiveIFrame.$window.scroll();
		};
	}

})
