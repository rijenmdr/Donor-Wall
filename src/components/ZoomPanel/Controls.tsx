import { useControls } from 'react-zoom-pan-pinch';
import { Button } from '../ui/button';

const Controls = () => {
    const { zoomIn, zoomOut, resetTransform } = useControls();
    return (
        <div className="tools absolute z-10 bottom-4 right-4 flex flex-col gap-2">
            <Button size={"icon"} onClick={() => zoomIn()}>+</Button>
            <Button size={"icon"} onClick={() => zoomOut()}>-</Button>
            <Button size={"icon"} onClick={() => resetTransform()}>x</Button>
        </div>
    )
}

export default Controls