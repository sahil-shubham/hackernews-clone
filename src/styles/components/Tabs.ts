import { styled } from "styled-components";

// Type selector styled components
export const TypeSelectorContainer = styled.div`
  margin-bottom: ${props => props.theme.space.lg};
`;

export const TypeSelectorGroup = styled.div`
  display: inline-flex;
  border-radius: ${props => props.theme.radii.md};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

export const TypeButton = styled.button<{ active: boolean }>`
  padding: ${props => `${props.theme.space.sm} ${props.theme.space.lg}`};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: ${props => props.theme.fontWeights.medium};
  border: 1px solid ${props => 
    props.active 
      ? props.theme.colors.primary 
      : props.theme.colors.secondaryLight
  };
  background-color: ${props => 
    props.active 
      ? props.theme.colors.primary 
      : props.theme.colors.white
  };
  color: ${props => 
    props.active 
      ? props.theme.colors.white 
      : props.theme.colors.secondaryDark
  };
  
  &:hover:not(:disabled) {
    background-color: ${props => 
      props.active 
        ? props.theme.colors.primary 
        : '#f9fafb'
    };
  }
  
  &:first-child {
    border-top-left-radius: ${props => props.theme.radii.md};
    border-bottom-left-radius: ${props => props.theme.radii.md};
  }
  
  &:last-child {
    border-top-right-radius: ${props => props.theme.radii.md};
    border-bottom-right-radius: ${props => props.theme.radii.md};
  }
`;