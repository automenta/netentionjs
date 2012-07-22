var express = require('express');
var ejs = require('ejs');
var fs = require('fs');
var apricot = require('apricot').Apricot;

var netention = require('./netention');
var rss = require('./rss');

var passport = require('passport')
  , OpenIDStrategy = require('passport-openid').Strategy;


passport.use(new OpenIDStrategy({
    returnURL: 'http://24.131.65.218:9090/auth/openid/return',
    realm: 'http://24.131.65.218:9090'
  },
  function(identifier, done) {
      console.log('Authenticated: ' + identifier);
      done(null, identifier);
  }
));

var server = express.createServer();

server.use(express.bodyParser());
server.use(express.favicon());
server.use(express.cookieParser());
server.use(passport.initialize());
server.use(passport.session());
server.use(express.static(__dirname + '/file', {
    maxAge: 24*60*60*365
}));

passport.serializeUser(function(user, done) {
    console.log('serializing: ' + user);
  done(null, JSON.stringify(user));
});

passport.deserializeUser(function(id, done) {
    console.log('deserializing: ' + id);
//  User.findOne(id, function (err, user) {
    done(null, JSON.parse(id));
//  });
});

//f = function(fileData, req, res) { }
function useTemplate(path, file, f) {
    server.get(path,  /*passport.authenticate('openid', { session: false , successFlash: 'Welcome' }),*/ function(req, res){
        fs.readFile(file, 'ascii', function(err, data){
            if(err) {                
                console.error(err);
                next();
            }
            console.log('serving ' + path + ' to ' + req.user);

            f(data, req, res);
        });
    });
}

function getAgentID() {    
    return 'Anonymous';
}

useTemplate('/nodes', 'node.html', function(data, req, res) {
    sendAgentPage(data, res, getAgentID(), 'setNodeList();');
});



function sendAgentPage(data, res, agentID, onStartCode) {
    netention.getAgent(agentID, function (a) {
            res.send( ejs.render(data, {
                agent: a,
                onStart: onStartCode                
            }));        
    });    
}

//useTemplate('/agent/:agent', 'agent.html', function(data, req, res) {
//    var agentID = req.params.agent;  
////    var index = { content: "INDEX" };
////    sendAgentPage(data, res, agentID, 'setNodeTo(' + JSON.stringify(index) + ');');
//
//    netention.db.collection('agents', function(err, c) {
//        c.findOne( { '_id': agentID }, function(err2, result) {        
//            var index = JSON.stringify(result.agent.nodes);
//            sendAgentPage(data, res, agentID, 'setList(' + index + ');');
//        });
//    });        
//
//});



useTemplate('/new', 'node.html', function(data, req, res) {
    var x = { content: '' };
    sendAgentPage(data, res, getAgentID(), 'setNodeTo(\'' + JSON.stringify(x) + '\');');
});

//useTemplate('/agent/:agent/:node', 'agent.html', function(data, req, res) {
//    var agentID = req.params.agent;
//    var nodeID = req.params.node;
//    sendAgentPage(data, res, agentID, 'setNodeById(\'' + nodeID + '\');');
//});
//
//server.post('/agent/:agent/updatenode', function(req,res) {
//    var agentID = req.params.agent;
//    if (req.body.node._id == undefined) {
//        req.body.node._id = randomUUID();
//    }
//    updateNode(agentID, req.body.node._id, req.body.node);
//    res.json(req.body.node._id);
//});

function withNode(nodeID, f/*(n)*/) {
   netention.db.collection('nodes', function(err, c) {
        c.findOne( { '_id': nodeID }, function(err, result) {
            if (err==null)
                f(result.node);
        });
   });        
}
function forEachNode(f/*(n)*/) {
   netention.db.collection('nodes', function(err, c) {
       c.find( { 'node' : { $exists : true } } ).toArray(function(err, results) {
           if (results!=null) {
              for (var i = 0; i < results.length; i++) {
                  var r = results[i];
                  var r2 = { };                  
                  r2._id = r._id;
                  
                  var maxTitleLength = 32;
                  var title = r.node.title;
                  if (title == undefined) {
                        title = r.node.content;
                        if (title == undefined) title = '';
                        if (title.length> maxTitleLength) 
                            title = title.substring(0, maxTitleLength-1);
                  }
   
                  r2.node = { 'title': title  };
                  f(r2);
              }
           }
       });
   });
    
}

function sentencize(urlOrText, f) {
   
   var rootNode;
   
   var p = function(err, doc) {
       if (err==null) {
           var str = doc.toHTML;
           str=str.replace(/<br>/gi, "\n");
           str=str.replace(/<p.*>/gi, "\n");
           str=str.replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 (Link->$1) ");
           str=str.replace(/<(?:.|\s)*?>/g, "");
                          
           var linesPreFilter = str.split("\n");
           var slines = [];
           var i;
           for (i = 0; i < linesPreFilter.length; i++) {
               var t = linesPreFilter[i].trim();               
               if (t.length > 0) {
                   slines.push(t);
               }                  
           }    
           
           var lines = [];
           for (i = 0; i < slines.length; i++) {
                var nodeID = rootNode + '.' + i;
                var agentID = 'sentencize';
                var a = { content: slines[i] };
                if (i > 0) {
                    a.previous = rootNode + '.' + (i-1);
                }
                if (i < slines.length-1) {
                    a.next = rootNode + '.' + (i+1);
                }

                var nt = netention.updateNode(nodeID, a, null )
                lines.push(nt);
               
           }
           
           f(lines);
       }
       else {
           console.log('ERROR: ' + err);
           f(err);
       }
   }
   
   if (urlOrText.indexOf('http://')==0) {
       rootNode = urlOrText;
       rootNode = rootNode.replace(/http:\/\//g, "");
       rootNode = rootNode.replace(/\//g, "_");
       //rootNode = netention.randomUUID();
       apricot.open(urlOrText, p, true);
   }
   else {
       var summaryLength = 16;
       if (urlOrText.length < summaryLength)
           summaryLenth = urlOrText.length;
       rootNode = urlOrText.substring(0, summaryLength);
       rootNode = encodeURIComponent(rootNode);
       apricot.parse(urlOrText, p);       
   }
}


server.post('/add/rss', function(req, res) {
    var url = req.body.url;
    rss.addRSS(url, function (n) {
        res.json(n);
    });
});

//server.get('/agent/:agent/json', function(req,res) {
//    var agentID = req.params.agent;
//    
//    netention.db.collection('agents', function(err, c) {
//        c.findOne( { '_id': agentID }, function(err, result) {
//            res.json(result.agent);
//        });
//    });        
//});
useTemplate('/node/:node', 'node.html', function(data, req, res) {
    var nodeID = req.params.node;
    
    netention.db.collection('nodes', function(err, c) {
        c.findOne( { '_id': nodeID }, function(err, result) {
            if (result!=null) {
                result.node._id = nodeID;
                sendAgentPage(data, res, getAgentID(), 'setNodeTo(' + JSON.stringify(result.node) + ');');
            }
        });
    });        
});
useTemplate('/', 'node.html', function(data, req, res) {
    sendAgentPage(data, res, getAgentID(), 'sidebar(true);');
});

server.get('/node/:node/json', function(req,res) {
    var nodeID = req.params.node;
    
    netention.db.collection('nodes', function(err, c) {
        c.findOne( { '_id': nodeID }, function(err, result) {
            if (result!=null) {
                result.node._id = nodeID;
                res.json(result.node);
            }
        });
    });        
});
server.get('/node/:node/remove', function(req,res) {
    var nodeID = req.params.node;
    
    netention.db.collection('nodes', function(err, c) {
        c.remove( { '_id': nodeID }, function(err, result) {
            res.json(result);
        });
    });        
});

//server.post('/node/:node/nodesummary', function(req,res) {
//    var nodeIDs = req.body.nodes;
//    
//    for (var i = 0; i < nodeIDs.length; i++) {
//        var nodeID = nodeIDs[i];
//        var node = getNode(nodeID);
//        
//    }
//    netention.db.collection('nodes', function(err, c) {
//        c.findOne( { '_id': nodeID }, function(err, result) {
//            res.json(result.node);
//        });
//    });        
//});

//server.get('/agents', function(req,res) {
//    netention.db.collection('agents', function(err, c) {
//        c.find().toArray(function(err, results) {        
//            var keys = [];
//            for (var i = 0; i < results.length; i++)
//                keys.push(results[i]._id);
//            res.json(keys);
//        });
//    });        
//});

server.get('/login', function(req,res) { res.redirect('/login.html'); });



 
var app = server.listen(9090);

var everyone = require("now").initialize(app);

//everyone.now.distributeMessage = function(message){
//  everyone.now.receiveMessage(this.now.name, message);
//};
everyone.now.forEachNode = forEachNode;
everyone.now.sentencize = sentencize;
everyone.now.updateNode = netention.updateNode;


// Accept the OpenID identifier and redirect the user to their OpenID
// provider for authentication.  When complete, the provider will redirect
// the user back to the application at
// /auth/openid/return
server.post('/auth/openid', passport.authenticate('openid'));

// The OpenID provider has redirected the user back to the application.
// Finish the authentication process by verifying the assertion.  If valid,
// the user will be logged in.  Otherwise, authentication has failed.
server.get('/auth/openid/return', 
  passport.authenticate('openid', { successRedirect: '/',
                                    failureRedirect: '/login' }));