var netention = require('../netention');


console.log('Searching...');

var text = process.argv[2];

netention.forEachLink( { 'content': text }, function(node, reason) {
    console.log(node);
}, function() {
    console.log('Finished');
});
