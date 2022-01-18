import styled from 'styled-components/macro';

export const MEDIA_SIZE = 600;
export const TABLET_SIZE = 1200;
export const media = {
  mobile: `@media screen and (max-width: ${MEDIA_SIZE}px)`,
  tablet: `@media screen and (max-width: ${TABLET_SIZE}px)`,
  desktop: `@media screen and (min-width: ${MEDIA_SIZE + 1}px)`,
};

export const fonts = {
  regular: 'Inter Regular, -apple-system, BlinkMacSystemFont, sans-serif',
  bold: 'Inter Bold, -apple-system, BlinkMacSystemFont, sans-serif',
  extraBold: 'Inter ExtraBold, -apple-system, BlinkMacSystemFont, sans-serif',
  semiBold: 'Inter SemiBold, -apple-system, BlinkMacSystemFont, sans-serif',
  light: 'Inter Light, -apple-system, BlinkMacSystemFont, sans-serif',
};

export const lineHeights = {
  header: 1.3,
  body: 1.45,
};

export const fontSizes = {
  size1: '14px',
  size2: '16px',
  size3: '18px',
  size4: '22px',
  size5: '26px',
  size6: '33px',
  size7: '38px',
  size8: '48px',
};

export const colors = {
  black: '#000000',
  blackMain: '#262D44',
  blackMid: '#4C5264',
  blackLight: '#A8ABB4',

  whiteMain: '#FFFFFF',

  greyMain: '#E4E4E4',
  greyLight: '#F4F4F3',

  primaryMain: '#456ADD',
  primaryDark: '#2F458B',
  primaryFaded: '#a2b4ee',
  primaryLight: '#E0E5F7',

  secondaryMain: '#26DFA8',
  secondaryMid: '#47A8A5',
  secondaryLight: '#CAF5E9',

  tertiary1Main: '#0586D4',
  tertiary1Light: '#CEEFFA',

  tertiary2Main: '#FC695D',
  tertiary2Mid: '#FAC6BE',
  tertiary2Light: '#FDEBE9',

  tertiary3Main: '#FEB32B',
};

export const borders = {
  standard: `1px solid ${colors.primaryLight}`,
  variation: `1px solid ${colors.greyMain}`,
  primary: `1px solid ${colors.primaryMain}`,
  secondary: `1px solid ${colors.secondaryMid}`,
  tertiary: `1px solid ${colors.greyMain}`,
  secondaryThick: `2px solid ${colors.secondaryMid}`,
  error: `1px solid ${colors.tertiary2Main}`,
};

export const margins = {
  /** 4px */
  size1: '4px',
  /** 8px */
  size2: '8px',
  /** 16px */
  size3: '16px',
  /** 24px */
  size4: '24px',
  /** 48px */
  size5: '48px',
  /** 64px */
  size6: '64px',
  /** 128px */
  size7: '128px',
};

export const globalTransitionSettings = 'all 0.2s ease;   -moz-transition-property: none;';

export const cardHoverShadow = '0px 3px 15px rgba(0, 0, 0, 0.08)';

export const MainHeading = styled.p`
  font-family: ${fonts.extraBold};
  font-size: ${fontSizes.size8};
  line-height: ${lineHeights.header};
  color: ${p => p.color || colors.blackMain};
  margin-bottom: ${margins.size2};
  font-feature-settings: 'cv11' 1;
  -webkit-font-feature-settings: 'cv11' 1;
  -ms-font-feature-settings: 'cv11' 1;
  -moz-font-feature-settings: 'cv11' 1;
  ${media.mobile} {
    font-size: ${fontSizes.size6};
  }
`;

export const Heading1 = styled.p`
  font-family: ${fonts.bold};
  font-size: ${fontSizes.size5};
  line-height: ${lineHeights.header};
  color: ${p => p.color || colors.blackMain};
  margin-bottom: ${margins.size2};
  font-feature-settings: 'cv11' 1;
  -webkit-font-feature-settings: 'cv11' 1;
  -ms-font-feature-settings: 'cv11' 1;
  -moz-font-feature-settings: 'cv11' 1;
`;

export const Heading2 = styled.p`
  margin-bottom: 0px;
  font-family: ${fonts.bold};
  font-size: ${fontSizes.size3};
  line-height: ${lineHeights.header};
  color: ${p => p.color || colors.blackMain};
  font-feature-settings: 'cv11' 1;
  -webkit-font-feature-settings: 'cv11' 1;
  -ms-font-feature-settings: 'cv11' 1;
  -moz-font-feature-settings: 'cv11' 1;
`;

export const Heading3 = styled.p`
  margin-bottom: 0px;
  font-family: ${fonts.bold};
  font-size: ${fontSizes.size2};
  line-height: ${lineHeights.header};
  color: ${p => p.color || colors.blackMain};
  font-feature-settings: 'cv11' 1;
  -webkit-font-feature-settings: 'cv11' 1;
  -ms-font-feature-settings: 'cv11' 1;
  -moz-font-feature-settings: 'cv11' 1;
`;

export const Heading4 = styled.p`
  margin-bottom: 0px;
  font-family: ${fonts.regular};
  font-size: ${fontSizes.size1};
  line-height: ${lineHeights.header};
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-feature-settings: 'tnum' on, 'lnum' on;
  color: ${p => p.color || colors.blackLight};
  font-feature-settings: 'cv11' 1;
  -webkit-font-feature-settings: 'cv11' 1;
  -ms-font-feature-settings: 'cv11' 1;
  -moz-font-feature-settings: 'cv11' 1;
  ${media.mobile} {
    font-size: ${fontSizes.size1};
  }
`;

export const Text = styled.p`
  margin-bottom: 0px;
  font-family: ${p => (p.bold ? fonts.bold : fonts.regular)};
  font-size: ${p => p.size ?? fontSizes.size2};
  line-height: ${lineHeights.header};
  letter-spacing: -0.02em;
  color: ${p => p.color || colors.blackMid};
  font-feature-settings: 'cv11' 1;
  -webkit-font-feature-settings: 'cv11' 1;
  -ms-font-feature-settings: 'cv11' 1;
  -moz-font-feature-settings: 'cv11' 1;
  -webkit-font-smoothing: antialiased;
  -moz-font-smoothing: antialiased;
  -o-font-smoothing: antialiased;
`;

export const SubText = styled.p`
  margin-bottom: 0px;
  font-family: ${fonts.light};
  font-size: ${fontSizes.size1};
  line-height: ${lineHeights.body};
  color: ${p => p.color || colors.blackLight};
  font-feature-settings: 'cv11' 1;
  -webkit-font-feature-settings: 'cv11' 1;
  -ms-font-feature-settings: 'cv11' 1;
  -moz-font-feature-settings: 'cv11' 1;
`;

export const FadedText = styled.p`
  margin-bottom: 0px;
  font-family: ${fonts.light};
  font-size: ${fontSizes.size2};
  line-height: ${lineHeights.body};
  letter-spacing: -0.02em;
  color: ${p => p.color || colors.blackLight};
  font-feature-settings: 'cv11' 1;
  -webkit-font-feature-settings: 'cv11' 1;
  -ms-font-feature-settings: 'cv11' 1;
  -moz-font-feature-settings: 'cv11' 1;
`;

export const FlexRow = styled.div`
  display: flex;
  flex-direction: ${p => p.flexDirection || 'row'};
  align-items: ${p => p.alignItems || 'center'};
  justify-content: ${p => p.justifyContent || 'left'};
  padding: ${p => p.padding || '0'};
  width: ${p => p.width || ''};
  margin: ${p => (p.centered ? '0 auto' : '')};
  flex-wrap: ${p => (p.$wrap ? 'wrap' : 'nowrap')};
  ${media.mobile} {
    flex-direction: ${p => (p.adapting ? 'column' : 'row')};
  }
`;

export const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${p => p.alignItems || 'center'};
  justify-content: ${p => p.justifyContent || 'left'};
  padding: ${p => p.padding || '0'};
  ${media.mobile} {
    flex-direction: ${p => (p.adapting ? 'row' : 'column')};
  }
`;


export const Card = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${p => p.maxWidth || ''};
  align-items: ${p => p.alignItems || 'left'};
  justify-content: ${p => p.justifyContent || 'left'};
  padding: ${p => p.padding || '0'};
  border-radius: 5px;
  border-style: ${p => (p.noBorder ? 'none' : 'solid')};
  border-width: 1px;
  border-color: ${colors.primaryLight};
  background-color: ${colors.whiteMain};
  margin: ${p => p.margin || '0 auto'};
  box-shadow: ${p => (p.shadow ? '0px 3px 25px rgba(0, 0, 0, 0.05)' : '')};
`;

export const ClickableCard = styled.div`
  display: flex;
  flex-direction: ${p => p.flexDirection || 'row'};
  align-items: ${p => p.alignItems || 'center'};
  justify-content: ${p => p.justifyContent || 'left'};
  padding: ${p => p.padding || '0'};
  border-radius: 5px;
  border-style: solid;
  border-width: 1px;
  border-color: ${colors.primaryLight};
  transition: ${globalTransitionSettings};
  background-color: ${p => (p.selected ? colors.greyMain : colors.whiteMain)};
  cursor: pointer;
  &:hover {
    background-color: ${p => (p.selected ? colors.greyMain : colors.greyLight)};
  }
`;

export const CardText = styled.p`
  margin-bottom: 0px;
  font-family: ${fonts.semiBold};
  font-size: ${fontSizes.size1};
  line-height: ${lineHeights.header};
  color: ${colors.blackMid};
`;


export const Clickable = styled.button`
  background-color: Transparent;
  background-repeat: no-repeat;
  border: none;
  cursor: pointer;
  overflow: hidden;
  outline: none;
  padding: 0px;
  flex-shrink: 0;

  :focus {
    outline: ${p => (p.noOutline ? 'none' : '5px auto -webkit-focus-ring-color')};
  }
`;


export const ClickableText = styled.p`
  margin-bottom: 0px;
  display: inline-block;
  font-family: ${p => (p.big ? fonts.bold : fonts.regular)};
  font-size: ${p => (p.big ? fontSizes.size3 : fontSizes.size2)};
  line-height: ${lineHeights.body};
  color: ${p => (p.invalid ? colors.blackLight : p.color || colors.primaryMain)};
  cursor: ${p => (p.invalid ? 'default' : 'pointer')};
  transition: ${globalTransitionSettings};
`;

export const HideMobile = styled.div`
  display: ${p => p.display || 'block'};
  ${media.mobile} {
    display: none;
  }
`;

export const ShowMobile = styled.div`
  display: ${p => p.display || 'block'};
  ${media.desktop} {
    display: none;
  }
`;

export const EditTextArea = styled.textarea`
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;

  border: ${borders.standard};
  border-radius: 5px;
  width: 100%;
  height: 70px;
  padding: ${margins.size3};
  resize: none;

  margin-bottom: 0px;
  font-family: ${fonts.regular};
  font-size: ${fontSizes.size2};
  line-height: ${lineHeights.body};
  color: ${colors.blackMid};
`;


export const BUTTON_HEIGHT = '44px';

export const MobileScrollFade = styled.div`
  position: fixed;
  z-index: 1;
  pointer-events: none;
  background-image: linear-gradient(to top, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1) 90%);
  width: 100%;
  height: 8px;
`;
