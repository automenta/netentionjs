var netention = require('../netention');

var url = process.argv[2];

netention.addSentencized(url, function(lines) {
   for (var i = 0; i < lines.length; i++) {
       netention.getNode(lines[i], function(n) {
          console.log(n); 
       });
   }
});