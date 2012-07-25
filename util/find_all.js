var netention = require('../netention');


console.log('Searching...');

netention.forEachNode({}, function(node) {
    console.log(node);
}, function() {
    console.log('Finished');
});
