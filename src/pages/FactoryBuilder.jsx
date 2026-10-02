import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import BuilderTopBar from '@/components/factory/BuilderTopBar';
import BuilderLeftRail from '@/components/factory/BuilderLeftRail';
import BuilderLibrary from '@/components/factory/BuilderLibrary';
import BuilderCanvas from '@/components/factory/BuilderCanvas';
import BuilderInspector from '@/components/factory/BuilderInspector';
import BuilderValidationDrawer from '@/components/factory/BuilderValidationDrawer';
import BriefForm from '@/components/factory/BriefForm';
import { Button } from '@/components/ui/button';
import { selectPatterns, scorePattern } from '@/lib/factory/compatibilityEngine';
import { validateBuildSpec } from '@/lib/factory/validationEngine';

const FAMILY_MAP = {
  brief: null,
  recipes: 'experience_recipes',
  pages: 'flow_patterns',
  components: 'component_patterns',
  brand: 'logo_patterns',
  colors: 'color_systems',
  typography: 'typography_patterns',
  media: 'image_patterns',
  motion: 'motion_patterns',
  states: 'state_patterns',
  data: 'domain_packs',
  templates: null,
  export: null,
};

export default function FactoryBuilder() {
  const [activePanel, setActivePanel] = useState('brief');
  const [viewport, setViewport] = useState('desktop');
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [frozenPatterns, setFrozenPatterns] = useState(new Set());
  const [project, setProject] = useState(null);
  const [buildSpec, setBuildSpec] = useState(null);
  const [validationReceipt, setValidationReceipt] = useState(null);
  const [compatibilityResult, setCompatibilityResult] = useState(null);

  // Load pattern families from database
  const { data: familiesData } = useQuery({
    queryKey: ['patternFamilies'],
    queryFn: async () => {
      const res = await base44.entities.PatternFamily.filter({}, { limit: 50 });
      return res.items || [];
    },
  });

  // Build a registry map from database records
  const registry = useMemo(() => {
    const map = {};
    (familiesData || []).forEach((f) => {
      map[f.family_id] = f.patterns || [];
    });
    return map;
  }, [familiesData]);

  const currentFamily = FAMILY_MAP[activePanel];
  const currentPatterns = currentFamily ? registry[currentFamily] || [] : [];

  // Compute compatibility scores for the current family
  const compatibilityScores = useMemo(() => {
    if (!currentFamily || !project) return null;
    const scores = {};
    currentPatterns.forEach((p) => {
      scores[p.id] = scorePattern(p, currentFamily, project);
    });
    return scores;
  }, [currentFamily, currentPatterns, project]);

  // Create project from brief
  const handleBriefSubmit = async (brief) => {
    const result = selectPatterns(brief, registry, brief.seed);
    setCompatibilityResult(result);

    const newProject = await base44.entities.FactoryProject.create({
      name: brief.name,
      company_name: brief.company_name,
      product_archetype: brief.product_archetype,
      platforms: brief.platforms,
      primary_goal: brief.primary_goal,
      target_audience: brief.target_audience,
      industry: brief.industry,
      seed: brief.seed,
      status: 'composing',
      selected_patterns: result.selection,
    });
    setProject(newProject);
    setBuildSpec({
      project_id: newProject.id,
      seed: brief.seed,
      platforms: brief.platforms,
      selected_patterns: result.selection,
      tokens: {},
      screens: [],
    });
    setActivePanel('recipes');
  };

  const handleValidate = () => {
    if (!buildSpec) return;
    const receipt = validateBuildSpec(buildSpec, registry);
    setValidationReceipt(receipt);
    base44.entities.ValidationReceipt.create({
      project_id: project?.id,
      build_spec_hash: JSON.stringify(buildSpec).length.toString(),
      hard_gates: receipt.hard_gates,
      scores: receipt.scores,
      deltas: receipt.deltas,
      result: receipt.result,
      evidence: receipt.evidence,
      repair_round: 0,
    });
  };

  const handleSelectPattern = (pattern) => {
    setSelectedPattern(pattern);
    if (project && currentFamily) {
      const updated = { ...buildSpec };
      updated.selected_patterns = {
        ...updated.selected_patterns,
        [currentFamily]: pattern.id,
      };
      setBuildSpec(updated);
    }
  };

  const toggleFreeze = () => {
    if (!selectedPattern) return;
    const newFrozen = new Set(frozenPatterns);
    if (newFrozen.has(selectedPattern.id)) {
      newFrozen.delete(selectedPattern.id);
    } else {
      newFrozen.add(selectedPattern.id);
    }
    setFrozenPatterns(newFrozen);
  };

  const canExport = validationReceipt?.result === 'PASS';

  return (
    <div className="h-screen flex flex-col bg-[#070709] overflow-hidden">
      <BuilderTopBar
        project={project}
        onValidate={handleValidate}
        onExport={() => alert('Export: ' + JSON.stringify(buildSpec, null, 2))}
        canExport={canExport}
      />
      <div className="flex-1 flex min-h-0">
        <BuilderLeftRail active={activePanel} onSelect={setActivePanel} />

        {activePanel === 'brief' && !project ? (
          <div className="flex-1 overflow-y-auto bg-[#070709]">
            <BriefForm onSubmit={handleBriefSubmit} />
          </div>
        ) : activePanel === 'brief' && project ? (
          <div className="flex-1 flex items-center justify-center bg-[#070709]">
            <div className="text-center">
              <h2 className="text-white text-lg font-bold mb-2">{project.name}</h2>
              <p className="text-white/50 text-sm mb-4">{project.product_archetype}</p>
              <Button
                onClick={() => {
                  setProject(null);
                  setBuildSpec(null);
                }}
                className="bg-white/10 text-white"
              >
                New Project
              </Button>
            </div>
          </div>
        ) : (
          <>
            {currentFamily && (
              <BuilderLibrary
                family={currentFamily}
                patterns={currentPatterns}
                selectedIds={buildSpec?.selected_patterns ? [buildSpec.selected_patterns[currentFamily]] : []}
                onSelect={handleSelectPattern}
                compatibilityScores={compatibilityScores}
              />
            )}
            <BuilderCanvas viewport={viewport} onViewportChange={setViewport}>
              {project && (
                <div className="w-full h-full bg-[#FAFAFA] p-4 overflow-y-auto">
                  <div className="max-w-2xl mx-auto space-y-3">
                    <div className="text-gray-400 text-xs uppercase font-bold">Build Preview</div>
                    {compatibilityResult && (
                      <div className="space-y-2">
                        {Object.entries(compatibilityResult.selection || {}).map(([k, v]) => {
                          const family = registry[Object.values(FAMILY_MAP).find((f) => f && registry[f]?.some((p) => p.id === v))] || [];
                          const pattern = family.find((p) => p.id === v);
                          return (
                            <div key={k} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                              <span className="text-gray-500 text-xs capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="text-gray-900 text-xs font-medium">
                                {pattern?.name || v}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {compatibilityResult?.constraints?.failures?.map((f, i) => (
                      <div key={i} className="p-2 bg-red-50 rounded-lg border border-red-200">
                        <span className="text-red-600 text-xs font-bold">CONSTRAINT: </span>
                        <span className="text-red-500 text-xs">{f.rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </BuilderCanvas>
            <BuilderInspector
              pattern={selectedPattern}
              family={currentFamily}
              isFrozen={selectedPattern && frozenPatterns.has(selectedPattern.id)}
              onToggleFreeze={toggleFreeze}
            />
          </>
        )}
      </div>
      <BuilderValidationDrawer
        receipt={validationReceipt}
        onRepair={() => {
          if (!validationReceipt) return;
          const repairs = (validationReceipt.deltas || [])
            .filter((d) => d.severity === 'error')
            .map((d) => d.correction);
          alert('Repairs:\n' + repairs.join('\n'));
        }}
      />
    </div>
  );
}