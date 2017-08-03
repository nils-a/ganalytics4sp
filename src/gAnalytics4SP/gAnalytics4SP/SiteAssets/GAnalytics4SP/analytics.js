if (window.Type) {
    window.Type.registerNamespace('ganalytics4sp');
} else {
    window.ganalytics4sp = { '__namespace': true };
}
(function (analytics) {
    analytics.doTracking = function () {
        //TODO: does this work, when MDS is active?!
        if (analytics.trackingId) {
            analytics.ga = window.ga; // window.ga was probably modified by google-script. save the modified version for later...
            window.ga('create', analytics.trackingId, 'auto');
            window.ga('send', 'pageview');
        }
    }
    analytics.loadWebSettings = function () {
        var ctx = SP.ClientContext.get_current(),
            properties = ctx.get_site().get_rootWeb().get_allProperties();
        ctx.load(properties);
        ctx.executeQueryAsync(function () { 
            analytics.trackingId = properties.get_fieldValues()['ganalytics4sp.trackingId'] || false;
            analytics.doTracking();
        }, function (err) {
            console.log && console.log(err.get_message());
        })
    };
    analytics.init = function () {
        if (analytics.ga) {
            // we've been here and ga was loaded.
            window.ga = analytics.ga; // window.ga may have been "cleaned up"..
            analytics.doTracking();
            return;
        }

        // load ga
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
        analytics.ga = window.ga;
        // load tracking-id
        if (!SP.SOD.executeOrDelayUntilScriptLoaded(analytics.loadWebSettings, 'sp.js')) {
            SP.SOD.executeFunc('sp.js', null, function () { });
        }
    };
    analytics.register = function () {
        var thisUrl;
        if (window.RegisterModuleInit && window._spPageContextInfo) {
            thisUrl = '~siteCollection/SiteAssets/GAnalytics4SP/analytics.js'.replace('~siteCollection/', window._spPageContextInfo.siteServerRelativeUrl);
            window.RegisterModuleInit(thisUrl, analytics.init);
        } 

        analytics.init();
    };
    window._spBodyOnLoadFunctions.push(analytics.register);
}(window.ganalytics4sp));
console.log('analytics.js loaded!');