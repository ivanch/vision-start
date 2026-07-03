function request_image(url) {
    return new Promise(function(resolve, reject) {
        var img = new Image();
        var settled = false;
        function settleOk() {
            if (settled) return;
            settled = true;
            clearTimeout(failTimer);
            img.onload = img.onerror = null;
            resolve(img);
        }
        function settleFail() {
            if (settled) return;
            settled = true;
            clearTimeout(failTimer);
            img.onload = img.onerror = null;
            reject(url);
        }
        img.onload = settleOk;
        img.onerror = settleFail;
        img.src = url + '?random-no-cache=' + Math.floor((1 + Math.random()) * 0x10000).toString(16);
        var failTimer = setTimeout(settleFail, 5000);
    });
}

function ping(url, multiplier) {
    return new Promise(function(resolve, reject) {
        var start = (new Date()).getTime();
        var response = function() {
            var delta = ((new Date()).getTime() - start);
            delta *= (multiplier || 1);
            resolve(delta);
        };
        request_image(url).then(response).catch(response);
    });
}

export default ping;
