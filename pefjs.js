if (typeof(ajuc) != undefined) {
	ajuc = {};
}

/***
    Process Engine For Java Script (pefjs)
    
    Copyright 2012 Sebastian "Ajuć" Pidek
    
    You can mail to me ajuc00 on google email service.
    
    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 3 of the License, or
    (at your option) any later version.
 
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
    Niniejszy program jest wolnym oprogramowaniem; możesz go
    rozprowadzać dalej i/lub modyfikować na warunkach Powszechnej
    Licencji Publicznej GNU, wydanej przez Fundację Wolnego
    Oprogramowania - według wersji 3 tej Licencji lub (według twojego
    wyboru) którejś z późniejszych wersji.

    Niniejszy program rozpowszechniany jest z nadzieją, iż będzie on
    użyteczny - jednak BEZ JAKIEJKOLWIEK GWARANCJI, nawet domyślnej
    gwarancji PRZYDATNOŚCI HANDLOWEJ albo PRZYDATNOŚCI DO OKREŚLONYCH
    ZASTOSOWAŃ. W celu uzyskania bliższych informacji sięgnij do
    Powszechnej Licencji Publicznej GNU.

    Z pewnością wraz z niniejszym programem otrzymałeś też egzemplarz
    Powszechnej Licencji Publicznej GNU (GNU General Public License);
    jeśli nie - napisz do Free Software Foundation, Inc., 59 Temple
    Place, Fifth Floor, Boston, MA  02110-1301  USA
    
**/
ajuc.pefjs = (function() {
	/**
	/// Token is a name of node in processdefinition.
	/// We are not just using number of node in array, because number of node
	/// can change when processdefinition changes, so we wouldn't be able to continue execution of process
	/// when processdefinition changed. And we usualy calculate index of nodes by name when
	/// loading processdefinition, so overhead is small.
	/// //TOTHINK if this will become bootleneck - use { name: "nodename", no: number of node or undefined} as a token.
	/// //TOTHINK but for now I don't think it'll be neccessary
	///
	/// Token is used by process engine to mark the nodes in which we
	/// we are currently during the execution of process.
	///
	/// IMPORTANT - we can be in many places 
	/// 
	/// Maybe it's overkill, but we can have many start nodes in process
	///
	/// Start node is a node with userData.data.start === true
	/// 
	/// Starting a process means we put a token in every start node
	/// of this process.
	**/
	function getStartTokensForProcessDefinition(definition) {
		var tokens = [];
		var nodeNo;

		for (nodeNo in definition.nodes) {
			if (definition.nodes[nodeNo].start === true) {
				tokens.push(definition.nodes[nodeNo].name);
			}
		}

		return tokens;
	}

	/// Get node by name, if no such node - return undefined.
	/// This functions is fast when processdefinition has index of nodes by name,
	/// but works also when no index exists - but then it search linearly throught
	/// each node every time.
	function getNodeByName(processDefinition, nodeName) {
		var node;
		var nodeNo;
		
		// if process definition is indexed
		// don't bother searching all nodes
		if (processDefinition.nodeNumbersIndexedByName !== undefined) {
			nodeNo = processDefinition.nodeNumbersIndexedByName[nodeName];
			if (nodeNo !== undefined) {
				return processDefinition.nodes[nodeNo];
			}
			return undefined;
		}


		
		for (nodeNo in processDefinition.nodes) {
			if (processDefinition.nodes[nodeNo].name == nodeName) {
				node = processDefinition.nodes[nodeNo];
			}
		}
		
		return node;
	}

	/// Return outgoing transitions (edges) starting in node with name == nodeName.
	/// If there is index - do it quickly usinng index.
	/// If there is no index - do it painfully slow, but do it neverthless :)
	function getOutgoingTransitions(processDefinition, nodeName) {
		var result = [];
		var numbers = [];
		var i=0;
		var edgeNo=-1;
		
		if (processDefinition.outgoingTransitionsNumbersIndexedBySrcName !== undefined) {
			numbers =
				processDefinition.
					outgoingTransitionsNumbersIndexedBySrcName[nodeName];
			for (i in numbers) {
				result.push(processDefinition.edges[numbers[i]]);
			}
			return result;
		}

		//painfully slow path
		for (edgeNo in processDefinition.edges) {
			if (processDefinition.edges[edgeNo].src===nodeName) {
				result.push(processDefinition.edges[edgeNo]);
			}
		}
		
		return result;
	}

	/// Return incoming transitions (edges) ending on the node with name == nodeName.
	/// If there is index - do it quickly using index.
	/// If there is no index - do it painfully slow, but do it neverthless :)
	function getIncomingTransitions(processDefinition, nodeName) {
		var result = [];
		var numbers = [];
		var i=0;
		var edgeNo=-1;
		
		if (processDefinition.incomingTransitionsNumbersIndexedByDstName !== undefined) {
			numbers =
				processDefinition.
					incomingTransitionsNumbersIndexedByDstName[nodeName];
			for (i in numbers) {
				result.push(processDefinition.edges[numbers[i]]);
			}
			return result;
		}

		//painfully slow path
		for (edgeNo in processDefinition.edges) {
			if (processDefinition.edges[edgeNo].dst===nodeName) {
				result.push(processDefinition.edges[edgeNo]);
			}
		}
		
		return result;
	}
	
	/// calculate index of node numbers by node name
	function indexOfNodesByName(processDefinition) {
		var index = {};
		var nodeNo;

		for (nodeNo in processDefinition.nodes) {
			index[processDefinition.nodes[nodeNo].name] = nodeNo;
		}

		return index;
	}

	/// calculate index of outgoing transitions by node name
	function indexOfOutgoingTransitionsByNodeName(processDefinition) {
		var index = {};
		var outTransitionsForCurrentNode = [];
		var nodeNo;
		var edgeNo;

		for (nodeNo in processDefinition.nodes) {
			
			outTransitionsForCurrentNode = [];
			for (edgeNo in processDefinition.edges) {
				if (processDefinition.edges[edgeNo].src === 
					processDefinition.nodes[nodeNo].name) {
				
					outTransitionsForCurrentNode.push(edgeNo);
				}
			}
			index[processDefinition.nodes[nodeNo].name] =
				outTransitionsForCurrentNode;
		}

		return index;
	}

	/// calculate index of incoming transitions by node name
	function indexOfIncomingTransitionsByNodeName(processDefinition) {
		var index = {};
		var inTransitionsForCurrentNode = [];
		var nodeNo;
		var edgeNo;

		for (nodeNo in processDefinition.nodes) {
			
			inTransitionsForCurrentNode = [];
			for (edgeNo in processDefinition.edges) {
				if (processDefinition.edges[edgeNo].dst === 
					processDefinition.nodes[nodeNo].name) {
				
					inTransitionsForCurrentNode.push(edgeNo);
				}
			}
			index[processDefinition.nodes[nodeNo].name] =
				inTransitionsForCurrentNode;
		}

		return index;
	}
	/// TOCOMMENT
	function destructivelyEvalAndExtractKeys(nodeOrEdge, mapping) {
		var keyInNodeOrEdge, keyInMapping, evaled;
		var ajuc_evaled_xxx_997;
		//alert("toeval:"+(nodeOrEdge.userData["data"]));
		
		if (nodeOrEdge.userData === undefined || nodeOrEdge.userData["data"] === undefined) {
			evaled = {};
		} else {
			try {
				evaled = eval("ajuc_evaled_xxx_997 = "+(nodeOrEdge.userData["data"] + ";"));
			} catch (e) {
				evaled = {};
				//TOTHINK - what to do in such a case?
			}
		}

		for (keyInNodeOrEdge in evaled) {
			for (keyInMapping in mapping) {
				//alert("keyInNodeOrEdge=="+keyInNodeOrEdge+", keyInMapping=="+keyInMapping);
				if (keyInNodeOrEdge === keyInMapping) {
					//HERE IT IS DESTRUCTIVE
					
					nodeOrEdge[mapping[keyInMapping]] =
						evaled[keyInNodeOrEdge];
				}
			}
		}
	}

	/// Load process definition from JSON representation
	/// example of correct process definition is in attached file
	/// example_process_definition_0.js
	///
	/// By default calculate index of nodes by name and put it in processDefinition
	/// to speed up using the processdefinition later
	/// but you can set argument indexNodesByName to false for slower execution
	/// but less memory consumption (not recommended).
	///
	/// By default also calculate index of outgoing transitions for each node name
	/// to speed up using the processdefinition later
	/// but you can set argument indexOutgoingTransitionsByNodeName to false for slower execution
	/// but less memory consumption (not recommended).
	///
	/// Te same goes for index of incoming transitions for each node name
	/// to speed up using the processdefinition later
	/// but you can set argument indexIncomingTransitionsByNodeName to false for slower execution
	/// but less memory consumption (not recommended).
	///
	/// This function also evaluates (using infamous eval) keys from
	/// node.userData and edge.userData and puts the result directly
	/// in node/edge
	/// this isn't regular JSON parsing, but eval, because regular JSON
	/// doesn't support function serialization, and this is important
	/// for conditions on edges and actions on nodes to work. And also when user edits this graph in jsDot editor,
	/// we don't want to break, when he is in the middle of writing some important token. //TOTHINK about it. 
	///
	/// validation is by default true. If true it means when executing process, we validate outgoing transitions
	/// before propagating tokens to them.
	/// Specific info about validation is in destructivelyPropagateTokens(instance, definition, externalState) function
	///
	/// recursivePropagation is by default false, and it means, that when we propagate once,
	/// and the target can propagate further, we don't propagate neverthless. If it is true - then we propagate further as far, as possible.
	/// BEWARE - setting this to true allows for infinite loops caused by buggy process definitions
	/// BEWARE - recursivePropagation === true isn't yet implemented
	function loadProcessDefinition(
			textualRepresentation,
			indexNodesByName,
			indexOutgoingTransitionsByNodeName,
			indexIncomingTransitionsByNodeName,
			userDataKeysToEval,
			validation,
			recursivePropagation
	) {
		//default arguments
		if (indexNodesByName === undefined) {
			indexNodesByName = true;
		}
		if (indexOutgoingTransitionsByNodeName === undefined) {
			indexOutgoingTransitionsByNodeName = true;
		}
		if (indexIncomingTransitionsByNodeName === undefined) {
			indexIncomingTransitionsByNodeName = true;
		}
		if (userDataKeysToEval === undefined) {
			userDataKeysToEval = {};
		}
		if (validation === undefined) {
			validation = true;
		}
		if (recursivePropagation === undefined) {
			recursivePropagation = false;
		}
		
		// these are needed for engine to work
		userDataKeysToEval["action"] = "action";
		userDataKeysToEval["condition"] = "condition";
		userDataKeysToEval["start"] = "start";
		userDataKeysToEval["fork"] = "fork";
		userDataKeysToEval["join"] = "join";
		userDataKeysToEval["kill"] = "kill";
		
		
		//userDataKeysToEval["message"] = "message"; // and this really isn't,
		
		if (recursivePropagation===true) {
			throw {
				name: "Not implemented yet",
				level: "Todo",
				message: "Recursive propagation isn't yet implemented."
			}
		}


		//proper work
		if (textualRepresentation === undefined) {
			throw { name: "Insufficient input data",
				level: "Blocking",
				message: "No data given to load processdefinition from!"
				};
		}
		var processDefinition = JSON.parse(textualRepresentation);
		var nodeNo, edgeNo;
		for (nodeNo in processDefinition.nodes) {
			destructivelyEvalAndExtractKeys( processDefinition.nodes[nodeNo], userDataKeysToEval);
		}
		for (edgeNo in processDefinition.edges) {
			destructivelyEvalAndExtractKeys( processDefinition.edges[edgeNo], userDataKeysToEval);
		}

		if (indexNodesByName) {
			processDefinition.nodeNumbersIndexedByName =
				indexOfNodesByName(processDefinition);
		}
		if (indexOutgoingTransitionsByNodeName) {
			processDefinition.outgoingTransitionsNumbersIndexedBySrcName =
				indexOfOutgoingTransitionsByNodeName(processDefinition);
		}
		if (indexIncomingTransitionsByNodeName) {
			processDefinition.incomingTransitionsNumbersIndexedByDstName =
				indexOfIncomingTransitionsByNodeName(processDefinition);
		}
		
		processDefinition.validation = validation;

		return processDefinition;
	}

	/**
	 * ///TOCOMMENT
	 */
	function onEnterNode(definition, nodeName, externalState, executeActions) {
		var node;

		if (executeActions === undefined) {
			executeActions = true;
		}
		
		if (executeActions === true) {
			node = getNodeByName(definition, nodeName);
			if (node !== undefined && node.action !== undefined) {
				//alert("RUN for " + node.name);
				node.action(externalState);
			}
		}
	}

	/**
	 * ///TOCOMMENT
	 */
	function startProcessInstance(definition, externalState, executeActions) {
		var startTokens =
			getStartTokensForProcessDefinition(definition);
		
		if (executeActions === undefined) {
			executeActions = true;
		}
		
		for (var i in startTokens) {
			onEnterNode(definition, startTokens[i], externalState, executeActions);
		}
		
		var processInstance = {
			"definition": definition,
			"tokens": startTokens
		};

		return processInstance;
	}

	function copyInstance(instance) {
		var newInstance = {
			"definition": instance.definition,
			"tokens": []
		};
		for (tokenNo in instance.tokens) {
			newInstance.tokens.push_back(instance.tokens[tokenNo]);
		}

		return newInstance;
	}
	
	/**
	 * ///TOCOMMENT
	 * 
	 */
	function destructivelyRemoveToken(tokens, currentToken) {
		var index = tokens.indexOf(currentToken);
		if (index!==-1) {
			tokens.splice(index,1);
		}
	}


	
	/**
	 * ///TOCOMMENT
	 * 
	 */
	function destructivelyPropagateTokens(instance, definition, externalState, executeActions) {
		
		if (executeActions === undefined) {
			executeActions = true;
		}
		
		var tokenNo = -1;
		var tokenKey = "";
		var currentToken = "";
		var currentNode = {};
		var outgoingTransitions = [];
		var incomingTransitions = [];
		var outgoingConditions = [];
		var firstTrueConditionNo = -1;
		var numberOfTransitionsThatReturnsTrue = 0;
		var outgoingTransitionNo = -1;
		var counter;
		var k,m;

		var tmpTokens = {};
		for (var j in instance.tokens) {
			tmpTokens[instance.tokens[j]] = instance.tokens[j];
		};
		for (tokenKey in tmpTokens) {
			tokenNo = tmpTokens[tokenKey];
			currentToken = tokenNo;
			currentNode = getNodeByName(definition, currentToken); // definition.nodes[];
			
			outgoingTransitions = getOutgoingTransitions(definition, currentToken);

			if (currentNode.join === true && (currentNode.fork === true || outgoingTransitions.length === 1)) {
				k=-1;
				counter = 0;
				
				for(k in instance.tokens) { // here it must be instance.tokens, and not tmpTokens, because we are counting how many times
					if (instance.tokens[k] === currentNode.name) {
						counter += 1; // I don't like k++
					}
				}
				incomingTransitions = getIncomingTransitions(definition, currentToken);
				if ( counter >= incomingTransitions.length ) {
					for (k=0; k<counter; k++) {
						destructivelyRemoveToken(instance.tokens, currentToken);
					}
					for (outgoingTransitionNo in outgoingTransitions) {
						if (definition.validation && outgoingTransitions[outgoingTransitionNo].condition !== undefined) {
							throw {
								name: "Condition on outgoing transition from JOIN node.",
								level: "blocking",
								message: "There CANNOT be conditions on outgoing transitions from JOIN node, and still there are (node " + currentNode.name + ")"
							};
						}
						onEnterNode(definition, outgoingTransitions[outgoingTransitionNo].dst, externalState, executeActions);
						instance.tokens.push(
								outgoingTransitions[outgoingTransitionNo].dst
						);
					}
				};
			} else if (currentNode.fork === true && currentNode.join !== true) {
				//propagate to all outgoing transitions
				// and remove from currentNode
				destructivelyRemoveToken(instance.tokens, currentToken);
				for (outgoingTransitionNo in outgoingTransitions) {
					if (definition.validation && outgoingTransitions[outgoingTransitionNo].condition !== undefined) {
						throw {
							name: "Condition on outgoing transition from JOIN node.",
							level: "blocking",
							message: "There CANNOT be conditions on outgoing transitions from JOIN node, and still there are (node " + currentNode.name + ")"
						};
					}
					onEnterNode(definition, outgoingTransitions[outgoingTransitionNo].dst, externalState, executeActions);
					instance.tokens.push(
							outgoingTransitions[outgoingTransitionNo].dst
					);
				}
			} else {
				// calculate conditions on each transition
				// maybe validate
				// and propagate
				outgoingConditions = [];
				firstTrueConditionNo = -1;
				for (outgoingTransitionNo in outgoingTransitions) {
					
					if (
						!outgoingTransitions[outgoingTransitionNo].condition ||
						outgoingTransitions[outgoingTransitionNo].condition(externalState)
					) {
						outgoingConditions.push(true);
						if (firstTrueConditionNo===-1) {
							firstTrueConditionNo = 
								outgoingTransitionNo;
						}
					} else {
						outgoingConditions.push(false);
					}
				}
				// validate
				if (definition.validation===true) {
					// if more than one transition condition returns true - throw exception
					// if no transition condition returns true - all is well - just
					// stay where you are
					var i=0;
					var specifically = "";
					numberOfTransitionsThatReturnsTrue = 0;
					for (i in outgoingConditions) {
						if (i !== 0) {
							specifically = specifically + ", ";
						}
						specifically = specifically +
							"(dst==" + outgoingTransitions[i].dst +
							") => " + outgoingConditions[i];
						if (outgoingConditions[i]) {
							numberOfTransitionsThatReturnsTrue += 1;
						}
					}

					if (numberOfTransitionsThatReturnsTrue>1) {
						throw "More than one transition " +
						"has condition that returns true " +
						"in a NON-FORK node (name=="+ currentNode.name +")" +
						"specifically: " + specifically;
					}
				}
				// propagate if any true transitions
				if (firstTrueConditionNo !== -1) {
					destructivelyRemoveToken(instance.tokens, currentToken);
					onEnterNode(definition, outgoingTransitions[firstTrueConditionNo].dst, externalState, executeActions);
					instance.tokens.push(
						outgoingTransitions[firstTrueConditionNo].dst
					);
				}
			}

		}
	}

	function propagateTokens(instance, definition, externalState) {
		var newInstance = copyInstance(instance);
		destructivelyPropagateTokens(instance, definition);
		return newInstance;
	}

	return {
		loadProcessDefinition : loadProcessDefinition,
		startProcessInstance : startProcessInstance,
		propagateTokens : propagateTokens,
		destructivelyPropagateTokens : destructivelyPropagateTokens
	};
}) ();