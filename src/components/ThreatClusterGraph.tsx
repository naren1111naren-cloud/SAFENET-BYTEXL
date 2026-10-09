'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-data';
import { ThreatItem, ThreatIOC } from '@/types/brand';
import {
  ThreatCluster,
  ClusterGraphData,
  clusterThreatsBySharedIocs,
  getSampleClusteredThreats,
} from '@/lib/clustering/threat-clusterer';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
  ShieldAlert,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ThreatClusterGraphProps {
  threats: ThreatItem[];
  onSeedDemoData?: (sampleThreats: ThreatItem[]) => void;
}

export default function ThreatClusterGraph({ threats, onSeedDemoData }: ThreatClusterGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  // Compute cluster data as derived state
  const graphData = React.useMemo(() => {
    return clusterThreatsBySharedIocs(threats);
  }, [threats]);

  const [selectedCluster, setSelectedCluster] = useState<ThreatCluster | null>(null);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<any | null>(null);
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterClusterId, setFilterClusterId] = useState<string>('all');

  // Initialize and update Vis-Network graph
  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    let visibleNodes = graphData.nodes;
    let visibleEdges = graphData.edges;

    if (filterClusterId !== 'all') {
      const activeCluster = graphData.clusters.find((c) => c.id === filterClusterId);
      if (activeCluster) {
        const clusterThreatIds = new Set(activeCluster.threats.map((t) => `threat-${t.id}`));
        visibleNodes = graphData.nodes.filter(
          (n) =>
            n.clusterId === filterClusterId ||
            clusterThreatIds.has(n.id) ||
            n.id.startsWith(`ioc-${filterClusterId}`) ||
            n.id === `hub-${filterClusterId}`
        );
        const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
        visibleEdges = graphData.edges.filter(
          (e) => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to)
        );
      }
    }

    const nodesDataSet = new DataSet(
      visibleNodes.map((node) => ({
        id: node.id,
        label: node.label,
        title: node.title,
        shape: node.shape || 'dot',
        size: node.size || 20,
        color: node.color,
        font: node.font || { color: '#202723', size: 11, face: 'monospace' },
        borderWidth: 2,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.08)',
          size: 6,
          x: 2,
          y: 2,
        },
      }))
    );

    const edgesDataSet = new DataSet(
      visibleEdges.map((edge) => ({
        id: edge.id,
        from: edge.from,
        to: edge.to,
        label: edge.label,
        dashes: edge.dashes,
        color: edge.color || { color: '#DDE2DC', highlight: '#477A60' },
        width: edge.width || 1,
        font: { color: '#626B65', size: 9, face: 'monospace', align: 'middle' },
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.2,
        },
      }))
    );

    const options = {
      nodes: {
        borderWidthSelected: 3,
      },
      edges: {
        arrows: {
          to: { enabled: true, scaleFactor: 0.5 },
        },
        selectionWidth: 3,
      },
      physics: {
        enabled: physicsEnabled,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -70,
          centralGravity: 0.015,
          springLength: 95,
          springConstant: 0.07,
          damping: 0.45,
          avoidOverlap: 0.8,
        },
        stabilization: {
          iterations: 120,
          updateInterval: 25,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        zoomView: true,
        dragView: true,
        navigationButtons: false,
        keyboard: true,
      },
    };

    const network = new Network(
      containerRef.current,
      { nodes: nodesDataSet, edges: edgesDataSet },
      options
    );
    networkRef.current = network;

    network.on('click', (params) => {
      if (params.nodes && params.nodes.length > 0) {
        const clickedNodeId = params.nodes[0];
        const clickedNode = visibleNodes.find((n) => n.id === clickedNodeId);

        if (clickedNode) {
          if (clickedNode.clusterId) {
            const cluster = graphData.clusters.find((c) => c.id === clickedNode.clusterId);
            setSelectedCluster(cluster || null);
          }

          if (clickedNodeId.startsWith('threat-')) {
            const threatId = clickedNodeId.replace('threat-', '');
            const threatObj = threats.find((t) => t.id === threatId);
            setSelectedNodeDetails({
              type: 'threat',
              node: clickedNode,
              data: threatObj,
            });
          } else {
            setSelectedNodeDetails({
              type: 'ioc',
              node: clickedNode,
            });
          }
        }
      } else {
        setSelectedNodeDetails(null);
      }
    });

    return () => {
      network.destroy();
    };
  }, [graphData, physicsEnabled, filterClusterId, threats]);

  // Viewport Control Actions
  const handleZoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 1.3, animation: { duration: 300, easingFunction: 'easeInOutQuad' } });
    }
  };

  const handleZoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 0.7, animation: { duration: 300, easingFunction: 'easeInOutQuad' } });
    }
  };

  const handleFit = () => {
    if (networkRef.current) {
      networkRef.current.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
    }
  };

  const handleTogglePhysics = () => {
    setPhysicsEnabled(!physicsEnabled);
  };

  const totalClusters = graphData?.clusters.length || 0;
  const clusteredAssetCount =
    graphData?.clusters.reduce((acc, c) => acc + c.threats.length, 0) || 0;

  return (
    <div
      className={`flex flex-col bg-white border border-[#DDE2DC] rounded-xl shadow-xs overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'relative w-full'
      }`}
    >
      {/* Topology Toolbar */}
      <div className="px-5 py-3 bg-[#F7F8F6] border-b border-[#DDE2DC] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#477A60] animate-pulse" />
            <span className="font-bold text-[#202723] uppercase tracking-wider text-[11px]">
              THREAT CLUSTER GRAPH
            </span>
          </div>
          <span className="text-[#858D86]">|</span>
          <span className="text-[#626B65] text-[11px]">
            Force-Directed Network Projection
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Cluster Filter */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <FilterIcon className="h-3 w-3 text-[#858D86]" />
            <select
              value={filterClusterId}
              onChange={(e) => setFilterClusterId(e.target.value)}
              className="bg-white border border-[#DDE2DC] text-[#202723] text-[11px] rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#477A60]"
            >
              <option value="all">All Clusters ({totalClusters})</option>
              {graphData?.clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.assetCount} assets)
                </option>
              ))}
            </select>
          </div>

          {/* Graph Controls */}
          <div className="flex items-center bg-white border border-[#DDE2DC] rounded-lg p-0.5 shadow-xs">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-[#626B65] hover:text-[#202723] transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-[#626B65] hover:text-[#202723] transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleFit}
              className="p-1.5 text-[#626B65] hover:text-[#202723] transition cursor-pointer"
              title="Fit to Screen"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleTogglePhysics}
              className={`p-1.5 transition text-[10px] font-mono font-bold cursor-pointer ${
                physicsEnabled
                  ? 'text-[#477A60]'
                  : 'text-[#858D86] hover:text-[#202723]'
              }`}
              title="Toggle Force Physics Simulation"
            >
              {physicsEnabled ? 'PHYSICS' : 'STATIC'}
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-[#626B65] hover:text-[#202723] transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Cluster Summary Metric Bar */}
      <div className="px-5 py-2.5 bg-white border-b border-[#DDE2DC] flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[#858D86] font-bold">CAMPAIGNS:</span>
            <span className="text-[#C93643] font-bold">{totalClusters} Clusters</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#858D86] font-bold">CLUSTERED ASSETS:</span>
            <span className="text-[#202723] font-bold">{clusteredAssetCount} Nodes</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[#858D86] font-bold">STANDALONE:</span>
            <span className="text-[#626B65]">{graphData?.unclusteredCount || 0}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[#626B65]">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-[#C93643] inline-block" />
            Campaign Hub
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-[#B7791F] inline-block" />
            Shared Clue
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-[#477A60] inline-block" />
            Threat Asset
          </span>
        </div>
      </div>

      {/* Main Canvas Container */}
      <div className="relative flex-1 w-full min-h-[500px] bg-[#F7F8F6] overflow-hidden">
        <div ref={containerRef} className="w-full h-full min-h-[500px]" />

        {/* Empty State Overlay */}
        {(!graphData || (graphData.nodes.length === 0 && graphData.clusters.length === 0)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white/95 z-20">
            <div className="h-12 w-12 rounded-xl bg-[#C93643]/10 border border-[#C93643]/30 flex items-center justify-center text-[#C93643] mb-3">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-[#202723]">No Threat Clusters Discovered</h3>
            <p className="text-xs text-[#626B65] max-w-md mt-1 mb-4">
              Discovered threat entities sharing identical infrastructure or identifiers (UPI VPAs, phone numbers, Telegram channels, or hosting IPs) will automatically coalesce into campaign hubs.
            </p>
          </div>
        )}

        {/* Floating Side Panel: Selected Cluster Dossier */}
        {selectedCluster && (
          <div className="absolute top-4 right-4 w-96 max-w-[calc(100%-2rem)] max-h-[calc(100%-2rem)] overflow-y-auto bg-white/95 border border-[#DDE2DC] rounded-xl p-4 shadow-xl backdrop-blur-md z-30">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#DDE2DC]">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C93643]/10 text-[#C93643] border border-[#C93643]/30 uppercase">
                  {selectedCluster.attackerTag}
                </span>
                <h3 className="text-sm font-bold text-[#202723] mt-1.5 leading-snug">
                  {selectedCluster.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCluster(null)}
                className="text-[#858D86] hover:text-[#202723] p-1 rounded-lg hover:bg-[#ECEFEC] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F7F8F6] border border-[#DDE2DC]">
                <span className="text-[#626B65] font-mono font-medium">Cluster Risk Level:</span>
                <span className="font-mono font-bold text-[#C93643] bg-[#C93643]/10 px-2 py-0.5 rounded border border-[#C93643]/20">
                  Peak Risk {selectedCluster.highestRiskScore}/100
                </span>
              </div>

              {/* Shared Pivot Clues */}
              <div>
                <h4 className="text-[11px] font-mono font-bold text-[#858D86] uppercase tracking-wider mb-2">
                  🔑 Shared Attacker Clues (Pivot IOCs)
                </h4>
                <div className="space-y-1.5">
                  {selectedCluster.sharedIocs.map((ioc, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-[#F7F8F6] border border-[#DDE2DC] flex items-center justify-between font-mono"
                    >
                      <span className="text-[10px] uppercase font-bold text-[#B7791F] bg-[#B7791F]/10 px-1.5 py-0.5 rounded">
                        {ioc.type}
                      </span>
                      <span className="text-[#202723] text-xs font-semibold truncate max-w-[200px]">{ioc.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Impersonation Assets */}
              <div>
                <h4 className="text-[11px] font-mono font-bold text-[#858D86] uppercase tracking-wider mb-2">
                  ⚔️ Linked Threat Assets ({selectedCluster.threats.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedCluster.threats.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-lg bg-[#F7F8F6] border border-[#DDE2DC] hover:border-[#858D86] transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#202723] text-xs truncate max-w-[190px]">
                          {t.targetAsset}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[#C93643]">
                          {t.riskScore}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#626B65] uppercase font-mono block mt-0.5">
                        {t.type.replace('_', ' ')} • {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Side Panel: Selected Threat Node Details */}
        {selectedNodeDetails && (
          <div className="absolute top-4 right-4 w-88 max-w-[calc(100%-2rem)] bg-white/95 border border-[#DDE2DC] rounded-xl p-4 shadow-xl backdrop-blur-md z-30">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#DDE2DC]">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#B7791F]/10 text-[#B7791F] border border-[#B7791F]/30 uppercase">
                  {selectedNodeDetails.type === 'threat' ? 'Threat Asset Node' : 'Shared Clue IOC'}
                </span>
                <h3 className="text-xs font-bold text-[#202723] mt-1.5 font-mono break-all">
                  {selectedNodeDetails.type === 'threat'
                    ? selectedNodeDetails.data?.targetAsset
                    : selectedNodeDetails.node?.label}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNodeDetails(null)}
                className="text-[#858D86] hover:text-[#202723] p-1 rounded-lg hover:bg-[#ECEFEC] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedNodeDetails.type === 'threat' && selectedNodeDetails.data && (
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#F7F8F6] border border-[#DDE2DC]">
                  <span className="text-[#626B65] font-mono font-medium">Risk Score:</span>
                  <span className="font-mono font-bold text-[#C93643]">
                    {selectedNodeDetails.data.riskScore}/100
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#F7F8F6] border border-[#DDE2DC] text-[11px] text-[#202723]">
                  <span className="font-mono text-[#858D86] block mb-1 uppercase text-[10px] font-bold">Detected Reasons:</span>
                  {selectedNodeDetails.data.reasons?.map((r: string, idx: number) => (
                    <p key={idx} className="text-[#626B65] mb-1">• {r}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
