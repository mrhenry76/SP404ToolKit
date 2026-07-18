# Architecture

## Boundaries

The repository is an npm-workspaces monorepo. Each package has a narrow role:

| Module | Owns | Must not own |
|---|---|---|
| `core` | Serializable domain types, pad model, mapping utilities | Browser `File`, React, Roland binary logic |
| `wav` | Defensive RIFF/WAVE parsing and PCM access | UI and Roland assumptions |
| `manifest` | Version 1 schema boundary and JSON validation | Audio bytes |
| `validator` | Technical and mapping messages | UI rendering or automatic correction |
| `roland-sp404sx` | Future verified Roland output | Speculative binary fields and UI |
| `reverse-engineering-lab` | Synthetic fixtures, read-only inspection, comparison and experiment records | Roland writers or semantic claims from unverified bytes |
| `pad-info` | Read-only decoding and reporting for the fixed-size `PAD_INFO.BIN` table | Serialization, normalization or Roland writers |
| `web` | Browser adapters and presentation | Binary format implementation |

Dependencies point inward toward the small data model. Browser-specific file
handles are deliberately kept outside serializable project data.

## Data flow

1. A browser adapter receives local files.
2. `wav` reads metadata without altering PCM data.
3. `core` assigns explicit filename pads, then free pads.
4. `validator` produces structured messages.
5. `manifest` reads or writes a portable project description.
6. A future verified Roland adapter will build export artifacts.

## Compatibility policy

Node.js 20 and 22 are tested in CI on Ubuntu, macOS and Windows. Browser
support will be fixed before the public beta; Foundation v0.1 targets current
evergreen browsers supported by Vite 7.



# SP404ToolKit Architecture

## Architectural Vision

SP404ToolKit is designed as a hardware-independent audio workflow platform.

The system separates:

- audio preparation;
- project management;
- hardware-specific formats.

The first supported hardware target is Roland SP-404SX.

Future hardware support should be implemented through dedicated adapters without changing the core model.

---

# High Level Architecture
                     SP404ToolKit


                          |

                          |

                     Project Core


          +---------------+---------------+

          |                               |

    Audio Engine                 Hardware Adapter Layer


          |                               |

          |                               |

  Sample Analysis                 Device Formats

  Processing                      Import / Export

  Metadata                        Validation


                                          |

                                          |

                                  Roland SP-404SX

---

# Core Components

## 1. Project Core

The Project Core represents the internal model of a musical project.

It must remain independent from any specific hardware format.

Responsibilities:

- project management;
- sample references;
- metadata;
- pad assignments;
- versions;
- user organization.

Example:

```json
{
  "project": "Live Set 2026",

  "samples": [
    {
      "name": "kick",

      "source": "kick_original.wav",

      "processed": "kick_SP404.wav",

      "assignment": {
        "bank": "A",
        "pad": 1
      }
    }
  ]
}
The core model must never contain hardware-specific binary structures.
2. Audio Engine
The Audio Engine prepares material before hardware export.
Responsibilities:
audio analysis;
metadata extraction;
processing profiles;
conversion;
validation.
Audio Analysis
Each sample can expose:
filename;
duration;
channels;
sample rate;
bit depth;
loudness;
peak;
true peak.
Example:
{
  "file": "sample.wav",

  "audio": {
    "channels": 2,
    "sampleRate": 44100,
    "bitDepth": 24,
    "duration": 2.4
  },

  "loudness": {
    "integratedLUFS": -18,
    "truePeak": -1
  }
}
Audio Preparation
Preparation is based on profiles.
Example:
SP404 Live Profile

Target loudness:
-18 LUFS

True Peak:
-1 dBTP

Headroom:
6 dB
Possible operations:
LUFS normalization;
mono conversion;
stereo optimization;
silence trimming;
fade generation;
export preparation.
3. Hardware Adapter Layer
The Hardware Adapter Layer translates the internal project model into hardware-specific formats.
Responsibilities:
filesystem structure;
proprietary formats;
device limitations;
import/export.
The adapter is responsible for knowing hardware details.
The core is not.
Roland SP-404SX Adapter
First hardware implementation.
Responsibilities:
analyze SD card structure;
read PAD_INFO.BIN;
validate samples;
export compatible projects.
Current status:
Implemented:
PAD_INFO.BIN read-only analyzer.
Not implemented:
PAD_INFO writer;
proprietary Roland file generation.
Reverse Engineering Lab
The Reverse Engineering Lab remains isolated from the production architecture.
Purpose:
investigate unknown formats;
collect evidence;
create fixtures;
validate hypotheses.
Rules:
no speculative interpretation;
no modification of original files;
no writer without confirmed specification.
Data Flow
Complete workflow:
DAW Export

    |

    v

Sample Import

    |

    v

Audio Analysis

    |

    v

Audio Preparation

    |

    v

Project Model

    |

    v

Hardware Adapter

    |

    v

Sampler
Design Principles
1. Hardware independence
Hardware formats must never leak into the core model.
2. Immutable originals
Original audio files are never overwritten.
Processing always creates derived versions.
Original

   |

   v

Processed Copy

   |

   v

Hardware Export
3. Evidence-driven reverse engineering
Unknown binary structures remain unknown until confirmed.
Observed data can be preserved.
Meaning cannot be invented.
4. Open project representation
The internal project format should remain:
readable;
exportable;
portable;
independent from vendors.
Future Expansion
Possible future adapters:
Roland SP-404MKII;
Akai MPC;
Elektron Digitakt;
Elektron Octatrack;
other sampler platforms.
The core workflow remains unchanged.

---

Io farei poi un commit unico insieme alla roadmap:

```bash
git add docs/roadmap.md docs/architecture.md

git commit -m "docs: define product roadmap and architecture vision"

git push
Così avrai uno storico molto pulito:
foundation-v0.1
        |
pad-info-v0.1
        |
docs: define product roadmap and architecture vision
        |
v0.4 Audio Preparation Engine