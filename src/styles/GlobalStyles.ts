import { createGlobalStyle, css } from 'styled-components';

const globalStyles = css`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    font-family: var(--font-geist-sans), ${props => props.theme.fonts.body};
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.secondaryDark};
    line-height: 1.5;
    max-width: 100vw;
    overflow-x: hidden;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button, input, textarea {
    font-family: inherit;
    font-size: inherit;
    border: none;
    outline: none;
  }

  button {
    cursor: pointer;
    background: none;
    padding: 0;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-family: var(--font-geist-sans), ${props => props.theme.fonts.heading};
    font-weight: ${props => props.theme.fontWeights.bold};
  }

  p {
    margin: 0;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  code, pre {
    font-family: var(--font-geist-mono), monospace;
  }

  /* Container class for consistent spacing */
  .container {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 ${props => props.theme.space.lg};
  }

  main {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: ${props => props.theme.space.xl} ${props => props.theme.space.lg};
  }
`;

const GlobalStyles = createGlobalStyle`
  ${globalStyles}
`;

export default GlobalStyles; 