import React from 'react';
import { Tooltip } from 'react-tooltip';

interface HelpToolTipProps {
    helpMessage: string
    variant?:  'dark' | 'light' | 'success' | 'warning' | 'error' | 'info'
    location?: 'top' | 'top-start' | 'top-end' | 'right' | 'right-start' | 'right-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end'
    classes?: string
}


export default function HelpToolTip({
    helpMessage,
    variant,
    location,
    classes,
  }: HelpToolTipProps): JSX.Element {

    return ( 
       <>
            <label
                data-tooltip-id="helpTooltip" 
                data-tooltip-html={helpMessage}
                data-tooltip-delay-hide={2000}
                data-tooltip-variant={variant ? variant : 'dark'}
                data-tooltip-place={location ? location : 'top'}
            >
                도움말
            </label>
            
            <Tooltip wrapper="span" id="helpTooltip" className={`${classes || ''}`}/>
       </>
    );
}