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
        size: node.size || 22,
        color: node.color,
        font: node.font || { color: '#FFFFFF', size: 14, face: 'monospace', strokeWidth: 2, strokeColor: '#080B10' },
        borderWidth: 2,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.4)',
          size: 8,
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
        color: edge.color || { color: '#303946', highlight: '#35D0BA' },
        width: edge.width || 1.5,
        font: { color: '#D0D7E0', size: 12, face: 'monospace', align: 'middle', strokeWidth: 2, strokeColor: '#080B10' },
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
      className={`flex flex-col bg-[#0D1118] border border-[#303946] rounded-xl overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'relative w-full'
      }`}
    >
      {/* Topology Toolbar */}
      <div className="px-6 py-4 bg-[#121821] border-b border-[#303946] flex flex-wrap items-center justify-between gap-4 font-mono text-[16px] font-bold">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#35D0BA] animate-pulse" />
            <span className="font-bold text-[#FFFFFF] uppercase tracking-wider text-[16px]">
              THREAT CLUSTER GRAPH
            </span>
          </div>
          <span className="text-[#303946]">|</span>
          <span className="text-[#D0D7E0] text-[15px] font-bold">
            Force-Directed Network Projection
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Cluster Filter */}
          <div className="flex items-center gap-2 text-[15px]">
            <FilterIcon className="h-4 w-4 text-[#35D0BA]" />
            <select
              value={filterClusterId}
              onChange={(e) => setFilterClusterId(e.target.value)}
              className="bg-[#080B10] border border-[#303946] text-[#FFFFFF] text-[15px] font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#35D0BA]"
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
          <div className="flex items-center bg-[#080B10] border border-[#303946] rounded-lg p-1">
            <button
              onClick={handleZoomIn}
              className="p-2 text-[#FFFFFF] hover:text-[#35D0BA] transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 text-[#FFFFFF] hover:text-[#35D0BA] transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={handleFit}
              className="p-2 text-[#FFFFFF] hover:text-[#35D0BA] transition cursor-pointer"
              title="Fit to Screen"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleTogglePhysics}
              className={`p-2 transition text-[13px] font-mono font-bold cursor-pointer ${
                physicsEnabled
                  ? 'text-[#35D0BA]'
                  : 'text-[#D0D7E0] hover:text-[#FFFFFF]'
              }`}
              title="Toggle Force Physics Simulation"
            >
              {physicsEnabled ? 'PHYSICS' : 'STATIC'}
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-[#FFFFFF] hover:text-[#35D0BA] transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Cluster Summary Metric Bar */}
      <div className="px-6 py-3 bg-[#0D1118] border-b border-[#303946] flex flex-wrap items-center justify-between gap-4 text-[15px] font-mono font-bold">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[#D0D7E0]">CAMPAIGNS:</span>
            <span className="text-[#FF5C6C] font-bold">{totalClusters} Clusters</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#D0D7E0]">CLUSTERED ASSETS:</span>
            <span className="text-[#FFFFFF] font-bold">{clusteredAssetCount} Nodes</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[#D0D7E0]">STANDALONE:</span>
            <span className="text-[#FFFFFF]">{graphData?.unclusteredCount || 0}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[14px] text-[#D0D7E0] font-bold">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5C6C] inline-block" />
            Campaign Hub
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FFCD4D] inline-block" />
            Shared Clue
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#35D0BA] inline-block" />
            Threat Asset
          </span>
        </div>
      </div>

      {/* Main Canvas Container */}
      <div className="relative flex-1 w-full min-h-[520px] bg-[#080B10] overflow-hidden">
        <div ref={containerRef} className="w-full h-full min-h-[520px]" />

        {/* Empty State Overlay */}
        {(!graphData || (graphData.nodes.length === 0 && graphData.clusters.length === 0)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#080B10]/95 z-20">
            <div className="h-14 w-14 rounded-xl bg-[#FF5C6C]/10 border border-[#FF5C6C]/30 flex items-center justify-center text-[#FF5C6C] mb-3">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h3 className="text-[20px] font-bold text-[#FFFFFF]">No Threat Clusters Discovered</h3>
            <p className="text-[16px] text-[#D0D7E0] font-bold max-w-md mt-1 mb-4">
              Discovered threat entities sharing identical infrastructure or identifiers (UPI VPAs, phone numbers, Telegram channels, or hosting IPs) will automatically coalesce into campaign hubs.
            </p>
          </div>
        )}

        {/* Floating Side Panel: Selected Cluster Dossier */}
        {selectedCluster && (
          <div className="absolute top-4 right-4 w-96 max-w-[calc(100%-2rem)] max-h-[calc(100%-2rem)] overflow-y-auto bg-[#121821]/95 border border-[#303946] rounded-xl p-5 shadow-2xl backdrop-blur-md z-30 text-[#FFFFFF]">
            <div className="flex items-start justify-between gap-2 pb-3.5 border-b border-[#303946]">
              <div>
                <span className="px-2.5 py-1 rounded text-[13px] font-mono font-bold bg-[#FF5C6C]/15 text-[#FF5C6C] border border-[#FF5C6C]/30 uppercase">
                  {selectedCluster.attackerTag}
                </span>
                <h3 className="text-[20px] font-bold text-[#FFFFFF] mt-2 leading-snug">
                  {selectedCluster.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCluster(null)}
                className="text-[#D0D7E0] hover:text-[#FFFFFF] text-[18px] font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-[15px] font-bold">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#080B10] border border-[#303946]">
                <span className="text-[#D0D7E0] font-mono">Cluster Risk Level:</span>
                <span className="font-mono font-bold text-[#FF5C6C] bg-[#FF5C6C]/10 px-2.5 py-0.5 rounded border border-[#FF5C6C]/30">
                  Peak Risk {selectedCluster.highestRiskScore}/100
                </span>
              </div>

              {/* Shared Pivot Clues */}
              <div>
                <h4 className="text-[13px] font-mono font-bold text-[#D0D7E0] uppercase tracking-wider mb-2">
                  🔑 Shared Attacker Clues (Pivot IOCs)
                </h4>
                <div className="space-y-2">
                  {selectedCluster.sharedIocs.map((ioc, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-[#080B10] border border-[#303946] flex items-center justify-between font-mono"
                    >
                      <span className="text-[12px] uppercase font-bold text-[#FFCD4D] bg-[#FFCD4D]/15 px-2 py-0.5 rounded border border-[#FFCD4D]/30">
                        {ioc.type}
                      </span>
                      <span className="text-[#FFFFFF] text-[15px] font-bold truncate max-w-[200px]">{ioc.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Impersonation Assets */}
              <div>
                <h4 className="text-[13px] font-mono font-bold text-[#D0D7E0] uppercase tracking-wider mb-2">
                  ⚔️ Linked Threat Assets ({selectedCluster.threats.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedCluster.threats.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-lg bg-[#080B10] border border-[#303946] hover:border-[#35D0BA] transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#FFFFFF] text-[15px] truncate max-w-[190px]">
                          {t.targetAsset}
                        </span>
                        <span className="text-[13px] font-mono font-bold text-[#FF5C6C]">
                          {t.riskScore}
                        </span>
                      </div>
                      <span className="text-[13px] text-[#D0D7E0] uppercase font-mono block mt-1 font-bold">
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
          <div className="absolute top-4 right-4 w-88 max-w-[calc(100%-2rem)] bg-[#121821]/95 border border-[#303946] rounded-xl p-5 shadow-2xl backdrop-blur-md z-30 text-[#FFFFFF]">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#303946]">
              <div>
                <span className="px-2.5 py-1 rounded text-[13px] font-mono font-bold bg-[#FFCD4D]/15 text-[#FFCD4D] border border-[#FFCD4D]/30 uppercase">
                  {selectedNodeDetails.type === 'threat' ? 'Threat Asset Node' : 'Shared Clue IOC'}
                </span>
                <h3 className="text-[18px] font-bold text-[#FFFFFF] mt-2 font-mono break-all">
                  {selectedNodeDetails.type === 'threat'
                    ? selectedNodeDetails.data?.targetAsset
                    : selectedNodeDetails.node?.label}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNodeDetails(null)}
                className="text-[#D0D7E0] hover:text-[#FFFFFF] p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedNodeDetails.type === 'threat' && selectedNodeDetails.data && (
              <div className="mt-3.5 space-y-3 text-[15px] font-bold">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#080B10] border border-[#303946]">
                  <span className="text-[#D0D7E0] font-mono">Risk Score:</span>
                  <span className="font-mono font-bold text-[#FF5C6C]">
                    {selectedNodeDetails.data.riskScore}/100
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#080B10] border border-[#303946] text-[14px] text-[#FFFFFF]">
                  <span className="font-mono text-[#D0D7E0] block mb-1 uppercase text-[12px] font-bold">Detected Reasons:</span>
                  {selectedNodeDetails.data.reasons?.map((r: string, idx: number) => (
                    <p key={idx} className="text-[#FFFFFF] mb-1 font-bold">• {r}</p>
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
