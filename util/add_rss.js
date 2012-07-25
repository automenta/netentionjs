var netention = require('../netention');
var rss = require('../rss');

var url = process.argv[2];

rss.addRSS(url, function (n) {
    for (var z = 0; z < n.length; z++) {
        netention.getNode(n[z], function(x) {
           console.log(x); 
        });
    }
});
