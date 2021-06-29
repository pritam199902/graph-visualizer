import React, { useState, useReducer, useRef, useEffect } from 'react';
import NodeDrawn from './NodeDrawn';
import EdgeDrawn from './EdgeDrawn';
import EditWeight from './EditWeight';
import Instructions from './Instructions';
import ExportImport from './ExportImport';
import BackButton from './Buttons/BackButton';
import FinishButton from './Buttons/FinishButton';
import WeightedEdgesToggle from './Buttons/WeightedEdgesToggle';
import DirectedEdgesToggle from './Buttons/DirectedEdgesToggle';
import NewButton from './Buttons/NewButton';
import TemporalEdge from './TemporalEdge';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import './DrawGraph.css';
import '../extra/Extra.css';

function Alert(props) {
  return <MuiAlert elevation={6} variant='filled' {...props} />;
}

function dataReducer(state, event) {
  switch (event.name) {
    case 'add-node':
      return {
        ...state,
        nodes: { ...state.nodes, [event.value.id ?? state.topNode]: event.value.node },
        topNode: state.topNode + (event.value.id === undefined ? 1 : 0),
      };
    case 'add-edge':
      return {
        ...state,
        edges: { ...state.edges, [event.value.id ?? state.topEdge]: event.value.edge },
        topEdge: state.topEdge + (event.value.id === undefined ? 1 : 0),
      };
    case 'delete-node':
      delete state.nodes[event.value];
      return state;
    case 'edit-edge':
      state.edges[event.value.id].w = event.value.weight;
      return state;
    case 'delete-edge':
      delete state.edges[event.value];
      return state;
    case 'set-graph':
      return event.value;
    case 'set-isWeighted':
      return { ...state, isWeighted: event.value };
    case 'set-isDirected':
      return { ...state, isDirected: event.value };
    default:
      throw new Error();
  }
}
export default function DrawGraph({ close, sendGraph, currentGraph }) {
  const blankGraph = { topNode: 0, topEdge: 0, isWeighted: false, isDirected: false, nodes: {}, edges: {} };
  const [graphData, updateGraphData] = useReducer(dataReducer, blankGraph);
  const [currentNode, setCurrentNode] = useState(null);
  const [currentEdge, setCurrentEdge] = useState(null);

  //Error states
  const [openError, setOpenError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  //Vector to draw temporary line
  const [edgeVector, setEdgeVector] = useState({ x: 0, y: 0 });

  //Set to check if an edge between u,v exists
  const [edgesSet, setEdgesSet] = useState(() => new Set());
  function addToSet(item) {
    setEdgesSet((prev) => new Set(prev).add(item));
  }
  function removeFromSet(item) {
    setEdgesSet((prev) => {
      const next = new Set(prev);
      next.delete(item);
      return next;
    });
  }
  //Update initially the graph
  useEffect(() => {
    setGraph(currentGraph);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //State to open and close editWeight
  const [showEditWeight, setShowEditWeight] = useState(false);
  useEffect(() => {
    if (currentEdge === null) setShowEditWeight(false);
  }, [currentEdge]);

  function createNode(posX, posY) {
    updateGraphData({
      name: 'add-node',
      value: { node: { x: posX, y: posY } },
    });
  }
  function createEdge(first, second) {
    if (first === second) return;
    //If user tries to add edge to u->v and it already exists
    if (edgesSet.has(JSON.stringify([first, second]))) {
      setErrorMessage('Edge already exists!');
      setOpenError(true);
      return;
    }
    //If user tries to add edge u->v but v->u already exists and is not directed
    if (!graphData.isDirected && edgesSet.has(JSON.stringify([second, first]))) {
      setErrorMessage('Graph needs to be directed to add double edges!');
      setOpenError(true);
      return;
    }
    //If there is no errors insert into set and update graph data
    addToSet(JSON.stringify([first, second]));
    updateGraphData({
      name: 'add-edge',
      value: { edge: { u: first, v: second, w: 1 } },
    });
  }
  function deleteNode(id) {
    Object.entries(graphData.edges).forEach((element) => {
      const key = element[0];
      const edge = element[1];
      if (edge.u === id || edge.v === id) deleteEdge(key);
    });
    updateGraphData({
      name: 'delete-node',
      value: id,
    });
  }
  function deleteEdge(id) {
    removeFromSet(JSON.stringify([graphData.edges[id].u, graphData.edges[id].v]));
    updateGraphData({
      name: 'delete-edge',
      value: id,
    });
  }
  function handleClickEdge(id, clicks) {
    setCurrentEdge(id);
    setCurrentNode(null);
    if (clicks === 'double') {
      setShowEditWeight(true);
    }
  }
  // Drag and drop functionality
  const dragTimeoutId = useRef('');
  const [isDragging, setIsDragging] = useState(false);

  function handleMouseUpNode() {
    if (isDragging) {
      DropNode();
    } else {
      clearTimeout(dragTimeoutId.current);
    }
  }
  function handleClickNode(id) {
    if (currentNode == null) {
      clear();
      setCurrentNode(id);
      dragTimeoutId.current = setTimeout(() => {
        setIsDragging(true);
      }, 100);
    } else {
      createEdge(currentNode, id);
      setCurrentNode(null);
    }
  }
  function DragNode(posX, posY) {
    updateGraphData({
      name: 'add-node',
      value: { id: currentNode, node: { x: posX, y: posY } },
    });
  }
  function DropNode() {
    setCurrentNode(null);
    setIsDragging(false);
  }
  function editWeight(id, weight) {
    updateGraphData({
      name: 'edit-edge',
      value: { id, weight },
    });
  }
  function clear() {
    setCurrentNode(null);
    setCurrentEdge(null);
  }
  function setGraph(graph) {
    updateGraphData({
      name: 'set-graph',
      value: graph,
    });
    edgesSet.clear();
    Object.values(graph.edges).forEach((edge) => {
      addToSet(JSON.stringify([edge.u, edge.v]));
    });
  }
  function hasDoubleEdge() {
    let ret = false;
    Object.values(graphData.edges).forEach(({ u, v }) => {
      console.log(u, v, edgesSet.has(JSON.stringify([u, v])), edgesSet.has(JSON.stringify([v, u])));
      if (edgesSet.has(JSON.stringify([u, v])) && edgesSet.has(JSON.stringify([v, u]))) ret = true;
    });
    return ret;
  }
  return (
    <div className='popup-out'>
      <div className='draw-graph-container popup-in'>
        <Instructions />
        <svg
          className='draw-graph'
          onMouseDown={(event) => {
            if (currentNode == null && currentEdge == null) createNode(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
            else clear();
          }}
          onMouseMove={(event) => {
            if (isDragging) {
              DragNode(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
            } else {
              setEdgeVector({
                x: event.nativeEvent.offsetX,
                y: event.nativeEvent.offsetY,
              });
            }
          }}
          onMouseUp={handleMouseUpNode}
          onKeyDown={(event) => {
            if (event.code === 'Escape') {
              setCurrentNode(null);
              setCurrentEdge(null);
            }
            if (event.code === 'Delete') {
              if (currentEdge != null) {
                deleteEdge(currentEdge);
              }
              if (currentNode != null) deleteNode(currentNode);
              setCurrentNode(null);
              setCurrentEdge(null);
            }
          }}
          tabIndex='0'
        >
          {currentNode != null && isDragging === false && (
            <TemporalEdge
              x1={graphData.nodes[currentNode].x}
              y1={graphData.nodes[currentNode].y}
              x2={edgeVector.x}
              y2={edgeVector.y}
            />
          )}
          {Object.entries(graphData.edges).map((element) => {
            const idx = element[0];
            const edge = element[1];
            return (
              <EdgeDrawn
                key={idx}
                id={idx}
                edge={edge}
                currentEdge={currentEdge}
                position={{
                  x1: graphData.nodes[edge.u].x,
                  y1: graphData.nodes[edge.u].y,
                  x2: graphData.nodes[edge.v].x,
                  y2: graphData.nodes[edge.v].y,
                }}
                setCurrentEdge={setCurrentEdge}
                handleClick={handleClickEdge}
                isWeighted={graphData.isWeighted}
                isDirected={graphData.isDirected}
                isCurved={edgesSet.has(JSON.stringify([edge.v, edge.u]))}
              />
            );
          })}
          {Object.entries(graphData.nodes).map((element) => {
            const idx = element[0];
            const node = element[1];
            return (
              <NodeDrawn
                key={idx}
                id={idx}
                position={node}
                handleClick={handleClickNode}
                currentNode={currentNode}
                isDragged={isDragging && idx === currentNode}
              />
            );
          })}
        </svg>
        <Snackbar
          open={openError}
          autoHideDuration={2500}
          onClose={(evt, reason) => {
            if (reason === 'clickaway') return;
            setOpenError(false);
          }}
        >
          <Alert
            onClose={(evt, reason) => {
              if (reason === 'clickaway') return;
              setOpenError(false);
            }}
            severity='error'
          >
            {errorMessage}
          </Alert>
        </Snackbar>
        {showEditWeight && graphData.isWeighted && (
          <EditWeight currentEdge={currentEdge} setCurrentEdge={setCurrentEdge} handleSubmit={editWeight} />
        )}
        <ExportImport graphData={graphData} setGraph={setGraph} />
        <BackButton close={close} />
        <WeightedEdgesToggle
          isWeighted={graphData.isWeighted}
          setIsWeighted={(checked) => updateGraphData({ name: 'set-isWeighted', value: checked })}
        />
        <FinishButton
          finish={() => {
            sendGraph(graphData);
            close();
          }}
        />
        <DirectedEdgesToggle
          isDirected={graphData.isDirected}
          setIsDirected={(checked) => {
            //If it has double edge throw error when trying to change to undirected
            console.log(hasDoubleEdge());
            if (hasDoubleEdge() && checked === false) {
              setErrorMessage("There is a double edge, graph can't be undirected until double edges are removed");
              setOpenError(true);
              return;
            }
            updateGraphData({ name: 'set-isDirected', value: checked });
          }}
        />
        <NewButton resetGraph={() => setGraph(blankGraph)} />
      </div>
    </div>
  );
}