import React from 'react';
import styled from 'styled-components';

const StyledCheckO = styled.i`
  & {
    box-sizing: border-box;
    position: relative;
    display: block;
    transform: scale(1.3);
    width: 22px;
    height: 22px;
    border: 2px solid;
    border-radius: 100px;
    margin-top: 9px;
    margin-bottom: 0px;
  }
  &::after {
    content: '';
    display: block;
    box-sizing: border-box;
    position: absolute;
    left: 3px;
    top: -1px;
    width: 6px;
    height: 10px;
    border-color: currentColor;
    border-width: 0 2px 2px 0;
    border-style: solid;
    transform-origin: bottom left;
    transform: rotate(45deg);
  }
`

export const CheckO = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    return (
      <>
        <StyledCheckO {...props} ref={ref} icon-role="check-o" />
      </>
    )
  },
)
