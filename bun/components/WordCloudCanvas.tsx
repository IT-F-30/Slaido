"use client";

import { useEffect, useState, useRef } from "react";
import type { MongoDB } from "@/types/MongoDB";

const WORD_CLOUD_CONFIG = {
  fontSize: 18, // Fixed font size for all words
  fontFamily: "Montserrat, sans-serif",
  verticalEnabled: true,
  padding_left: 2,
  padding_top: 2,
};

// Predefined colors for groups (will cycle if more groups exist)
const GROUP_COLORS = [
  "#E63946", // Red
  "#2A9D8F", // Teal
  "#E9C46A", // Yellow
  "#264653", // Dark Blue
  "#F4A261", // Orange
  "#9B59B6", // Purple
  "#3498DB", // Blue
  "#1ABC9C", // Turquoise
  "#E74C3C", // Crimson
  "#27AE60", // Green
  "#F39C12", // Amber
  "#8E44AD", // Violet
];

enum SpaceType {
  LB = 1, // Left Bottom
  LT = 2, // Left Top
  RT = 3, // Right Top
  RB = 4, // Right Bottom
}

enum AlignmentType {
  HR = 1, // Horizontal
  VR = 2, // Vertical
}

interface PlacedWord {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  font: string;
  fontSize: number;
  rotate: number;
  groupNumber: number;
}

interface Space {
  spaceType: SpaceType;
  width: number;
  height: number;
  x: number;
  y: number;
}

interface GroupedWord {
  mongo: MongoDB;
  groupNumber: number;
}

function getGroupColor(groupNumber: number): string {
  return GROUP_COLORS[groupNumber % GROUP_COLORS.length];
}

export default function WordCloudCanvas({ mongos }: { mongos: MongoDB[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [words, setWords] = useState<PlacedWord[]>([]);

  useEffect(() => {
    if (!mongos || !mongos.length || !containerRef.current) {
      setWords([]);
      return;
    }

    const container = containerRef.current;
    const tWidth = container.offsetWidth;
    const tHeight = container.offsetHeight;
    const xOffset = tWidth / 2;
    const yOffset = tHeight / 2;

    // Function to check if word is within bounds
    const isWithinBounds = (
      x: number,
      y: number,
      w: number,
      h: number,
      rotate: number,
    ): boolean => {
      if (rotate === 0) {
        return x >= 0 && y >= 0 && x + w <= tWidth && y + h <= tHeight;
      } else {
        // For rotated text, check if the bounding box fits
        return x >= 0 && y >= 0 && x + h <= tWidth && y + w <= tHeight;
      }
    };

    // Try to place words with different font scales
    const attemptPlacement = (fontScale: number): PlacedWord[] => {
      const options = {
        ...WORD_CLOUD_CONFIG,
        fontSize: Math.max(Math.floor(tWidth / 40), 12) * fontScale,
      };

      // Group words by group_number and sort by group_number (smaller first = closer to center)
      const groupedWords: GroupedWord[] = mongos.map((mongo) => ({
        mongo,
        groupNumber: Number.isFinite(mongo.group_number)
          ? mongo.group_number
          : 999,
      }));

      // Sort by group_number to place smaller groups closer to center
      groupedWords.sort((a, b) => a.groupNumber - b.groupNumber);

      // Group words by their group_number for batch placement
      const groupMap = new Map<number, GroupedWord[]>();
      groupedWords.forEach((gw) => {
        if (!groupMap.has(gw.groupNumber)) {
          groupMap.set(gw.groupNumber, []);
        }
        groupMap.get(gw.groupNumber)!.push(gw);
      });

      // Flatten back maintaining group order but keeping group members together
      const sortedWords: GroupedWord[] = [];
      const sortedGroupNumbers = Array.from(groupMap.keys()).sort(
        (a, b) => a - b,
      );
      sortedGroupNumbers.forEach((gn) => {
        sortedWords.push(...groupMap.get(gn)!);
      });

      if (sortedWords.length === 0) return [];

      let spaceDataObject: { [key: string]: Space } = {};
      let spaceIdArray: string[] = [];
      let distance_Counter = 1;

      const pushSpaceData = (
        type: SpaceType,
        w: number,
        h: number,
        x: number,
        y: number,
      ) => {
        // Only push spaces that are within bounds
        if (w <= 0 || h <= 0 || x < 0 || y < 0 || x >= tWidth || y >= tHeight)
          return;

        const distance = Math.sqrt(
          (xOffset - x) * (xOffset - x) + (yOffset - y) * (yOffset - y),
        );
        const distanceS = `${distance}_${distance_Counter++}`;

        let inserted = false;
        for (let index = 0; index < spaceIdArray.length; index++) {
          if (distance < parseFloat(spaceIdArray[index].split("_")[0])) {
            spaceIdArray.splice(index, 0, distanceS);
            inserted = true;
            break;
          }
        }
        if (!inserted) spaceIdArray.push(distanceS);

        spaceDataObject[distanceS] = {
          spaceType: type,
          width: w,
          height: h,
          x,
          y,
        };
      };

      const measureWord = (text: string, fontSize: number) => {
        const span = document.createElement("span");
        span.style.position = "absolute";
        span.style.visibility = "hidden";
        span.style.fontSize = `${fontSize}px`;
        span.style.fontFamily = options.fontFamily;
        span.style.lineHeight = `${fontSize}px`;
        span.style.paddingLeft = `${options.padding_left}px`;
        span.style.whiteSpace = "nowrap";
        span.innerText = text;
        document.body.appendChild(span);
        const w = span.offsetWidth;
        const h = span.offsetHeight;
        document.body.removeChild(span);
        return { w, h };
      };

      const placedWords: PlacedWord[] = [];

      sortedWords.forEach((groupedWord, index) => {
        const mongo = groupedWord.mongo;
        const groupNumber = groupedWord.groupNumber;
        const fontSize = options.fontSize;
        const color = getGroupColor(groupNumber);

        const { w, h } = measureWord(mongo.word, fontSize);

        let placed = false;
        let pX = 0,
          pY = 0,
          pRotate = 0;

        if (index === 0) {
          const xoff = xOffset - w / 2;
          const yoff = yOffset - h / 2;

          // Check if first word fits
          if (isWithinBounds(xoff, yoff, w, h, 0)) {
            pX = xoff;
            pY = yoff;
            placed = true;

            pushSpaceData(
              SpaceType.LB,
              tWidth - xoff - w,
              h,
              xoff + w,
              yoff + h / 2,
            );
            pushSpaceData(
              SpaceType.LT,
              w,
              tHeight - yoff - h,
              xoff + w / 2,
              yoff + h,
            );
            pushSpaceData(SpaceType.RT, xoff, h, xoff, yoff + h / 2);
            pushSpaceData(SpaceType.RB, w, yoff, xoff + w / 2, yoff);

            pushSpaceData(SpaceType.LT, w / 2, h / 2, xoff + w, yoff + h / 2);
            pushSpaceData(SpaceType.RT, w / 2, h / 2, xoff + w / 2, yoff + h);
            pushSpaceData(SpaceType.RB, w / 2, h / 2, xoff, yoff + h / 2);
            pushSpaceData(SpaceType.LB, w / 2, h / 2, xoff + w / 2, yoff);

            pushSpaceData(
              SpaceType.LT,
              tWidth - xoff - w - w / 2,
              tHeight - yoff - h / 2,
              xoff + w + w / 2,
              yoff + h / 2,
            );
            pushSpaceData(
              SpaceType.RT,
              xoff + w / 2,
              tHeight - yoff - h - h / 2,
              xoff + w / 2,
              yoff + h + h / 2,
            );
            pushSpaceData(
              SpaceType.RB,
              xoff - w / 2,
              yoff + h / 2,
              xoff - w / 2,
              yoff + h / 2,
            );
            pushSpaceData(
              SpaceType.LB,
              xoff + w / 2,
              yoff - h / 2,
              xoff + w / 2,
              yoff - h / 2,
            );
          }
        } else {
          for (let i = 0; i < spaceIdArray.length; i++) {
            const spaceId = spaceIdArray[i];
            const space = spaceDataObject[spaceId];
            if (!space) continue;

            let alignmentInd = 0;
            let alignmentIndCount = 0;

            if (w <= space.width && h <= space.height) {
              alignmentInd = AlignmentType.HR;
              alignmentIndCount++;
            }

            if (
              options.verticalEnabled &&
              h <= space.width &&
              w <= space.height
            ) {
              alignmentInd = AlignmentType.VR;
              alignmentIndCount++;
            }

            if (alignmentIndCount > 0) {
              delete spaceDataObject[spaceId];
              spaceIdArray.splice(i, 1);

              if (alignmentIndCount > 1) {
                if (Math.random() * 5 > 3) {
                  alignmentInd = AlignmentType.VR;
                } else {
                  alignmentInd = AlignmentType.HR;
                }
              }

              let xMul = 1,
                yMul = 1;
              let xMulS = 1,
                yMulS = 1;

              switch (space.spaceType) {
                case SpaceType.LB:
                  xMul = 0;
                  yMul = -1;
                  xMulS = 1;
                  yMulS = -1;
                  break;
                case SpaceType.LT:
                  xMul = 0;
                  yMul = 0;
                  xMulS = 1;
                  yMulS = 1;
                  break;
                case SpaceType.RT:
                  xMul = -1;
                  yMul = 0;
                  xMulS = -1;
                  yMulS = 1;
                  break;
                case SpaceType.RB:
                  xMul = -1;
                  yMul = -1;
                  xMulS = -1;
                  yMulS = -1;
                  break;
              }

              if (alignmentInd === AlignmentType.HR) {
                pX = space.x + xMul * w;
                pY = space.y + yMul * h;
                pRotate = 0;

                // Check bounds before placing
                if (isWithinBounds(pX, pY, w, h, pRotate)) {
                  placed = true;

                  if (Math.random() * 2 > 1) {
                    pushSpaceData(
                      space.spaceType,
                      space.width - w,
                      h,
                      space.x + xMulS * w,
                      space.y,
                    );
                    pushSpaceData(
                      space.spaceType,
                      space.width,
                      space.height - h,
                      space.x,
                      space.y + yMulS * h,
                    );
                  } else {
                    pushSpaceData(
                      space.spaceType,
                      space.width - w,
                      space.height,
                      space.x + xMulS * w,
                      space.y,
                    );
                    pushSpaceData(
                      space.spaceType,
                      w,
                      space.height - h,
                      space.x,
                      space.y + yMulS * h,
                    );
                  }
                }
              } else {
                pX = space.x + xMul * h - (w - h) / 2;
                pY = space.y + yMul * w + (w - h) / 2;
                pRotate = 270;

                // Check bounds before placing
                if (isWithinBounds(pX, pY, w, h, pRotate)) {
                  placed = true;

                  if (Math.random() * 2 > 1) {
                    pushSpaceData(
                      space.spaceType,
                      space.width - h,
                      w,
                      space.x + xMulS * h,
                      space.y,
                    );
                    pushSpaceData(
                      space.spaceType,
                      space.width,
                      space.height - w,
                      space.x,
                      space.y + yMulS * w,
                    );
                  } else {
                    pushSpaceData(
                      space.spaceType,
                      space.width - h,
                      space.height,
                      space.x + xMulS * h,
                      space.y,
                    );
                    pushSpaceData(
                      space.spaceType,
                      h,
                      space.height - w,
                      space.x,
                      space.y + yMulS * w,
                    );
                  }
                }
              }

              if (placed) break;
            }
          }
        }

        if (placed) {
          placedWords.push({
            id: mongo._id || `${mongo.word}-${index}`,
            text: mongo.word,
            x: pX,
            y: pY,
            width: w,
            height: h,
            color,
            font: options.fontFamily,
            fontSize,
            rotate: pRotate,
            groupNumber,
          });
        }
      });

      return placedWords;
    };

    // Try with different scales until we get good placement
    let result: PlacedWord[] = [];
    const scales = [1.0, 0.85, 0.7, 0.6];

    for (const scale of scales) {
      result = attemptPlacement(scale);
      const placementRate = result.length / mongos.length;

      // If we placed at least 80% of words, or it's the last attempt, use this result
      if (placementRate >= 0.8 || scale === scales[scales.length - 1]) {
        break;
      }
    }

    setWords(result);
  }, [mongos]);

  // Get unique group numbers for legend
  const uniqueGroups = Array.from(
    new Set(words.map((w) => w.groupNumber)),
  ).sort((a, b) => a - b);

  if (!mongos || !mongos.length) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          placeItems: "center",
        }}
      >
        <p style={{ color: "#999" }}>データがありません</p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "75vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Word cloud container */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          fontFamily: "Montserrat, sans-serif",
        }}
      >
        {words.map((word) => (
          <span
            key={word.id}
            style={{
              position: "absolute",
              left: word.x,
              top: word.y,
              fontSize: `${word.fontSize}px`,
              fontFamily: word.font,
              color: word.color,
              lineHeight: `${word.fontSize}px`,
              paddingLeft: "2px",
              whiteSpace: "nowrap",
              transform: `rotate(${word.rotate}deg)`,
              transformOrigin: "center center",
              userSelect: "none",
              fontWeight: 500,
            }}
            title={`Group: ${word.groupNumber}`}
          >
            {word.text}
          </span>
        ))}
      </div>
    </div>
  );
}
