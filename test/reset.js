var netention = require('../netention');

console.log('Resetting..');
netention.reset(function() {
    console.log('finished');
});
