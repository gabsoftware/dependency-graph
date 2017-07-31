# Dependency Graph

Simple dependency graph

## Overview

This is a simple dependency graph useful for determining the order to do a list of things that depend on certain items being done before they are.

To use, `npm install dependency-graph` and then `require('dependency-graph').DepGraph`

## API

### DepGraph

Nodes in the graph are just simple strings with optional data associated with them.

 - `addNode(name, data)` - add a node in the graph with optional data. If `data` is not given, `name` will be used as data
 - `removeNode(name)` - remove a node from the graph
 - `hasNode(name)` - check if a node exists in the graph
 - `getNodeData(name)` - get the data associated with a node (will throw an Error if the node does not exist)
 - `setNodeData(name, data)` - set the data for an existing node (will throw an Error if the node does not exist)
 - `addDependency(from, to)` - add a dependency between two nodes (will throw an Error if one of the nodes does not exist)
 - `removeDependency(from, to)` - remove a dependency between two nodes
 - `dependenciesOf(name, leavesOnly)` - get an array containing the nodes that the specified node depends on (transitively). If `leavesOnly` is true, only nodes that do not depend on any other nodes will be returned in the array.
 - `dependantsOf(name, leavesOnly)` - get an array containing the nodes that depend on the specified node (transitively). If `leavesOnly` is true, only nodes that do not have any dependants will be returned in the array.
 - `overallOrder(leavesOnly)` - construct the overall processing order for the dependency graph. If `leavesOnly` is true, only nodes that do not depend on any other nodes will be returned.
 - `steps()` - return an array of steps, the first item at index zero being an array of nodes that depends on nothing

Dependency Cycles are detected when running `dependenciesOf`, `dependantsOf`, and `overallOrder` and if one is found, an error will be thrown that includes what the cycle was in the message: e.g. `Dependency Cycle Found: a -> b -> c -> a`.

## Examples

    var DepGraph = require('dependency-graph').DepGraph;

    var graph = new DepGraph();
    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');

    graph.addDependency('a', 'b');
    graph.addDependency('b', 'c');

    graph.dependenciesOf('a'); // ['c', 'b']
    graph.dependenciesOf('b'); // ['c']
    graph.dependantsOf('c'); // ['a', 'b']

    graph.overallOrder(); // ['c', 'b', 'a']
    graph.overallOrder(true); // ['c']

    graph.addNode('d', 'data');

    graph.getNodeData('d'); // 'data'

    graph.setNodeData('d', 'newData');

    graph.getNodeData('d'); // 'newData'



    ### steps() function example

    One step contains the nodes that can be processed in same time.
    
    Considering the following dependency graph:

               c
             /
        a --          e
             \      /
               d -- 
                    \
                      f -- 
                           \
                             g
                           /
        b ----------------

        ======== steps =======
        1      2      3      4

        a,b    c,d    e,f    g

        Nodes a and b can be processed immediately.
        Nodes c and d can be processed as soon as node a has been processed.
        Nodes e and f can be processed as soon as node d has been processed.
        node g can be processed as soon as nodes f and b have been processed.

        So there are 4 steps.

    Code:

        var graph = new DepGraph();
        
        graph.addNode( 'a' );
        graph.addNode( 'b' );
        graph.addNode( 'c' );
        graph.addNode( 'd' );
        graph.addNode( 'e' );
        graph.addNode( 'f' );
        graph.addNode( 'g' );
    
        graph.addDependency( 'a', 'c' );
        graph.addDependency( 'a', 'd' );
        graph.addDependency( 'd', 'e' );
        graph.addDependency( 'd', 'f' );
        graph.addDependency( 'f', 'g' );
        graph.addDependency( 'b', 'g' );

        graph.steps(); // [['a', 'b'], ['c', 'd'], ['e', 'f'], ['g']]
