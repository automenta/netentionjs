var schema, code;
var types = {};
var nodeID, node = { };
var code;

function getSchemaRoots() {
    var roots = { };
    $.each(schema.types, function(k, v) {
        if (v.ancestors.length == 1) {
            if (v.ancestors[0] == 'Thing')
                roots[k] = v;
        }
    });
    return roots;            
}
function getSchemaChildren(parent) {
    var roots = { };
    var count = 0;
    var maxItems = 500;
    $.each(schema.types, function(k, v) {
        for (var i = 0; i < v.ancestors.length; i++) {
            if (v.ancestors[i] == parent) {                        
                roots[k] = v;
                count++;
            }
            if (count > maxItems)
                return roots;
        }
    });
    return roots;                        
}

function loadTypeMenu(parent, children) {
    if (parent!=null)
        if (children.length == 0)
            if (schema.types[parent].properties.length < 1)
                return '';

    var s = '';
        $.each(children, function(k, v) {
            var sc = getSchemaChildren(k);
            var scLen = Object.keys(sc).length;
            //s+= '<li><a href="#">' + k + ' ' + scLen + '</a></li>';

            var tt = '';
            if (scLen > 0) {               
                tt = loadTypeMenu(k, sc);
            }
            s+= '<li><a href="javascript:addType(\'' + k + '\', null, null)">' + v.label + '</a>' + tt + '</li>';
        });

        return '<ul>' + s + '</ul>';

}

function getProperties(type) {
    return schema.types[type].properties;
}

function isCommonProperty(v) {
    return (v == 'url') || (v == 'description') || (v == 'name') || (v == 'image');
}
function isDataPropertyType(v) {
    return (v == 'Integer') || (v == 'URL') || (v=='Text') || (v=='Boolean') || (v=='Geo') || (v=='Float') || (v=='Date') || (v=='DataType') || (v=='Number') || (v=='Thing');
}
function isSupertype(parent, child) {
    if (isDataPropertyType(child)) {
        return false;
    }
    var parents = schema.types[child];
    if (parents==undefined)
        return false;

    parents = parents.supertypes;
    $.each(parents, function(t) {
        if (t == parent)
            return true;
        if (isSupertype(parent, t))
            return true;               
    });
    return false;
}

function loadPropertiesMenu(type, history) {
    var MAXDEPTH = 3;

    if (history == undefined) history = [ type ];
    var level = history.length - 1;
    if (level >= MAXDEPTH) return '';

    var t = '';
    var props = getProperties(type);

    $.each(props, function(k, v) {
        if (isCommonProperty(v)) {
            //do not add
        }
        else if (schema.properties[v].comment.indexOf('legacy spelling')!=-1) {

        }
        else {
            var label = schema.properties[v].label;
            var range = schema.properties[v].ranges[0];

            if (isDataPropertyType(range))  {
                t += '<li><a href="javascript:addProperty(\'' + v + '\', \'' + history + '\')">' + label + '</a></li>';                        
            }
            else if (level < MAXDEPTH-1) {
                if (!isSupertype(type, range)) {
                    if (schema.types[range].properties.length > 0) {
                        history.push(v);
                        t += '<li>' + label + loadPropertiesMenu(range, history) + "</li>";
                        history.pop();
                    }
                }
            }
        }
    });
    if (level == 0)
        t += '<li><a href="javascript:removeType(\'' + type + '\')"><i>Remove</i></a></li>';
    return '<ul> ' + t + '</ul>';
}

function isDataType(t) {
    return (t == 'Text') || (t == 'Boolean') || (t == 'URL') || (t == 'Integer') || (t == 'Float') || (t == 'Number') || (t == 'Date') || (t=='Thing');
}

function addProperty(tt) {
    var t = '', s = tt;
    if (tt.indexOf('/')!=-1) {
        t = tt.substring(0, tt.indexOf('/'));
        s = tt.substring(tt.indexOf('/')+1, tt.length);
    }
    var prop = schema.properties[s];

    //TODO handle multiple range types
    var range = prop.ranges[0];

    if (isDataType(range)) {
        var source = $('#NodeSource');

        var newLine = s + ': ';

        var line = code.getLine(code.lineCount()-1);
        var prefix;
        if (line.length > 0)
            prefix = '\n';
        else
            prefix = '';

        var tl = code.lineCount()-1;

        code.setLine(tl, code.getLine(tl) + prefix + newLine);
        code.refresh();
        code.focus();

        source.focus();                
    }
    else {
        console.log('can not add property: ' + tt);
    }
}

function addType(t, forClass, forProp) {
    if (types[t] == undefined) {
        var v = schema.types[t];
        var p = '';
        if (forProp!=null) {
            p = forProp + '/';
        }
        $('#EditMenu').append('<li><a href="#">' + p + v.label + '</a>' + loadPropertiesMenu(t) + '</li>');
        $('ul.sf-menu').superfish();
    }
    types[t] = true;
}

function updateCode(from, to, text, next) {
    var currentLine = code.getCursor().line;     
    var line = code.getLine(currentLine);
    var status = $('#Status');
    if (currentLine == 0) {
        status.html("Enter a name for this object on the first line.");                
    }
    else if (line.indexOf(':')!=-1) {
        var p = line.substring(0, line.indexOf(':'));
        var prop = schema.properties[p];
        if (prop == undefined) {
            status.html('Property "' + p + '" not defined.  Did you mean...');
        }
        else {
            var name = prop.label;
            var comment = prop.comment;
            var type = prop.ranges[0];
            status.html('<b>' + name + '(' + p + ': ' + type + ')</b><br/>' + comment + '<br>Suggested Values: [not implemented yet]' );
        }
    }
    else {
        status.html('');
    }
    //TODO colorize lines
}


function editNode(id) {            
    nodeID = id;


    if (nodeID!=null) {
        $.getJSON('/node/' + nodeID + '/json', function(data) {
            node = data;
            console.log(node);
            code.setValue( node.content );

            for (var i = 0; i < node.types.length; i++) {
                var t = node.types[i];
                addType(t);
            }
        });
        $.gritter.add({
                title: 'Editing Node: ' + nodeID,
                text: 'Ready.'
        });
    }
    else {
        code.setValue('Name\n');
        $.gritter.add({
                title: 'Editing a New Node',
                text: 'Ready.'
        });
    }

    code.setLineClass(0, 'firstLine', '');
    code.refresh();
    code.focus();

    //$('#NodeSource').html('Name\n');

//            var a = $('#AddTypeMenuItem');
//            $.each(getSchemaRoots(), function(k, v) {
//               a.append('<li>' + k + ':' + schema.types[k] + '<ul>' + loadMenu(k) + '</ul></li>');
//            });
    //$('#AddTypeMenuItem').append(loadMenu(null));

    $('#EditMenu').html('<li><a href="#">[+]</a>' + loadTypeMenu(null, getSchemaRoots()) + '</li>');

    $('ul.sf-menu').superfish( {
            delay:       0,                            // one second delay on mouseout 
            animation:   {opacity:'show',height:'show'},  // fade-in and slide-down animation 
            speed:       'fast'                          // faster animation speed                     
    });

   $('#editArea').show();



}


function loadSchema(whenSchemaLoaded) {
    $.getJSON('/schema.org.json', function(data) {
       schema = data; 
       whenSchemaLoaded();
    });            
}

function commitNode() {
    code.save();
    if (nodeID!=undefined)
        node._id = nodeID;
    node.content = code.getTextArea().value;

    var typesList = [];
    $.each(types, function(k, v) {
        typesList.push(k);
    });
    node.types = typesList;

    return node;
}

function deleteNode() {
    var r=confirm("Delete this node?");
    if (r) {
        $.getJSON('/node/' + nodeID + '/remove', function(data) {
            editNode(null);
            loadNodes();
        });
    }
}

function updateNode() {
    var g = $.gritter.add({
            title: 'Saving New Node',
            text: 'Standby...'
    });

    $.post('/agent/' + agentID + '/updatenode', 
      { 'node': commitNode() },
      function(data) {
        $.gritter.remove(g);
        $.gritter.add({
                title: 'Saved',
                text: 'Result: ' + data
        });
        nodeID = data;
        node._id = nodeID;
        loadNodes();
    });
}        

function loadNodes() {
    $.getJSON('/agent/' + agentID + '/nodes', function(data) {
        $('#listAreaList').html('');
        for (var i = 0; i < data.length; i++) {
            var nodeID = data[i];
            $.getJSON('/node/' + nodeID + '/json', function(data) {
                var title = data.content.split('\n')[0];
                $('#listAreaList').append('<li><a href="/agent/' + agentID + '/' + data._id + '">' + title + "</a></i>");
            });
        }
    });

}

$(document).ready(function(){
    $.extend($.gritter.options, { 
            position: 'bottom-right', // defaults to 'top-right' but can be 'bottom-left', 'bottom-right', 'top-left', 'top-right' (added in 1.7.1)
            fade_in_speed: 'medium', // how fast notifications fade in (string or int)
            fade_out_speed: 2000, // how fast the notices fade out
            time: 4000 // hang on the screen for...
    });        

    code = CodeMirror.fromTextArea(document.getElementById('NodeSource'), {
        value: 'Name\n',
        mode:  "javascript",
        autofocus: true,
        theme: 'default',
        smartIndent: false,
        onCursorActivity: updateCode
    });

    loadSchema(function() {
        loadNodes();
        onStart();
    });
    
});

var onStart = function() { }
