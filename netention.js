var mongo = require('mongodb'),
  Server = mongo.Server,
  Db = mongo.Db;

var agents, nodes;
var mongoServer = new Server('localhost', 27017, {auto_reconnect: true});
var db = new Db('netention', mongoServer);


db.open(function(err, db) {
  if(!err) {
     console.log("DB connected");
     db.createCollection('nodes', function(err, collection) {});     
  }
  else {
     console.log("DB: " + err);
  }
});


function randomUUID() {
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function updateNode(nodeID, node, callback) {
    var agentID = 'Anonymous';
    if (nodeID == null)
        nodeID = randomUUID();
    
    //console.log(agentID + ' updating node ' + nodeID + ' with ' + node);
    
    db.collection('nodes', function(err, c) {
        if (err!=null) {
            console.log('collection: nodes ' + err);
        }
        
        //c.update({ '_id': agentID }, {$addToSet: { 'agent.nodes': nodeID }});

        node.author = agentID;
        c.save( {'_id': nodeID, 'node': node }, { }, function(err, record){ 
            if (err!=null) {
                console.log('collection: nodes, save ' + nodeID + ': '+ err);                
            }
            else {
                if (callback!=null)
                    callback(nodeID);
            }            
        });
    });
    
    return nodeID;
}
function getAgent(agentID, f) {
    db.collection('nodes', function(err, c) {
        c.findOne({ '_id': agentID}, function(err, agent) {
            var a = agent;
            if (agent == null) {
                a = newAgent();
                c.save( {'_id': agentID, 'agent': a }, { }, function(err, record){ });
            }
            f(a);
        });
    });        
}

function newAgent() {
    return { nodes: [] };
}

function deleteNodes(nodeArray, callback) {
    db.collection('nodes', function(err, c) {
        var errs = null;
        for (var i = 0; i < nodeArray.length; i++) {
            var n = nodeArray[i];
            c.remove({_id: n}, {safe:true}, function(err, result) {
                if (err!=null) {
                    console.log('ERROR removing: ' + err);
                    if (errs == null) errs = [ err ];
                    else errs.push(err);
                }
                else {
                    console.log('Removed ' + result);                    
                }
            });
        }
        callback(errs);
    });    
}


exports.db = db;
exports.updateNode = updateNode;
exports.deleteNodes = deleteNodes;
exports.getAgent = getAgent;
exports.randomUUID = randomUUID;