import React, { MouseEvent, useRef, useState } from 'react';

interface TouchScrollProps {
    className: string
    isLeftAndRight?:boolean
    children: any
}

export default function TouchScrollDiv({
    className,
    isLeftAndRight,
    children,
  }: TouchScrollProps): JSX.Element {

    /* 주문리스트 터치스크롤 JS.231128*/
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);
    const [clickPoint, setClickPoint] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDownEvent = (e: MouseEvent<HTMLDivElement>) => {
        setDragging(true);
        if(containerRef.current){

            if(isLeftAndRight) {
                setClickPoint(e.pageX);
                setScrollLeft(containerRef.current.scrollLeft);
            }else{
                setClickPoint(e.pageY);
                setScrollTop(containerRef.current.scrollTop);
            }
        }
    };

    const handleMouseMoveEvent = (e: MouseEvent<HTMLDivElement>) => {
        if(!dragging) return;

        e.preventDefault();
        if(containerRef.current){

            if(isLeftAndRight){
                const walk = e.pageX - clickPoint;
                containerRef.current.scrollLeft = scrollLeft - walk;
            }else{
                const walk = e.pageY - clickPoint;
                containerRef.current.scrollTop = scrollTop - walk;
            }   
        }
    };

    return (
        <div className={className}
              ref={containerRef}
                onMouseDown={handleMouseDownEvent}
                onMouseLeave={() => setDragging(false)}
                onMouseUp={() => setDragging(false)}
                onMouseMove={handleMouseMoveEvent}
        >
            {children}
        </div>
    );
}