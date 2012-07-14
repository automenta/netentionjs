var nStore = require('nstore');
nStore = nStore.extend(require('nstore/query')());

var express = require('express');
var ejs = require('ejs');
var fs = require('fs');

var agents = nStore.new('data/users.db', function () {
    // It's loaded now
    });
var nodes = nStore.new('data/nodes.db', function () {
    // It's loaded now
    });

var server = express.createServer();
server.use(express.bodyParser());

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
    res.send( ejs.render(data, {
        }));
});

useTemplate('/agent/:agent', 'agent.html', function(data, req, res) {
    var agentID = req.params.agent;
  
    agents.get(agentID, function (err, doc, key) {
        
        var a = doc;
        
        if (err) { 
            var newUser = { };
            agents.save(agentID, {
                nodes: []
            }, function(err) { 
                if (err) {
                    throw err;
                }
            });
            a = newUser;
            
        }

        res.send( ejs.render(data, {
            agent: [
            agentID
            ]
        }));

    });

});

function randomUUID() {
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function updateNode(agentID, nodeID, f) {
    
    agents.get(agentID, function (err, agent, key) {

        if (err != null)
            return;
        
        if (agent == undefined)
            return;
        
        var node = f(agent);
        
        console.log('updating: ' + agentID + '/' + nodeID);
        
        agents.save(agentID, agent, function(err) { 
            if (err) {
                throw err;
            }
        });
        nodes.save(nodeID, node, function(err) {
            if (err) {
                throw err;
            }            
        });

    });    
    return nodeID;
}

function newNode(agentID, node) {
    var nodeID = randomUUID();
    updateNode(agentID, nodeID, function(agent) {
        agent.nodes.push(nodeID);
        return node;        
    });
    return nodeID;
}


server.post('/agent/:agent/newnode', function(req,res) {
    var agentID = req.params.agent;
    var n = newNode(agentID, req.body.node);
    res.json(n);
});
server.get('/agent/:agent/nodes', function(req,res) {
    var agentID = req.params.agent;
  
    agents.get(agentID, function (err, doc, key) {
        res.json( doc.nodes );
    });
    
});

server.get('/agents', function(req,res) {
    agents.all(function (err, results) {
        res.json(results);
    });
});

server.get('/', function(req,res) {
    res.redirect('/index.html');
});
server.use(express.static(__dirname + '/file', {
    maxAge: 24*60*60*365
}));

server.listen(3000);
