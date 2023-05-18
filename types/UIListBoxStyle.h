/**
 * Definition: UIListBoxStyle
 * Hash: 8a5932f4
 */

#pragma once

#include "../types.h"
#include "UIControlConsoleInput.h"
#include "UIControlFont.h"
#include "UIControlHandle.h"
#include "t98c23c41.h"

#pragma push(pack, 1)

struct UIListBoxStyle : public ComplexRead {
  DT_UINT dwType;
  DT_UINT dwPad;
  UIControlHandle hParentStyle;
  DT_INT64 unk_441f783;
  DT_TAGMAP<DT_INT> unk_b835d15;
  UIControlConsoleInput tConsoleInput;
  DT_TAGMAP<DT_INT> unk_b4f614c;
  t98c23c41 unk_4cce0b6;
  UIControlFont tFont;
  DT_TAGMAP<DT_INT> unk_59693f9;

  void read(const char* base, char* &ptr);
};

#pragma pop(pack)
