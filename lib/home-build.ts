// The homepage's build simulator strip (components/HomeBuildStrip).
//
// A blank build as a link, for "start a new build" beside a remembered one:
// the simulator keeps the remembered build until the visitor edits this one
// (BuildSimulator fromLink), so starting over never loses it by accident.

import { EMPTY_BUILD, encodeBuild } from '@/lib/build-calc';

export const NEW_BUILD_HREF = `/tools/build?${new URLSearchParams({ b: encodeBuild(EMPTY_BUILD) })}`;
