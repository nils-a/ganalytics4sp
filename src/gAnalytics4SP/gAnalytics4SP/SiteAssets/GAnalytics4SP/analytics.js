if (window.Type) {
    window.Type.registerNamespace('ganalytics4sp');
} else {
    window.ganalytics4sp = { '__namespace': true };
}
(function (analytics) {
    analytics.mdsReplaceStartAspx = function (inp) {
        var startAspx = '/start.aspx',
            pos = inp.indexOf(startAspx),
            offset = pos + startAspx.length + 1,
            stop, url;

        if( pos === -1) {
            // no mds-url
            return inp;
        }
        if (inp.substring(0, offset-1) !== document.location.href.substring(0, offset-1)) {
            console.log('THIS IS ' + document.location.href + ' but we\'re comparing to ' + inp + '. THIS IS BAD!');
            return inp;
        }

        //calculate the real page-url..
        //TODO: is _spPageContextInfo.serverRequestPath what I'm looking for?!
        stop = Math.min.apply(Math, [document.location.href.indexOf('?', offset),
            document.location.href.indexOf('#', offset)].filter(function (x) {
                return x > -1
            }));
        if (stop === window.Infinity) {
            stop = document.location.href.length;
        }
        url = window.decodeURIComponent(document.location.href.substring(offset, stop));
        return window.location.href.substring(0, window.location.href.indexOf('/_layouts')) + url;
    };
    analytics.mdsGaClenaup = function (loc) {
        if(loc.page){
            loc.page = analytics.mdsReplaceStartAspx(loc.page);
        }
        if(loc.location){
            loc.location = analytics.mdsReplaceStartAspx(loc.location);
        }
        return loc;
    }
    analytics.mdsGaBuildHitTask = function(oldTask, model) {
        var loc = {
                page: model.get('page'),
                location: model.get('location')
            };
        loc = analytics.mdsGaClenaup(loc);
        model.set(loc, null, true);
        return oldTask.call(this, model);
    };
    analytics.mdsGaGet = function (oldGet, field) {
        if (field !== 'page' && field !== 'location') {
            return oldGet.call(this, field);
        }
        var loc = {
            page: oldGet.call(this, 'page'),
            location: oldGet.call(this, 'location')
        };
        loc = analytics.mdsGaClenaup(loc);
        return loc[field];
    };
    
    analytics.mdsGaPlugin = function(tracker) {
        /* This is a ga-plugin (https://developers.google.com/analytics/devguides/collection/analyticsjs/writing-plugins)
            * it will re-write the url of a page, when MDS is active - i.e. after navigating to 
            * _layouts/15/start.aspx#/path/to/real/page.aspx googleAnalytics will "recieve" /path/to/real/page.aspx
            * so that ga does not list start.aspx all the time...
            * 
            * The "how-to-override-the-url"-part 
            * was proudly "stolen" from https://github.com/googleanalytics/autotrack/blob/master/lib/plugins/clean-url-tracker.js
            */
        var oldGet = tracker.get,
            oldTask;
        tracker.get = analytics.mdsGaGet.bind(tracker, oldGet);
        oldTask = tracker.get('buildHitTask');
        tracker.set('buildHitTask', analytics.mdsGaBuildHitTask.bind(tracker, oldTask));
    };
    analytics.doTracking = function () {
        if (!analytics.trackingId) {
            return;
        }
        // How do we check, if the tracker was successfully created?!
        if (!window.ga._analytics4sp) {
            //initialize ga!
            window.ga._analytics4sp = true;
            window.ga('create', analytics.trackingId, 'auto');
            window.ga('provide', 'mdsGaPlugin', analytics.mdsGaPlugin);
            window.ga('require', 'mdsGaPlugin');
            analytics.ga = window.ga; // window.ga was probably modified by google-script. save the modified version for later...
        }

        window.ga('send', 'pageview');
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