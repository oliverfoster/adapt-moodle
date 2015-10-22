# adapt-responsiveIFrame
Extension to allow Adapt inside iframes.

Not to be used in production. Beginning of a series of fixes to make this possible.

1. Add to course. 
2. Change iframe.html to point to the Adapt index.html / scorm_test_harness.html
3. Open iframe.html
4. Look at code
5. Suggest improvements


```
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


```
