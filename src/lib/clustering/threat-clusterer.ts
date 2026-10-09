import { ThreatItem, ThreatIOC } from '@/types/brand';

export interface ThreatCluster {
  id: string;
  name: string;
  attackerTag: string; // "one attacker, N assets"
  primaryIoc: ThreatIOC;
  sharedIocs: ThreatIOC[];
  assetCount: number;
  threats: ThreatItem[];
  totalRiskScore: number;
  avgRiskScore: number;
  highestRiskScore: number;
  threatTypes: string[];
  firstSeen: string;
  lastSeen: string;
}

export interface GraphNode {
  id: string;
  label: string;
  title?: string; // tooltip
  group: 'cluster_hub' | 'domain' | 'social_profile' | 'mobile_app' | 'ioc_upi' | 'ioc_phone' | 'ioc_telegram' | 'ioc_ip';
  shape?: string;
  color?: {
    background: string;
    border: string;
    highlight?: { background: string; border: string };
  };
  size?: number;
  font?: { color: string; size?: number; face?: string; multi?: boolean };
  threatId?: string;
  clusterId?: string;
  riskScore?: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  dashes?: boolean;
  color?: { color: string; highlight: string };
  width?: number;
}

export interface ClusterGraphData {
  clusters: ThreatCluster[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  unclusteredCount: number;
}

/**
 * Union-Find Disjoint Set data structure to link threats transitively
 */
class UnionFind {
  parent: Map<string, string> = new Map();

  find(item: string): string {
    if (!this.parent.has(item)) {
      this.parent.set(item, item);
      return item;
    }
    const p = this.parent.get(item)!;
    if (p === item) return item;
    const root = this.find(p);
    this.parent.set(item, root);
    return root;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) {
      this.parent.set(rootA, rootB);
    }
  }
}

/**
 * Groups ThreatItem[] into connected campaign clusters based on shared IOC clues
 */
export function clusterThreatsBySharedIocs(threats: ThreatItem[]): ClusterGraphData {
  if (!threats || threats.length === 0) {
    return {
      clusters: [],
      nodes: [],
      edges: [],
      unclusteredCount: 0,
    };
  }

  const uf = new UnionFind();
  const iocToThreatIds = new Map<string, string[]>();

  // Map each threat's IOCs to the threat ID
  for (const threat of threats) {
    uf.find(threat.id); // initialize

    const iocList = threat.iocs || [];
    for (const ioc of iocList) {
      const iocKey = `${ioc.type}:${ioc.value.trim().toLowerCase()}`;
      if (!iocToThreatIds.has(iocKey)) {
        iocToThreatIds.set(iocKey, []);
      }
      const list = iocToThreatIds.get(iocKey)!;
      list.push(threat.id);
    }
  }

  // Union all threats sharing the same IOC key
  for (const [_, threatIds] of iocToThreatIds.entries()) {
    if (threatIds.length > 1) {
      const first = threatIds[0];
      for (let i = 1; i < threatIds.length; i++) {
        uf.union(first, threatIds[i]);
      }
    }
  }

  // Group threats by their root parent
  const rootToThreats = new Map<string, ThreatItem[]>();
  for (const threat of threats) {
    const root = uf.find(threat.id);
    if (!rootToThreats.has(root)) {
      rootToThreats.set(root, []);
    }
    rootToThreats.get(root)!.push(threat);
  }

  const clusters: ThreatCluster[] = [];
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let clusterIndex = 1;
  let unclusteredCount = 0;

  for (const [_, clusterThreats] of rootToThreats.entries()) {
    // Collect all IOCs in this cluster
    const clusterIocMap = new Map<string, ThreatIOC>();
    for (const t of clusterThreats) {
      for (const ioc of t.iocs || []) {
        clusterIocMap.set(`${ioc.type}:${ioc.value.toLowerCase()}`, ioc);
      }
    }
    const allClusterIocs = Array.from(clusterIocMap.values());

    // Single asset with no shared link
    if (clusterThreats.length === 1 && allClusterIocs.length <= 1) {
      unclusteredCount++;
      const singleThreat = clusterThreats[0];

      // Add single node
      const nodeColor = getNodeColorForType(singleThreat.type, singleThreat.riskScore);
      nodes.push({
        id: `threat-${singleThreat.id}`,
        label: truncateLabel(singleThreat.targetAsset),
        title: `Standalone Asset: ${singleThreat.targetAsset}\nType: ${singleThreat.type}\nRisk: ${singleThreat.riskScore}/100`,
        group: singleThreat.type as any,
        shape: getShapeForType(singleThreat.type),
        color: nodeColor,
        size: 22,
        threatId: singleThreat.id,
        riskScore: singleThreat.riskScore,
      });

      // Add its IOC node if present
      if (allClusterIocs.length === 1) {
        const ioc = allClusterIocs[0];
        const iocNodeId = `ioc-${singleThreat.id}-${ioc.type}-${ioc.value}`;
        nodes.push({
          id: iocNodeId,
          label: `${ioc.type.toUpperCase()}:\n${truncateLabel(ioc.value)}`,
          title: `Clue (${ioc.type}): ${ioc.value}`,
          group: `ioc_${ioc.type}` as any,
          shape: 'diamond',
          color: getIocColor(ioc.type),
          size: 16,
        });
        edges.push({
          id: `edge-${singleThreat.id}-${iocNodeId}`,
          from: `threat-${singleThreat.id}`,
          to: iocNodeId,
          label: 'observes',
          color: { color: '#475569', highlight: '#06b6d4' },
          width: 1.5,
          dashes: true,
        });
      }
      continue;
    }

    // Cluster with multiple assets sharing clues: "one attacker, N assets"
    const assetCount = clusterThreats.length;
    const attackerTag = `one attacker, ${assetCount} assets`;
    const primaryIoc = allClusterIocs[0] || {
      type: 'domain',
      value: clusterThreats[0].targetAsset,
    };

    const clusterId = `cluster-${clusterIndex++}`;
    const clusterName = `Campaign #${clusterIndex - 1}: ${primaryIoc.value}`;
    const highestRisk = Math.max(...clusterThreats.map((t) => t.riskScore));
    const avgRisk = Math.round(
      clusterThreats.reduce((acc, t) => acc + t.riskScore, 0) / clusterThreats.length
    );

    const cluster: ThreatCluster = {
      id: clusterId,
      name: clusterName,
      attackerTag,
      primaryIoc,
      sharedIocs: allClusterIocs,
      assetCount,
      threats: clusterThreats,
      totalRiskScore: highestRisk,
      avgRiskScore: avgRisk,
      highestRiskScore: highestRisk,
      threatTypes: Array.from(new Set(clusterThreats.map((t) => t.type))),
      firstSeen: clusterThreats[0].discoveredAt || new Date().toISOString(),
      lastSeen: clusterThreats[clusterThreats.length - 1].discoveredAt || new Date().toISOString(),
    };
    clusters.push(cluster);

    // 1. Create central Campaign Hub Node ("one attacker, N assets")
    const hubNodeId = `hub-${clusterId}`;
    nodes.push({
      id: hubNodeId,
      label: `⚔️ ATTACKER CAMPAIGN\n[${attackerTag.toUpperCase()}]\n${truncateLabel(primaryIoc.value)}`,
      title: `Campaign: ${clusterName}\nStatus: ${attackerTag}\nConnected Assets: ${assetCount}\nPeak Risk: ${highestRisk}/100`,
      group: 'cluster_hub',
      shape: 'box',
      size: 32,
      clusterId,
      color: {
        background: '#881337', // deep rose
        border: '#f43f5e', // bright rose
        highlight: { background: '#be123c', border: '#fda4af' },
      },
      font: {
        color: '#ffffff',
        size: 11,
        face: 'monospace',
      },
    });

    // 2. Add IOC clue nodes
    const createdIocNodeIds = new Map<string, string>();
    for (const ioc of allClusterIocs) {
      const iocKey = `${ioc.type}:${ioc.value.toLowerCase()}`;
      const iocNodeId = `ioc-${clusterId}-${ioc.type}-${ioc.value.replace(/[^a-zA-Z0-9]/g, '_')}`;
      createdIocNodeIds.set(iocKey, iocNodeId);

      nodes.push({
        id: iocNodeId,
        label: `🔍 ${ioc.type.toUpperCase()}\n${truncateLabel(ioc.value)}`,
        title: `Shared Clue [${ioc.type}]: ${ioc.value}`,
        group: `ioc_${ioc.type}` as any,
        shape: 'diamond',
        size: 20,
        color: getIocColor(ioc.type),
        font: { color: '#e2e8f0', size: 10, face: 'monospace' },
      });

      // Edge from Hub to Shared IOC
      edges.push({
        id: `edge-hub-${iocNodeId}`,
        from: hubNodeId,
        to: iocNodeId,
        label: 'operates via',
        color: { color: '#f43f5e', highlight: '#fb7185' },
        width: 2.5,
      });
    }

    // 3. Add Threat Asset nodes and connect to their respective IOCs and the Hub
    for (const threat of clusterThreats) {
      const threatNodeId = `threat-${threat.id}`;
      const nodeColor = getNodeColorForType(threat.type, threat.riskScore);

      nodes.push({
        id: threatNodeId,
        label: `${getTypeIconEmoji(threat.type)} ${truncateLabel(threat.targetAsset)}\n(Risk: ${threat.riskScore})`,
        title: `Target Asset: ${threat.targetAsset}\nType: ${threat.type}\nReasons: ${threat.reasons?.join(', ')}`,
        group: threat.type as any,
        shape: getShapeForType(threat.type),
        color: nodeColor,
        size: 24,
        threatId: threat.id,
        clusterId,
        riskScore: threat.riskScore,
        font: { color: '#ffffff', size: 10, face: 'monospace' },
      });

      // Connect threat to its specific IOC nodes
      let connectedToAnyIoc = false;
      for (const ioc of threat.iocs || []) {
        const iocKey = `${ioc.type}:${ioc.value.toLowerCase()}`;
        const targetIocNodeId = createdIocNodeIds.get(iocKey);
        if (targetIocNodeId) {
          edges.push({
            id: `edge-${threatNodeId}-${targetIocNodeId}`,
            from: targetIocNodeId,
            to: threatNodeId,
            label: 'linked asset',
            color: { color: '#06b6d4', highlight: '#38bdf8' },
            width: 2,
          });
          connectedToAnyIoc = true;
        }
      }

      // If no direct IOC edge was made, connect directly to Hub
      if (!connectedToAnyIoc) {
        edges.push({
          id: `edge-hub-${threatNodeId}`,
          from: hubNodeId,
          to: threatNodeId,
          label: 'asset',
          color: { color: '#94a3b8', highlight: '#cbd5e1' },
          width: 1.5,
          dashes: true,
        });
      }
    }
  }

  return {
    clusters,
    nodes,
    edges,
    unclusteredCount,
  };
}

/**
 * Seed realistic demo clustered threats if the registry is empty
 */
export function getSampleClusteredThreats(brandName: string = 'Paytm', brandDomain: string = 'paytm.com'): ThreatItem[] {
  const cleanBrand = brandName.toLowerCase();
  const now = new Date().toISOString();

  return [
    // --- CLUSTER 1: "Refund & KYC Smishing Syndicate" (Shares UPI & Phone) ---
    {
      id: 'demo-threat-1',
      brandId: 'brand-paytm-default',
      targetAsset: `${cleanBrand}-kyc-refund-portal.net`,
      type: 'domain',
      source: 'live_check',
      riskScore: 94,
      reasons: ['Combosquatting with high-urgency keywords', 'Cyrillic homoglyph lookalikes detected'],
      iocs: [
        { type: 'upi', value: `${cleanBrand}.support@okaxis` },
        { type: 'phone', value: '+91-9876543210' },
        { type: 'domain', value: `${cleanBrand}-kyc-refund-portal.net` },
      ],
      discoveredAt: now,
      status: 'investigating',
    },
    {
      id: 'demo-threat-2',
      brandId: 'brand-paytm-default',
      targetAsset: `@${cleanBrand}_instant_refund_care`,
      type: 'social_profile',
      source: 'simulator',
      riskScore: 92,
      reasons: ['Telegram customer care bot requesting reverse UPI PIN verification'],
      iocs: [
        { type: 'telegram', value: `${cleanBrand}_instant_refund_care` },
        { type: 'upi', value: `${cleanBrand}.support@okaxis` },
      ],
      discoveredAt: now,
      status: 'investigating',
    },
    {
      id: 'demo-threat-3',
      brandId: 'brand-paytm-default',
      targetAsset: `${brandName} Pay & Instant Rewards APK`,
      type: 'mobile_app',
      source: 'simulator',
      riskScore: 95,
      reasons: ['Predatory clone app requesting SMS permissions and UPI token credentials'],
      iocs: [
        { type: 'phone', value: '+91-9876543210' },
        { type: 'upi', value: `${cleanBrand}.support@okaxis` },
      ],
      discoveredAt: now,
      status: 'takedown_requested',
    },

    // --- CLUSTER 2: "Electricity & Bill Fraud Syndicate" (Shares Telegram & Phone) ---
    {
      id: 'demo-threat-4',
      brandId: 'brand-paytm-default',
      targetAsset: `pаytm-billpay-update.com`, // Cyrillic 'а'
      type: 'domain',
      source: 'live_check',
      riskScore: 96,
      reasons: ['IDN Homoglyph attack spoofing Latin vowels', 'Threat of immediate 24h power disconnection'],
      iocs: [
        { type: 'telegram', value: `billpay_officer_helpdesk` },
        { type: 'phone', value: '+91-9123456789' },
      ],
      discoveredAt: now,
      status: 'investigating',
    },
    {
      id: 'demo-threat-5',
      brandId: 'brand-paytm-default',
      targetAsset: `+91 91234 56789 (Official ${brandName} Desk)`,
      type: 'social_profile',
      source: 'simulator',
      riskScore: 89,
      reasons: ['Unsolicited WhatsApp messaging soliciting remote AnyDesk app download'],
      iocs: [
        { type: 'phone', value: '+91-9123456789' },
        { type: 'telegram', value: `billpay_officer_helpdesk` },
      ],
      discoveredAt: now,
      status: 'investigating',
    },

    // --- CLUSTER 3: "Typosquat Domain Cluster" (Shares Infrastructure IP) ---
    {
      id: 'demo-threat-6',
      brandId: 'brand-paytm-default',
      targetAsset: `pyatm.com`, // Transposition
      type: 'domain',
      source: 'simulator',
      riskScore: 85,
      reasons: ['Adjacent character transposition typosquat', 'Parked on high-risk bulletproof hosting ASN'],
      iocs: [
        { type: 'ip', value: '185.220.101.5' },
        { type: 'domain', value: 'pyatm.com' },
      ],
      discoveredAt: now,
      status: 'investigating',
    },
    {
      id: 'demo-threat-7',
      brandId: 'brand-paytm-default',
      targetAsset: `paytmm-secure.com`, // Double character
      type: 'domain',
      source: 'simulator',
      riskScore: 82,
      reasons: ['Double character addition combosquat', 'Hosts phishing kit clone'],
      iocs: [
        { type: 'ip', value: '185.220.101.5' },
        { type: 'domain', value: 'paytmm-secure.com' },
      ],
      discoveredAt: now,
      status: 'investigating',
    },
  ];
}

function truncateLabel(str: string, maxLen: number = 24): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

function getShapeForType(type: string): string {
  switch (type) {
    case 'domain':
      return 'dot';
    case 'social_profile':
      return 'triangle';
    case 'mobile_app':
      return 'square';
    default:
      return 'ellipse';
  }
}

function getNodeColorForType(type: string, riskScore: number) {
  if (riskScore >= 80) {
    return {
      background: '#e11d48', // rose-600
      border: '#fda4af', // rose-300
      highlight: { background: '#f43f5e', border: '#ffffff' },
    };
  }
  if (riskScore >= 50) {
    return {
      background: '#d97706', // amber-600
      border: '#fde68a',
      highlight: { background: '#f59e0b', border: '#ffffff' },
    };
  }
  return {
    background: '#059669', // emerald-600
    border: '#a7f3d0',
    highlight: { background: '#10b981', border: '#ffffff' },
  };
}

function getIocColor(type: string) {
  switch (type) {
    case 'upi':
      return {
        background: '#0284c7', // cyan-600
        border: '#7dd3fc',
        highlight: { background: '#0ea5e9', border: '#ffffff' },
      };
    case 'phone':
      return {
        background: '#7c3aed', // violet-600
        border: '#c4b5fd',
        highlight: { background: '#8b5cf6', border: '#ffffff' },
      };
    case 'telegram':
      return {
        background: '#2563eb', // blue-600
        border: '#93c5fd',
        highlight: { background: '#3b82f6', border: '#ffffff' },
      };
    case 'ip':
    case 'asn':
      return {
        background: '#475569', // slate-600
        border: '#cbd5e1',
        highlight: { background: '#64748b', border: '#ffffff' },
      };
    default:
      return {
        background: '#0d9488', // teal-600
        border: '#99f6e4',
        highlight: { background: '#14b8a6', border: '#ffffff' },
      };
  }
}

function getTypeIconEmoji(type: string): string {
  switch (type) {
    case 'domain':
      return '🌐';
    case 'social_profile':
      return '💬';
    case 'mobile_app':
      return '📱';
    default:
      return '🎯';
  }
}
