(function(){
    var cancelClick = function () {
        var url = '',
            source = document.location.href.match('[\?&]Source=[^\&]+');
        if (source && source.length > 0) {
            url = decodeURIComponent(source[0].substring(8));
        } else {
            url = _spPageContextInfo.siteAbsoluteUrl;
            url += '/' + _spPageContextInfo.layoutsUrl + '/settings.aspx';
        }
        document.location.href = url;
        },
        okClick = function () {
            var trackerInput = document.getElementById('trackingId');
                ctx = SP.ClientContext.get_current(),
                web = ctx.get_site().get_rootWeb(),
                properties = web.get_allProperties();
            console.log('save: ' + trackerInput.value)
            ctx.load(properties);
            ctx.executeQueryAsync(function () {
                properties.set_item('ganalytics4sp.trackingId', trackerInput.value || '');
                web.update();
                ctx.load(web);
                ctx.executeQueryAsync(function () {
                    cancelClick();
                }, function (err) {
                    console.log && console.log(err.get_message());
                });
            }, function (err) {
                console.log && console.log(err.get_message());
            });
        },
        attachEvent = function (elm, event, handler) {
            if(elm.addEventListener) {
                elm.addEventListener(event, handler, false);
            }
            else if (elm.attachEvent) {
                elm.attachEvent('on' + event, handler);
            }
        },
        load = function () {
        var ctx = SP.ClientContext.get_current(),
            properties = ctx.get_site().get_rootWeb().get_allProperties();
        ctx.load(properties);
        ctx.executeQueryAsync(function () {
            var trackerInput = document.getElementById('trackingId'),
                okBtn = document.getElementById('analytics-ok'),
                cancelBtn = document.getElementById('analytics-cancel'),
                trackingId = properties.get_fieldValues()['ganalytics4sp.trackingId'] || '';
            trackerInput.value = trackingId;
            trackerInput.removeAttribute('readonly');
            trackerInput.removeAttribute('disabled');
            attachEvent(okBtn, 'click', okClick);
            okBtn.classList.remove('disabled');
            attachEvent(cancelBtn, 'click', cancelClick);
            cancelBtn.classList.remove('disabled');
        }, function (err) {
            console.log && console.log(err.get_message());
        });
    };
    if (!SP.SOD.executeOrDelayUntilScriptLoaded(load, 'sp.js')) {
        SP.SOD.executeFunc('sp.js', null, function () { });
    }
}())