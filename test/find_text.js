var netention = require('../netention');


console.log('Searching...');

var text = process.argv[2];

netention.links( { 'content': text }, function(node) {
    console.log(node);
}, function() {
    console.log('Finished');
});
