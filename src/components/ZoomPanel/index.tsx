"use client"
import { TransformComponent, TransformWrapper, useControls } from "react-zoom-pan-pinch"
import Panel from "../Panel";
import { Button } from "../ui/button";
import { sponsers } from "@/static";
import { useEffect, useState } from 'react';

type Sponsor = typeof sponsers[0] & { color: string };

const Controls = () => {
    const { zoomIn, zoomOut, resetTransform } = useControls();

    return (
        <div className="tools absolute z-10 bottom-4 right-4 flex flex-col gap-2">
            <Button size={"icon"} onClick={() => zoomIn()}>+</Button>
            <Button size={"icon"} onClick={() => zoomOut()}>-</Button>
            <Button size={"icon"} onClick={() => resetTransform()}>x</Button>
        </div>
    );
};

const ZoomPanel = () => {
    const gridColumns = 76;
    const gridRows = 41;
    const totalPanels = gridColumns * gridRows;

    const generateRandomColor = (): string => {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const calculateDimensions = (panels: number): { rows: number; cols: number } => {
        if (panels <= 3) {
            return { rows: 1, cols: panels };
        }

        let cols = Math.ceil(Math.sqrt(panels));
        let rows = Math.ceil(panels / cols);

        if (cols > gridColumns) {
            cols = gridColumns;
            rows = Math.ceil(panels / cols);
        }

        return { rows, cols };
    };

    const [panelsArray, setPanelsArray] = useState<(null | Sponsor)[]>(new Array(totalPanels).fill(null));

    const getBlockIndices = (
        count: number,
        max: number,
        panelsArray: (null | Sponsor)[],
        gridColumns: number,
        gridRows: number
    ): number[] => {
        const { rows, cols } = calculateDimensions(count);
        let startIndex = -1;

        while (startIndex === -1) {
            const randomStartIndex = Math.floor(Math.random() * max);
            const rowStart = Math.floor(randomStartIndex / gridColumns);
            const colStart = randomStartIndex % gridColumns;

            let hasSpace = true;

            if (colStart + cols > gridColumns || rowStart + rows > gridRows) {
                hasSpace = false;
                continue;
            }

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const currentIndex = (rowStart + row) * gridColumns + (colStart + col);
                    if (currentIndex >= max || panelsArray[currentIndex] !== null) {
                        hasSpace = false;
                        break;
                    }
                }
                if (!hasSpace) break;
            }

            if (hasSpace) {
                startIndex = randomStartIndex;
            }
        }

        const indices: number[] = [];
        const rowIndex = Math.floor(startIndex / gridColumns);
        const columnIndex = startIndex % gridColumns;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const currentIndex = (rowIndex + row) * gridColumns + (columnIndex + col);
                indices.push(currentIndex);
            }
        }

        return indices;
    };

    useEffect(() => {
        const assignPanels = () => {
            const newPanelsArray = [...panelsArray];

            sponsers.forEach((sponsor) => {
                const sponsorWithColor: Sponsor = { ...sponsor, color: generateRandomColor() };

                const blockIndices = getBlockIndices(
                    sponsor.numberOfPanelsDonated,
                    totalPanels,
                    newPanelsArray,
                    gridColumns,
                    gridRows
                );

                blockIndices.forEach((index) => {
                    newPanelsArray[index] = sponsorWithColor;
                });
            });

            setPanelsArray(newPanelsArray);
        };

        assignPanels();
    }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

    return (
        <TransformWrapper
            initialScale={1}
            initialPositionX={0}
            initialPositionY={0}
        >
            {() => (
                <>
                    <Controls />
                    <TransformComponent
                        wrapperClass="!w-full relative !h-fit-content !bg-white rounded"
                    >
                        <div className={`grid grid-cols-76 grid-rows-41`}>
                            {panelsArray.map((panel, i) => {
                                const index = i + 1;
                                const rowIndex = Math.floor((index - 1) / gridColumns) + 1;
                                const colIndex = ((index - 1) % gridColumns) + 1;
                                return (
                                    <div
                                        key={i}
                                        data-row={rowIndex}
                                        data-sponsor={panel?.id}
                                        data-col={colIndex}
                                        className="border border-transparent flex justify-center align-center relative"
                                    >
                                        <Panel color={panel?.color} />
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