/**
 * Definition: SkillKitDefinition
 * Hash: fcfaaf30
 */

#pragma once

#include "../types.h"
#include "ActiveSkillEntry.h"
#include "SkillTreeNode.h"
#include "te2a05745.h"

#pragma push(pack, 1)

struct SkillKitDefinition : public ComplexRead {
  DT_VARIABLEARRAY<ActiveSkillEntry> arActiveSkillEntries;
  DT_VARIABLEARRAY<DT_SNO<SnoGroup::Power>> unk_a6a18af;
  DT_VARIABLEARRAY<SkillTreeNode> arNodes;
  DT_VARIABLEARRAY<te2a05745> arConnections;
  DT_UINT dwNextID;
  DT_VECTOR2D vNodeMinPositions;
  DT_VECTOR2D vNodeMaxPositions;
  DT_VECTOR2D unk_11ce0b6;
  DT_VECTOR2D unk_99647ce;

  void read(const char* base, char* &ptr);
};

#pragma pop(pack)
