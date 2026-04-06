import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Network, Plus, Play, RotateCcw, Activity, Cpu, Zap, MapPin, Share2, Info, Terminal, ChevronRight, ChevronLeft, Send, Trash2, X, Check } from 'lucide-react';

// --- STYLES & ANIMATIONS ---
const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&family=JetBrains+Mono:wght@400;700&display=swap');

  body {
    font-family: 'Space Grotesk', sans-serif;
    background-color: #020617;
    color: white;
    overflow: hidden;
  }

  .font-mono {
    font-family: 'JetBrains Mono', monospace;
  }

  .cyber-grid {
    position: absolute;
    inset: 0;
    background-image: 
      radial-gradient(circle at center, rgba(0,240,255,0.04) 2px, transparent 2px),
      linear-gradient(to right, rgba(0, 240, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
    background-size: 60px 60px, 60px 60px, 60px 60px;
    z-index: 0;
  }

  .radar-sweep {
    position: absolute;
    top: 50%; left: 50%;
    width: 200vw; height: 200vw;
    margin-left: -100vw; margin-top: -100vw;
    background: conic-gradient(from 0deg, transparent 70%, rgba(0, 240, 255, 0.08) 100%);
    border-radius: 50%;
    animation: sweep 10s linear infinite;
    pointer-events: none;
    z-index: 0;
  }

  .scanlines {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1));
    background-size: 100% 4px;
    pointer-events: none;
    z-index: 50;
    opacity: 0.3;
  }

  @keyframes sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  @keyframes packet-flow {
    0% { stroke-dashoffset: 40; }
    100% { stroke-dashoffset: 0; }
  }

  @keyframes ripple {
    0% { r: 18; opacity: 1; stroke-width: 4; }
    100% { r: 70; opacity: 0; stroke-width: 0; }
  }

  @keyframes float {
    0% { transform: translateY(0) scale(1); opacity: 0.3; }
    50% { transform: translateY(-20px) scale(1.2); opacity: 0.8; }
    100% { transform: translateY(0) scale(1); opacity: 0.3; }
  }

  .data-packet {
    stroke: #ffffff;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 2 38;
    animation: packet-flow 0.6s linear infinite;
    filter: drop-shadow(0 0 5px #fff) drop-shadow(0 0 12px #00f0ff);
  }

  .glass-panel {
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(0, 240, 255, 0.1);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  }

  .neon-text         { text-shadow: 0 0 15px rgba(0, 240, 255, 0.9); }
  .neon-text-blue    { text-shadow: 0 0 15px rgba(59, 130, 246, 0.9); }
  .neon-text-purple  { text-shadow: 0 0 15px rgba(217, 70, 239, 0.9); }

  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:200; display:flex; align-items:center; justify-content:center; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0, 240, 255, 0.2); border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0, 240, 255, 0.5); }

  input:focus { outline: none; border-color: rgba(0,240,255,0.6) !important; box-shadow: 0 0 0 2px rgba(0,240,255,0.15); }
`;

const JAVA = 'http://localhost:8080';
const PY   = 'http://localhost:8000';

export default function App() {
  const [nodes,        setNodes]        = useState([]);
  const [edges,        setEdges]        = useState([]);
  const [transform,    setTransform]    = useState({ x: 0, y: 0, scale: 1 });
  const [animatedPath, setAnimatedPath] = useState([]);
  const [totalCost,    setTotalCost]    = useState(null);
  const [ripples,      setRipples]      = useState([]);

  // Chat state
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'Nexus Agent Online. Connecting to Java backend...' }
  ]);
  const [userInput,    setUserInput]    = useState('');
  const [isThinking,   setIsThinking]   = useState(false);

  // UI state
  const [isLeftSidebarOpen,  setIsLeftSidebarOpen]  = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isComputing,        setIsComputing]        = useState(false);
  const [apiStatus,          setApiStatus]          = useState({ used: false, message: '' });
  const [editModal,          setEditModal]          = useState(null);
  const [addModal,           setAddModal]           = useState(null);
  const [formData,           setFormData]           = useState({});
  const [startNode,          setStartNode]          = useState('');
  const [endNode,            setEndNode]            = useState('');

  // Refs
  const svgRef         = useRef(null);
  const gRef           = useRef(null);
  const scrollRef      = useRef(null);
  const animRef        = useRef(null);
  const transformRef   = useRef(transform);
  const nodesRef       = useRef([]); 
  const draggingNode   = useRef(null);
  const dragOffset     = useRef({ x: 0, y: 0 });
  const isPanningRef   = useRef(false);
  const panStart       = useRef({ x: 0, y: 0 });

  useEffect(() => { transformRef.current = transform; }, [transform]);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [chatMessages]);

  const particles = useMemo(() => [...Array(40)].map(() => ({
    id: Math.random(), top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`, duration: `${4 + Math.random() * 6}s`
  })), []);

  // ── Fetch graph from Java backend (PERSISTS POSITIONS) ────────────────────
  const fetchGraph = useCallback(async () => {
    try {
      const res = await fetch(`${JAVA}/api/path/graph`);
      if (!res.ok) throw new Error();
      const dbEdges = await res.json();

      const realEdges = dbEdges.filter(e => e.from !== e.to);
      const edgeList  = realEdges.map(e => ({ id: e.id, source: e.from, target: e.to, weight: e.cost }));

      // Build raw node map
      const nodeMap = {};
      dbEdges.forEach(e => {
        if (!nodeMap[e.from]) nodeMap[e.from] = { id: e.from, x: e.fromX || 0, y: e.fromY || 0 };
        if (!nodeMap[e.to])   nodeMap[e.to]   = { id: e.to,   x: e.toX || 0,   y: e.toY || 0   };
      });
      let nodeList = Object.values(nodeMap);

      // Check if we have existing nodes to preserve their coords preventing clustering
      const existingMap = new Map(nodesRef.current.map(n => [n.id, n]));

      if (existingMap.size === 0) {
        // Initial load layout normalization
        const TARGET_SIZE = 420;
        const xs = nodeList.map(n => n.x), ys = nodeList.map(n => n.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const spanX = maxX - minX || 1, spanY = maxY - minY || 1;
        const sc = Math.min(TARGET_SIZE / spanX, TARGET_SIZE / spanY);
        nodeList = nodeList.map(n => ({ ...n, x: (n.x - minX) * sc + 80, y: (n.y - minY) * sc + 80 }));

        const clumped = nodeList.filter(n => n.x === 80 && n.y === 80);
        if (clumped.length > 1) {
          const r = Math.max(160, clumped.length * 110 / (2 * Math.PI));
          clumped.forEach((n, i) => {
            const a = (2 * Math.PI * i) / clumped.length - Math.PI / 2;
            n.x = 80 + TARGET_SIZE / 2 + r * Math.cos(a);
            n.y = 80 + TARGET_SIZE / 2 + r * Math.sin(a);
          });
        }

        // Auto-fit viewport
        if (nodeList.length > 0) {
          const SIDEBAR_W = 600, PADDING = 180;
          const vw = window.innerWidth - SIDEBAR_W, vh = window.innerHeight;
          const nxs = nodeList.map(n => n.x), nys = nodeList.map(n => n.y);
          const nMinX = Math.min(...nxs), nMaxX = Math.max(...nxs);
          const nMinY = Math.min(...nys), nMaxY = Math.max(...nys);
          const gw = nMaxX - nMinX || 1, gh = nMaxY - nMinY || 1;
          const fitScale = Math.min((vw - PADDING * 2) / gw, (vh - PADDING * 2) / gh, 1.0);
          setTransform({ scale: fitScale, x: vw / 2 - (nMinX + gw / 2) * fitScale, y: vh / 2 - (nMinY + gh / 2) * fitScale });
        }
      } else {
        // Subsequent fetches (Adding Edges): PRESERVE POSITIONS
        nodeList = nodeList.map(n => {
          if (existingMap.has(n.id)) {
            return { ...n, x: existingMap.get(n.id).x, y: existingMap.get(n.id).y };
          }
          // Safely inject new nodes roughly into the center avoiding overlap
          return { ...n, x: 250 + Math.random() * 150, y: 250 + Math.random() * 150 };
        });
      }

      setEdges(edgeList);
      setNodes(nodeList);
      
      setStartNode(prev => (!prev && nodeList.length > 0 ? nodeList[0].id : prev));
      setEndNode(prev => (!prev && nodeList.length > 1 ? nodeList[nodeList.length - 1].id : prev));

      setChatMessages(prev =>
        prev.length === 1
          ? [...prev, { role: 'ai', text: `Synced. ${nodeList.length} nodes, ${edgeList.length} edges loaded.` }]
          : prev
      );
    } catch {
      setChatMessages(prev =>
        prev.length === 1
          ? [...prev, { role: 'ai', text: 'Java backend unreachable. Start Spring Boot on port 8080.' }]
          : prev
      );
    }
  }, []); // Empty dependencies block stale closures

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const scaleAdjust = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.3, transform.scale + scaleAdjust), 2);
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setTransform(prev => ({
      x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
      y: mouseY - (mouseY - prev.y) * (newScale / prev.scale),
      scale: newScale,
    }));
  }, [transform.scale]);

  // ── Pan & drag ────────────────────────────────────────────────────────────
  const onSvgMouseDown = (e) => {
    if (draggingNode.current) return;
    isPanningRef.current = true;
    panStart.current = { x: e.clientX - transformRef.current.x, y: e.clientY - transformRef.current.y };
  };

  const onMouseMove = useCallback((e) => {
    if (draggingNode.current) {
      const t = transformRef.current;
      setNodes(prev => prev.map(n =>
        n.id === draggingNode.current
          ? { ...n, x: (e.clientX - t.x) / t.scale - dragOffset.current.x, y: (e.clientY - t.y) / t.scale - dragOffset.current.y }
          : n
      ));
    } else if (isPanningRef.current) {
      setTransform(prev => ({ ...prev, x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y }));
    }
  }, []);

  const onMouseUp = useCallback(() => { draggingNode.current = null; isPanningRef.current = false; }, []);

  const onNodeMouseDown = (e, node) => {
    e.stopPropagation();
    isPanningRef.current = false;
    const t = transformRef.current;
    dragOffset.current = { x: (e.clientX - t.x) / t.scale - node.x, y: (e.clientY - t.y) / t.scale - node.y };
    draggingNode.current = node.id;
    setRipples(prev => [...prev, { id: Date.now(), nodeId: node.id }]);
    setTimeout(() => setRipples(prev => prev.slice(1)), 800);
  };

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, [onMouseMove, onMouseUp]);

  // ── Path animation ────────────────────────────────────────────────────────
  const animatePath = (path, cost) => {
    if (animRef.current) clearInterval(animRef.current);
    
    // Safety check for backend returning string vs array
    let normalizedPath = Array.isArray(path) ? path : (typeof path === 'string' ? path.split(/->|-|,|\s/).map(s=>s.trim()).filter(Boolean) : []);
    
    setAnimatedPath([]); setTotalCost(cost); setIsComputing(true);
    if (!normalizedPath || normalizedPath.length === 0) { setIsComputing(false); return; }
    
    setAnimatedPath([normalizedPath[0]]);
    let step = 1;
    animRef.current = setInterval(() => {
      setAnimatedPath(normalizedPath.slice(0, step + 1));
      step++;
      if (step >= normalizedPath.length) { clearInterval(animRef.current); setIsComputing(false); }
    }, 450);
  };

  const clearResults = () => {
    if (animRef.current) clearInterval(animRef.current);
    setAnimatedPath([]); setTotalCost(null); setIsComputing(false);
    setApiStatus({ used: false, message: '' });
  };

  // ── Local A* fallback ─────────────────────────────────────────────────────
  const localAStar = (graphNodes, graphEdges, start, goal) => {
    const adj = {}; graphNodes.forEach(n => adj[n.id] = []);
    graphEdges.forEach(e => { if (adj[e.source]) adj[e.source].push({ target: e.target, weight: e.weight }); });
    let open = [{ id: start, f: 0, g: 0 }], closed = new Set(), parent = {}, gScore = { [start]: 0 };
    while (open.length > 0) {
      open.sort((a, b) => a.f - b.f);
      let current = open.shift();
      if (current.id === goal) {
        let path = [], curr = goal;
        while (curr) { path.unshift(curr); curr = parent[curr]; }
        return { path, cost: gScore[goal] };
      }
      closed.add(current.id);
      (adj[current.id] || []).forEach(nb => {
        if (closed.has(nb.target)) return;
        let tg = gScore[current.id] + nb.weight;
        if (tg < (gScore[nb.target] ?? Infinity)) {
          parent[nb.target] = current.id; gScore[nb.target] = tg;
          if (!open.find(n => n.id === nb.target)) open.push({ id: nb.target, f: tg, g: tg });
        }
      });
    }
    return { path: [], cost: -1 };
  };

  // ── Compute path (UI button) ───────────────────────────────────────────────
  const findOptimalPath = async () => {
    if (!startNode || !endNode) return;
    
    // Automatically open the right telemetry sidebar when searching
    setIsRightSidebarOpen(true);
    
    clearResults(); setIsComputing(true);
    await new Promise(r => setTimeout(r, 800));
    try {
      const res = await fetch(`${JAVA}/api/path`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: startNode, goal: endNode }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setApiStatus({ used: true, message: 'Spring Boot Core Linked' });
      animatePath(data.path, data.cost);
      setChatMessages(prev => [...prev, { role: 'ai', text: `Path: ${data.path.join(' → ')} | Cost: ${data.cost}` }]);
    } catch {
      const result = localAStar(nodes, edges, startNode, endNode);
      setApiStatus({ used: false, message: 'Local Fallback Activated' });
      animatePath(result.path, result.cost);
      setChatMessages(prev => [...prev, { role: 'ai', text: result.path.length ? `Path: ${result.path.join(' → ')} | Cost: ${result.cost}` : 'No path found.' }]);
    }
  };

  // ── Chat (AI agent) ───────────────────────────────────────────────────────
  const handleChat = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isThinking) return;
    const msg = userInput.trim();
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsThinking(true);
    try {
      const res  = await fetch(`${PY}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
      
      if (data.action === 'PATH_FOUND') {
        setIsRightSidebarOpen(true); // Auto open when AI finds path
        
        // Normalize the path array
        let normalizedPath = Array.isArray(data.data.path) 
          ? data.data.path 
          : (typeof data.data.path === 'string' ? data.data.path.split(/->|-|,|\s/).map(s=>s.trim()).filter(Boolean) : []);
        
        // Sync the Target Parameters (Start/End) dropdowns and colors with the AI's result
        if (normalizedPath.length >= 2) {
          const aiStart = normalizedPath[0];
          const aiEnd = normalizedPath[normalizedPath.length - 1];
          // Ensure the nodes exist in our graph before setting them
          if (nodes.some(n => String(n.id).trim().toLowerCase() === String(aiStart).trim().toLowerCase())) {
            setStartNode(aiStart);
          }
          if (nodes.some(n => String(n.id).trim().toLowerCase() === String(aiEnd).trim().toLowerCase())) {
            setEndNode(aiEnd);
          }
        }
        
        animatePath(normalizedPath, data.data.cost);
      }
      if (['ADD_NODE', 'ADD_EDGE', 'EDIT_EDGE'].includes(data.action)) fetchGraph();
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Python hub (port 8000) unreachable or encountered an error.' }]);
    } finally { setIsThinking(false); }
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const submitAddNode = async () => {
    const { id, x = 0, y = 0 } = formData;
    if (!id) return;
    const nid = id.toUpperCase();
    try { await fetch(`${JAVA}/api/nodes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: nid, x: +x, y: +y }) }); } catch {}
    setChatMessages(prev => [...prev, { role: 'ai', text: `Node ${nid} added.` }]);
    setAddModal(null); setFormData({}); fetchGraph();
  };

  const submitAddEdge = async () => {
    const { from, to, cost } = formData;
    if (!from || !to || !cost) return;
    const src = from.toUpperCase(), tgt = to.toUpperCase(), w = +cost;
    try { await fetch(`${JAVA}/api/edges`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from: src, to: tgt, cost: w }) }); } catch {}
    setChatMessages(prev => [...prev, { role: 'ai', text: `Edge ${src}→${tgt} (cost ${w}) added.` }]);
    setAddModal(null); setFormData({}); fetchGraph();
  };

  const submitEditEdge = async () => {
    const { id, weight } = formData;
    if (!weight) return;
    try { await fetch(`${JAVA}/api/edges/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cost: +weight }) }); } catch {}
    setChatMessages(prev => [...prev, { role: 'ai', text: `Edge updated to weight ${weight}.` }]);
    setEditModal(null); setFormData({}); fetchGraph();
  };

  const deleteEdge = async (edge) => {
    try { await fetch(`${JAVA}/api/edges/${edge.id}`, { method: 'DELETE' }); } catch {}
    setChatMessages(prev => [...prev, { role: 'ai', text: `Edge ${edge.source}→${edge.target} deleted.` }]);
    setEditModal(null); fetchGraph();
  };

  const deleteNode = async (nodeId) => {
    try { await fetch(`${JAVA}/api/nodes/${nodeId}`, { method: 'DELETE' }); } catch {}
    setAnimatedPath([]);
    setChatMessages(prev => [...prev, { role: 'ai', text: `Node ${nodeId} deleted.` }]);
    fetchGraph();
  };

  // ── Dynamic Path Segments & Cost ──────────────────────────────────────────
  const pathSegments = useMemo(() => {
    const segments = [];
    for (let i = 0; i < animatedPath.length - 1; i++) {
      const srcId = animatedPath[i];
      const tgtId = animatedPath[i + 1];
      
      const srcNode = nodes.find(n => String(n.id).trim().toLowerCase() === String(srcId).trim().toLowerCase());
      const tgtNode = nodes.find(n => String(n.id).trim().toLowerCase() === String(tgtId).trim().toLowerCase());
      
      if (srcNode && tgtNode) {
        const realEdge = edges.find(e => 
          (String(e.source).trim().toLowerCase() === String(srcId).trim().toLowerCase() && String(e.target).trim().toLowerCase() === String(tgtId).trim().toLowerCase()) ||
          (String(e.target).trim().toLowerCase() === String(srcId).trim().toLowerCase() && String(e.source).trim().toLowerCase() === String(tgtId).trim().toLowerCase())
        );
        segments.push({
          id: `${srcNode.id}-${tgtNode.id}`,
          src: srcNode,
          tgt: tgtNode,
          isReal: !!realEdge,
          realEdge
        });
      }
    }
    return segments;
  }, [animatedPath, nodes, edges]);

  const displayCost = useMemo(() => {
    if (!isComputing && animatedPath.length > 1 && totalCost !== null && totalCost !== undefined) {
      return totalCost; // Favor backend's authoritative cost when done
    }
    let cost = 0;
    pathSegments.forEach(seg => {
      if (seg.isReal) cost += seg.realEdge.weight;
    });
    return cost;
  }, [isComputing, animatedPath, totalCost, pathSegments]);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const Modal = ({ title, onClose, onSubmit, children }) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel rounded-2xl p-6 w-80" style={{ border: '1px solid rgba(0,240,255,0.2)' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-xs tracking-widest uppercase font-mono text-cyan-400">{title}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400 hover:text-white" /></button>
        </div>
        <div className="space-y-3">{children}</div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-xs text-slate-400 hover:bg-slate-800">Cancel</button>
          <button onClick={onSubmit} className="flex-1 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold flex items-center justify-center gap-1">
            <Check className="w-3 h-3" /> Confirm
          </button>
        </div>
      </div>
    </div>
  );

  const MInput = ({ label, field, placeholder, type = 'text' }) => (
    <div>
      <label className="text-[9px] uppercase tracking-widest text-slate-400 font-mono mb-1 block">{label}</label>
      <input type={type} placeholder={placeholder} value={formData[field] || ''}
        onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white"
      />
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-screen h-screen overflow-hidden text-slate-200 selection:bg-cyan-500/30">
      <style>{customStyles}</style>

      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black" />
      <div className="cyber-grid" style={{ backgroundPosition: `${transform.x}px ${transform.y}px`, transform: `scale(${transform.scale})`, transformOrigin: '0 0' }} />
      <div className="radar-sweep" />
      <div className="scanlines" />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(p => (
          <div key={p.id} className="absolute w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#00f0ff]"
            style={{ top: p.top, left: p.left, animation: `float ${p.duration} ease-in-out infinite ${p.delay}` }} />
        ))}
      </div>

      {/* Main layout */}
      <div className="relative z-10 flex h-full w-full p-4 gap-4 pointer-events-none">

        {/* ── LEFT PANEL ── */}
        <div className={`glass-panel rounded-2xl flex flex-col h-full shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto transition-all duration-500 shrink-0 ${isLeftSidebarOpen ? 'w-80' : 'w-0 overflow-hidden p-0'}`}>
          {/* Header */}
          <div className="p-6 border-b border-white/5 relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent" />
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="p-2 bg-slate-900 border border-cyan-500/30 rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <Network className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide">Nexus <span className="text-cyan-400">AI</span></h1>
                <p className="text-[10px] text-cyan-500/70 uppercase tracking-[0.2em] font-mono">Routing Agent v2.0</p>
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

            {/* Path finder */}
            <div className="space-y-3 shrink-0">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono">
                <MapPin className="w-4 h-4 text-cyan-400" /> Target Parameters
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">Origin</label>
                  <select value={startNode} onChange={e => { setStartNode(e.target.value); clearResults(); }}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-lg p-2 text-sm focus:border-cyan-400 outline-none font-mono text-cyan-100">
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">Destination</label>
                  <select value={endNode} onChange={e => { setEndNode(e.target.value); clearResults(); }}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-lg p-2 text-sm focus:border-purple-400 outline-none font-mono text-purple-100">
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={findOptimalPath} disabled={isComputing || !startNode || !endNode}
                className={`w-full py-3 rounded-xl font-bold font-mono tracking-wide flex items-center justify-center gap-2 transition-all duration-300 ${
                  isComputing ? 'bg-slate-800 text-slate-500 cursor-wait' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                }`}>
                {isComputing ? <><Activity className="w-4 h-4 animate-spin" /> COMPUTING...</> : <><Play className="w-4 h-4 fill-current" /> COMPUTE PATH</>}
              </button>
            </div>

            {/* Topology builder */}
            <div className="space-y-3 pt-4 border-t border-white/5 shrink-0">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Share2 className="w-4 h-4 text-purple-400" /> Topology Builder
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setAddModal({ type: 'node' }); setFormData({}); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-[10px] font-mono transition-all">
                  <Plus className="w-3 h-3 text-cyan-400" /> Add Node
                </button>
                <button onClick={() => { setAddModal({ type: 'edge' }); setFormData({}); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-[10px] font-mono transition-all">
                  <Plus className="w-3 h-3 text-emerald-400" /> Add Edge
                </button>
              </div>
              <button onClick={() => { clearResults(); fetchGraph(); }}
                className="w-full py-2 flex items-center justify-center gap-2 text-[10px] uppercase font-mono tracking-widest text-slate-500 hover:text-slate-300 transition-colors hover:bg-slate-800/50 rounded-lg">
                <RotateCcw className="w-3 h-3" /> Refresh Graph
              </button>
            </div>

            {/* AI Chat */}
            <div className="flex-1 flex flex-col pt-4 border-t border-white/5 min-h-[250px] mt-auto">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono mb-3">
                <Cpu className="w-4 h-4 text-emerald-400" /> Nexus Terminal
              </h3>
              
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-3">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] p-2.5 rounded-xl text-[10px] font-mono leading-relaxed ${
                      m.role === 'user' ? 'bg-cyan-600/20 border border-cyan-500/30' : 'bg-slate-800/60 border border-white/5 text-slate-300'
                    }`}>
                      <span className="text-[7px] opacity-40 mb-1 block uppercase">{m.role}</span>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isThinking && (
                  <div className="text-[9px] font-mono text-cyan-400 animate-pulse flex items-center gap-2 mt-2">
                    <Activity className="w-3 h-3" /> CALCULATING...
                  </div>
                )}
              </div>

              <form onSubmit={handleChat} className="flex gap-2 mb-2">
                <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)}
                  placeholder="e.g. add node F from A cost 6"
                  className="flex-1 bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-white" />
                <button type="submit" disabled={isThinking}
                  className="p-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 disabled:opacity-40 transition-all shrink-0">
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </form>
              <p className="text-[8px] text-slate-500 font-mono text-center">Right-click node = delete · Click edge badge = edit</p>
            </div>
          </div>
        </div>

        {/* ── CENTER MAP ── */}
        <div className="flex-1 relative rounded-2xl overflow-hidden glass-panel border border-white/5 pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.5)]" onWheel={handleWheel}>

          {/* Left Sidebar toggle */}
          <button onClick={() => setIsLeftSidebarOpen(s => !s)}
            className="absolute left-4 top-4 z-30 p-2 glass-panel rounded-lg hover:bg-slate-800 transition-all border border-white/10 pointer-events-auto">
            <ChevronRight className={`w-4 h-4 transition-transform ${isLeftSidebarOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Right Sidebar toggle - Cool Radar Icon */}
          <button onClick={() => setIsRightSidebarOpen(s => !s)} title="Toggle Telemetry"
            className="absolute right-4 top-4 z-30 p-3 glass-panel rounded-xl hover:bg-slate-800 transition-all border border-emerald-500/40 pointer-events-auto group shadow-[0_0_20px_rgba(16,185,129,0.15)] flex items-center justify-center overflow-hidden">
            {isRightSidebarOpen ? (
              <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-emerald-400/30 blur-[10px] rounded-full animate-pulse" />
              </div>
            )}
          </button>

          <svg ref={svgRef} className={`w-full h-full select-none ${isPanningRef.current ? 'cursor-grabbing' : 'cursor-crosshair'}`}
            onMouseDown={onSvgMouseDown}>
            <defs>
              {pathSegments.map((seg, i) => (
                <linearGradient key={`grad-path-${i}`} id={`grad-path-${seg.src.id}-${seg.tgt.id}`} gradientUnits="userSpaceOnUse" x1={seg.src.x} y1={seg.src.y} x2={seg.tgt.x} y2={seg.tgt.y}>
                  <stop offset="0%" stopColor={seg.isReal ? "#00f0ff" : "#f43f5e"} />
                  <stop offset="100%" stopColor={seg.isReal ? "#a855f7" : "#9f1239"} />
                </linearGradient>
              ))}
              <marker id="arrow" markerUnits="userSpaceOnUse" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="12" markerHeight="12" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.15)" />
              </marker>
              <marker id="arrow-active" markerUnits="userSpaceOnUse" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="14" markerHeight="14" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
              </marker>
              <marker id="arrow-anomaly" markerUnits="userSpaceOnUse" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="14" markerHeight="14" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
              </marker>
            </defs>

            <g ref={gRef} transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>

              {/* Base Edges */}
              {edges.map((edge, i) => {
                const src = nodes.find(n => n.id === edge.source);
                const tgt = nodes.find(n => n.id === edge.target);
                if (!src || !tgt) return null;
                const midX = (src.x + tgt.x) / 2, midY = (src.y + tgt.y) / 2;

                return (
                  <g key={`edge-${edge.id ?? i}`}>
                    {/* Wide invisible hit area */}
                    <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                      stroke="transparent" strokeWidth="24" style={{ cursor: 'pointer' }}
                      onClick={() => { setEditModal({ type: 'edge', data: edge }); setFormData({ id: edge.id, weight: edge.weight }); }}
                    />
                    {/* Background line */}
                    <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth={2}
                      markerEnd="url(#arrow)"
                    />
                    {/* Weight badge */}
                    <g transform={`translate(${midX}, ${midY})`} style={{ cursor: 'pointer' }}
                      onClick={() => { setEditModal({ type: 'edge', data: edge }); setFormData({ id: edge.id, weight: edge.weight }); }}>
                      <rect x="-14" y="-10" width="28" height="20" rx="4"
                        fill="#0f172a" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                      <text fill="#64748b" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold" textAnchor="middle" dominantBaseline="central">
                        {edge.weight}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Path Highlight Segments */}
              {pathSegments.map((seg, i) => (
                <g key={`path-highlight-${i}`}>
                  <line x1={seg.src.x} y1={seg.src.y} x2={seg.tgt.x} y2={seg.tgt.y}
                    stroke={`url(#grad-path-${seg.src.id}-${seg.tgt.id})`} 
                    strokeWidth="4" 
                    strokeDasharray={seg.isReal ? "none" : "8 8"}
                    markerEnd={seg.isReal ? "url(#arrow-active)" : "url(#arrow-anomaly)"}
                  />
                  <line x1={seg.src.x} y1={seg.src.y} x2={seg.tgt.x} y2={seg.tgt.y} className="data-packet pointer-events-none" />
                  
                  <g transform={`translate(${(seg.src.x + seg.tgt.x) / 2}, ${(seg.src.y + seg.tgt.y) / 2})`} className="pointer-events-none">
                    <rect x="-14" y="-10" width="28" height="20" rx="4"
                      fill="#020617" stroke={seg.isReal ? '#d946ef' : '#f43f5e'} strokeWidth="1" />
                    <text fill={seg.isReal ? '#e879f9' : '#fb7185'} fontSize="10"
                      fontFamily="JetBrains Mono" fontWeight="bold" textAnchor="middle" dominantBaseline="central">
                      {seg.isReal ? seg.realEdge.weight : '?'}
                    </text>
                  </g>
                </g>
              ))}

              {/* Nodes */}
              {nodes.map((node) => {
                const isStart  = String(node.id).trim().toLowerCase() === String(startNode).trim().toLowerCase();
                const isEnd    = String(node.id).trim().toLowerCase() === String(endNode).trim().toLowerCase();
                const isInPath = animatedPath.some(p => String(p).trim().toLowerCase() === String(node.id).trim().toLowerCase());

                let theme = { stroke: 'rgba(255,255,255,0.2)', fill: '#0f172a', text: '#94a3b8', glow: '', aura: '' };
                if (isStart)       theme = { stroke: '#00f0ff', fill: '#082f49', text: '#fff', glow: 'drop-shadow(0 0 20px rgba(0,240,255,0.8))', aura: 'rgba(0,240,255,0.15)' };
                else if (isEnd)    theme = { stroke: '#d946ef', fill: '#3b0764', text: '#fff', glow: 'drop-shadow(0 0 20px rgba(217,70,239,0.8))', aura: 'rgba(217,70,239,0.15)' };
                else if (isInPath) theme = { stroke: '#3b82f6', fill: '#172554', text: '#fff', glow: 'drop-shadow(0 0 15px rgba(59,130,246,0.6))', aura: 'rgba(59,130,246,0.15)' };

                return (
                  <g key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={e => onNodeMouseDown(e, node)}
                    onContextMenu={e => { e.preventDefault(); deleteNode(node.id); }}
                    className="cursor-pointer group"
                  >
                    <circle r="45" fill="transparent" />

                    {/* Depth aura */}
                    {(isStart || isEnd || isInPath) && (
                      <circle r="55" fill={theme.aura} style={{ filter: 'blur(15px)' }} className="animate-pulse pointer-events-none" />
                    )}

                    {/* Click ripple */}
                    {ripples.filter(r => r.nodeId === node.id).map(r => (
                      <circle key={r.id} fill="none" stroke={theme.stroke} className="animate-[ripple_0.8s_ease-out_forwards] pointer-events-none" />
                    ))}

                    <g className="transition-transform duration-300 group-hover:scale-125">
                      {/* Dashed hover ring */}
                      <circle r="25" fill="none" stroke={theme.stroke} strokeWidth="1.5" strokeDasharray="4 6"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-[spin_3s_linear_infinite]" />
                      {/* Sci-fi HUD rings for path nodes */}
                      {(isStart || isEnd || isInPath) && (
                        <>
                          <circle r="32" fill="none" stroke={theme.stroke} strokeWidth="1" strokeDasharray="10 5" opacity="0.6" className="animate-[spin_6s_linear_infinite]" />
                          <circle r="27" fill="none" stroke={theme.stroke} strokeWidth="2" strokeDasharray="4 8" opacity="0.4" className="animate-[spin_4s_linear_infinite_reverse]" />
                        </>
                      )}
                      {/* Core */}
                      <circle r="18" fill={theme.fill} stroke={theme.stroke} strokeWidth="2.5"
                        className="transition-all duration-300 group-hover:drop-shadow-[0_0_30px_#00f0ff]"
                        style={{ filter: theme.glow }} />
                      {/* Label */}
                      <text fill={theme.text} fontSize="14" fontFamily="JetBrains Mono" fontWeight="bold"
                        textAnchor="middle" dominantBaseline="central"
                        className={`transition-colors duration-300 group-hover:fill-white select-none ${isStart ? 'neon-text' : isEnd ? 'neon-text-purple' : isInPath ? 'neon-text-blue' : ''}`}
                        style={{ pointerEvents: 'none' }}>
                        {node.id}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* HUD */}
          <div className="absolute top-4 left-16 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 flex items-center gap-3 font-mono shadow-lg pointer-events-none">
            <Info className="w-4 h-4 text-cyan-500" />
            <div className="flex flex-col">
              <span className="text-[10px] text-cyan-400 tracking-wider">NAV_SYSTEM_ONLINE</span>
              <span className="text-[9px] text-slate-400">Scroll to Zoom · Drag to Pan · Right-click node = delete</span>
            </div>
          </div>

          {/* Viewport coords */}
          <div className="absolute bottom-4 right-4 text-right font-mono text-[9px] text-slate-500 leading-tight select-none bg-slate-900/60 p-2 rounded border border-white/5 backdrop-blur pointer-events-none">
            <p>X: {Math.round(-transform.x)} Y: {Math.round(-transform.y)}</p>
            <p>SCALE: {transform.scale.toFixed(2)}x</p>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className={`relative h-full transition-all duration-500 shrink-0 ${isRightSidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}`}>
          <div className={`glass-panel absolute top-0 right-0 w-72 bottom-0 rounded-2xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto transition-transform duration-500 ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-[150%]'}`}>
            <div className="p-5 border-b border-white/5 bg-slate-900/30 shrink-0">
              <h2 className="text-sm font-mono font-bold flex items-center gap-2 text-white uppercase tracking-widest">
                <Cpu className="w-4 h-4 text-emerald-400" /> Telemetry
              </h2>
            </div>

            <div className="p-5 space-y-5 flex-1 flex flex-col overflow-y-auto">
              {isComputing && animatedPath.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-70 animate-pulse">
                  <Activity className="w-10 h-10 mb-3 text-cyan-500 animate-spin" />
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400">Establishing Neural Link...<br /><span className="text-slate-400 mt-1 block">Calculating Heuristics</span></p>
                </div>
              ) : animatedPath.length > 0 ? (
                <div className="flex-1 space-y-5">
                  <div>
                    <p className="text-[10px] text-cyan-500 font-mono uppercase tracking-[0.2em] mb-2">Live Trajectory</p>
                    <div className="flex flex-wrap gap-2 items-center bg-slate-900/50 p-3 rounded-xl border border-cyan-500/20">
                      {animatedPath.map((node, i) => (
                        <React.Fragment key={`path-${i}`}>
                          <div className={`w-7 h-7 rounded border flex items-center justify-center font-bold font-mono text-white text-xs shadow-lg ${
                            node === startNode ? 'bg-slate-900 border-cyan-500 shadow-cyan-500/30' :
                            node === endNode   ? 'bg-slate-900 border-purple-500 shadow-purple-500/30' :
                                                 'bg-slate-800 border-blue-500 shadow-blue-500/30'
                          }`}>{node}</div>
                          {i < animatedPath.length - 1 && (
                            <div className="w-3 h-px bg-cyan-500/50 relative">
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-cyan-300 rounded-full shadow-[0_0_6px_#00f0ff] animate-pulse" />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                      <p className="text-[9px] font-mono text-slate-400 uppercase">Cost</p>
                      <p className="text-3xl font-light font-mono text-white mt-1 group-hover:text-emerald-400 transition-colors">{displayCost}</p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-purple-500/20 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                      <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                      <p className="text-[9px] font-mono text-slate-400 uppercase">Hops</p>
                      <p className="text-3xl font-light font-mono text-white mt-1 group-hover:text-purple-400 transition-colors">{animatedPath.length - 1}</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-700 p-3 rounded-xl relative">
                    <Zap className="absolute top-3 right-3 w-3 h-3 text-amber-400 opacity-50" />
                    <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest mb-2">Diagnostics</p>
                    <p className="text-[10px] font-mono text-slate-300 leading-relaxed">
                      A* complete. <span className="text-cyan-400 font-bold">{startNode}</span> → <span className="text-purple-400 font-bold">{endNode}</span>
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 rounded bg-black/50 border border-white/5 text-[9px] font-mono text-slate-300 uppercase">
                      <div className={`w-1.5 h-1.5 rounded-full ${apiStatus.used ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-amber-500 shadow-[0_0_6px_#f59e0b]'}`} />
                      {apiStatus.message || 'Ready'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                  <Terminal className="w-10 h-10 mb-3 text-slate-500" />
                  <p className="text-xs font-mono uppercase tracking-widest">Awaiting Parameters<br />System Idle</p>
                </div>
              )}

              {/* Fake terminal log */}
              <div className="mt-auto pt-4 border-t border-white/5">
                <div className="h-14 overflow-hidden relative font-mono text-[9px] text-emerald-500/50 leading-tight">
                  <div className="absolute bottom-0 w-full">
                    <p>&gt; SYS.INIT: Neural routing core v2.0 loaded</p>
                    <p>&gt; SEC: Handshake verified 0x9F3A</p>
                    {isComputing && <p className="text-cyan-400">&gt; EXEC: A* pathfinding active...</p>}
                    {animatedPath.length > 0 && !isComputing && <p className="text-emerald-400">&gt; SUCCESS: Optimal vector established.</p>}
                    <p>&gt; NET: Waiting for user input...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Modals ── */}
      {addModal?.type === 'node' && (
        <Modal title="Add New Node" onClose={() => setAddModal(null)} onSubmit={submitAddNode}>
          <MInput label="Node ID (e.g. E)" field="id" placeholder="Letter or short code" />
          <div className="grid grid-cols-2 gap-2">
            <MInput label="X grid coord" field="x" placeholder="0" type="number" />
            <MInput label="Y grid coord" field="y" placeholder="0" type="number" />
          </div>
        </Modal>
      )}
      {addModal?.type === 'edge' && (
        <Modal title="Add New Edge" onClose={() => setAddModal(null)} onSubmit={submitAddEdge}>
          <div className="grid grid-cols-2 gap-2">
            <MInput label="From Node" field="from" placeholder="e.g. A" />
            <MInput label="To Node"   field="to"   placeholder="e.g. B" />
          </div>
          <MInput label="Cost / Weight" field="cost" placeholder="e.g. 5" type="number" />
        </Modal>
      )}
      {editModal?.type === 'edge' && (
        <Modal title={`Edit ${editModal.data.source} → ${editModal.data.target}`}
          onClose={() => setEditModal(null)} onSubmit={submitEditEdge}>
          <p className="text-[9px] text-slate-400 font-mono">Current weight: <span className="text-cyan-400 font-bold">{editModal.data.weight}</span></p>
          <MInput label="New Weight" field="weight" placeholder={String(editModal.data.weight)} type="number" />
          <button onClick={() => deleteEdge(editModal.data)}
            className="w-full py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-mono flex items-center justify-center gap-2 mt-1 transition-all">
            <Trash2 className="w-3 h-3" /> Delete this edge
          </button>
        </Modal>
      )}
    </div>
  );
}