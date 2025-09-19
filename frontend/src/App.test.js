import { render, screen } from '@testing-library/react';
import App from './App';

test('renders tunisafka app', () => {
  render(<App />);
  // Check for the main heading or app title
  const appElement = screen.getByText(/tunisafka/i);
  expect(appElement).toBeInTheDocument();
});

test('renders random button', () => {
  render(<App />);
  // Check for the random selection button using the actual button text
  const randomButton = screen.getByRole('button', {
    name: /select.*random.*menu/i,
  });
  expect(randomButton).toBeInTheDocument();
});
