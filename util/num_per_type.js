var netention = require('../netention');

var types = { };

netention.forEachNode({}, function(node) {
    var t = node.node.types;
    if (t!=null) {
        for (var i = 0; i < t.length; i++) {
            var tt = t[i];
            if (types[tt]==undefined)
                types[tt] = 1;
            else
                types[tt] = types[tt]+1;
        }
    }
}, function() {
    console.log(types);
});
