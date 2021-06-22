import React, { useState, useReducer, useRef } from 'react';
import Node from './Node';
import Edge from './Edge';
import EditWeight from './EditWeight';
import Switch from '@material-ui/core/Switch';
import BackspaceIcon from '@material-ui/icons/Backspace';
import RestoreIcon from '@material-ui/icons/Restore';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import Snackbar from '@material-ui/core/Snackbar';
import './Canvas.css';
import './extra/Extra.css';

function dataReducer(state, event) {
  switch (event.name) {
    case 'add-node':
      return {
        ...state,
        nodes: { ...state.nodes, [event.value.id ?? state.topNode]: event.value.node },
        topNode: state.topNode + (event.value.id !== null),
      };
    case 'add-edge':
      return {
        ...state,
        edges: { ...state.edges, [event.value.id ?? state.topEdge]: event.value.edge },
        topEdge: state.topEdge + (event.value.id !== null),
      };
    case 'delete-node':
      delete state.nodes[event.value];
      return state;
    case 'edit-edge':
      state.edges[event.value.id].w = event.value.weight;
      return state;
    case 'delete-edge':
      delete state.edges[event.value.id];
      return state;
    case 'set-graph':
      return event.value;
    default:
      throw new Error();
  }
}
export default function Canvas() {
  const [graphData, updateGraphData] = useReducer(dataReducer, { topNode: 0, topEdge: 0, nodes: {}, edges: {} });
  const [currentNode, setCurrentNode] = useState(null);
  const [currentEdge, setCurrentEdge] = useState(null);
  const [edgeVector, setEdgeVector] = useState({ x: 0, y: 0 });
  const [isWeighted, setIsWeighted] = useState(false);
  const [isDirected, setIsDirected] = useState(false);

  function createNode(posX, posY) {
    updateGraphData({
      name: 'add-node',
      value: { node: { x: posX, y: posY } },
    });
  }
  function createEdge(first, second) {
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
    updateGraphData({
      name: 'delete-edge',
      value: id,
    });
  }
  function handleClickEdge(newEdgeData) {
    setCurrentEdge(newEdgeData);
    setCurrentNode(null);
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
  }
  //Input output
  const [showInput, setShowInput] = useState(true);
  //Import state
  const [inputText, setInputText] = useState('');
  //State for opening copy alert
  const [copyAlertOpen, setCopyAlertOpen] = useState(false);
  return (
    <div className='popup-out'>
      <div className='draw-graph-container popup-in'>
        <ul className='instructions'>
          <h2>Instructions</h2>
          <li>Click in an empty space to create a node</li>
          <li>Click a node and then click another to create an edge</li>
          <li>Drag nodes by pressing and releasing</li>
          <li>Use weights and directions to change your edges</li>
        </ul>
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
                console.log('Deleting..');
              }
              if (currentNode != null) deleteNode(currentNode);
              setCurrentNode(null);
              setCurrentEdge(null);
            }
          }}
          tabIndex='0'
        >
          {currentNode != null && isDragging === false && (
            <line
              x1={graphData.nodes[currentNode].x}
              y1={graphData.nodes[currentNode].y}
              x2={edgeVector.x}
              y2={edgeVector.y}
              stroke='black'
              strokeWidth='3px'
            />
          )}
          {Object.entries(graphData.edges).map((element) => {
            const idx = element[0];
            const edge = element[1];
            return (
              <Edge
                key={idx}
                id={idx}
                weight={isWeighted ? edge.w : ''}
                position={{
                  x1: graphData.nodes[edge.u].x,
                  y1: graphData.nodes[edge.u].y,
                  x2: graphData.nodes[edge.v].x,
                  y2: graphData.nodes[edge.v].y,
                }}
                currentEdge={currentEdge}
                setCurrentEdge={setCurrentEdge}
                handleClick={handleClickEdge}
              />
            );
          })}
          {Object.entries(graphData.nodes).map((element) => {
            const idx = element[0];
            const node = element[1];
            return (
              <Node
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
        {currentEdge != null && isWeighted && (
          <EditWeight currentEdge={currentEdge} setCurrentEdge={setCurrentEdge} handleSubmit={editWeight} />
        )}
        <div className='input-output'>
          <h2 className='output-name' onClick={() => setShowInput(false)}>
            Export
          </h2>
          {!showInput && (
            <div className='output-box'>
              <FileCopyIcon
                className='copy-icon'
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(graphData, null, '\t'));
                  setCopyAlertOpen(true);
                }}
              />
              <textarea value={JSON.stringify(graphData, null, '\t')} />
              <Snackbar
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                autoHideDuration={500}
                open={copyAlertOpen}
                onClose={() => setCopyAlertOpen(false)}
                message='Copied to clipboard!'
              />
            </div>
          )}
          <h2 className='input-name' onClick={() => setShowInput(true)}>
            Import
          </h2>
          {showInput && (
            <div className='input-box'>
              <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} />
            </div>
          )}
          {showInput && (
            <div className='input-button' onClick={() => setGraph(JSON.parse(inputText))}>
              Submit
            </div>
          )}
        </div>
        <div className='draw-graph-button'>
          <BackspaceIcon fontSize='inherit' />
          <h3>Back</h3>
        </div>
        <div className='draw-graph-checkbox grid-left'>
          <h3>Weighted edges</h3>
          <Switch
            checked={isWeighted}
            onChange={(e) => {
              setIsWeighted(e.target.checked);
            }}
            color='secondary'
          />
        </div>
        <div className='draw-graph-button'>
          <h3>Finish</h3>
        </div>
        <div className='draw-graph-checkbox grid-right'>
          <h3>Directed edges</h3>
          <Switch
            checked={isDirected}
            onChange={(e) => {
              setIsDirected(e.target.checked);
            }}
            color='secondary'
          />
        </div>
        <div className='draw-graph-button' onClick={() => setGraph({ topNode: 0, topEdge: 0, nodes: {}, edges: {} })}>
          <h3>New</h3>
          <RestoreIcon fontSize='inherit' />
        </div>
      </div>
    </div>
  );
}
