import styled from "styled-components";

export const RequiredMark = styled.span`
  color: ${props => props.theme.colors.error};
`;

export const ErrorAlert = styled.div`
  background-color: #fee2e2;
  border: 1px solid ${props => props.theme.colors.error};
  color: ${props => props.theme.colors.error};
  padding: ${props => props.theme.space.md};
  border-radius: ${props => props.theme.radii.md};
  margin-bottom: ${props => props.theme.space.lg};
`;

// Form components
export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${props => props.theme.space.lg};
`;

export const Label = styled.label`
  margin-bottom: ${props => props.theme.space.sm};
  font-weight: ${props => props.theme.fontWeights.medium};
`;

export const Input = styled.input`
  padding: ${props => props.theme.space.md};
  border: 1px solid ${props => props.theme.colors.secondaryLight};
  border-radius: ${props => props.theme.radii.sm};
  font-size: ${props => props.theme.fontSizes.md};
  
  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
  }
`;

export const TextArea = styled.textarea`
  padding: ${props => props.theme.space.md};
  border: 1px solid ${props => props.theme.colors.secondaryLight};
  border-radius: ${props => props.theme.radii.sm};
  font-size: ${props => props.theme.fontSizes.md};
  resize: vertical;
  min-height: 6rem;
  
  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
  }
`;

export const SearchInputContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: ${(props) => props.theme.colors.white};
  border: 1px solid ${(props) => props.theme.colors.secondaryLight};
  border-radius: ${(props) => props.theme.radii.md};
  padding: ${(props) => props.theme.space.sm} ${(props) => props.theme.space.md}; // Adjusted padding
  width: 100%; // Make it full width
  max-width: 700px; // Max width for the search bar
  margin: ${(props) => props.theme.space.lg} auto; // Center it
  box-shadow: ${(props) => props.theme.shadows.md};

  form {
    display: flex;
    width: 100%;
    align-items: center;
  }
`;

export const StyledSearchInput = styled.input` // Renamed from InlineSearchInput
  flex-grow: 1;
  border: none;
  outline: none;
  font-size: ${(props) => props.theme.fontSizes.md}; // Larger font size
  padding: ${(props) => props.theme.space.sm}; // Adjusted padding
  color: ${(props) => props.theme.colors.secondaryDark};
  background-color: transparent;
  margin-right: ${(props) => props.theme.space.sm};

  &::placeholder {
    color: ${(props) => props.theme.colors.secondary};
  }
`;