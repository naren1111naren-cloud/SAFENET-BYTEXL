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
        font: node.font || { color: '#ffffff', size: 11, face: 'monospace' },
        borderWidth: 2,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.8)',
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
        color: edge.color || { color: 'rgba(255,255,255,0.15)', highlight: '#18E6A3' },
        width: edge.width || 1,
        font: { color: '#8A9390', size: 9, face: 'monospace', align: 'middle' },
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
      if (params.nodes.length > 0) {
        const clickedNodeId = params.nodes[0] as string;
        const foundNode = graphData.nodes.find((n) => n.id === clickedNodeId);

        if (foundNode) {
          if (foundNode.group === 'cluster_hub' && foundNode.clusterId) {
            const cluster = graphData.clusters.find((c) => c.id === foundNode.clusterId);
            setSelectedCluster(cluster || null);
            setSelectedNodeDetails(null);
          } else if (foundNode.threatId) {
            const threat = threats.find((t) => t.id === foundNode.threatId);
            setSelectedNodeDetails({ type: 'threat', data: threat, node: foundNode });
            setSelectedCluster(null);
          } else {
            setSelectedNodeDetails({ type: 'ioc', node: foundNode });
            setSelectedCluster(null);
          }
        }
      } else {
        setSelectedNodeDetails(null);
        setSelectedCluster(null);
      }
    });

    return () => {
      network.destroy();
      networkRef.current = null;
    };
  }, [graphData, filterClusterId, physicsEnabled, threats]);

  const handleZoomIn = () => {
    if (!networkRef.current) return;
    const scale = networkRef.current.getScale();
    networkRef.current.moveTo({ scale: scale * 1.3, animation: true });
  };

  const handleZoomOut = () => {
    if (!networkRef.current) return;
    const scale = networkRef.current.getScale();
    networkRef.current.moveTo({ scale: scale / 1.3, animation: true });
  };

  const handleFit = () => {
    if (!networkRef.current) return;
    networkRef.current.fit({ animation: true });
  };

  const handleTogglePhysics = () => {
    setPhysicsEnabled(!physicsEnabled);
  };

  const handleLoadSampleData = () => {
    if (onSeedDemoData) {
      const sampleThreats = getSampleClusteredThreats();
      onSeedDemoData(sampleThreats);
    }
  };

  const totalClusters = graphData?.clusters.length || 0;
  const clusteredAssetCount =
    graphData?.clusters.reduce((acc, c) => acc + c.assetCount, 0) || 0;

  return (
    <div className={`bg-[#080A0B] border border-[rgba(255,255,255,0.08)] rounded-[2px] overflow-hidden flex flex-col transition-all ${
      isFullscreen ? 'fixed inset-4 z-50 bg-[#080A0B]' : 'relative'
    }`}>
      {/* Graph Toolbar */}
      <div className="p-4 sm:p-5 border-b border-[rgba(255,255,255,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0D1011]">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-normal text-[#F2F4F3] tracking-tight">
                Adversary Threat Clusters & Infrastructure Topology
              </h2>
              <span className="font-mono text-[10px] text-[#FF5C5C] uppercase tracking-wider">
                Correlated Ring
              </span>
            </div>
            <p className="text-[12px] text-[#8A9390] mt-0.5">
              Correlating threats sharing identical UPI VPAs, phone numbers, Telegram bots, and hosting IPs.
            </p>
          </div>
        </div>

        {/* Controls & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Cluster Selector */}
          <div className="flex items-center gap-2 bg-[#080A0B] border border-[rgba(255,255,255,0.08)] px-3 py-1 rounded-[2px] text-xs">
            <select
              value={filterClusterId}
              onChange={(e) => setFilterClusterId(e.target.value)}
              className="bg-transparent text-[#F2F4F3] focus:outline-none text-[11px] font-mono"
            >
              <option value="all" className="bg-[#080A0B]">All Clusters ({totalClusters})</option>
              {graphData?.clusters.map((cluster) => (
                <option key={cluster.id} value={cluster.id} className="bg-[#080A0B]">
                  {cluster.name} ({cluster.attackerTag})
                </option>
              ))}
            </select>
          </div>

          {/* Graph Controls */}
          <div className="flex items-center bg-[#080A0B] border border-[rgba(255,255,255,0.08)] rounded-[2px] p-0.5">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-[#8A9390] hover:text-[#F2F4F3] transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-[#8A9390] hover:text-[#F2F4F3] transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleFit}
              className="p-1.5 text-[#8A9390] hover:text-[#F2F4F3] transition-colors cursor-pointer"
              title="Fit to Screen"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleTogglePhysics}
              className={`p-1.5 transition-colors text-[10px] font-mono cursor-pointer ${
                physicsEnabled
                  ? 'text-[#18E6A3]'
                  : 'text-[#59625F] hover:text-[#8A9390]'
              }`}
              title="Toggle Force Physics Simulation"
            >
              {physicsEnabled ? 'PHYSICS' : 'STATIC'}
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-[#8A9390] hover:text-[#F2F4F3] transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Cluster Summary Metric Bar */}
      <div className="px-5 py-2.5 bg-[#080A0B] border-b border-[rgba(255,255,255,0.08)] flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[#59625F]">CAMPAIGNS:</span>
            <span className="text-[#FF5C5C]">{totalClusters} Clusters</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#59625F]">CLUSTERED ASSETS:</span>
            <span className="text-[#F2F4F3]">{clusteredAssetCount} Nodes</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[#59625F]">STANDALONE:</span>
            <span className="text-[#8A9390]">{graphData?.unclusteredCount || 0}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[#8A9390]">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C5C] inline-block" />
            Campaign Hub
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F5B84B] inline-block" />
            Shared Clue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#18E6A3] inline-block" />
            Threat Asset
          </span>
        </div>
      </div>

      {/* Main Canvas Container (Pure Black) */}
      <div className="relative flex-1 w-full min-h-[500px] bg-black overflow-hidden">
        <div ref={containerRef} className="w-full h-full min-h-[500px]" />

        {/* Empty State Overlay */}
        {(!graphData || (graphData.nodes.length === 0 && graphData.clusters.length === 0)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/95 z-20">
            <div className="h-12 w-12 rounded bg-[#EB364B]/10 border border-[#EB364B]/30 flex items-center justify-center text-[#EB364B] mb-3">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No Threat Clusters Discovered</h3>
            <p className="text-xs text-[#A0A0A0] max-w-md mt-1 mb-4">
              Discovered threat entities sharing identical infrastructure or identifiers (UPI VPAs, phone numbers, Telegram channels, or hosting IPs) will automatically coalesce into campaign hubs.
            </p>
          </div>
        )}

        {/* Floating Side Panel: Selected Cluster Dossier */}
        {selectedCluster && (
          <div className="absolute top-4 right-4 w-96 max-w-[calc(100%-2rem)] max-h-[calc(100%-2rem)] overflow-y-auto bg-[#0E0E0E]/95 border border-[#EB364B]/40 rounded p-4 shadow-2xl backdrop-blur-xl z-30">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#222222]">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EB364B]/20 text-[#EB364B] border border-[#EB364B]/30 uppercase">
                  {selectedCluster.attackerTag}
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5 leading-snug">
                  {selectedCluster.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCluster(null)}
                className="text-[#767676] hover:text-white p-1 rounded hover:bg-[#1A1A1A] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded bg-black border border-[#222222]">
                <span className="text-[#A0A0A0] font-mono">Cluster Risk Level:</span>
                <span className="font-mono font-bold text-[#EB364B] bg-[#EB364B]/10 px-2 py-0.5 rounded border border-[#EB364B]/20">
                  Peak Risk {selectedCluster.highestRiskScore}/100
                </span>
              </div>

              {/* Shared Pivot Clues */}
              <div>
                <h4 className="text-[11px] font-mono font-semibold text-[#A0A0A0] uppercase tracking-wider mb-2">
                  🔑 Shared Attacker Clues (Pivot IOCs)
                </h4>
                <div className="space-y-1.5">
                  {selectedCluster.sharedIocs.map((ioc, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-black border border-[#222222] flex items-center justify-between font-mono"
                    >
                      <span className="text-[10px] uppercase font-bold text-[#F38020] bg-[#F38020]/10 px-1.5 py-0.5 rounded">
                        {ioc.type}
                      </span>
                      <span className="text-white text-xs truncate max-w-[200px]">{ioc.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Impersonation Assets */}
              <div>
                <h4 className="text-[11px] font-mono font-semibold text-[#A0A0A0] uppercase tracking-wider mb-2">
                  ⚔️ Linked Threat Assets ({selectedCluster.threats.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedCluster.threats.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded bg-black border border-[#222222] hover:border-[#383838] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-white text-xs truncate max-w-[190px]">
                          {t.targetAsset}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[#EB364B]">
                          {t.riskScore}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#767676] uppercase font-mono block mt-0.5">
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
          <div className="absolute top-4 right-4 w-88 max-w-[calc(100%-2rem)] bg-[#0E0E0E]/95 border border-[#333333] rounded p-4 shadow-2xl backdrop-blur-xl z-30">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#222222]">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F38020]/20 text-[#F38020] border border-[#F38020]/30 uppercase">
                  {selectedNodeDetails.type === 'threat' ? 'Threat Asset Node' : 'Shared Clue IOC'}
                </span>
                <h3 className="text-xs font-bold text-white mt-1.5 font-mono break-all">
                  {selectedNodeDetails.type === 'threat'
                    ? selectedNodeDetails.data?.targetAsset
                    : selectedNodeDetails.node?.label}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNodeDetails(null)}
                className="text-[#767676] hover:text-white p-1 rounded hover:bg-[#1A1A1A] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedNodeDetails.type === 'threat' && selectedNodeDetails.data && (
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-black border border-[#222222]">
                  <span className="text-[#A0A0A0] font-mono">Risk Score:</span>
                  <span className="font-mono font-bold text-[#EB364B]">
                    {selectedNodeDetails.data.riskScore}/100
                  </span>
                </div>
                <div className="p-2 rounded bg-black border border-[#222222] text-[11px] text-[#CCCCCC]">
                  <span className="font-mono text-[#767676] block mb-1 uppercase text-[10px]">Detected Reasons:</span>
                  {selectedNodeDetails.data.reasons?.map((r: string, idx: number) => (
                    <p key={idx} className="text-[#A0A0A0] mb-1">• {r}</p>
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
