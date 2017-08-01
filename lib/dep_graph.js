/**
 * A simple dependency graph
 */

/**
 * Helper for creating a Depth-First-Search on
 * a set of edges.
 *
 * Detects cycles and throws an Error if one is detected.
 *
 * @param edges The set of edges to DFS through
 * @param leavesOnly Whether to only return "leaf" nodes (ones who have no edges)
 * @param result An array in which the results will be populated
 */
function createDFS(edges, leavesOnly, result) {
  var currentPath = [];
  var visited = {};
  return function DFS(currentNode) {
    visited[currentNode] = true;
    currentPath.push(currentNode);
    edges[currentNode].forEach(function (node) {
      if (!visited[node]) {
        DFS(node);
      } else if (currentPath.indexOf(node) >= 0) {
        currentPath.push(node);
        throw new Error('Dependency Cycle Found: ' + currentPath.join(' -> '));
      }
    });
    currentPath.pop();
    if ((!leavesOnly || edges[currentNode].length === 0) && result.indexOf(currentNode) === -1) {
      result.push(currentNode);
    }
  };
}

/**
 * Simple Dependency Graph
 */
var DepGraph = function DepGraph() {
  this.nodes = {};
  this.outgoingEdges = {}; // Node -> [Dependency Node]
  this.incomingEdges = {}; // Node -> [Dependant Node]
};
if( typeof exports !== "undefined" ) {
  exports.DepGraph = DepGraph;
}
DepGraph.prototype = {
  /**
   * Add a node to the dependency graph. If a node already exists, this method will do nothing.
   */
  "addNode": function (node, data) {
    if (!this.hasNode(node)) {
      // Checking the arguments length allows the user to add a node with undefined data
      if (arguments.length === 2) {
        this.nodes[node] = data;
      } else {
        this.nodes[node] = node;
      }
      this.outgoingEdges[node] = [];
      this.incomingEdges[node] = [];
    }
  },
  /**
   * Remove a node from the dependency graph. If a node does not exist, this method will do nothing.
   */
  "removeNode": function (node) {
    if (this.hasNode(node)) {
      delete this.nodes[node];
      delete this.outgoingEdges[node];
      delete this.incomingEdges[node];
      [this.incomingEdges, this.outgoingEdges].forEach(function (edgeList) {
        Object.keys(edgeList).forEach(function (key) {
          var idx = edgeList[key].indexOf(node);
          if (idx >= 0) {
            edgeList[key].splice(idx, 1);
          }
        }, this);
      });
    }
  },
  /**
   * Check if a node exists in the graph
   */
  "hasNode": function (node) {
    return this.nodes.hasOwnProperty(node);
  },
  /**
   * Get the data associated with a node name
   */
  "getNodeData": function (node) {
    if (this.hasNode(node)) {
      return this.nodes[node];
    } else {
      throw new Error('Node does not exist: ' + node);
    }
  },
  /**
   * Set the associated data for a given node name. If the node does not exist, this method will throw an error
   */
  "setNodeData": function (node, data) {
    if (this.hasNode(node)) {
      this.nodes[node] = data;
    } else {
      throw new Error('Node does not exist: ' + node);
    }
  },
  /**
   * Add a dependency between two nodes. If either of the nodes does not exist,
   * an Error will be thrown.
   */
  "addDependency": function (from, to) {
    if (!this.hasNode(from)) {
      throw new Error('Node does not exist: ' + from);
    }
    if (!this.hasNode(to)) {
      throw new Error('Node does not exist: ' + to);
    }
    if (this.outgoingEdges[from].indexOf(to) === -1) {
      this.outgoingEdges[from].push(to);
    }
    if (this.incomingEdges[to].indexOf(from) === -1) {
      this.incomingEdges[to].push(from);
    }
    return true;
  },
  /**
   * Remove a dependency between two nodes.
   */
  "removeDependency": function (from, to) {
    var idx;
    if (this.hasNode(from)) {
      idx = this.outgoingEdges[from].indexOf(to);
      if (idx >= 0) {
        this.outgoingEdges[from].splice(idx, 1);
      }
    }

    if (this.hasNode(to)) {
      idx = this.incomingEdges[to].indexOf(from);
      if (idx >= 0) {
        this.incomingEdges[to].splice(idx, 1);
      }
    }
  },
  /**
   * Get an array containing the nodes that the specified node depends on (transitively).
   *
   * Throws an Error if the graph has a cycle, or the specified node does not exist.
   *
   * If `leavesOnly` is true, only nodes that do not depend on any other nodes will be returned
   * in the array.
   */
  "dependenciesOf": function (node, leavesOnly) {
    if (this.hasNode(node)) {
      var result = [];
      var DFS = createDFS(this.outgoingEdges, leavesOnly, result);
      DFS(node);
      var idx = result.indexOf(node);
      if (idx >= 0) {
        result.splice(idx, 1);
      }
      return result;
    }
    else {
      throw new Error('Node does not exist: ' + node);
    }
  },
  /**
   * get an array containing the nodes that depend on the specified node (transitively).
   *
   * Throws an Error if the graph has a cycle, or the specified node does not exist.
   *
   * If `leavesOnly` is true, only nodes that do not have any dependants will be returned in the array.
   */
  "dependantsOf": function (node, leavesOnly) {
    if (this.hasNode(node)) {
      var result = [];
      var DFS = createDFS(this.incomingEdges, leavesOnly, result);
      DFS(node);
      var idx = result.indexOf(node);
      if (idx >= 0) {
        result.splice(idx, 1);
      }
      return result;
    } else {
      throw new Error('Node does not exist: ' + node);
    }
  },
  /**
   * Construct the overall processing order for the dependency graph.
   *
   * Throws an Error if the graph has a cycle.
   *
   * If `leavesOnly` is true, only nodes that do not depend on any other nodes will be returned.
   */
  "overallOrder": function (leavesOnly) {
    var self = this;
    var result = [];
    var keys = Object.keys(this.nodes);
    if (keys.length === 0) {
      return result; // Empty graph
    } else {
      // Look for cycles - we run the DFS starting at all the nodes in case there
      // are several disconnected subgraphs inside this dependency graph.
      var CycleDFS = createDFS(this.outgoingEdges, false, []);
      keys.forEach(function(n) {
        CycleDFS(n);
      });

      var DFS = createDFS(this.outgoingEdges, leavesOnly, result);
      // Find all potential starting points (nodes with nothing depending on them) an
      // run a DFS starting at these points to get the order
      keys.filter(function (node) {
        return self.incomingEdges[node].length === 0;
      }).forEach(function (n) {
        DFS(n);
      });

      return result;
    }
  },

  /**
   * Construct the logical steps of the dependency graph.
   *
   * Throws an Error if the graph has a cycle.
   *
   */
  "steps": function () {
    var self = this;

    var steps = [];
    var done  = {};
    var level = -1;
    var value, racine;

    // recursive helper function
    var processchild = function( parent, lvl ) {

      var newlevel = lvl + 1;
      var check;
      var pass;
      var cpt, nbr;
      var child;

      // test if all parent dependencies have been processed already
      pass = true;
      for( cpt = 0, nbr = self.incomingEdges[ parent ].length; cpt < nbr; cpt++ ) {
        check = self.incomingEdges[ parent ][ cpt ];
        if( ! done.hasOwnProperty( check ) ) {
          pass = false;
        } else {
          // if parent level is > to current level, current level = parent level + 1
          if( done[ check ] > newlevel ) {
            newlevel = done[ check ] + 1;
          }
        }
      }

      // if all parent dependencies were already processed
      if( pass ) {

        // add a new step if necessary
        if( ! steps[ newlevel ] ) {
          steps[ newlevel ] = [];
        }

        // add a dependency in the step
        steps[ newlevel ].push( parent );
        
        // mark the dependency as processed
        done[ parent ] = newlevel;

        // for each child dependency, run this function recursively
        for( cpt = 0, nbr = self.outgoingEdges[ parent ].length; cpt < nbr; cpt++ ) {
          child = self.outgoingEdges[ parent ][ cpt ];
          processchild.call( self, child, newlevel );
        }
      }
    }; // end function processchild
    
    // will throw an error if the graph has a cycle.
    steps = self.overallOrder();
    
    // no error thrown, we continue
    if( steps.length ) {
      steps = [];

      // for each entries in incomingEdges
      for( var property in self.incomingEdges ) {
        if( self.incomingEdges.hasOwnProperty( property ) ) {

          // get the array of child dependencies for this entry
          value = self.incomingEdges[ property ];
          
          // if empty array, entry does not depend on anything, it's a root entry
          if( ! value.length ) {
            // process this root entry
            processchild.call( self, property, level );
          }
        }
      }
    }

    return steps;
  }
};