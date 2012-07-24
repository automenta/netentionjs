var apricot = require('apricot').Apricot;

var mongo = require('mongodb'),
  Server = mongo.Server,
  Db = mongo.Db;

var agents, nodes;
var mongoServer = new Server('localhost', 27017, {auto_reconnect: true});
var db = new Db('netention', mongoServer);



function start(f) {
    db.open(function(err, db) {
      if(!err) {
         console.log("MongoDB connected");
         db.createCollection('nodes', function(err, collection) {});     
         f();
      }
      else {
         console.log("DB: " + err);
      }
    }); 
}

//clears and reinitializes the database
function reset(callback) {
    var nodes = [];
    forEachNode({ }, function(e) {
        nodes.push(e._id);
    }, function() {
        deleteNodes(nodes, function(errs) {            
            callback(errs);
        })
    });
}

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
        if (node.when == undefined)
            node.when = Date.now();
        
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

function forEachNodeOLD(f/*(n)*/) {
   db.collection('nodes', function(err, c) {
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

function finalizeNode(n) {
    var maxTitleLength = 32;
                        
    var title = n.node.title;
    if (title == undefined) {
          title = n.node.content;
          if (title == undefined) title = '';
          if (title.length> maxTitleLength) 
              title = title.substring(0, maxTitleLength-1);
    }
    n.node.title = title;
    return n;   
}

function forEachNode(query, forEach, whenFinished) {
    db.collection('nodes', function(err, c) {
        var stream = c.find(query).streamRecords();
        if ((whenFinished!=null) && (whenFinished!=undefined))
            stream.on("end", whenFinished);           
        stream.on("data", function(n) {
            if (n.node!=undefined) {
                forEach(finalizeNode(n));
            }
        });
        
    });
}


function getNode(nodeID, f) {
    db.collection('nodes', function(err, c) {
        c.findOne({ '_id': nodeID}, function(err, node) {
            if (err==null) {
                f(node);
            }
            else {
                console.log(err);
            }
        });
    });        
}

//deprectaed
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
            });
        }
        callback(errs);
    });    
}

function getProperty(s) {
    //TODO implement
    return true;
}

//inputs string and outputs { text: '...', properties: [ ... ] }
function parseContent(c) {
     var lines = c.split('\n');
     var t = '';
     var properties = [];
     for (var i = 0; i < lines.length; i++) {
         var propPushed = false;

         var l = lines[i];
         var colIndex = l.indexOf(':');
         if (colIndex!=-1) {
            var propName = l.substring(0, colIndex-1);
            if (propName.indexOf(' ')==-1) {
                if (getProperty(propName)!=null) {
                    properties.push(l);
                    propPushed = true;
                }
            }
         }
         
         if (!propPushed)
             t += lines[i] + "\n";
     }
     
     return { text: t, 'properties': properties };
}

function forEachLink(nodeOrNodeID, forEach/*(node, reasons)*/, whenFinished) {
    var n = nodeOrNodeID;
    if (n.length != undefined) {
        getNode(n, function(f) {
            forEachLink(f.node, forEach, whenFinished);
        });
        return;
    }
    
    //var c = parseContent(n.content);
    
    var types = null;
    if (n.types == undefined)
        types = null;
    else if (n.types.length == 0)
        types = null;
    else
        types = n.types;
    
    
    if (types == null) {
        //full text search, title & content
        var fulltext = n.content;
        var r = {$regex : "(?i)^.*" + fulltext + ".*$"};
        forEachNode( { "node.content": r}, function(x) {
            if (x._id!=n._id)
                forEach(finalizeNode(x), ['matches text']);
        }, whenFinished);
    }
}

function addSentencized(urlOrText, f) {
   
   var rootNode;
   
   var p = function(err, doc) {
       if (err==null) {
           doc.find("script").remove();
           doc.find("style").remove();
           doc.find("head").remove();
           
           var str = doc.toHTML;
           str=str.replace(/\n/g, " ");
           //str=str.replace(/\r/g, " ");
           //str=str.replace(/\t/g, " ");
           str=str.replace(/&nbsp;/gi, " ");
           str=str.replace(/<br>/gi, "\n");
           str=str.replace(/<p.*>/gi, "\n");
           str=str.replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 [$1] ");
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
                a.types = [ 'Sentence' ];

                var nt = updateNode(nodeID, a, null )
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

exports.db = db;
exports.start = start;
exports.forEachNode = forEachNode;
exports.getNode = getNode;
exports.updateNode = updateNode;
exports.deleteNodes = deleteNodes;
exports.getAgent = getAgent;
exports.randomUUID = randomUUID;
exports.forEachLink = forEachLink;
exports.addSentencized = addSentencized;
exports.parseContent = parseContent;
exports.reset = reset;