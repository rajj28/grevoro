import { createHash } from 'crypto';

export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

export function computeEventHash(prevHash: string, eventPayload: Record<string, unknown>): string {
  const canonical = JSON.stringify(eventPayload, Object.keys(eventPayload).sort());
  return sha256(`${prevHash}:${canonical}`);
}

export function buildMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return sha256('EMPTY');
  if (hashes.length === 1) return hashes[0];

  const tree: string[] = [...hashes];
  let size = tree.length;

  while (size > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < size; i += 2) {
      const left = tree[i];
      const right = i + 1 < size ? tree[i + 1] : left;
      nextLevel.push(sha256(`${left}${right}`));
    }
    tree.splice(0, size, ...nextLevel);
    size = nextLevel.length;
  }

  return tree[0];
}

export function getMerkleProof(hashes: string[], index: number): string[] {
  const proof: string[] = [];
  const tree: string[] = [...hashes];
  let idx = index;
  let size = tree.length;

  while (size > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < size; i += 2) {
      const left = tree[i];
      const right = i + 1 < size ? tree[i + 1] : left;
      nextLevel.push(sha256(`${left}${right}`));
      if (i === idx || i + 1 === idx) {
        proof.push(i === idx ? (i + 1 < size ? tree[i + 1] : left) : tree[i]);
      }
    }
    idx = Math.floor(idx / 2);
    tree.splice(0, size, ...nextLevel);
    size = nextLevel.length;
  }

  return proof;
}

export function verifyMerkleProof(leafHash: string, proof: string[], root: string, index: number): boolean {
  let computed = leafHash;
  let idx = index;

  for (const sibling of proof) {
    if (idx % 2 === 0) {
      computed = sha256(`${computed}${sibling}`);
    } else {
      computed = sha256(`${sibling}${computed}`);
    }
    idx = Math.floor(idx / 2);
  }

  return computed === root;
}

export function generateGrvId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'GRV-';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
