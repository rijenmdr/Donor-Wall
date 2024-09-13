"use client";
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import Panel from "../Panel";
import { colors, sponsors } from "@/static";
import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from "next/image";
import Controls from "./Controls";
import { Sponsor } from "@/type";

const GRID_COLUMNS = 76
const GRID_ROWS = 38;
const INITIAL_SCALE = 2;

const ZoomPanel = () => {
    const totalPanels = GRID_COLUMNS * GRID_ROWS;

    const [panelsArray, setPanelsArray] = useState<(null | Sponsor)[]>(new Array(totalPanels).fill(null));
    const [scale, setScale] = useState(INITIAL_SCALE);

    const handleTransform = (e: ReactZoomPanPinchRef) => {
        const {scale} = e.instance.transformState
        setScale(scale);
    }

    const highestDivisor = useCallback((num: number) => {
        // Start checking from half of the number, as no divisor greater than num/2 (other than num itself) exists
        if (num <= 10) {
            for (let i = Math.floor(num / 2); i > 0; i--) {
                if (num % i === 0) {
                    return i; // Return the first divisor found, which is the largest
                }
            }
        }
        return Math.floor(Math.sqrt(num)); // If no divisor found, return 1 (every number is divisible by 1)
    },[])

    const calculateDimensions = useMemo(() => {
        return (panels: number) => {
            if (panels <= 7) {
                return { rows: 1, cols: panels };
            }

            let cols = highestDivisor(panels);
            let rows = Math.ceil(panels / cols);

            // Ensure that columns are always greater than or equal to rows
            while (cols < rows) {
                rows--;
                cols = Math.ceil(panels / rows);
            }

            // Adjust if columns exceed the grid limit
            if (cols > GRID_COLUMNS) {
                cols = GRID_COLUMNS;
                rows = Math.ceil(panels / cols);
            }

            return { rows, cols };
        };
    }, [GRID_COLUMNS]);

    const getBlockIndices = useMemo(() => {
        return (count: number, max: number, panelsArray: (null | Sponsor)[], gridColumns: number, gridRows: number) => {
            const { rows, cols } = calculateDimensions(count);
            let startIndex = 0; // Always start from the top-left corner (index 0)
            const indices: number[] = [];

            // Loop through the grid, from left to right, top to bottom
            for (let i = startIndex; i < max && indices.length < count; i++) {
                const rowStart = Math.floor(i / gridColumns);
                const colStart = i % gridColumns;

                let hasSpace = true;

                // Check if there's enough space for the block starting at the current index
                if (colStart + cols > gridColumns || rowStart + rows > gridRows) {
                    hasSpace = false;
                } else {
                    for (let row = 0; row < rows && hasSpace; row++) {
                        for (let col = 0; col < cols && hasSpace; col++) {
                            const currentIndex = (rowStart + row) * gridColumns + (colStart + col);
                            if (currentIndex >= max || panelsArray[currentIndex] !== null) {
                                hasSpace = false;
                            }
                        }
                    }
                }

                // If space is available, assign the block of panels starting at this index
                if (hasSpace) {
                    for (let row = 0; row < rows; row++) {
                        for (let col = 0; col < cols; col++) {
                            const currentIndex = (rowStart + row) * gridColumns + (colStart + col);
                            if (indices.length < count) {
                                indices.push(currentIndex);
                            }
                        }
                    }
                    break; // Exit the loop once we find a valid space
                }
            }

            return { indices, rows, cols };
        };
    }, [GRID_COLUMNS, GRID_ROWS]);

    const getCenterIndex = useMemo(() => {
        return (indices: number[], gridColumns: number) => {
            // Calculate row and column indices for all provided indices
            const rowIndices = indices.map(index => Math.floor(index / gridColumns));

            // Determine the center row and center column
            const centerRow = rowIndices[Math.floor(rowIndices.length / 2)];

            // Filter indices to find the leftmost panel in the center row
            const leftmostCenterIndex = indices
                .filter(index => Math.floor(index / gridColumns) === centerRow)
                .sort((a, b) => (a % gridColumns) - (b % gridColumns))[0]; // Sort by column index and take the smallest

            return leftmostCenterIndex;
        };
    }, [GRID_COLUMNS]);

    const assignPanels = useCallback(() => {

        const newPanelsArray = [...panelsArray];

        const getAdjacentIndexes = (index: number) => {
            const adjacentIndexes = [];
            const row = Math.floor(index / GRID_COLUMNS);
            const col = index % GRID_COLUMNS;

            if (row > 0) adjacentIndexes.push(index - GRID_COLUMNS); // Top
            if (row < GRID_ROWS - 1) adjacentIndexes.push(index + GRID_COLUMNS); // Bottom
            if (col > 0) adjacentIndexes.push(index - 1); // Left
            if (col < GRID_COLUMNS - 1) adjacentIndexes.push(index + 1); // Right

            return adjacentIndexes;
        };

        const getAvailableColor = (excludedColors: any[]) => {
            const availableColors = colors.filter(color => !excludedColors.includes(color?.bgColor));
            return availableColors[Math.floor(Math.random() * availableColors.length)];
        };

        sponsors.forEach((sponsor) => {
            let color: { bgColor: string, color: string } = {
                bgColor: '#bbe1d2',
                color: '#93d1b8'
            };
            if (sponsor.numberOfPanelsDonated === 1) {
                color = { bgColor: '#d3b962', color: '#d3b962' }; // Use the specific color if there is only 1 panel
            } else {
                let attempts = 0;
                const maxAttempts = 100; // Prevents infinite loops

                while (attempts < maxAttempts) {
                    const { indices } = getBlockIndices(
                        sponsor.numberOfPanelsDonated,
                        totalPanels,
                        newPanelsArray,
                        GRID_COLUMNS,
                        GRID_ROWS
                    );
                    
                    // Get colors of adjacent panels
                    const adjacentColors = new Set<string>();
                    indices.forEach(index => {
                        getAdjacentIndexes(index).forEach(adjIndex => {
                            const adjacentPanel = newPanelsArray[adjIndex];
                            if (adjacentPanel && adjacentPanel.color) {
                                adjacentColors.add(adjacentPanel.color?.bgColor);
                            }
                        });
                    });

                    color = getAvailableColor(Array.from(adjacentColors));

                    // Check if the chosen color does not conflict with adjacent panels
                    const validColor = indices.every(index => {
                        return getAdjacentIndexes(index).every(adjIndex => {
                            const adjacentPanel = newPanelsArray[adjIndex];
                            return !adjacentPanel || adjacentPanel.color?.bgColor !== color?.bgColor;
                        });
                    });

                    if (validColor) break;

                    attempts++;
                }
            }

            const sponsorWithColor: Sponsor = {
                ...sponsor, color: color || {
                    bgColor: '#bbe1d2',
                    color: '#93d1b8'
                }
            };

            const { indices, rows, cols } = getBlockIndices(
                sponsor.numberOfPanelsDonated,
                totalPanels,
                newPanelsArray,
                GRID_COLUMNS,
                GRID_ROWS
            );

            const centerIndex = getCenterIndex(indices, GRID_COLUMNS);

            indices.forEach((index) => {
                newPanelsArray[index] = sponsorWithColor;

                if (index === centerIndex) {
                    newPanelsArray[index] = { ...sponsorWithColor, isCenterPanel: true, rows, cols };
                }
            });
        });

        setPanelsArray(newPanelsArray);
    }, [panelsArray, sponsors, getBlockIndices, getCenterIndex, GRID_COLUMNS, GRID_ROWS]);

    useEffect(() => {
        assignPanels();
    }, []);

    return (
        <TransformWrapper
            initialScale={INITIAL_SCALE}
            initialPositionX={0}
            initialPositionY={0}
            onTransformed={(e) => handleTransform(e)}
        >
            {() => (
                <>
                    <Controls />
                    <TransformComponent
                        wrapperClass="!w-full relative !h-full !bg-white"
                    >
                        <div className={`grid grid-cols-76 grid-rows-38`}>
                            {panelsArray.map((panel, i) => {
                                const index = i + 1;
                                const rowIndex = Math.floor((index - 1) / GRID_COLUMNS) + 1;
                                const colIndex = ((index - 1) % GRID_COLUMNS) + 1;

                                return (
                                    <div
                                        key={i}
                                        data-row={rowIndex}
                                        data-sponsor={panel?.id}
                                        data-col={colIndex}
                                        className="border border-transparent flex justify-center align-center relative"
                                    >
                                        <Panel color={panel?.color?.bgColor} />
                                        {panel?.isCenterPanel && panel?.numberOfPanelsDonated > 1 && (
                                            <div
                                                className="absolute inset-0 flex justify-center items-center z-10"
                                                style={{
                                                    backgroundColor: panel?.color?.bgColor,
                                                    width: panel?.numberOfPanelsDonated === 2 ? `${panel?.cols! * 16.4}px` : `${panel?.cols! * 17.1}px`,
                                                    opacity: panel?.numberOfPanelsDonated >=20 || scale > 3 ? 1 : 0
                                                }}
                                            >
                                                {
                                                    panel?.recogntionText ?
                                                        <span
                                                            className="text-black text-center"
                                                            style={{
                                                                fontSize: panel?.numberOfPanelsDonated >=20 ? "6px" : `2px`,
                                                                lineHeight: panel?.numberOfPanelsDonated >=20 ?`12px`: "2px",
                                                            }}
                                                        >
                                                            {panel?.recogntionText}
                                                        </span> :
                                                        <div className="flex items-center">
                                                            <Image src={`${`https://1000logos.net/wp-content/uploads/2018/02/BMW-Logo-1997.png`}`} alt="" width={20} height={20} />
                                                            <span
                                                                className="text-black text-center"
                                                                style={{
                                                                    fontSize: `6px`,
                                                                    lineHeight: `12px`,
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                {panel?.companyName}
                                                            </span>
                                                        </div>
                                                }
                                            </div>
                                        )}

                                        {panel?.isCenterPanel && panel?.numberOfPanelsDonated === 1 && (
                                            <div 
                                                className="absolute inset-0 flex justify-center items-center left-[.2px] z-10"
                                                style={{
                                                    opacity: scale > 4 ? 1 : 0
                                                }}
                                            >
                                                <span className="text-black text-[1.5px] leading-[2px] text-center">{panel?.recogntionText}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </TransformComponent>
                </>
            )}
        </TransformWrapper>
    );
};

export default ZoomPanel;
