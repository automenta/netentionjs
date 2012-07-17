var express = require('express');
var ejs = require('ejs');
var fs = require('fs');
    
var netention = require('./netention');


var server = express.createServer(express.bodyParser()
  , express.favicon()
  , express.cookieParser()
  , express.session({ secret: '3423fewf'})
  );
  
server.use(express.bodyParser());
server.use(express.static(__dirname + '/file', {
    maxAge: 24*60*60*365
}));
  
//f = function(fileData, req, res) { }
function useTemplate(path, file, f) {
    server.get(path, function(req, res){
        fs.readFile(file, 'ascii', function(err, data){
            if(err) {                
                console.error(err);
                next();
            }

            f(data, req, res);
        });
    });
}

useTemplate('/index.html', 'index.html', function(data, req, res) {
    res.send( ejs.render(data, { }));
});



function sendAgentPage(data, res, agentID, onStartCode) {
    netention.getAgent(agentID, function (a) {
            res.send( ejs.render(data, {
                agent: a,
                onStart: onStartCode                
            }));        
    });    
}

useTemplate('/agent/:agent', 'agent.html', function(data, req, res) {
    var agentID = req.params.agent;  
//    var index = { content: "INDEX" };
//    sendAgentPage(data, res, agentID, 'setNodeTo(' + JSON.stringify(index) + ');');

    netention.db.collection('agents', function(err, c) {
        c.findOne( { '_id': agentID }, function(err2, result) {        
            var index = JSON.stringify(result.agent.nodes);
            sendAgentPage(data, res, agentID, 'setList(' + index + ');');
        });
    });        

});

server.get('/agent/:agent/nodes', function(req,res) {
    var agentID = req.params.agent;
    
    netention.db.collection('agents', function(err, c) {
        c.findOne( { '_id': agentID }, function(err2, result) {        
            res.json(result.agent.nodes);
        });
    });        
});

useTemplate('/agent/:agent/:node', 'agent.html', function(data, req, res) {
    var agentID = req.params.agent;
    var nodeID = req.params.node;
    sendAgentPage(data, res, agentID, 'setNodeById(\'' + nodeID + '\');');
});

server.post('/agent/:agent/updatenode', function(req,res) {
    var agentID = req.params.agent;
    if (req.body.node._id == undefined) {
        req.body.node._id = randomUUID();
    }
    updateNode(agentID, req.body.node._id, req.body.node);
    res.json(req.body.node._id);
});

function withNode(nodeID, f) {
   netention.db.collection('nodes', function(err, c) {
        c.findOne( { '_id': nodeID }, function(err, result) {
            if (err==null)
                f(result.node);
        });
   });        
}

server.get('/agent/:agent/json', function(req,res) {
    var agentID = req.params.agent;
    
    netention.db.collection('agents', function(err, c) {
        c.findOne( { '_id': agentID }, function(err, result) {
            res.json(result.agent);
        });
    });        
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

server.get('/agents', function(req,res) {
    netention.db.collection('agents', function(err, c) {
        c.find().toArray(function(err, results) {        
            var keys = [];
            for (var i = 0; i < results.length; i++)
                keys.push(results[i]._id);
            res.json(keys);
        });
    });        
});

server.get('/', function(req,res) {
    res.redirect('/index.html');
});



 
server.listen(9090);
