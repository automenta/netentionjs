var FeedParser = require('feedparser')
  , parser = new FeedParser()
  , request = require('request');

var netention = require('./netention');

var url = 'http://pittsburgh.craigslist.org/cpg/index.rss';

parser.parseUrl(url,  function (error, meta, articles) {
  //https://github.com/danmactough/node-feedparser
  
//  var agentID = meta.link + '_rss';
//  agentID = agentID.replace('/', '-'); 
  var agentID = 'rss';
  
  netention.getAgent(agentID, function(a) { });
  
  if (error) console.error(error);
  else {
    
    console.log('Feed info');
    console.log('%s - %s - %s', meta.title, meta.link, meta.xmlUrl);
    console.log('Articles');
    
    articles.forEach(function (article){
      //var nodeID = article.guid;
      var nodeID = netention.randomUUID();
        
      article.content = article.title + '\n' + article.description;
      delete article.title;
      delete article.description;
      
      console.log('%s - %s (%s)', article.date, article.title, article.link);
      var n = netention.updateNode(agentID, nodeID, article)
      console.log('  ' + n);
    });
    
  }
  
});
