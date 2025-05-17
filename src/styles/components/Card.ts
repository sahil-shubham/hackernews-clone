import styled from "styled-components";

export const Card = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.radii.md};
  box-shadow: ${props => props.theme.shadows.sm};
  padding: ${props => props.theme.space.xl};
  margin-bottom: ${props => props.theme.space.lg};
`;

export const FormCard = styled(Card)`
  max-width: 32rem;
  margin: 0 auto;
  padding: ${props => props.theme.space.xl};
`;