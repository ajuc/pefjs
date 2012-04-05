var a = {
	"nodes" : [
			{
				"name" : 1,
				"label" : {
					"type" : "plain",
					"value" : "start"
				},
				"position" : [ 135, 93 ],
				"stencil" : "circle",
				"userData" : {
					"data" : "{\n\"message\" : function(game) {\n},\n\"action\": function(game) {\n}\n}"
				}
			},
			{
				"name" : 2,
				"label" : {
					"type" : "plain",
					"value" : "stop"
				},
				"position" : [ 235, 93 ],
				"stencil" : "circle",
				"userData" : {
					"data" : "{\n\"message\" : function(game) {\n},\n\"action\": function(game) {\n}\n}"
				}
			} ],
	"edges" : [ {
		"src" : 1,
		"dst" : 2,
		"label" : null,
		"stencil" : "line",
		"userData" : {
			"data" : "{\"condition\": function(game){return true;}, \"action\":function(game) {}}"
		}
	} ],
	"defaultNodeStencil" : "circle",
	"defaultEdgeStencil" : "line"
};