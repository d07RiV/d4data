/**
 * Definition: UIThumbButtonStyle
 * Hash: 5915120b
 */

#pragma once

#include "../types.h"
#include "UIControlConsoleInput.h"
#include "UIControlFont.h"
#include "UIControlHandle.h"
#include "UIControlIcon.h"
#include "t98c23c41.h"

#pragma push(pack, 1)

struct UIThumbButtonStyle : public ComplexRead {
  DT_UINT dwType;
  DT_UINT dwPad;
  UIControlHandle hParentStyle;
  DT_INT64 unk_441f783;
  DT_TAGMAP<DT_INT> unk_b835d15;
  UIControlConsoleInput tConsoleInput;
  DT_TAGMAP<DT_INT> unk_b4f614c;
  UIControlFont tFont;
  DT_TAGMAP<DT_INT> unk_4741819;
  UIControlIcon tIcon;
  t98c23c41 unk_4cce0b6;
  DT_TAGMAP<DT_INT> unk_10f81f0;

  void read(const char* base, char* &ptr);
};

#pragma pop(pack)
