/**
 * Artifact Store
 * SHA-256 checksums, output manifests, and artifact integrity.
 * Per 13_ARTIFACT_SYSTEM: every artifact has ID, run ID, generator ID/version,
 * filename, media type, size, SHA-256, source step, dependencies, validation state.
 */

export async function computeSha256(content) {
  const encoder = new TextEncoder();
  const data = typeof content === 'string' ? content : JSON.stringify(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createArtifact(name, content, mediaType, sourceStep, options = {}) {
  const sha256 = await computeSha256(content);
  const sizeBytes = typeof content === 'string'
    ? new TextEncoder().encode(content).length
    : JSON.stringify(content).length;
  return {
    artifact_id: options.artifact_id || `art-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    name,
    media_type: mediaType,
    content: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
    sha256,
    size_bytes: sizeBytes,
    source_step: sourceStep,
    dependencies: options.dependencies || [],
    validation_state: 'pending',
    metadata: options.metadata || {},
    is_compound: false,
    child_artifact_ids: [],
    created_at: new Date().toISOString(),
  };
}

export function createOutputManifest(runId, artifacts) {
  return {
    run_id: runId,
    artifacts: artifacts.map(a => ({
      artifact_id: a.artifact_id,
      sha256: a.sha256,
      media_type: a.media_type,
      path: a.name,
      size_bytes: a.size_bytes,
      source_step: a.source_step,
    })),
    created_at: new Date().toISOString(),
  };
}